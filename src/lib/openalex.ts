/* eslint-disable @typescript-eslint/no-explicit-any */
import { Paper, SearchParams, SearchResult, AuthorProfile } from "./types";

const BASE_URL = "https://api.openalex.org";

// Helper to convert inverted index to string
function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string | null {
  if (!invertedIndex) return null;
  const maxIndex = Math.max(...Object.values(invertedIndex).flat());
  if (maxIndex === -Infinity || maxIndex < 0) return null;
  const words = new Array(maxIndex + 1).fill("");
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.join(" ").replace(/\s+/g, " ").trim();
}

// Map OpenAlex work to our Paper type
export function mapWorkToPaper(work: any): Paper {
  return {
    id: work.id?.replace("https://openalex.org/", "") || "",
    doi: work.doi,
    title: work.title || work.display_name,
    publicationDate: work.publication_date,
    publicationYear: work.publication_year,
    authors: (work.authorships || []).map((a: any) => ({
      id: a.author?.id?.replace("https://openalex.org/", "") || "",
      name: a.author?.display_name || "",
      institution: a.institutions?.[0]?.display_name,
    })),
    abstract: reconstructAbstract(work.abstract_inverted_index),
    tldr: null, // Will be filled by Semantic Scholar if needed
    citedByCount: work.cited_by_count || 0,
    isOpenAccess: work.open_access?.is_oa || false,
    pdfUrl: work.open_access?.oa_url || null,
    journal: work.primary_location?.source ? {
      id: work.primary_location.source.id?.replace("https://openalex.org/", "") || "",
      displayName: work.primary_location.source.display_name,
      issn: work.primary_location.source.issn,
      publisher: work.primary_location.source.host_organization_name,
    } : null,
    concepts: (work.concepts || []).map((c: any) => ({
      id: c.id?.replace("https://openalex.org/", "") || "",
      displayName: c.display_name,
      level: c.level,
    })),
    referencedWorks: (work.referenced_works || []).map((rw: string) => rw?.replace("https://openalex.org/", "") || ""),
    relatedWorks: (work.related_works || []).map((rw: string) => rw?.replace("https://openalex.org/", "") || ""),
  };
}

export async function searchPapers(params: SearchParams): Promise<SearchResult> {
  const url = new URL(`${BASE_URL}/works`);
  
  // Base filters
  const filters: string[] = ["type:article"]; // Only papers
  
  if (params.q) {
    filters.push(`default.search:${encodeURIComponent(params.q)}`);
  }
  if (params.journalId) {
    filters.push(`primary_location.source.id:${params.journalId}`);
  }
  if (params.authorId) {
    filters.push(`author.id:${params.authorId}`);
  }
  if (params.yearFrom && params.yearTo) {
    filters.push(`publication_year:${params.yearFrom}-${params.yearTo}`);
  } else if (params.yearFrom) {
    filters.push(`publication_year:${params.yearFrom}-2050`);
  } else if (params.yearTo) {
    filters.push(`publication_year:1900-${params.yearTo}`);
  }
  if (params.oaOnly) {
    filters.push("open_access.is_oa:true");
  }
  
  if (filters.length > 0) {
    url.searchParams.append("filter", filters.join(","));
  }
  
  // Pagination
  url.searchParams.append("page", (params.page || 1).toString());
  url.searchParams.append("per-page", "20");
  
  // Sorting
  if (params.sort === "citations") {
    url.searchParams.append("sort", "cited_by_count:desc");
  } else if (params.sort === "date") {
    url.searchParams.append("sort", "publication_date:desc");
  } else if (params.sort === "oldest") {
    url.searchParams.append("sort", "publication_date:asc");
  } else if (params.sort === "relevance" && params.q) {
    url.searchParams.append("sort", "relevance_score:desc");
  } else if (!params.q) {
    url.searchParams.append("sort", "publication_date:desc");
  }

  url.searchParams.append("mailto", "scholarflow.project@example.com");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`OpenAlex API error: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  return {
    results: data.results.map(mapWorkToPaper),
    totalCount: data.meta.count,
    page: data.meta.page,
  };
}

export async function getPaperById(id: string): Promise<Paper | null> {
  const isDoi = id.startsWith("10.");
  const endpoint = isDoi ? `https://doi.org/${id}` : `W${id.replace(/^W/, '')}`;
  const url = `${BASE_URL}/works/${endpoint}?mailto=scholarflow.project@example.com`;
  
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OpenAlex API error: ${res.statusText}`);
  
  const data = await res.json();
  return mapWorkToPaper(data);
}

function mapOpenAlexAuthorToProfile(data: any): AuthorProfile {
  return {
    id: data.id?.replace("https://openalex.org/", "") || "",
    displayName: data.display_name,
    alternatives: data.display_name_alternatives || [],
    worksCount: data.works_count || 0,
    citedByCount: data.cited_by_count || 0,
    lastKnownInstitution: data.last_known_institution ? {
      id: data.last_known_institution.id?.replace("https://openalex.org/", "") || "",
      displayName: data.last_known_institution.display_name,
      countryCode: data.last_known_institution.country_code,
      type: data.last_known_institution.type,
    } : null,
    concepts: (data.x_concepts || []).slice(0, 5).map((c: any) => ({
      id: c.id?.replace("https://openalex.org/", "") || "",
      displayName: c.display_name,
      score: c.score,
    })),
    countsByYear: data.counts_by_year || [],
  };
}

export async function searchAuthors(query: string, page: number = 1): Promise<{ results: AuthorProfile[], totalCount: number, page: number }> {
  const url = new URL(`${BASE_URL}/authors`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per-page", "20");
  url.searchParams.append("mailto", "scholarflow.project@example.com");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`OpenAlex API error: ${res.statusText}`);
  const data = await res.json();

  return {
    results: data.results.map(mapOpenAlexAuthorToProfile),
    totalCount: data.meta.count,
    page: data.meta.page,
  };
}

export async function getAuthorById(id: string): Promise<AuthorProfile | null> {
  const authorId = id.startsWith('A') ? id : `A${id}`;
  const url = `${BASE_URL}/authors/${authorId}?mailto=scholarflow.project@example.com`;
  
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`OpenAlex API error: ${res.statusText}`);
  
  const data = await res.json();
  return mapOpenAlexAuthorToProfile(data);
}
