import {
  Paper,
  SearchParams,
  SearchResult,
  AuthorProfile,
  AuthorInstitution,
  JournalProfile,
  ArticleCategory,
  SpotlightAuthorItem,
} from "./types";

export const OPENALEX_BASE_URL = "https://api.openalex.org";
const MAILTO = "engshorts99@gmail.com";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours persistent cache
const STORAGE_CACHE_PREFIX = "schox_oa2_";
export const API_KEY_STORAGE_KEY = "schox_openalex_api_key";

const memoryCache = new Map<string, { ts: number; data: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();

export function getSavedOpenAlexApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return (window.localStorage.getItem(API_KEY_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setSavedOpenAlexApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const clean = key.trim();
    if (clean) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, clean);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

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
  return `${STORAGE_CACHE_PREFIX}${(hash >>> 0).toString(36)}_${str.length}`;
}

export function hasCachedOpenAlexUrl(url: string): boolean {
  return readCached(url) !== undefined;
}

function evictOldCacheEntries(): void {
  if (typeof window === "undefined") return;
  try {
    const entries: { key: string; ts: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(k);
          const parsed = raw ? JSON.parse(raw) : null;
          entries.push({ key: k, ts: parsed?.ts || 0 });
        } catch {
          entries.push({ key: k, ts: 0 });
        }
      }
    }
    entries.sort((a, b) => a.ts - b.ts);
    const removeCount = Math.max(10, Math.floor(entries.length / 2));
    for (let i = 0; i < Math.min(removeCount, entries.length); i++) {
      window.localStorage.removeItem(entries[i].key);
    }
  } catch {
    // Ignore storage cleanup errors
  }
}

function readCached(url: string): unknown {
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
      const storageKey = hashKey(url);
      const raw =
        window.localStorage.getItem(storageKey) ||
        window.sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url === url && now - parsed.ts < CACHE_TTL_MS) {
          memoryCache.set(url, { ts: parsed.ts, data: parsed.data });
          return parsed.data;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return undefined;
}

function writeCached(url: string, data: unknown): void {
  const entry = { ts: Date.now(), data };
  memoryCache.set(url, entry);

  if (memoryCache.size > 300) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  if (typeof window !== "undefined") {
    const storageKey = hashKey(url);
    const payload = JSON.stringify({ url, ts: entry.ts, data });
    if (payload.length < 220_000) {
      try {
        window.localStorage.setItem(storageKey, payload);
      } catch {
        evictOldCacheEntries();
        try {
          window.localStorage.setItem(storageKey, payload);
        } catch {
          // Fallback to sessionStorage if localStorage still full
          try {
            window.sessionStorage.setItem(storageKey, payload);
          } catch {
            // Ignore
          }
        }
      }
    }
  }
}

function attachApiKeyIfSaved(rawUrl: string): string {
  const apiKey = getSavedOpenAlexApiKey();
  if (!apiKey) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has("api_key")) {
      parsed.searchParams.set("api_key", apiKey);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

// eslint-disable-next-line
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
    const headers: Record<string, string> = {};
    if (typeof window === "undefined") {
      headers["User-Agent"] = `Schox/1.0 (mailto:${MAILTO})`;
    }

    const requestUrl = attachApiKeyIfSaved(url);

    // Do NOT aggressively retry 429s in a tight loop when daily IP budget is exhausted;
    // at most 1 gentle retry after 1.2s if transient per-second burst.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(requestUrl, { cache: "no-store", headers });

      if (res.status === 404 && options?.allow404) {
        return null;
      }

      if (res.status === 429) {
        const remaining = res.headers.get("x-ratelimit-remaining");
        if (remaining === "0" || attempt === 1) {
          throw new Error(
            "RATE_LIMIT_429: OpenAlex free daily IP quota ($0.10/day) is temporarily exhausted. Add a free OpenAlex API key ($1/day = 10x quota) in the top bar or wait for daily reset."
          );
        }
        await new Promise((r) => setTimeout(r, 1200));
        continue;
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

    throw new Error("RATE_LIMIT_429: OpenAlex rate limit reached.");
  })();

  inflightRequests.set(url, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inflightRequests.delete(url);
  }
}

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

function parsePosition(pos: unknown): "first" | "middle" | "last" | undefined {
  if (pos === "first" || pos === "middle" || pos === "last") return pos;
  return undefined;
}

// eslint-disable-next-line
export function mapWorkToPaper(work: any): Paper {
  const rawConcepts = (work.concepts || [])
    .slice()
    // eslint-disable-next-line
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    // eslint-disable-next-line
    .map((c: any) => ({
      id: c.id?.replace("https://openalex.org/", "") || "",
      displayName: c.display_name || "",
      level: c.level ?? 1,
    }))
    .filter((c: { displayName: string }) => c.displayName);

  const fallbackConcepts =
    rawConcepts.length > 0
      ? rawConcepts
      : (work.topics || [])
          .slice(0, 8)
          // eslint-disable-next-line
          .map((t: any) => ({
            id: t.id?.replace("https://openalex.org/", "") || "",
            displayName: t.display_name || "",
            level: 1,
          }))
          .filter((c: { displayName: string }) => c.displayName);

  return {
    id: work.id?.replace("https://openalex.org/", "") || "",
    doi: work.doi || null,
    title: work.title || work.display_name || "Untitled Paper",
    publicationDate: work.publication_date || "",
    publicationYear: work.publication_year || 0,
    type: work.type || undefined,
    // eslint-disable-next-line
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
    correspondingAuthorIds: (work.corresponding_author_ids || [])
      .map((cid: string) => cid?.replace("https://openalex.org/", "") || "")
      .filter(Boolean),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    tldr: null,
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
      // eslint-disable-next-line
      .map((k: any) => k.display_name)
      .filter(Boolean),
    countsByYear: (work.counts_by_year || [])
      // eslint-disable-next-line
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
  const endpoint = isDoi ? `https://doi.org/${id}` : normalizeWorkId(id);
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

// Single 1-credit call instead of 2 calls!
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

  const url = new URL(`${OPENALEX_BASE_URL}/works`);
  url.searchParams.append("filter", `authorships.author.id:${cleanId}`);
  url.searchParams.append("sort", "cited_by_count:desc");
  url.searchParams.append("per-page", "50");
  url.searchParams.append("select", selectFields);
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString()).catch(() => null);
  return (data?.results || []).map(mapWorkToPaper);
}

// eslint-disable-next-line
function mapInstitution(inst: any): AuthorInstitution {
  return {
    id: inst.id?.replace("https://openalex.org/", "") || "",
    displayName: inst.display_name || "",
    countryCode: inst.country_code || "",
    type: inst.type || "",
  };
}

// eslint-disable-next-line
function mapOpenAlexAuthorToProfile(data: any): AuthorProfile {
  const rawInstitutions = Array.isArray(data.last_known_institutions)
    ? data.last_known_institutions
    : data.last_known_institution
    ? [data.last_known_institution]
    : [];

  const lastKnownInstitutions: AuthorInstitution[] = rawInstitutions
    // eslint-disable-next-line
    .filter((i: any) => i && i.display_name)
    .map(mapInstitution);

  const affiliations = (data.affiliations || [])
    // eslint-disable-next-line
    .filter((aff: any) => aff?.institution?.display_name)
    // eslint-disable-next-line
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

  // eslint-disable-next-line
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
      ? // eslint-disable-next-line
        rawXConcepts.slice(0, 8).map((c: any) => ({
          id: c.id?.replace("https://openalex.org/", "") || "",
          displayName: c.display_name || "",
          score: c.score || 0,
        }))
      : topics.slice(0, 8).map((t: { id: string; displayName: string; count: number }) => ({
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
    // eslint-disable-next-line
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

// Zero-credit (0 USD) author autocomplete, sorted by citations desc so main PI profiles always rank #1!
export async function autocompleteAuthors(
  query: string
): Promise<SpotlightAuthorItem[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const url = new URL(`${OPENALEX_BASE_URL}/autocomplete/authors`);
  url.searchParams.append("q", clean);
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());
  const rows: Array<{
    id?: string;
    display_name?: string;
    hint?: string;
    cited_by_count?: number;
    works_count?: number;
  }> = data?.results || [];

  return rows
    .filter((r) => r.id && r.display_name)
    .sort((a, b) => (b.cited_by_count || 0) - (a.cited_by_count || 0))
    .map((r) => ({
      id: normalizeAuthorId(r.id || ""),
      name: r.display_name || "",
      hint: r.hint || undefined,
      citedByCount: r.cited_by_count || 0,
    }));
}

// Zero-credit (0 USD) journal autocomplete endpoint!
export async function autocompleteJournals(
  query: string
): Promise<JournalProfile[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const url = new URL(`${OPENALEX_BASE_URL}/autocomplete/sources`);
  url.searchParams.append("q", clean);
  url.searchParams.append("mailto", MAILTO);

  const data = await fetchOpenAlexJson(url.toString());
  const rows: Array<{
    id?: string;
    display_name?: string;
    hint?: string;
    works_count?: number;
    cited_by_count?: number;
  }> = data?.results || [];

  return rows
    .filter((r) => r.id && r.display_name)
    .map((r) => ({
      id: (r.id || "").replace("https://openalex.org/", ""),
      displayName: r.display_name || "",
      issn: [],
      issnL: null,
      publisher: r.hint || null,
      worksCount: r.works_count || 0,
      citedByCount: r.cited_by_count || 0,
      homepageUrl: null,
      type: "journal",
    }));
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
      // eslint-disable-next-line
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
