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
  const authorGroupFilter =
    articleType === "both" ? `${baseFilter},authors_count:>1` : baseFilter;

  // Step 1: Run 6 fast parallel OpenAlex group_by aggregations
  const [
    corrGroupData,
    allAuthGroupData,
    topicGroupData,
    kwGroupData,
    journalGroupData,
    yearGroupData,
  ] = await Promise.all([
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        group_by: "corresponding_author_ids",
        "per-page": "25",
      })
    ).catch(() => null),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: authorGroupFilter,
        group_by: "authorships.author.id",
        "per-page": "25",
      })
    ).catch(() => null),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        group_by: "primary_topic.id",
        "per-page": "16",
      })
    ).catch(() => null),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        group_by: "keywords.id",
        "per-page": "24",
      })
    ).catch(() => null),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        group_by: "primary_location.source.id",
        "per-page": "20",
      })
    ).catch(() => null),
    fetchOpenAlexJson(
      buildWorksUrl({
        filter: baseFilter,
        group_by: "publication_year",
      })
    ).catch(() => null),
  ]);

  const totalMatchingWorks =
    yearGroupData?.meta?.count ??
    journalGroupData?.meta?.count ??
    allAuthGroupData?.meta?.count ??
    0;

  // Step 2: Select top 18 candidate Research Teams / Labs
  const candidateMap = new Map<
    string,
    { id: string; name: string; piCount: number; allCount: number }
  >();

  const corrRows: Array<{ key?: string; key_display_name?: string; count?: number }> =
    corrGroupData?.group_by || [];
  const authRows: Array<{ key?: string; key_display_name?: string; count?: number }> =
    allAuthGroupData?.group_by || [];

  for (const r of corrRows) {
    const id = normalizeAuthorId(String(r.key || ""));
    const name = String(r.key_display_name || "").trim();
    if (!id || !name || id === "Anull") continue;
    candidateMap.set(id, {
      id,
      name,
      piCount: Number(r.count) || 0,
      allCount: Number(r.count) || 0,
    });
  }

  for (const r of authRows) {
    const id = normalizeAuthorId(String(r.key || ""));
    const name = String(r.key_display_name || "").trim();
    if (!id || !name || id === "Anull") continue;
    const existing = candidateMap.get(id);
    if (existing) {
      existing.allCount = Math.max(existing.allCount, Number(r.count) || 0);
    } else {
      candidateMap.set(id, {
        id,
        name,
        piCount: 0,
        allCount: Number(r.count) || 0,
      });
    }
  }

  const sortedCandidates = Array.from(candidateMap.values()).sort((a, b) => {
    if (teamRoleMode === "pi") {
      if (b.piCount !== a.piCount) return b.piCount - a.piCount;
      return b.allCount - a.allCount;
    }
    if (b.allCount !== a.allCount) return b.allCount - a.allCount;
    return b.piCount - a.piCount;
  });

  const selectedCandidates = sortedCandidates.slice(0, 18);
  const candidateIds = selectedCandidates.map((c) => c.id);

  // Step 3: Batch fetch actual papers of those top 18 teams + overall top/latest papers
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

  const [teamCitedData, teamRecentData, topVenueData, latestVenueData] =
    await Promise.all([
      candidateIds.length > 0
        ? fetchOpenAlexJson(
            buildWorksUrl({
              filter: `${baseFilter},authorships.author.id:${candidateIds.join("|")}`,
              sort: "cited_by_count:desc",
              "per-page": "100",
              select: selectFields,
            })
          ).catch(() => null)
        : Promise.resolve(null),
      candidateIds.length > 0
        ? fetchOpenAlexJson(
            buildWorksUrl({
              filter: `${baseFilter},authorships.author.id:${candidateIds.join("|")}`,
              sort: "publication_date:desc",
              "per-page": "100",
              select: selectFields,
            })
          ).catch(() => null)
        : Promise.resolve(null),
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: baseFilter,
          sort: "cited_by_count:desc",
          "per-page": "20",
        })
      ).catch(() => null),
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: baseFilter,
          sort: "publication_date:desc",
          "per-page": "20",
        })
      ).catch(() => null),
    ]);

  const topCitedPapers = deduplicatePapers(
    (topVenueData?.results || []).map(mapWorkToPaper)
  );
  const latestPapers = deduplicatePapers(
    (latestVenueData?.results || []).map(mapWorkToPaper)
  );

  const paperPoolMap = new Map<string, Paper>();
  for (const raw of [
    ...(teamCitedData?.results || []),
    ...(teamRecentData?.results || []),
    ...(topVenueData?.results || []),
    ...(latestVenueData?.results || []),
  ]) {
    const mapped = mapWorkToPaper(raw);
    if (mapped.id && !paperPoolMap.has(mapped.id)) {
      paperPoolMap.set(mapped.id, mapped);
    }
  }
  const allPoolPapers = deduplicatePapers(Array.from(paperPoolMap.values()));

  const journalNameMap = new Map<string, string>();
  for (const j of normalizedJournals) {
    journalNameMap.set(j.id, j.name);
  }

  // Step 4: Construct rich VenueResearchTeam profiles
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
    if (activePapers.length === 0 && cand.allCount === 0) continue;

    // Exclude unaffiliated solo feature/journalism writers when ranking research labs
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

    const jBreakdownMap = new Map<string, { journalId: string; journalName: string; count: number }>();
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

      // Extract key lab members (first 4 + last 2 authors)
      const notableAuthors = [
        ...p.authors.slice(0, 4),
        ...p.authors.slice(-2),
      ];
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

    const expectedTotal =
      teamRoleMode === "pi" && cand.piCount > 0 ? cand.piCount : cand.allCount;

    teams.push({
      id: cand.id,
      name: cand.name,
      institution,
      countryCode,
      totalVenuePapers: Math.max(expectedTotal, activePapers.length),
      sampledPaperCount: activePapers.length,
      piLeadCount: Math.max(cand.piCount, matchingPi.length),
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

  // Step 5: Compute Team-to-Team Edges (Direct Co-authorship + Shared Topic Thematic Overlap)
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

      const score = sharedTopics.length * 2 + sharedKws.length * 1;
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

  // Step 6: Build VenueTopicCluster[], Team<->Topic links, and Topic<->Topic synergy edges
  const topicMetaById = new Map<
    string,
    { field?: string; subfield?: string; kws: Map<string, number> }
  >();

  for (const p of allPoolPapers) {
    if (!p.primaryTopic?.id) continue;
    const tid = p.primaryTopic.id.replace("https://openalex.org/", "");
    let meta = topicMetaById.get(tid);
    if (!meta) {
      meta = {
        field: p.primaryTopic.field,
        subfield: p.primaryTopic.subfield,
        kws: new Map(),
      };
      topicMetaById.set(tid, meta);
    }
    for (const kw of p.keywords || []) {
      if (GENERIC_KEYWORDS.has(kw.toLowerCase())) continue;
      meta.kws.set(kw, (meta.kws.get(kw) || 0) + 1);
    }
  }

  const teamTopicLinks: VenueTeamTopicLink[] = [];
  const topicTeamsMap = new Map<string, Set<string>>();

  const rawTopicGroups: Array<{ key?: string; key_display_name?: string; count?: number }> = (
    topicGroupData?.group_by || []
  ).slice(0, 12);
  const topicNameLookup = new Map<string, string>();
  for (const tg of rawTopicGroups) {
    const tid = String(tg.key || "").replace("https://openalex.org/", "");
    const tname = String(tg.key_display_name || "").trim();
    if (tid && tname) topicNameLookup.set(tid, tname);
  }

  for (const team of teams) {
    const perTopicCount = new Map<string, number>();
    for (const p of team.papers) {
      if (!p.primaryTopic?.id) continue;
      const tid = p.primaryTopic.id.replace("https://openalex.org/", "");
      if (!topicNameLookup.has(tid)) continue;
      perTopicCount.set(tid, (perTopicCount.get(tid) || 0) + 1);
    }
    for (const [tid, count] of Array.from(perTopicCount.entries())) {
      teamTopicLinks.push({ teamId: team.id, topicId: tid, count });
      if (!topicTeamsMap.has(tid)) topicTeamsMap.set(tid, new Set());
      topicTeamsMap.get(tid)!.add(team.id);
    }
  }

  const topics: VenueTopicCluster[] = rawTopicGroups
    .map((tg) => {
      const tid = String(tg.key || "").replace("https://openalex.org/", "");
      const name = String(tg.key_display_name || "").trim();
      const count = Number(tg.count) || 0;
      const meta = topicMetaById.get(tid);
      const topKeywords = meta
        ? Array.from(meta.kws.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k]) => k)
        : [];
      const leadingTeamIds = Array.from(topicTeamsMap.get(tid) || []);

      return {
        id: tid,
        name,
        field: meta?.field,
        subfield: meta?.subfield,
        count,
        sharePct:
          totalMatchingWorks > 0
            ? Math.max(1, Math.round((count / totalMatchingWorks) * 100))
            : 0,
        topKeywords,
        leadingTeamIds,
      };
    })
    .filter((t) => t.id && t.name && t.count > 0);

  // Topic <-> Topic Synergy Edges: connected via cross-topic teams + shared keywords
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

  // Journal counts & year counts
  const rawJournalGroups: Array<{ key?: string; key_display_name?: string; count?: number }> =
    journalGroupData?.group_by || [];
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
    name: j.name || jCountLookup.get(j.id)?.name || j.id,
    count: jCountLookup.get(j.id)?.count || 0,
  }));

  const rawYearGroups: Array<{ key?: string; count?: number }> =
    yearGroupData?.group_by || [];
  const yearCounts: YearCount[] = rawYearGroups
    .filter((g) => /^\d{4}$/.test(String(g.key)))
    .map((g) => ({
      year: parseInt(String(g.key), 10),
      count: Number(g.count) || 0,
    }))
    .filter((yc: YearCount) => yc.year >= yearFrom && yc.year <= yearTo)
    .sort((a: YearCount, b: YearCount) => a.year - b.year);

  const rawKwGroups: Array<{ key_display_name?: string; count?: number }> =
    kwGroupData?.group_by || [];
  const hotKeywords = rawKwGroups
    .map((g) => ({
      name: String(g.key_display_name || "").trim(),
      count: Number(g.count) || 0,
    }))
    .filter(
      (k: { name: string; count: number }) =>
        k.name.length > 0 &&
        k.count > 0 &&
        !GENERIC_KEYWORDS.has(k.name.toLowerCase())
    )
    .slice(0, 18);

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
