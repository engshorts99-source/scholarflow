import {
  ArticleCategory,
  Paper,
  SelectedJournalItem,
  SpotlightAuthorItem,
  VenueFieldScope,
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
  autocompleteAuthors,
  buildArticleCategoryFilters,
  deduplicatePapers,
  fetchOpenAlexJson,
  mapWorkToPaper,
  normalizeAuthorId,
  sanitizeOpenAlexQuery,
} from "./openalex";
import { FIELD_SCOPES, resolveJournalName } from "./journalPresets";

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
  fieldScope?: VenueFieldScope;
  teamRoleMode?: "hybrid" | "pi" | "all";
  spotlightAuthors?: SpotlightAuthorItem[];
  yearFrom: number;
  yearTo: number;
  query?: string;
}): Promise<VenueRadarAnalysis> {
  const {
    journals,
    articleType,
    fieldScope = "all",
    teamRoleMode = "hybrid",
    spotlightAuthors = [],
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
  let cleanQ = query ? sanitizeOpenAlexQuery(query) : "";

  // Smart detection: if user typed an exact researcher name in the topic box (e.g., "Yoshihiro Kawaoka", "Akiko Iwasaki", "Paul Kubes"),
  // check 0-credit /autocomplete/authors! If it's an exact researcher name match, pin them as a Spotlight Lab instead of searching paper text for their name!
  const effectiveSpotlights: SpotlightAuthorItem[] = [...spotlightAuthors];
  const spotlightIdSet = new Set(
    effectiveSpotlights.map((s) => normalizeAuthorId(s.id))
  );

  if (cleanQ && cleanQ.split(/\s+/).length >= 2 && cleanQ.split(/\s+/).length <= 4) {
    try {
      const matchedAuthors = await autocompleteAuthors(cleanQ);
      const exactAuthor = matchedAuthors.find(
        (a) =>
          a.name.toLowerCase() === cleanQ.toLowerCase() &&
          (a.citedByCount || 0) >= 1500
      );
      if (exactAuthor) {
        if (!spotlightIdSet.has(exactAuthor.id)) {
          effectiveSpotlights.push(exactAuthor);
          spotlightIdSet.add(exactAuthor.id);
        }
        // Clear text query so we see their full output in the selected journals alongside peer labs!
        cleanQ = "";
      }
    } catch {
      // Ignore autocomplete errors
    }
  }

  const venueAndWindowParts: string[] = [
    `primary_location.source.id:${sourceIds.join("|")}`,
    `publication_year:${yearFrom}-${yearTo}`,
    ...buildArticleCategoryFilters(articleType, true),
  ];

  const scopeMeta = FIELD_SCOPES.find((f) => f.id === fieldScope);
  if (scopeMeta?.conceptId) {
    venueAndWindowParts.push(`concepts.id:${scopeMeta.conceptId}`);
  }

  const filterWithoutAuthorCap = [...venueAndWindowParts];
  if (cleanQ) {
    filterWithoutAuthorCap.push(`default.search:${cleanQ}`);
  }
  const baseFilter = filterWithoutAuthorCap.join(",");

  // For corresponding_author_ids: only exclude 1-author journalism (keep large clinical/multi-lab PI studies like Long COVID Nature papers!).
  // For authorships.author.id: cap authors_count:2-35 so mega-consortium middle authors don't crowd out lab PIs.
  const corrFilter =
    articleType === "review" ? baseFilter : `${baseFilter},authors_count:>1`;
  const nonConsortiumFilter =
    articleType === "review"
      ? baseFilter
      : `${baseFilter},authors_count:2-35`;

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

  // Phase 1: Parallel ranking + initial top works + optional spotlight author works
  const [corrGroupData, allAuthGroupData, topVenueData, journalGroupData, spotlightWorksData] =
    await Promise.all([
      teamRoleMode !== "all"
        ? fetchOpenAlexJson(
            buildWorksUrl({
              filter: corrFilter,
              group_by: "corresponding_author_ids",
              "per-page": "50",
            })
          ).catch(() => null)
        : Promise.resolve(null),
      teamRoleMode !== "pi"
        ? fetchOpenAlexJson(
            buildWorksUrl({
              filter: nonConsortiumFilter,
              group_by: "authorships.author.id",
              "per-page": "50",
            })
          ).catch(() => null)
        : Promise.resolve(null),
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
      effectiveSpotlights.length > 0
        ? fetchOpenAlexJson(
            buildWorksUrl({
              filter: `${baseFilter},authorships.author.id:${effectiveSpotlights
                .map((s) => normalizeAuthorId(s.id))
                .join("|")}`,
              sort: "publication_date:desc",
              "per-page": "100",
              select: selectFields,
            })
          ).catch(() => null)
        : Promise.resolve(null),
    ]);

  const totalMatchingWorks =
    topVenueData?.meta?.count ??
    allAuthGroupData?.meta?.count ??
    corrGroupData?.meta?.count ??
    0;

  // Merge Corresponding PI counts + Overall Non-Consortium Author counts (Hybrid PI + Senior)
  const candMap = new Map<
    string,
    { id: string; name: string; piCount: number; allCount: number; isSpotlight: boolean }
  >();

  for (const sp of effectiveSpotlights) {
    const sid = normalizeAuthorId(sp.id);
    candMap.set(sid, {
      id: sid,
      name: sp.name,
      piCount: 0,
      allCount: 0,
      isSpotlight: true,
    });
  }

  const corrRows: Array<{
    key?: string;
    key_display_name?: string;
    count?: number;
  }> = corrGroupData?.group_by || [];
  for (const r of corrRows) {
    const id = normalizeAuthorId(String(r.key || ""));
    const name = String(r.key_display_name || "").trim();
    if (!id || !name || id === "Anull") continue;
    const c = Number(r.count) || 0;
    const existing = candMap.get(id);
    if (existing) {
      existing.piCount = Math.max(existing.piCount, c);
      existing.allCount = Math.max(existing.allCount, c);
    } else {
      candMap.set(id, {
        id,
        name,
        piCount: c,
        allCount: c,
        isSpotlight: spotlightIdSet.has(id),
      });
    }
  }

  const authRows: Array<{
    key?: string;
    key_display_name?: string;
    count?: number;
  }> = allAuthGroupData?.group_by || [];
  for (const r of authRows) {
    const id = normalizeAuthorId(String(r.key || ""));
    const name = String(r.key_display_name || "").trim();
    if (!id || !name || id === "Anull") continue;
    const c = Number(r.count) || 0;
    const existing = candMap.get(id);
    if (existing) {
      existing.allCount = Math.max(existing.allCount, c);
    } else {
      candMap.set(id, {
        id,
        name,
        piCount: 0,
        allCount: c,
        isSpotlight: spotlightIdSet.has(id),
      });
    }
  }

  const scoreCandidate = (c: {
    piCount: number;
    allCount: number;
    isSpotlight: boolean;
  }) => {
    const spotlightBoost = c.isSpotlight ? 1_000_000 : 0;
    if (teamRoleMode === "pi") return spotlightBoost + c.piCount * 100 + c.allCount;
    if (teamRoleMode === "all") return spotlightBoost + c.allCount * 100 + c.piCount;
    // Hybrid mode: strongly weight Corresponding PI leadership (3.5x) so middle co-authors never push out true Lab PIs,
    // while still capturing Senior/Last-Author PIs when publishers omit is_corresponding.
    return spotlightBoost + c.piCount * 3.5 + c.allCount;
  };

  const selectedCandidates = Array.from(candMap.values())
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
    .slice(0, 32);

  const initialVenuePapers = deduplicatePapers(
    (topVenueData?.results || []).map(mapWorkToPaper)
  );
  const spotlightPapers = deduplicatePapers(
    (spotlightWorksData?.results || []).map(mapWorkToPaper)
  );

  // Phase 2: Fetch recent/complete papers of top candidates so recent & mid-window papers are well represented
  const candidateIds = selectedCandidates.map((c) => c.id);
  const teamRecentData =
    candidateIds.length > 0 && totalMatchingWorks > 100
      ? await fetchOpenAlexJson(
          buildWorksUrl({
            filter: `${baseFilter},authorships.author.id:${candidateIds
              .slice(0, 25)
              .join("|")}`,
            sort: "publication_date:desc",
            "per-page": "160",
            select: selectFields,
          })
        ).catch(() => null)
      : null;

  const paperPoolMap = new Map<string, Paper>();
  for (const p of [...spotlightPapers, ...initialVenuePapers]) {
    if (p.id && !paperPoolMap.has(p.id)) paperPoolMap.set(p.id, p);
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

    if (
      !cand.isSpotlight &&
      activePapers.length === 0 &&
      cand.allCount === 0 &&
      cand.piCount === 0
    ) {
      continue;
    }

    if (
      !cand.isSpotlight &&
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

    const corpusCount =
      teamRoleMode === "pi"
        ? Math.max(cand.piCount, activePapers.length)
        : Math.max(cand.allCount, cand.piCount, activePapers.length);

    teams.push({
      id: cand.id,
      name: cand.name,
      institution,
      countryCode,
      isSpotlight: cand.isSpotlight,
      totalVenuePapers: corpusCount,
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

  teams.sort((a, b) => {
    if (Boolean(a.isSpotlight) !== Boolean(b.isSpotlight)) {
      return a.isSpotlight ? -1 : 1;
    }
    return (
      b.totalVenuePapers - a.totalVenuePapers ||
      b.piLeadCount - a.piLeadCount ||
      b.streakYears - a.streakYears ||
      b.totalCitations - a.totalCitations
    );
  });

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
    ...thematicCandidates.slice(0, 28),
  ];

  // Derive Topics, Keywords, YearCounts, and JournalCounts locally from allPoolPapers
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
    fieldScope,
    teamRoleMode,
    spotlightAuthors: effectiveSpotlights,
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
