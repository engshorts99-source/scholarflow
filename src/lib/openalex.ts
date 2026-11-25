import {
  Paper,
  SearchParams,
  SearchResult,
  AuthorProfile,
  AuthorInstitution,
  JournalProfile,
  ArticleCategory,
} from "./types";

export const OPENALEX_BASE_URL = "https://api.openalex.org";
const MAILTO = "engshorts99@gmail.com";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const SESSION_CACHE_PREFIX = "schox_oa_";

const memoryCache = new Map<string, { ts: number; data: any }>();
const inflightRequests = new Map<string, Promise<any>>();

export function sanitizeOpenAlexQuery(q: string): string {
  return q
    .replace(/["{},|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWorkId(id: string): string {
  const clean = id.replace("https://openalex.org/", "").trim();
  return clean.startsWith("W") ? clean : `W${clean}`;
}

export function normalizeAuthorId(id: string): string {
  const clean = id.replace("https://openalex.org/", "").trim();
  return clean.startsWith("A") ? clean : `A${clean}`;
}

export function deduplicatePapers(papers: Paper[]): Paper[] {
  const byTitle = new Map<string, Paper>();

  for (const paper of papers) {
    const normTitle = (paper.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "");
    const key = normTitle.length >= 6 ? normTitle : paper.id;

    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, paper);
      continue;
    }

    const existingScore =
      (existing.citedByCount || 0) * 10 +
      (existing.abstract ? 5 : 0) +
      (existing.doi ? 2 : 0);
    const candidateScore =
      (paper.citedByCount || 0) * 10 +
      (paper.abstract ? 5 : 0) +
      (paper.doi ? 2 : 0);

    if (candidateScore > existingScore) {
      byTitle.set(key, paper);
    }
  }

  return Array.from(byTitle.values());
}

function hashKey(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return `${SESSION_CACHE_PREFIX}${(hash >>> 0).toString(36)}_${str.length}`;
}

function readCached(url: string): any | undefined {
  const now = Date.now();
  const mem = memoryCache.get(url);
  if (mem && now - mem.ts < CACHE_TTL_MS) {
    return mem.data;
  }
  if (mem) {
    memoryCache.delete(url);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(hashKey(url));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url === url && now - parsed.ts < CACHE_TTL_MS) {
          memoryCache.set(url, { ts: parsed.ts, data: parsed.data });
          return parsed.data;
        }
      }
    } catch {
      // Ignore storage errors (private browsing / disabled storage)
    }
  }
  return undefined;
}

function writeCached(url: string, data: any): void {
  const entry = { ts: Date.now(), data };
  memoryCache.set(url, entry);

  if (memoryCache.size > 200) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  if (typeof window !== "undefined") {
    try {
      const payload = JSON.stringify({ url, ts: entry.ts, data });
      if (payload.length < 180_000) {
        window.sessionStorage.setItem(hashKey(url), payload);
      }
    } catch {
      // Ignore QuotaExceededError gracefully
    }
  }
}

export async function fetchOpenAlexJson<T = any>(
  url: string,
  options?: { allow404?: boolean }
): Promise<T | null> {
  const cached = readCached(url);
  if (cached !== undefined) {
    return cached as T;
  }

  const existingInflight = inflightRequests.get(url);
  if (existingInflight) {
    return existingInflight as Promise<T | null>;
  }

  const requestPromise = (async (): Promise<T | null> => {
    // Only set User-Agent on server/edge; browsers forbid User-Agent and it triggers CORS preflight.
    const headers: Record<string, string> = {};
    if (typeof window === "undefined") {
      headers["User-Agent"] = `Schox/1.0 (mailto:${MAILTO})`;
    }

    let lastStatus = 0;
    let lastStatusText = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, { cache: "no-store", headers });
      lastStatus = res.status;
      lastStatusText = res.statusText;

      if (res.status === 404 && options?.allow404) {
        return null;
      }

      if (res.status === 429) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        throw new Error(
          "OpenAlex free daily query limit reached for your IP. Please try again later."
        );
      }

      if (!res.ok) {
        throw new Error(
          `OpenAlex API error (${res.status}): ${res.statusText || "Request failed"}`
        );
      }

      const data = await res.json();
      writeCached(url, data);
      return data as T;
    }

    throw new Error(
      `OpenAlex API error (${lastStatus}): ${lastStatusText || "Request failed"}`
    );
  })();

  inflightRequests.set(url, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inflightRequests.delete(url);
  }
}

// Helper to convert inverted index to string
function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null
): string | null {
  if (!invertedIndex) return null;
  let maxIndex = -1;
  for (const positions of Object.values(invertedIndex)) {
    for (const pos of positions) {
      if (pos > maxIndex) maxIndex = pos;
    }
  }
  if (maxIndex < 0) return null;
  const words = new Array(maxIndex + 1).fill("");
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.join(" ").replace(/\s+/g, " ").trim();
}

function parsePosition(pos: any): "first" | "middle" | "last" | undefined {
  if (pos === "first" || pos === "middle" || pos === "last") return pos;
  return undefined;
}

// Map OpenAlex work to our Paper type
export function mapWorkToPaper(work: any): Paper {
  const rawConcepts = (work.concepts || [])
    .slice()
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    .map((c: any) => ({
      id: c.id?.replace("https://openalex.org/", "") || "",
      displayName: c.display_name || "",
      level: c.level ?? 1,
    }))
    .filter((c: any) => c.displayName);

  const fallbackConcepts =
    rawConcepts.length > 0
      ? rawConcepts
      : (work.topics || [])
          .slice(0, 8)
          .map((t: any) => ({
            id: t.id?.replace("https://openalex.org/", "") || "",
            displayName: t.display_name || "",
            level: 1,
          }))
          .filter((c: any) => c.displayName);

  return {
    id: work.id?.replace("https://openalex.org/", "") || "",
    doi: work.doi || null,
    title: work.title || work.display_name || "Untitled Paper",
    publicationDate: work.publication_date || "",
    publicationYear: work.publication_year || 0,
    type: work.type || undefined,
    authors: (work.authorships || []).map((a: any) => ({
      id: a.author?.id?.replace("https://openalex.org/", "") || "",
      name: a.author?.display_name || "Unknown Author",
      institution: a.institutions?.[0]?.display_name || undefined,
      institutionId:
        a.institutions?.[0]?.id?.replace("https://openalex.org/", "") ||
        undefined,
      countryCode: a.institutions?.[0]?.country_code || undefined,
      position: parsePosition(a.author_position),
      isCorresponding: Boolean(a.is_corresponding),
    })),
    correspondingAuthorIds: (work.corresponding_author_ids || []).map(
      (cid: string) => cid?.replace("https://openalex.org/", "") || ""
    ).filter(Boolean),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    tldr: null, // Enriched by Semantic Scholar when available
    citedByCount: work.cited_by_count || 0,
    isOpenAccess: work.open_access?.is_oa || false,
    pdfUrl: work.open_access?.oa_url || null,
    journal: work.primary_location?.source
      ? {
          id:
            work.primary_location.source.id?.replace(
              "https://openalex.org/",
              ""
            ) || "",
          displayName: work.primary_location.source.display_name || "",
          issn: work.primary_location.source.issn,
          publisher: work.primary_location.source.host_organization_name,
        }
      : null,
    primaryTopic: work.primary_topic
      ? {
          id:
            work.primary_topic.id?.replace("https://openalex.org/", "") || "",
          displayName: work.primary_topic.display_name || "",
          subfield: work.primary_topic.subfield?.display_name,
          field: work.primary_topic.field?.display_name,
          domain: work.primary_topic.domain?.display_name,
        }
      : null,
    keywords: (work.keywords || [])
      .map((k: any) => k.display_name)
      .filter(Boolean),
    countsByYear: (work.counts_by_year || [])
      .map((c: any) => ({
        year: c.year,
        citedByCount: c.cited_by_count || 0,
      }))
      .sort((a: { year: number }, b: { year: number }) => a.year - b.year),
    referencedWorksCount:
      work.referenced_works_count ?? work.referenced_works?.length ?? 0,
    concepts: fallbackConcepts,
    referencedWorks: (work.referenced_works || []).map(
      (rw: string) => rw?.replace("https://openalex.org/", "") || ""
    ),
    relatedWorks: (work.related_works || []).map(
      (rw: string) => rw?.replace("https://openalex.org/", "") || ""
    ),
  };
}

export function buildArticleCategoryFilters(
  articleType: ArticleCategory | undefined,
  hasJournalFilter: boolean
): string[] {
  if (articleType === "review") {
    return ["type:review"];
  }
  if (articleType === "research") {
    return hasJournalFilter
      ? ["type:article|letter", "referenced_works_count:>5"]
      : ["type:article|letter|conference-paper|preprint"];
  }
  // Default "both": Research (incl. letters) + Reviews
  return hasJournalFilter
    ? ["type:article|letter|review", "referenced_works_count:>5"]
    : ["type:article|letter|conference-paper|preprint|review"];
}

export async function searchPapers(params: SearchParams): Promise<SearchResult> {
  const url = new URL(`${OPENALEX_BASE_URL}/works`);

  const hasJournal = Boolean(
    params.journalId && params.journalId.trim().length > 0
  );
  const filters: string[] = buildArticleCategoryFilters(
    params.articleType,
    hasJournal
  );

  const cleanQ = params.q ? sanitizeOpenAlexQuery(params.q) : "";
  if (cleanQ) {
    filters.push(`default.search:${cleanQ}`);
  }

  if (params.journalId) {
    const journalIds = params.journalId
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (journalIds.length > 1) {
      filters.push(`primary_location.source.id:${journalIds.join("|")}`);
    } else if (journalIds.length === 1) {
      filters.push(`primary_location.source.id:${journalIds[0]}`);
    }
  }

  if (params.authorId) {
    filters.push(`authorships.author.id:${normalizeAuthorId(params.authorId)}`);
  }
  if (params.coauthorId) {
    filters.push(
      `authorships.author.id:${normalizeAuthorId(params.coauthorId)}`
    );
  }
  if (params.citesId) {
    filters.push(`cites:${normalizeWorkId(params.citesId)}`);
  }

  if (params.yearFrom && params.yearTo) {
    filters.push(`publication_year:${params.yearFrom}-${params.yearTo}`);
  } else if (params.yearFrom) {
    const currentYear = new Date().getFullYear();
    filters.push(`publication_year:${params.yearFrom}-${currentYear}`);
  } else if (params.yearTo) {
    filters.push(`publication_year:1900-${params.yearTo}`);
  }

  if (!params.yearTo && !params.yearFrom) {
    const today = new Date().toISOString().split("T")[0];
    filters.push(`to_publication_date:${today}`);
  }

  if (params.oaOnly) {
    filters.push("open_access.is_oa:true");
  }

  if (filters.length > 0) {
    url.searchParams.append("filter", filters.join(","));
  }

  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per-page", "20");

  if (params.sort === "citations") {
    url.searchParams.append("sort", "cited_by_count:desc");
  } else if (params.sort === "date") {
    url.searchParams.append("sort", "publication_date:desc");
  } else if (params.sort === "oldest") {
    url.searchParams.append("sort", "publication_date:asc");
  } else if (params.sort === "relevance" && cleanQ) {
    url.searchParams.append("sort", "relevance_score:desc");
  } else if (!cleanQ) {
    url.searchParams.append("sort", "publication_date:desc");
  }

  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());

  return {
    results: (data?.results || []).map(mapWorkToPaper),
    totalCount: data?.meta?.count || 0,
    page: data?.meta?.page || params.page || 1,
  };
}

export async function getPaperById(id: string): Promise<Paper | null> {
  const isDoi = id.startsWith("10.");
  const endpoint = isDoi
    ? `https://doi.org/${id}`
    : normalizeWorkId(id);
  const url = `${OPENALEX_BASE_URL}/works/${endpoint}?mailto=${MAILTO}`;

  const data = await fetchOpenAlexJson(url, { allow404: true });
  if (!data) return null;
  return mapWorkToPaper(data);
}

export async function getWorksByIds(
  workIds: string[],
  limit = 10
): Promise<Paper[]> {
  const cleanIds = Array.from(
    new Set(
      workIds
        .map((id) => id.replace("https://openalex.org/", "").trim())
        .filter((id) => /^W\d+$/.test(id))
    )
  ).slice(0, 25);

  if (cleanIds.length === 0) return [];

  const url = new URL(`${OPENALEX_BASE_URL}/works`);
  url.searchParams.append("filter", `openalex:${cleanIds.join("|")}`);
  url.searchParams.append("sort", "cited_by_count:desc");
  url.searchParams.append("per-page", Math.min(limit, 25).toString());
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());
  return (data?.results || []).map(mapWorkToPaper);
}

export async function getCoauthoredPapers(
  authorIdA: string,
  authorIdB: string,
  perPage = 20
): Promise<{ results: Paper[]; totalCount: number }> {
  const idA = normalizeAuthorId(authorIdA);
  const idB = normalizeAuthorId(authorIdB);

  const url = new URL(`${OPENALEX_BASE_URL}/works`);
  url.searchParams.append(
    "filter",
    `authorships.author.id:${idA},authorships.author.id:${idB}`
  );
  url.searchParams.append("sort", "cited_by_count:desc");
  url.searchParams.append("per-page", perPage.toString());
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());
  return {
    results: (data?.results || []).map(mapWorkToPaper),
    totalCount: data?.meta?.count || 0,
  };
}

export async function getAuthorWorksForNetwork(
  authorId: string
): Promise<Paper[]> {
  const cleanId = normalizeAuthorId(authorId);
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
    "primary_topic",
    "referenced_works",
    "referenced_works_count",
  ].join(",");

  const topUrl = new URL(`${OPENALEX_BASE_URL}/works`);
  topUrl.searchParams.append("filter", `authorships.author.id:${cleanId}`);
  topUrl.searchParams.append("sort", "cited_by_count:desc");
  topUrl.searchParams.append("per-page", "35");
  topUrl.searchParams.append("select", selectFields);
  topUrl.searchParams.append("mailto", MAILTO);

  const recentUrl = new URL(`${OPENALEX_BASE_URL}/works`);
  recentUrl.searchParams.append("filter", `authorships.author.id:${cleanId}`);
  recentUrl.searchParams.append("sort", "publication_date:desc");
  recentUrl.searchParams.append("per-page", "25");
  recentUrl.searchParams.append("select", selectFields);
  recentUrl.searchParams.append("mailto", MAILTO);

  const [topData, recentData] = await Promise.all([
    fetchOpenAlexJson(topUrl.toString()).catch(() => null),
    fetchOpenAlexJson(recentUrl.toString()).catch(() => null),
  ]);

  const byId = new Map<string, Paper>();
  for (const raw of [
    ...(topData?.results || []),
    ...(recentData?.results || []),
  ]) {
    const paper = mapWorkToPaper(raw);
    if (paper.id && !byId.has(paper.id)) {
      byId.set(paper.id, paper);
    }
  }

  return Array.from(byId.values());
}

function mapInstitution(inst: any): AuthorInstitution {
  return {
    id: inst.id?.replace("https://openalex.org/", "") || "",
    displayName: inst.display_name || "",
    countryCode: inst.country_code || "",
    type: inst.type || "",
  };
}

function mapOpenAlexAuthorToProfile(data: any): AuthorProfile {
  const rawInstitutions = Array.isArray(data.last_known_institutions)
    ? data.last_known_institutions
    : data.last_known_institution
    ? [data.last_known_institution]
    : [];

  const lastKnownInstitutions: AuthorInstitution[] = rawInstitutions
    .filter((i: any) => i && i.display_name)
    .map(mapInstitution);

  const affiliations = (data.affiliations || [])
    .filter((aff: any) => aff?.institution?.display_name)
    .map((aff: any) => ({
      institution: mapInstitution(aff.institution),
      years: Array.isArray(aff.years)
        ? [...aff.years].sort((a: number, b: number) => b - a)
        : [],
    }))
    .sort(
      (a: { years: number[] }, b: { years: number[] }) =>
        (b.years[0] || 0) - (a.years[0] || 0)
    );

  const topics = (data.topics || []).slice(0, 10).map((t: any) => ({
    id: t.id?.replace("https://openalex.org/", "") || "",
    displayName: t.display_name || "",
    count: t.count || 0,
    field: t.field?.display_name,
    subfield: t.subfield?.display_name,
  }));

  const rawXConcepts = data.x_concepts || [];
  const concepts =
    rawXConcepts.length > 0
      ? rawXConcepts.slice(0, 8).map((c: any) => ({
          id: c.id?.replace("https://openalex.org/", "") || "",
          displayName: c.display_name || "",
          score: c.score || 0,
        }))
      : topics.slice(0, 8).map((t: any) => ({
          id: t.id,
          displayName: t.displayName,
          score: t.count || 0,
        }));

  return {
    id: data.id?.replace("https://openalex.org/", "") || "",
    displayName: data.display_name || "Unknown Researcher",
    alternatives: data.display_name_alternatives || [],
    worksCount: data.works_count || 0,
    citedByCount: data.cited_by_count || 0,
    orcid: data.orcid || null,
    hIndex: data.summary_stats?.h_index,
    i10Index: data.summary_stats?.i10_index,
    twoYearMeanCitedness: data.summary_stats?.["2yr_mean_citedness"],
    lastKnownInstitution: lastKnownInstitutions[0] || null,
    lastKnownInstitutions,
    affiliations,
    topics,
    concepts,
    countsByYear: (data.counts_by_year || []).map((c: any) => ({
      year: c.year,
      worksCount: c.works_count || 0,
      citedByCount: c.cited_by_count || 0,
    })),
  };
}

export async function searchAuthors(
  query: string,
  page: number = 1
): Promise<{ results: AuthorProfile[]; totalCount: number; page: number }> {
  const url = new URL(`${OPENALEX_BASE_URL}/authors`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per-page", "20");
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());

  return {
    results: (data?.results || []).map(mapOpenAlexAuthorToProfile),
    totalCount: data?.meta?.count || 0,
    page: data?.meta?.page || page,
  };
}

export async function getAuthorById(id: string): Promise<AuthorProfile | null> {
  const authorId = normalizeAuthorId(id);
  const url = `${OPENALEX_BASE_URL}/authors/${authorId}?mailto=${MAILTO}`;

  const data = await fetchOpenAlexJson(url, { allow404: true });
  if (!data) return null;
  return mapOpenAlexAuthorToProfile(data);
}

export async function getJournalById(
  id: string
): Promise<JournalProfile | null> {
  const sourceId = id.startsWith("S") ? id : `S${id}`;
  const url = `${OPENALEX_BASE_URL}/sources/${sourceId}?mailto=${MAILTO}`;

  const data = await fetchOpenAlexJson(url, { allow404: true });
  if (!data) return null;
  return {
    id: data.id?.replace("https://openalex.org/", "") || "",
    displayName: data.display_name || "",
    issn: data.issn || [],
    issnL: data.issn_l || null,
    publisher: data.host_organization_name || null,
    worksCount: data.works_count || 0,
    citedByCount: data.cited_by_count || 0,
    homepageUrl: data.homepage_url || null,
    type: data.type || null,
  };
}

export async function searchJournals(
  query: string,
  page: number = 1
): Promise<{ results: JournalProfile[]; totalCount: number; page: number }> {
  const url = new URL(`${OPENALEX_BASE_URL}/sources`);
  url.searchParams.append("search", query);
  url.searchParams.append("filter", "type:journal");
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per-page", "20");
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());

  return {
    results: (data?.results || []).map(
      (d: any): JournalProfile => ({
        id: d.id?.replace("https://openalex.org/", "") || "",
        displayName: d.display_name || "",
        issn: d.issn || [],
        issnL: d.issn_l || null,
        publisher: d.host_organization_name || null,
        worksCount: d.works_count || 0,
        citedByCount: d.cited_by_count || 0,
        homepageUrl: d.homepage_url || null,
        type: d.type || null,
      })
    ),
    totalCount: data?.meta?.count || 0,
    page: data?.meta?.page || page,
  };
}
