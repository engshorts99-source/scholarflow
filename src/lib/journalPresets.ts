import { SelectedJournalItem } from "./types";

export interface JournalPreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  journals: SelectedJournalItem[];
}

// Verified OpenAlex Source IDs
export const KNOWN_JOURNALS: Record<string, SelectedJournalItem> = {
  S137773608: { id: "S137773608", name: "Nature", shortName: "Nature" },
  S3880285: { id: "S3880285", name: "Science", shortName: "Science" },
  S110447773: { id: "S110447773", name: "Cell", shortName: "Cell" },
  S41063453: {
    id: "S41063453",
    name: "Nature Immunology",
    shortName: "Nat. Immunol.",
  },
  S2764653179: {
    id: "S2764653179",
    name: "Science Immunology",
    shortName: "Sci. Immunol.",
  },
  S199671312: { id: "S199671312", name: "Immunity", shortName: "Immunity" },
  S22947807: {
    id: "S22947807",
    name: "Journal of Experimental Medicine",
    shortName: "JEM",
  },
  S203256638: {
    id: "S203256638",
    name: "Nature Medicine",
    shortName: "Nat. Med.",
  },
  S106963461: {
    id: "S106963461",
    name: "Nature Biotechnology",
    shortName: "Nat. Biotechnol.",
  },
  S137905309: {
    id: "S137905309",
    name: "Nature Genetics",
    shortName: "Nat. Genet.",
  },
  S127827428: {
    id: "S127827428",
    name: "Nature Methods",
    shortName: "Nat. Methods",
  },
  S2298632: {
    id: "S2298632",
    name: "Nature Neuroscience",
    shortName: "Nat. Neurosci.",
  },
  S45757444: { id: "S45757444", name: "Neuron", shortName: "Neuron" },
  S25671836: {
    id: "S25671836",
    name: "Cancer Cell",
    shortName: "Cancer Cell",
  },
  S4210236562: {
    id: "S4210236562",
    name: "Nature Cancer",
    shortName: "Nat. Cancer",
  },
  S2486275289: {
    id: "S2486275289",
    name: "Cancer Discovery",
    shortName: "Cancer Discov.",
  },
  S202193212: {
    id: "S202193212",
    name: "Nature Chemistry",
    shortName: "Nat. Chem.",
  },
  S128124174: {
    id: "S128124174",
    name: "Cell Stem Cell",
    shortName: "Cell Stem Cell",
  },
  S156208185: {
    id: "S156208185",
    name: "Molecular Cell",
    shortName: "Mol. Cell",
  },
};

export const JOURNAL_PRESETS: JournalPreset[] = [
  {
    id: "cns",
    label: "CNS Flagship (Nature · Cell · Science)",
    shortLabel: "CNS (Nature · Cell · Science)",
    description: "Global multidisciplinary flagship journals",
    accent: "from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-200",
    journals: [
      KNOWN_JOURNALS.S137773608,
      KNOWN_JOURNALS.S110447773,
      KNOWN_JOURNALS.S3880285,
    ],
  },
  {
    id: "immunology",
    label: "Immunology Elite (Nat Immunol · Sci Immunol · Immunity)",
    shortLabel: "Immunology Elite",
    description: "Top-tier immunology venues tracking immune mechanisms & therapy",
    accent: "from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-200",
    journals: [
      KNOWN_JOURNALS.S41063453,
      KNOWN_JOURNALS.S2764653179,
      KNOWN_JOURNALS.S199671312,
    ],
  },
  {
    id: "immunology-jem",
    label: "Immunology + JEM (4 Venues)",
    shortLabel: "Immunology + JEM",
    description: "Nature Immunology, Science Immunology, Immunity & JEM",
    accent: "from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-200",
    journals: [
      KNOWN_JOURNALS.S41063453,
      KNOWN_JOURNALS.S2764653179,
      KNOWN_JOURNALS.S199671312,
      KNOWN_JOURNALS.S22947807,
    ],
  },
  {
    id: "biomed",
    label: "Biomed & Biotech (Nat Med · Nat Biotech · Nat Genet · Nat Methods)",
    shortLabel: "Biomed & Biotech",
    description: "Translational medicine, biotechnology, genomics & experimental methods",
    accent: "from-emerald-500/20 to-mint-500/20 border-emerald-500/40 text-emerald-200",
    journals: [
      KNOWN_JOURNALS.S203256638,
      KNOWN_JOURNALS.S106963461,
      KNOWN_JOURNALS.S137905309,
      KNOWN_JOURNALS.S127827428,
    ],
  },
  {
    id: "cell-mol",
    label: "Cell & Molecular (Cell · Mol Cell · Cell Stem Cell)",
    shortLabel: "Cell & Stem",
    description: "Core cellular, molecular & stem cell biology venues",
    accent: "from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-200",
    journals: [
      KNOWN_JOURNALS.S110447773,
      KNOWN_JOURNALS.S156208185,
      KNOWN_JOURNALS.S128124174,
    ],
  },
  {
    id: "neuro",
    label: "Neuroscience (Nat Neurosci · Neuron · Science)",
    shortLabel: "Neuroscience",
    description: "Systems, cellular & cognitive neuroscience",
    accent: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-200",
    journals: [
      KNOWN_JOURNALS.S2298632,
      KNOWN_JOURNALS.S45757444,
      KNOWN_JOURNALS.S3880285,
    ],
  },
  {
    id: "cancer",
    label: "Oncology Elite (Cancer Cell · Nat Cancer · Cancer Discovery)",
    shortLabel: "Cancer Elite",
    description: "Leading cancer biology, tumor immunology & clinical oncology",
    accent: "from-rose-500/20 to-orange-500/20 border-rose-500/40 text-rose-200",
    journals: [
      KNOWN_JOURNALS.S25671836,
      KNOWN_JOURNALS.S4210236562,
      KNOWN_JOURNALS.S2486275289,
    ],
  },
];

export function resolveJournalName(id: string, fallback?: string): string {
  const clean = id.replace("https://openalex.org/", "").trim();
  const normalized = clean.startsWith("S") ? clean : `S${clean}`;
  return KNOWN_JOURNALS[normalized]?.name || fallback || normalized;
}

export function getJournalBadgeStyle(journalIdOrName: string): string {
  const key = journalIdOrName.toLowerCase();
  if (key === "s137773608" || key === "nature") {
    return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  }
  if (key === "s3880285" || key === "science") {
    return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  }
  if (key === "s110447773" || key === "cell") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  if (key.includes("immunol") || key === "s41063453" || key === "s2764653179") {
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  }
  if (key === "immunity" || key === "s199671312") {
    return "bg-teal-500/15 text-teal-300 border-teal-500/30";
  }
  if (key.includes("cancer") || key === "s25671836" || key === "s4210236562") {
    return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  }
  if (key.includes("neuro") || key === "neuron" || key === "s2298632" || key === "s45757444") {
    return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  }
  return "bg-blue-500/15 text-blue-300 border-blue-500/30";
}
