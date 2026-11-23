import {
  ConceptAnalysis,
  ConceptSnapshot,
  EvolutionEra,
  Paper,
  ResearchMaturityStage,
  YearCount,
} from "./types";
import {
  OPENALEX_BASE_URL,
  deduplicatePapers,
  fetchOpenAlexJson,
  mapWorkToPaper,
  sanitizeOpenAlexQuery,
} from "./openalex";
import { buildConceptPeopleGraph } from "./relationshipEngine";

const MAILTO = "engshorts99@gmail.com";

export function extractDefinitionalExcerpt(
  abstract: string | null | undefined,
  maxChars = 320
): string | null {
  if (!abstract) return null;
  let cleaned = abstract
    .replace(/^\s*(Abstract|Summary|Background|Motivation|Purpose)\s*[:.-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  // Split into sentence-like chunks while respecting abbreviations moderately
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length === 0) {
    return cleaned.length > maxChars
      ? `${cleaned.slice(0, maxChars - 1).trim()}…`
      : cleaned;
  }

  let excerpt = sentences[0].trim();
  if (sentences.length > 1 && excerpt.length + sentences[1].length + 1 <= maxChars + 40) {
    excerpt = `${excerpt} ${sentences[1].trim()}`.trim();
  }

  if (excerpt.length > maxChars + 40) {
    excerpt = `${excerpt.slice(0, maxChars).trim()}…`;
  }
  return excerpt;
}

function buildWorksUrl(params: Record<string, string>): string {
  const url = new URL(`${OPENALEX_BASE_URL}/works`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, v);
  }
  url.searchParams.append("mailto", MAILTO);
  return url.toString();
}

async function computeConceptSnapshotInternal(
  rawQuery: string
): Promise<{ snapshot: ConceptSnapshot; originPapers: Paper[] } | null> {
  const cleanQ = sanitizeOpenAlexQuery(rawQuery);
  if (cleanQ.length < 2) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1..12
  const words = cleanQ.split(/\s+/).filter(Boolean);

  let queryMode: "title" | "title_and_abstract" = "title";
  let activeFilter = `title.search:"${cleanQ}"`;
  let yearGroupData: any = null;

  if (words.length <= 5) {
    yearGroupData = await fetchOpenAlexJson(
      buildWorksUrl({
        filter: activeFilter,
        group_by: "publication_year",
      })
    );
  }

  const titleCount = yearGroupData?.meta?.count || 0;
  if (words.length > 5 || titleCount < 15) {
    const absFilter = `title_and_abstract.search:${cleanQ}`;
    const absData = await fetchOpenAlexJson(
      buildWorksUrl({
        filter: absFilter,
        group_by: "publication_year",
      })
    );
    if ((absData?.meta?.count || 0) >= titleCount) {
      queryMode = "title_and_abstract";
      activeFilter = absFilter;
      yearGroupData = absData;
    }
  }

  const totalCount = yearGroupData?.meta?.count || 0;
  if (totalCount === 0) return null;

  const yearCounts: YearCount[] = (yearGroupData?.group_by || [])
    .filter((g: any) => /^\d{4}$/.test(String(g.key)))
    .map((g: any) => ({
      year: parseInt(String(g.key), 10),
      count: Number(g.count) || 0,
    }))
    .filter((yc: YearCount) => yc.year >= 1900 && yc.year <= currentYear && yc.count > 0)
    .sort((a: YearCount, b: YearCount) => a.year - b.year);

  if (yearCounts.length === 0) return null;

  // Step B: Earliest defining papers
  const floor = totalCount >= 500 ? 20 : totalCount >= 80 ? 5 : 0;
  const earliestFilter =
    floor > 0 ? `${activeFilter},cited_by_count:>${floor}` : activeFilter;

  let earliestData = await fetchOpenAlexJson(
    buildWorksUrl({
      filter: earliestFilter,
      sort: "publication_year:asc",
      "per-page": "15",
    })
  );

  let rawOriginPapers: Paper[] = (earliestData?.results || [])
    .map(mapWorkToPaper)
    .filter((p: Paper) => p.publicationYear >= 1900 && p.publicationYear <= currentYear);

  if (rawOriginPapers.length === 0 && floor > 0) {
    earliestData = await fetchOpenAlexJson(
      buildWorksUrl({
        filter: activeFilter,
        sort: "publication_year:asc",
        "per-page": "15",
      })
    );
    rawOriginPapers = (earliestData?.results || [])
      .map(mapWorkToPaper)
      .filter((p: Paper) => p.publicationYear >= 1900 && p.publicationYear <= currentYear);
  }

  const originPapers = deduplicatePapers(rawOriginPapers).sort(
    (a, b) => a.publicationYear - b.publicationYear || b.citedByCount - a.citedByCount
  );

  // Step C: Deterministic Origin & Research State Calculation
  const yearMap = new Map<number, number>();
  let peakYear: number | null = null;
  let peakCount = 0;

  for (const yc of yearCounts) {
    yearMap.set(yc.year, yc.count);
    if (yc.count > peakCount) {
      peakCount = yc.count;
      peakYear = yc.year;
    }
  }

  const threshold = Math.min(10, Math.max(3, Math.floor(peakCount * 0.002)));
  let sustainedStartYear = yearCounts[0].year;
  for (const yc of yearCounts) {
    const sum3 =
      (yearMap.get(yc.year) || 0) +
      (yearMap.get(yc.year + 1) || 0) +
      (yearMap.get(yc.year + 2) || 0);
    if (sum3 >= threshold) {
      sustainedStartYear = yc.year;
      break;
    }
  }

  const originCandidatesRaw = originPapers.filter(
    (p) => p.publicationYear >= sustainedStartYear - 5
  );
  const originCandidates =
    originCandidatesRaw.length > 0 ? originCandidatesRaw : originPapers;

  const originYear =
    originCandidates[0]?.publicationYear ?? sustainedStartYear;

  const definingPool = originCandidates.filter(
    (p) => p.publicationYear >= originYear && p.publicationYear <= originYear + 2
  );
  const definingPaper =
    (definingPool.length > 0 ? definingPool : originCandidates)
      .slice()
      .sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0))[0] || null;

  const definitionalExcerpt = extractDefinitionalExcerpt(
    definingPaper?.abstract
  );

  const curYearCount = yearMap.get(currentYear) || 0;
  const prev1YearCount = yearMap.get(currentYear - 1) || 0;
  const recent2YrCount = prev1YearCount + curYearCount;

  // Annualize current year only before October so growth isn't skewed mid-year
  const adjustedCurYear =
    currentMonth < 10
      ? curYearCount * (12 / Math.max(1, currentMonth - 0.5))
      : curYearCount;
  const annualizedRecent2Yr = prev1YearCount + adjustedCurYear;

  const prev2YrCount =
    (yearMap.get(currentYear - 3) || 0) + (yearMap.get(currentYear - 2) || 0);

  const growthRate2Yr =
    prev2YrCount > 0
      ? Math.round(((annualizedRecent2Yr - prev2YrCount) / prev2YrCount) * 100)
      : null;

  const last3YrCount =
    curYearCount +
    prev1YearCount +
    (yearMap.get(currentYear - 2) || 0);

  const recentSharePct =
    totalCount > 0 ? Math.min(100, Math.round((last3YrCount / totalCount) * 100)) : 0;

  let stage: ResearchMaturityStage = "Quiet / Specialized";
  if (growthRate2Yr !== null && growthRate2Yr >= 60 && recent2YrCount >= 40) {
    stage = "Explosive Frontier";
  } else if (growthRate2Yr !== null && growthRate2Yr >= 25 && recent2YrCount >= 25) {
    stage = "Rapidly Accelerating";
  } else if (
    currentYear - originYear <= 6 &&
    totalCount < 2500 &&
    (growthRate2Yr === null || growthRate2Yr >= 0)
  ) {
    stage = "Emerging Niche";
  } else if (
    recent2YrCount >= 40 &&
    (growthRate2Yr === null || growthRate2Yr >= -10)
  ) {
    stage = "Mature & Active";
  } else if (
    peakYear !== null &&
    peakYear < currentYear - 4 &&
    growthRate2Yr !== null &&
    growthRate2Yr < -10
  ) {
    stage = "Established Classic";
  }

  const leadName = definingPaper?.authors?.[0]?.name;
  const momentumClause =
    growthRate2Yr !== null
      ? ` (${growthRate2Yr >= 0 ? "+" : ""}${growthRate2Yr}% 2-year momentum)`
      : "";
  const summaryText = `First sustained research emerged around ${originYear}${
    leadName ? ` (early landmark by ${leadName})` : ""
  }, spanning ${totalCount.toLocaleString()} works across the literature. Currently in a ${stage} state${momentumClause}, with ${recentSharePct}% of papers published in the last 3 years.`;

  return {
    snapshot: {
      query: rawQuery.trim(),
      queryMode,
      activeFilter,
      totalCount,
      originYear,
      definingPaper,
      definitionalExcerpt,
      stage,
      growthRate2Yr,
      recent2YrCount,
      recentSharePct,
      peakYear,
      peakCount,
      yearCounts,
      summaryText,
    },
    originPapers,
  };
}

export async function getConceptSnapshot(
  rawQuery: string
): Promise<ConceptSnapshot | null> {
  const res = await computeConceptSnapshotInternal(rawQuery);
  return res?.snapshot ?? null;
}

export async function getFullConceptAnalysis(
  rawQuery: string
): Promise<ConceptAnalysis | null> {
  const base = await computeConceptSnapshotInternal(rawQuery);
  if (!base) return null;

  const { snapshot, originPapers } = base;
  const { activeFilter, yearCounts } = snapshot;
  const currentYear = new Date().getFullYear();

  const [seminalData, frontierData, prolificData, hotKwData] =
    await Promise.all([
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: activeFilter,
          sort: "cited_by_count:desc",
          "per-page": "25",
        })
      ).catch(() => null),
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: `${activeFilter},publication_year:${currentYear - 1}-${currentYear}`,
          sort: "cited_by_count:desc",
          "per-page": "25",
        })
      ).catch(() => null),
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: activeFilter,
          group_by: "authorships.author.id",
          "per-page": "15",
        })
      ).catch(() => null),
      fetchOpenAlexJson(
        buildWorksUrl({
          filter: `${activeFilter},publication_year:${currentYear - 1}-${currentYear}`,
          group_by: "keywords.id",
          "per-page": "15",
        })
      ).catch(() => null),
    ]);

  const seminalPapers = deduplicatePapers(
    (seminalData?.results || []).map(mapWorkToPaper)
  ).sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));

  const frontierPapers = deduplicatePapers(
    (frontierData?.results || []).map(mapWorkToPaper)
  ).sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));

  const reviewPapers = deduplicatePapers(
    [...seminalPapers, ...frontierPapers].filter(
      (p) =>
        p.type === "review" ||
        /\b(survey|review|overview|state[- ]of[- ]the[- ]art)\b/i.test(p.title)
    )
  )
    .sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0))
    .slice(0, 10);

  let definitionalExcerpt = snapshot.definitionalExcerpt;
  if (!definitionalExcerpt) {
    const fallbackWithAbstract = [
      ...originPapers,
      ...seminalPapers,
      ...reviewPapers,
    ].find((p) => Boolean(p.abstract));
    definitionalExcerpt = extractDefinitionalExcerpt(
      fallbackWithAbstract?.abstract
    );
  }

  // Determine canonical domain breadcrumb from most frequent primaryTopic
  const topicCounts = new Map<
    string,
    { count: number; path: string[] }
  >();
  for (const p of [...seminalPapers, ...frontierPapers]) {
    if (!p.primaryTopic?.displayName) continue;
    const key = p.primaryTopic.id || p.primaryTopic.displayName;
    const path = [
      p.primaryTopic.domain,
      p.primaryTopic.field,
      p.primaryTopic.subfield,
      p.primaryTopic.displayName,
    ].filter((s): s is string => Boolean(s));
    const existing = topicCounts.get(key);
    if (existing) existing.count += 1;
    else topicCounts.set(key, { count: 1, path });
  }
  const topTopic = Array.from(topicCounts.values()).sort(
    (a, b) => b.count - a.count
  )[0];
  const domainPath = topTopic?.path || [];

  const hotKeywords = (hotKwData?.group_by || [])
    .map((g: any) => ({
      name: String(g.key_display_name || "").trim(),
      count: Number(g.count) || 0,
    }))
    .filter((k: { name: string; count: number }) => k.name.length > 0 && k.count > 0)
    .slice(0, 12);

  const prolificAuthors = (prolificData?.group_by || [])
    .map((g: any) => ({
      id: String(g.key || "").replace("https://openalex.org/", ""),
      name: String(g.key_display_name || "").trim(),
      count: Number(g.count) || 0,
    }))
    .filter((a: { id: string; name: string }) => a.id && a.name)
    .slice(0, 15);

  const originY = snapshot.originYear ?? currentYear;
  const span = Math.max(0, currentYear - originY);

  const sumRange = (start: number, end: number) =>
    yearCounts
      .filter((yc) => yc.year >= start && yc.year <= end)
      .reduce((sum, yc) => sum + yc.count, 0);

  const allAnchorCandidates = deduplicatePapers([
    ...originPapers,
    ...seminalPapers,
    ...frontierPapers,
  ]);
  const usedInEras = new Set<string>();

  const pickEraPapers = (
    start: number,
    end: number,
    preferOrigin = false
  ): Paper[] => {
    const inWindow = allAnchorCandidates
      .filter((p) => p.publicationYear >= start && p.publicationYear <= end)
      .sort((a, b) => {
        if (preferOrigin) {
          const yearDiff = a.publicationYear - b.publicationYear;
          if (Math.abs(yearDiff) >= 2) return yearDiff;
        }
        return (b.citedByCount || 0) - (a.citedByCount || 0);
      });

    const fresh = inWindow.filter((p) => !usedInEras.has(p.id));
    const chosen = (fresh.length >= 2 ? fresh : inWindow).slice(0, 3);
    for (const c of chosen) usedInEras.add(c.id);
    return chosen;
  };

  const eras: EvolutionEra[] = [];
  if (span < 3) {
    if (originY < currentYear) {
      eras.push({
        id: "origin",
        label: "Origin & Emergence",
        subtitle: "First formulations and foundational benchmarks",
        startYear: originY,
        endYear: currentYear - 1,
        paperCount: sumRange(originY, currentYear - 1),
        papers: pickEraPapers(originY, currentYear - 1, true),
      });
    }
    eras.push({
      id: "frontier",
      label: "Current Frontier",
      subtitle: "Newest developments and emerging trajectories",
      startYear: Math.max(originY, currentYear - (originY === currentYear ? 0 : 0)),
      endYear: currentYear,
      paperCount: sumRange(currentYear, currentYear),
      papers: pickEraPapers(currentYear, currentYear),
    });
  } else if (span < 6) {
    const originEnd = originY + 1;
    const midEnd = Math.max(originEnd + 1, currentYear - 2);
    eras.push({
      id: "origin",
      label: "1. Origin & Definition",
      subtitle: "Initial formulation and defining frameworks",
      startYear: originY,
      endYear: originEnd,
      paperCount: sumRange(originY, originEnd),
      papers: pickEraPapers(originY, originEnd, true),
    });
    if (originEnd + 1 <= midEnd) {
      eras.push({
        id: "breakthrough",
        label: "2. Breakthrough & Foundation",
        subtitle: "Core methodology and rising adoption",
        startYear: originEnd + 1,
        endYear: midEnd,
        paperCount: sumRange(originEnd + 1, midEnd),
        papers: pickEraPapers(originEnd + 1, midEnd),
      });
    }
    eras.push({
      id: "frontier",
      label: `${eras.length + 1}. Current Frontier`,
      subtitle: "Active research front and specialization",
      startYear: midEnd + 1,
      endYear: currentYear,
      paperCount: sumRange(midEnd + 1, currentYear),
      papers: pickEraPapers(midEnd + 1, currentYear),
    });
  } else {
    const originEnd = Math.min(originY + 2, currentYear - 3);
    const frontierStart = currentYear - 1;
    const expansionEnd = frontierStart - 1;
    const midPoint =
      originEnd + Math.max(1, Math.floor((expansionEnd - originEnd) / 2));

    eras.push({
      id: "origin",
      label: "1. Origin & Definition",
      subtitle: "Earliest formalizations and foundational concepts",
      startYear: originY,
      endYear: originEnd,
      paperCount: sumRange(originY, originEnd),
      papers: pickEraPapers(originY, originEnd, true),
    });

    if (originEnd + 1 <= midPoint) {
      eras.push({
        id: "breakthrough",
        label: "2. Breakthrough & Foundation",
        subtitle: "Landmark papers driving rapid community uptake",
        startYear: originEnd + 1,
        endYear: midPoint,
        paperCount: sumRange(originEnd + 1, midPoint),
        papers: pickEraPapers(originEnd + 1, midPoint),
      });
    }

    if (midPoint + 1 <= expansionEnd) {
      eras.push({
        id: "expansion",
        label: "3. Expansion & Synthesis",
        subtitle: "Broad interdisciplinary scaling and major surveys",
        startYear: midPoint + 1,
        endYear: expansionEnd,
        paperCount: sumRange(midPoint + 1, expansionEnd),
        papers: pickEraPapers(midPoint + 1, expansionEnd),
      });
    }

    eras.push({
      id: "frontier",
      label: `${eras.length + 1}. Current Frontier`,
      subtitle: "Latest high-impact work and active research directions",
      startYear: frontierStart,
      endYear: currentYear,
      paperCount: sumRange(frontierStart, currentYear),
      papers: pickEraPapers(frontierStart, currentYear),
    });
  }

  const { people, edges, topInstitutions } = buildConceptPeopleGraph({
    originPapers,
    seminalPapers,
    frontierPapers,
    prolificAuthors,
    originYear: originY,
    currentYear,
  });

  return {
    ...snapshot,
    definitionalExcerpt,
    domainPath,
    eras,
    seminalPapers: seminalPapers.slice(0, 12),
    frontierPapers: frontierPapers.slice(0, 12),
    reviewPapers,
    hotKeywords,
    topInstitutions,
    people,
    edges,
    prolificAuthors,
  };
}
