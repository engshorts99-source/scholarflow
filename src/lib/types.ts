export type ArticleCategory = "research" | "review" | "both";

export interface Paper {
  id: string; // OpenAlex ID
  doi: string | null;
  title: string;
  publicationDate: string;
  publicationYear: number;
  type?: string;
  authors: Author[];
  correspondingAuthorIds?: string[];
  abstract: string | null;
  tldr: string | null; // Semantic Scholar
  citedByCount: number;
  isOpenAccess: boolean;
  pdfUrl: string | null;
  journal: Journal | null;
  primaryTopic?: {
    id: string;
    displayName: string;
    subfield?: string;
    field?: string;
    domain?: string;
  } | null;
  keywords?: string[];
  countsByYear?: { year: number; citedByCount: number }[];
  referencedWorksCount?: number;
  concepts: Concept[];
  relatedWorks?: string[];
  referencedWorks?: string[];
}

export interface Author {
  id: string;
  name: string;
  institution?: string;
  institutionId?: string;
  countryCode?: string;
  position?: "first" | "middle" | "last";
  isCorresponding?: boolean;
}

export interface Journal {
  id: string;
  displayName: string;
  issn?: string[];
  publisher?: string;
}

export interface JournalProfile {
  id: string;
  displayName: string;
  issn: string[];
  issnL: string | null;
  publisher: string | null;
  worksCount: number;
  citedByCount: number;
  homepageUrl: string | null;
  type: string | null;
}

export interface SelectedJournalItem {
  id: string;
  name: string;
  shortName?: string;
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
  articleType?: ArticleCategory;
  yearFrom?: string;
  yearTo?: string;
  oaOnly?: boolean;
  authorId?: string;
  coauthorId?: string;
  citesId?: string; // For citation tracking: find papers that cite this work
}

export interface SearchResult {
  results: Paper[];
  totalCount: number;
  page: number;
}

export interface AuthorInstitution {
  id: string;
  displayName: string;
  countryCode: string;
  type: string;
}

export interface AuthorAffiliation {
  institution: AuthorInstitution;
  years: number[];
}

export interface AuthorTopic {
  id: string;
  displayName: string;
  count: number;
  field?: string;
  subfield?: string;
}

export interface AuthorProfile {
  id: string;
  displayName: string;
  alternatives: string[];
  worksCount: number;
  citedByCount: number;
  orcid?: string | null;
  hIndex?: number;
  i10Index?: number;
  twoYearMeanCitedness?: number;
  lastKnownInstitution: AuthorInstitution | null;
  lastKnownInstitutions?: AuthorInstitution[];
  affiliations?: AuthorAffiliation[];
  topics?: AuthorTopic[];
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

export type ResearchMaturityStage =
  | "Explosive Frontier"
  | "Rapidly Accelerating"
  | "Emerging Niche"
  | "Mature & Active"
  | "Established Classic"
  | "Quiet / Specialized";

export interface YearCount {
  year: number;
  count: number;
}

export interface EvolutionEra {
  id: string;
  label: string;
  subtitle: string;
  startYear: number;
  endYear: number;
  paperCount: number;
  papers: Paper[];
}

export interface ConceptSnapshot {
  query: string;
  queryMode: "title" | "title_and_abstract";
  activeFilter: string;
  totalCount: number;
  originYear: number | null;
  definingPaper: Paper | null;
  definitionalExcerpt: string | null;
  stage: ResearchMaturityStage;
  growthRate2Yr: number | null;
  recent2YrCount: number;
  recentSharePct: number;
  peakYear: number | null;
  peakCount: number;
  yearCounts: YearCount[];
  summaryText: string;
}

export type ConceptPersonRole = "pioneer" | "bridge" | "authority" | "frontier";

export interface ConceptPersonNode {
  id: string;
  name: string;
  institution?: string;
  countryCode?: string;
  role: ConceptPersonRole;
  citationsInConcept: number;
  samplePaperCount: number;
  corpusPaperCount?: number;
  firstYear: number;
  lastYear: number;
  leadCount: number;
  seniorCount: number;
  papers: Paper[];
}

export interface CoauthorshipEdge {
  source: string;
  target: string;
  weight: number;
  sharedPapers: {
    id: string;
    title: string;
    year: number;
    citedByCount: number;
  }[];
  sameInstitution: boolean;
  firstYear: number;
  lastYear: number;
}

export interface ConceptAnalysis extends ConceptSnapshot {
  domainPath: string[];
  eras: EvolutionEra[];
  seminalPapers: Paper[];
  frontierPapers: Paper[];
  reviewPapers: Paper[];
  hotKeywords: { name: string; count: number }[];
  topInstitutions: { name: string; countryCode?: string; count: number }[];
  people: ConceptPersonNode[];
  edges: CoauthorshipEdge[];
  prolificAuthors: { id: string; name: string; count: number }[];
}

export interface CollaboratorProfile {
  id: string;
  name: string;
  institution?: string;
  countryCode?: string;
  sharedCount: number;
  firstYear: number;
  lastYear: number;
  phase: "ongoing" | "longterm" | "early";
  roleDynamic: string;
  sameInstitution: boolean;
  sharedPapers: {
    id: string;
    title: string;
    year: number;
    citedByCount: number;
  }[];
}

export interface LineagePerson {
  id: string;
  name: string;
  institution?: string;
  count: number;
  samplePapers: {
    id: string;
    title: string;
    year: number;
  }[];
}

export interface AuthorRelationshipNetwork {
  centerId: string;
  centerName: string;
  collaborators: CollaboratorProfile[];
  peerEdges: { source: string; target: string; weight: number }[];
  sampledPapersCount: number;
  influencedBy: LineagePerson[];
  influences: LineagePerson[];
}

// === Elite Venue / Multi-Journal Lab & Topic Radar Types ===

export interface VenueResearchTeam {
  id: string; // PI / Lead Researcher OpenAlex ID
  name: string;
  institution?: string;
  countryCode?: string;
  totalVenuePapers: number;
  sampledPaperCount: number;
  piLeadCount: number;
  totalCitations: number;
  streakYears: number; // Longest consecutive-year streak inside window
  activeYears: number[]; // Sorted years active inside window
  journalBreakdown: {
    journalId: string;
    journalName: string;
    count: number;
  }[];
  keyMembers: {
    id: string;
    name: string;
    count: number;
  }[];
  topTopics: string[];
  topKeywords: string[];
  papers: Paper[];
}

export interface VenueTeamEdge {
  source: string;
  target: string;
  kind: "coauthorship" | "thematic";
  weight: number;
  sharedPapers: {
    id: string;
    title: string;
    year: number;
    journalName?: string;
    citedByCount: number;
  }[];
  sharedTopics: string[];
}

export interface VenueTopicCluster {
  id: string;
  name: string;
  field?: string;
  subfield?: string;
  count: number;
  sharePct: number;
  topKeywords: string[];
  leadingTeamIds: string[];
}

export interface VenueTopicSynergyEdge {
  source: string; // topic id
  target: string; // topic id
  weight: number;
  sharedTeamNames: string[];
}

export interface VenueTeamTopicLink {
  teamId: string;
  topicId: string;
  count: number;
}

export interface VenueRadarAnalysis {
  journals: SelectedJournalItem[];
  articleType: ArticleCategory;
  teamRoleMode: "pi" | "all";
  yearFrom: number;
  yearTo: number;
  query: string;
  totalMatchingWorks: number;
  journalCounts: {
    id: string;
    name: string;
    count: number;
  }[];
  yearCounts: YearCount[];
  teams: VenueResearchTeam[];
  teamEdges: VenueTeamEdge[];
  topics: VenueTopicCluster[];
  topicEdges: VenueTopicSynergyEdge[];
  teamTopicLinks: VenueTeamTopicLink[];
  hotKeywords: { name: string; count: number }[];
  topCitedPapers: Paper[];
  latestPapers: Paper[];
}
