import {
  ArticleCategory,
  Paper,
  SelectedJournalItem,
  VenueRadarAnalysis,
  VenueResearchTeam,
  VenueTeamEdge,
  VenueTeamTopicLink,
  VenueTopicCluster,
  VenueTopicSynergyEdge,
  YearCount,
} from "./types";
import {
  OPENALEX_BASE_URL,
  buildArticleCategoryFilters,
  deduplicatePapers,
  fetchOpenAlexJson,
  mapWorkToPaper,
  normalizeAuthorId,
  sanitizeOpenAlexQuery,
} from "./openalex";
import { resolveJournalName } from "./journalPresets";

const MAILTO = "engshorts99@gmail.com";

const GENERIC_KEYWORDS = new Set([
  "human",
  "humans",
  "mice",
  "mouse",
  "animals",
  "animal",
  "female",
  "male",
  "cells",
  "cell",
  "biology",
  "science",
  "medicine",
  "disease",
  "protein",
  "proteins",
]);

function buildWorksUrl(params: Record<string, string>): string {
  const url = new URL(`${OPENALEX_BASE_URL}/works`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, v);
  }
  url.searchParams.append("mailto", MAILTO);
  return url.toString();
}

function normalizeSourceId(id: string): string {
  const clean = id.replace("https://openalex.org/", "").trim();
  return clean.startsWith("S") ? clean : `S${clean}`;
}

function computeLongestConsecutiveStreak(sortedYears: number[]): number {
  if (sortedYears.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sortedYears.length; i++) {
    if (sortedYears[i] === sortedYears[i - 1] + 1) {
      current += 1;
      if (current > best) best = current;
    } else if (sortedYears[i] !== sortedYears[i - 1]) {
      current = 1;
    }
  }
  return best;
}

/**
 * Low-credit Venue Radar Engine:
 * Uses only 3–4 OpenAlex calls total (down from 10!), deriving topics, keywords,
 * year counts, and network relationships locally from the fetched work pool.
 */
export async function analyzeVenueLandscape(args: {
  journals: SelectedJournalItem[];
  articleType: ArticleCategory;
  teamRoleMode?: "pi" | "all";
  yearFrom: number;
  yearTo: number;
  query?: string;
}): Promise<VenueRadarAnalysis> {
  const {
    journals,
    articleType,
    teamRoleMode = "pi",
    yearFrom,
    yearTo,
    query = "",
  } = args;

  const normalizedJournals: SelectedJournalItem[] = journals.map((j) => {
    const cleanId = normalizeSourceId(j.id);
    return {
      id: cleanId,
      name: j.name || resolveJournalName(cleanId),
      shortName: j.shortName,
    };
  });

  const sourceIds = normalizedJournals.map((j) => j.id);
  const cleanQ = query ? sanitizeOpenAlexQuery(query) : "";

  const filterParts: string[] = [
    `primary_location.source.id:${sourceIds.join("|")}`,
    `publication_year:${yearFrom}-${yearTo}`,
    ...buildArticleCategoryFilters(articleType, true),
  ];

  if (articleType === "research") {
    filterParts.push("authors_count:>1");
  }

  if (cleanQ) {
    filterParts.push(`default.search:${cleanQ}`);
  }

  const baseFilter = filterParts.join(",");
  const groupField =
    teamRoleMode === "pi" ? "corresponding_author_ids" : "authorships.author.id";
  const groupFilter =
    teamRoleMode === "all" && articleType === "both"
      ? `${baseFilter},authors_count:>1`
      : baseFilter;

  const selectFields = [
    "id",
    "doi",
    "title",
    "display_name",
    "publication_date",
    "publication_year",
    "type",
    "cited_by_count",
    "open_access",
    "primary_location",
    "authorships",
    "corresponding_author_ids",
    "primary_topic",
    "keywords",
    "concepts",
    "referenced_works_count",
  ].join(",");

  // Phase 1: Just 2–3 parallel calls (Author ranking + Top 120 Venue Works + Multi-journal count if >1 venue)
  const [authorGroupData, topVenueData, journalGroupData] = await Promise.all([
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: groupFilter,
        group_by: groupField,
        "per-page": "20",
      })
    ),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        sort: "cited_by_count:desc",
        "per-page": "120",
        select: selectFields,
      })
    ),
    normalizedJournals.length > 1 && !cleanQ
      ? fetchOpenAlexJson(
          buildWorksUrl({
            filter: baseFilter,
            group_by: "primary_location.source.id",
            "per-page": "20",
          })
        ).catch(() => null)
      : Promise.resolve(null),
  ]);

  const totalMatchingWorks =
    topVenueData?.meta?.count ?? authorGroupData?.meta?.count ?? 0;

  const groupRows: Array<{
    key?: string;
    key_display_name?: string;
    count?: number;
  }> = authorGroupData?.group_by || [];

  const selectedCandidates: { id: string; name: string; groupCount: number }[] = [];
  for (const r of groupRows) {
    const id = normalizeAuthorId(String(r.key || ""));
    const name = String(r.key_display_name || "").trim();
    if (!id || !name || id === "Anull") continue;
    selectedCandidates.push({
      id,
      name,
      groupCount: Number(r.count) || 0,
    });
    if (selectedCandidates.length >= 16) break;
  }

  // Fallback: if corresponding_author_ids returned very few rows, derive from topVenueData locally (0 extra API calls!)
  const initialVenuePapers = deduplicatePapers(
    (topVenueData?.results || []).map(mapWorkToPaper)
  );

  if (selectedCandidates.length < 6 && initialVenuePapers.length > 0) {
    const existingIds = new Set(selectedCandidates.map((c) => c.id));
    const localCounts = new Map<string, { id: string; name: string; count: number }>();
    for (const p of initialVenuePapers) {
      const targetAuthors =
        teamRoleMode === "pi"
          ? p.authors.filter(
              (a) => a.isCorresponding || a.position === "last"
            )
          : p.authors.slice(0, 8);
      for (const a of targetAuthors) {
        if (!a.id) continue;
        const aid = normalizeAuthorId(a.id);
        if (existingIds.has(aid)) continue;
        const cur = localCounts.get(aid);
        if (cur) cur.count += 1;
        else localCounts.set(aid, { id: aid, name: a.name, count: 1 });
      }
    }
    const extras = Array.from(localCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 16 - selectedCandidates.length);
    for (const ex of extras) {
      selectedCandidates.push({
        id: ex.id,
        name: ex.name,
        groupCount: ex.count,
      });
    }
  }

  // Phase 2: Only 1 targeted call to fetch recent papers of the top streak candidates (if total > 120)
  const candidateIds = selectedCandidates.map((c) => c.id);
  const teamRecentData =
    candidateIds.length > 0 && totalMatchingWorks > 120
      ? await fetchOpenAlexJson(
          buildWorksUrl({
            filter: `${baseFilter},authorships.author.id:${candidateIds.join("|")}`,
            sort: "publication_date:desc",
            "per-page": "120",
            select: selectFields,
          })
        ).catch(() => null)
      : null;

  const paperPoolMap = new Map<string, Paper>();
  for (const p of initialVenuePapers) {
    if (p.id) paperPoolMap.set(p.id, p);
  }
  for (const raw of teamRecentData?.results || []) {
    const mapped = mapWorkToPaper(raw);
    if (mapped.id && !paperPoolMap.has(mapped.id)) {
      paperPoolMap.set(mapped.id, mapped);
    }
  }
  const allPoolPapers = deduplicatePapers(Array.from(paperPoolMap.values()));

  const topCitedPapers = allPoolPapers
    .slice()
    .sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0))
    .slice(0, 20);

  const latestPapers = allPoolPapers
    .slice()
    .sort((a, b) =>
      (b.publicationDate || String(b.publicationYear)).localeCompare(
        a.publicationDate || String(a.publicationYear)
      )
    )
    .slice(0, 20);

  const journalNameMap = new Map<string, string>();
  for (const j of normalizedJournals) {
    journalNameMap.set(j.id, j.name);
  }

  // Build VenueResearchTeam profiles
  const teams: VenueResearchTeam[] = [];

  for (const cand of selectedCandidates) {
    const matchingAll: Paper[] = [];
    const matchingPi: Paper[] = [];

    for (const p of allPoolPapers) {
      const authEntry = p.authors.find(
        (a) => a.id && normalizeAuthorId(a.id) === cand.id
      );
      const isCorr = (p.correspondingAuthorIds || []).some(
        (cid) => normalizeAuthorId(cid) === cand.id
      );

      if (!authEntry && !isCorr) continue;
      matchingAll.push(p);

      if (
        isCorr ||
        authEntry?.isCorresponding ||
        authEntry?.position === "last" ||
        authEntry?.position === "first"
      ) {
        matchingPi.push(p);
      }
    }

    const activePapers =
      teamRoleMode === "pi" && matchingPi.length > 0 ? matchingPi : matchingAll;
    if (activePapers.length === 0 && cand.groupCount === 0) continue;

    if (
      articleType !== "review" &&
      activePapers.length > 0 &&
      activePapers.every((p) => p.authors.length <= 1)
    ) {
      continue;
    }

    let latestInstYear = -1;
    let institution: string | undefined;
    let countryCode: string | undefined;

    const jBreakdownMap = new Map<
      string,
      { journalId: string; journalName: string; count: number }
    >();
    const activeYearSet = new Set<number>();
    const memberCounts = new Map<string, { id: string; name: string; count: number }>();
    const topicFreq = new Map<string, number>();
    const kwFreq = new Map<string, number>();
    let totalCitations = 0;

    for (const p of activePapers) {
      totalCitations += p.citedByCount || 0;
      if (p.publicationYear >= yearFrom && p.publicationYear <= yearTo) {
        activeYearSet.add(p.publicationYear);
      }

      const selfAuth = p.authors.find(
        (a) => a.id && normalizeAuthorId(a.id) === cand.id
      );
      if (selfAuth?.institution && p.publicationYear >= latestInstYear) {
        latestInstYear = p.publicationYear;
        institution = selfAuth.institution;
        countryCode = selfAuth.countryCode || countryCode;
      }

      if (p.journal?.id) {
        const jid = normalizeSourceId(p.journal.id);
        const jName =
          journalNameMap.get(jid) ||
          p.journal.displayName ||
          resolveJournalName(jid);
        const prev = jBreakdownMap.get(jid);
        if (prev) prev.count += 1;
        else jBreakdownMap.set(jid, { journalId: jid, journalName: jName, count: 1 });
      }

      if (p.primaryTopic?.displayName) {
        topicFreq.set(
          p.primaryTopic.displayName,
          (topicFreq.get(p.primaryTopic.displayName) || 0) + 1
        );
      }

      for (const kw of p.keywords || []) {
        const cleanKw = kw.trim();
        if (!cleanKw || GENERIC_KEYWORDS.has(cleanKw.toLowerCase())) continue;
        kwFreq.set(cleanKw, (kwFreq.get(cleanKw) || 0) + 1);
      }

      const notableAuthors = [...p.authors.slice(0, 4), ...p.authors.slice(-2)];
      const seenInPaper = new Set<string>();
      for (const ma of notableAuthors) {
        if (!ma.id) continue;
        const mid = normalizeAuthorId(ma.id);
        if (mid === cand.id || seenInPaper.has(mid)) continue;
        seenInPaper.add(mid);
        const existingM = memberCounts.get(mid);
        if (existingM) existingM.count += 1;
        else memberCounts.set(mid, { id: mid, name: ma.name, count: 1 });
      }
    }

    const activeYears = Array.from(activeYearSet).sort((a, b) => a - b);
    const streakYears = computeLongestConsecutiveStreak(activeYears);

    teams.push({
      id: cand.id,
      name: cand.name,
      institution,
      countryCode,
      totalVenuePapers: Math.max(cand.groupCount, activePapers.length),
      sampledPaperCount: activePapers.length,
      piLeadCount:
        teamRoleMode === "pi"
          ? Math.max(cand.groupCount, matchingPi.length)
          : matchingPi.length,
      totalCitations,
      streakYears,
      activeYears,
      journalBreakdown: Array.from(jBreakdownMap.values()).sort(
        (a, b) => b.count - a.count
      ),
      keyMembers: Array.from(memberCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
      topTopics: Array.from(topicFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name]) => name),
      topKeywords: Array.from(kwFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name),
      papers: activePapers
        .slice()
        .sort(
          (a, b) =>
            b.publicationYear - a.publicationYear ||
            (b.citedByCount || 0) - (a.citedByCount || 0)
        ),
    });
  }

  teams.sort(
    (a, b) =>
      b.totalVenuePapers - a.totalVenuePapers ||
      b.streakYears - a.streakYears ||
      b.totalCitations - a.totalCitations
  );

  // Team-to-Team Edges (Co-authorship + Shared Topic Thematic)
  const teamIdSet = new Set(teams.map((t) => t.id));
  const coauthEdgeMap = new Map<string, VenueTeamEdge>();

  for (const p of allPoolPapers) {
    const presentTeams = Array.from(
      new Set(
        p.authors
          .map((a) => (a.id ? normalizeAuthorId(a.id) : ""))
          .filter((id) => teamIdSet.has(id))
      )
    ).sort();

    if (presentTeams.length < 2) continue;

    for (let i = 0; i < presentTeams.length; i++) {
      for (let j = i + 1; j < presentTeams.length; j++) {
        const s = presentTeams[i];
        const t = presentTeams[j];
        const key = `${s}__${t}`;
        let edge = coauthEdgeMap.get(key);
        if (!edge) {
          edge = {
            source: s,
            target: t,
            kind: "coauthorship",
            weight: 0,
            sharedPapers: [],
            sharedTopics: [],
          };
          coauthEdgeMap.set(key, edge);
        }
        edge.weight += 1;
        edge.sharedPapers.push({
          id: p.id,
          title: p.title,
          year: p.publicationYear,
          journalName: p.journal?.displayName,
          citedByCount: p.citedByCount || 0,
        });
        if (
          p.primaryTopic?.displayName &&
          !edge.sharedTopics.includes(p.primaryTopic.displayName)
        ) {
          edge.sharedTopics.push(p.primaryTopic.displayName);
        }
      }
    }
  }

  const thematicCandidates: VenueTeamEdge[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const tA = teams[i];
      const tB = teams[j];
      const pairKey = [tA.id, tB.id].sort().join("__");
      if (coauthEdgeMap.has(pairKey)) continue;

      const topicsB = new Set(tB.topTopics.map((s) => s.toLowerCase()));
      const sharedTopics = tA.topTopics.filter((s) =>
        topicsB.has(s.toLowerCase())
      );

      const kwB = new Set(tB.topKeywords.map((s) => s.toLowerCase()));
      const sharedKws = tA.topKeywords.filter((s) => kwB.has(s.toLowerCase()));

      const score = sharedTopics.length * 2 + sharedKws.length;
      if (score >= 2) {
        thematicCandidates.push({
          source: tA.id,
          target: tB.id,
          kind: "thematic",
          weight: score,
          sharedPapers: [],
          sharedTopics: Array.from(
            new Set([...sharedTopics, ...sharedKws])
          ).slice(0, 4),
        });
      }
    }
  }

  thematicCandidates.sort((a, b) => b.weight - a.weight);
  const teamEdges: VenueTeamEdge[] = [
    ...Array.from(coauthEdgeMap.values()).sort((a, b) => b.weight - a.weight),
    ...thematicCandidates.slice(0, 24),
  ];

  // Derive Topics, Keywords, YearCounts, and JournalCounts locally from allPoolPapers (0 extra API calls!)
  const topicAcc = new Map<
    string,
    {
      id: string;
      name: string;
      field?: string;
      subfield?: string;
      count: number;
      kws: Map<string, number>;
    }
  >();
  const kwGlobalAcc = new Map<string, number>();
  const yearLocalAcc = new Map<number, number>();
  const journalLocalAcc = new Map<string, { name: string; count: number }>();

  for (const p of allPoolPapers) {
    if (p.publicationYear >= yearFrom && p.publicationYear <= yearTo) {
      yearLocalAcc.set(
        p.publicationYear,
        (yearLocalAcc.get(p.publicationYear) || 0) + 1
      );
    }

    if (p.journal?.id) {
      const jid = normalizeSourceId(p.journal.id);
      const curJ = journalLocalAcc.get(jid);
      if (curJ) curJ.count += 1;
      else
        journalLocalAcc.set(jid, {
          name: p.journal.displayName || resolveJournalName(jid),
          count: 1,
        });
    }

    for (const kw of p.keywords || []) {
      const cleanKw = kw.trim();
      if (!cleanKw || GENERIC_KEYWORDS.has(cleanKw.toLowerCase())) continue;
      kwGlobalAcc.set(cleanKw, (kwGlobalAcc.get(cleanKw) || 0) + 1);
    }

    if (p.primaryTopic?.id && p.primaryTopic.displayName) {
      const tid = p.primaryTopic.id.replace("https://openalex.org/", "");
      let entry = topicAcc.get(tid);
      if (!entry) {
        entry = {
          id: tid,
          name: p.primaryTopic.displayName,
          field: p.primaryTopic.field,
          subfield: p.primaryTopic.subfield,
          count: 0,
          kws: new Map(),
        };
        topicAcc.set(tid, entry);
      }
      entry.count += 1;
      for (const kw of p.keywords || []) {
        if (GENERIC_KEYWORDS.has(kw.toLowerCase())) continue;
        entry.kws.set(kw, (entry.kws.get(kw) || 0) + 1);
      }
    }
  }

  const topTopicEntries = Array.from(topicAcc.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const topTopicIdSet = new Set(topTopicEntries.map((t) => t.id));

  const teamTopicLinks: VenueTeamTopicLink[] = [];
  const topicTeamsMap = new Map<string, Set<string>>();

  for (const team of teams) {
    const perTopicCount = new Map<string, number>();
    for (const p of team.papers) {
      if (!p.primaryTopic?.id) continue;
      const tid = p.primaryTopic.id.replace("https://openalex.org/", "");
      if (!topTopicIdSet.has(tid)) continue;
      perTopicCount.set(tid, (perTopicCount.get(tid) || 0) + 1);
    }
    for (const [tid, count] of Array.from(perTopicCount.entries())) {
      teamTopicLinks.push({ teamId: team.id, topicId: tid, count });
      if (!topicTeamsMap.has(tid)) topicTeamsMap.set(tid, new Set());
      topicTeamsMap.get(tid)!.add(team.id);
    }
  }

  const sampledDenom = Math.max(allPoolPapers.length, 1);
  const topics: VenueTopicCluster[] = topTopicEntries.map((t) => ({
    id: t.id,
    name: t.name,
    field: t.field,
    subfield: t.subfield,
    count: t.count,
    sharePct: Math.max(1, Math.round((t.count / sampledDenom) * 100)),
    topKeywords: Array.from(t.kws.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k),
    leadingTeamIds: Array.from(topicTeamsMap.get(t.id) || []),
  }));

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));
  const topicEdges: VenueTopicSynergyEdge[] = [];
  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const a = topics[i];
      const b = topics[j];
      const setB = new Set(b.leadingTeamIds);
      const sharedTeamIds = a.leadingTeamIds.filter((id) => setB.has(id));
      const kwSetB = new Set(b.topKeywords.map((k) => k.toLowerCase()));
      const sharedKwCount = a.topKeywords.filter((k) =>
        kwSetB.has(k.toLowerCase())
      ).length;

      const weight =
        sharedTeamIds.length * 2 +
        sharedKwCount +
        (a.subfield && a.subfield === b.subfield ? 1 : 0);

      if (weight >= 2) {
        topicEdges.push({
          source: a.id,
          target: b.id,
          weight,
          sharedTeamNames: sharedTeamIds
            .map((id) => teamNameById.get(id) || id)
            .slice(0, 4),
        });
      }
    }
  }
  topicEdges.sort((a, b) => b.weight - a.weight);

  const rawJournalGroups: Array<{
    key?: string;
    key_display_name?: string;
    count?: number;
  }> = journalGroupData?.group_by || [];
  const jCountLookup = new Map<string, { name: string; count: number }>();
  for (const jg of rawJournalGroups) {
    const jid = normalizeSourceId(String(jg.key || ""));
    jCountLookup.set(jid, {
      name: String(jg.key_display_name || ""),
      count: Number(jg.count) || 0,
    });
  }

  const journalCounts = normalizedJournals.map((j) => ({
    id: j.id,
    name: j.name,
    count:
      normalizedJournals.length === 1
        ? totalMatchingWorks
        : jCountLookup.get(j.id)?.count ??
          journalLocalAcc.get(j.id)?.count ??
          0,
  }));

  const yearCounts: YearCount[] = Array.from(yearLocalAcc.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const hotKeywords = Array.from(kwGlobalAcc.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([name, count]) => ({ name, count }));

  return {
    journals: normalizedJournals,
    articleType,
    teamRoleMode,
    yearFrom,
    yearTo,
    query: cleanQ,
    totalMatchingWorks,
    journalCounts,
    yearCounts,
    teams,
    teamEdges,
    topics,
    topicEdges: topicEdges.slice(0, 24),
    teamTopicLinks,
    hotKeywords,
    topCitedPapers,
    latestPapers,
  };
}
