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
}

export interface SearchResult {
  results: Paper[];
  totalCount: number;
  page: number;
}
