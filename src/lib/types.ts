export interface Paper {
  id: string; // OpenAlex ID
  doi: string | null;
  title: string;
  publicationDate: string;
  publicationYear: number;
  authors: Author[];
  abstract: string | null;
  tldr: string | null; // Semantic Scholar
  citedByCount: number;
  isOpenAccess: boolean;
  pdfUrl: string | null;
  journal: Journal | null;
  concepts: Concept[];
  relatedWorks?: string[];
  referencedWorks?: string[];
}

export interface Author {
  id: string;
  name: string;
  institution?: string;
}

export interface Journal {
  id: string;
  displayName: string;
  issn?: string[];
  publisher?: string;
}

export interface Concept {
  id: string;
  displayName: string;
  level: number;
}

export interface SearchParams {
  q?: string;
  page?: number;
  sort?: "relevance" | "citations" | "date" | "oldest";
  journalId?: string;
  yearFrom?: string;
  yearTo?: string;
  oaOnly?: boolean;
  authorId?: string;
}

export interface SearchResult {
  results: Paper[];
  totalCount: number;
  page: number;
}

export interface AuthorProfile {
  id: string;
  displayName: string;
  alternatives: string[];
  worksCount: number;
  citedByCount: number;
  lastKnownInstitution: {
    id: string;
    displayName: string;
    countryCode: string;
    type: string;
  } | null;
  concepts: {
    id: string;
    displayName: string;
    score: number;
  }[];
  countsByYear: {
    year: number;
    worksCount: number;
    citedByCount: number;
  }[];
}
