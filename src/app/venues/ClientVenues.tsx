"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import JournalMultiSelect from "@/components/JournalMultiSelect";
import VenueEcosystemGraph from "@/components/VenueEcosystemGraph";
import PaperCard from "@/components/PaperCard";
import { RateLimitHelpBanner } from "@/components/ApiKeyControl";
import {
  ArticleCategory,
  SelectedJournalItem,
  SpotlightAuthorItem,
  VenueFieldScope,
  VenueRadarAnalysis,
} from "@/lib/types";
import {
  FIELD_SCOPES,
  JOURNAL_PRESETS,
  getJournalBadgeStyle,
  resolveJournalName,
} from "@/lib/journalPresets";
import { autocompleteAuthors } from "@/lib/openalex";
import { analyzeVenueLandscape } from "@/lib/venueRadarEngine";
import {
  Flame,
  Award,
  Search,
  X,
  Building,
  Users,
  Sparkles,
  BookOpen,
  FileText,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Calendar,
  Play,
  Star,
  Plus,
  Layers,
} from "lucide-react";

const QUICK_TOPIC_IDEAS = [
  "intravital",
  "influenza",
  "T cell exhaustion",
  "mucosal immunity",
  "CRISPR",
  "spatial transcriptomics",
  "CAR-T",
  "microglia",
];

const QUICK_SPOTLIGHT_LEGENDS: SpotlightAuthorItem[] = [
  {
    id: "A5010263068",
    name: "Akiko Iwasaki",
    hint: "Yale / HHMI",
  },
  {
    id: "A5076363097",
    name: "Yoshihiro Kawaoka",
    hint: "Univ. of Wisconsin / UTokyo",
  },
  {
    id: "A5073181252",
    name: "Paul Kubes",
    hint: "Univ. of Calgary",
  },
];

const WINDOW_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: "2Y" },
  { value: 5, label: "5Y" },
  { value: 10, label: "10Y" },
  { value: 15, label: "15Y" },
  { value: 30, label: "All" },
];

function parseJournalsFromParams(
  searchParams: ReturnType<typeof useSearchParams>
): SelectedJournalItem[] {
  const presetParam = searchParams.get("preset");
  if (presetParam) {
    const found = JOURNAL_PRESETS.find((p) => p.id === presetParam);
    if (found) return found.journals;
  }

  const journalsParam = searchParams.get("journals");
  const namesParam = searchParams.get("jnames");
  if (journalsParam) {
    const ids = journalsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const names = namesParam ? namesParam.split("|") : [];
    if (ids.length > 0) {
      return ids.map((id, idx) => {
        const clean = id.startsWith("S") ? id : `S${id}`;
        return {
          id: clean,
          name: resolveJournalName(clean, names[idx] || clean),
        };
      });
    }
  }

  return JOURNAL_PRESETS[0].journals;
}

function parseFieldFromParams(
  searchParams: ReturnType<typeof useSearchParams>
): VenueFieldScope {
  const raw = searchParams.get("field") as VenueFieldScope | null;
  if (raw && FIELD_SCOPES.some((f) => f.id === raw)) return raw;
  return "all";
}

function parseSpotlightsFromParams(
  searchParams: ReturnType<typeof useSearchParams>
): SpotlightAuthorItem[] {
  const idsRaw = searchParams.get("spotlights");
  const namesRaw = searchParams.get("snames");
  if (!idsRaw) return [];
  const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const names = namesRaw ? namesRaw.split("|") : [];
  return ids.map((id, idx) => ({
    id: id.startsWith("A") ? id : `A${id}`,
    name: names[idx] || id,
  }));
}

export default function ClientVenues() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  // Staged controls — 0 API calls until Search Radar is clicked!
  const [draftJournals, setDraftJournals] = useState<SelectedJournalItem[]>(() =>
    parseJournalsFromParams(searchParams)
  );
  const [draftArticleType, setDraftArticleType] = useState<ArticleCategory>(
    () => {
      const raw = searchParams.get("articleType");
      return raw === "review" || raw === "both" ? raw : "research";
    }
  );
  const [draftFieldScope, setDraftFieldScope] = useState<VenueFieldScope>(() =>
    parseFieldFromParams(searchParams)
  );
  const [draftYears, setDraftYears] = useState<number>(() => {
    const raw = parseInt(searchParams.get("years") || "5", 10);
    return [2, 5, 10, 15, 30].includes(raw) ? raw : 5;
  });
  const [draftRole, setDraftRole] = useState<"hybrid" | "pi" | "all">(() => {
    const r = searchParams.get("role");
    return r === "pi" || r === "all" ? r : "hybrid";
  });
  const [draftSpotlights, setDraftSpotlights] = useState<SpotlightAuthorItem[]>(
    () => parseSpotlightsFromParams(searchParams)
  );
  const [draftQuery, setDraftQuery] = useState<string>(() =>
    (searchParams.get("q") || "").trim()
  );

  // Zero-credit author autocomplete state
  const [authorInput, setAuthorInput] = useState("");
  const [authorSuggestions, setAuthorSuggestions] = useState<
    SpotlightAuthorItem[]
  >([]);
  const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false);
  const [searchingAuthors, setSearchingAuthors] = useState(false);
  const authorBoxRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState<VenueRadarAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [lastExecutedSig, setLastExecutedSig] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<
    Record<string, boolean>
  >({});
  const [paperTab, setPaperTab] = useState<"cited" | "latest">("cited");

  useEffect(() => {
    setDraftJournals(parseJournalsFromParams(searchParams));
    const rawArt = searchParams.get("articleType");
    setDraftArticleType(
      rawArt === "review" || rawArt === "both" ? rawArt : "research"
    );
    setDraftFieldScope(parseFieldFromParams(searchParams));
    const rawYrs = parseInt(searchParams.get("years") || "5", 10);
    setDraftYears([2, 5, 10, 15, 30].includes(rawYrs) ? rawYrs : 5);
    const r = searchParams.get("role");
    setDraftRole(r === "pi" || r === "all" ? r : "hybrid");
    setDraftSpotlights(parseSpotlightsFromParams(searchParams));
    setDraftQuery((searchParams.get("q") || "").trim());
  }, [searchParams]);

  // 0-credit author autocomplete debounce
  useEffect(() => {
    if (!authorInput.trim() || authorInput.trim().length < 2) {
      setAuthorSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingAuthors(true);
      try {
        const res = await autocompleteAuthors(authorInput.trim());
        setAuthorSuggestions(res.slice(0, 7));
        setAuthorDropdownOpen(true);
      } catch {
        setAuthorSuggestions([]);
      } finally {
        setSearchingAuthors(false);
      }
    }, 420);
    return () => clearTimeout(timer);
  }, [authorInput]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        authorBoxRef.current &&
        !authorBoxRef.current.contains(e.target as Node)
      ) {
        setAuthorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const addSpotlight = (item: SpotlightAuthorItem) => {
    setDraftSpotlights((prev) =>
      prev.some((s) => s.id === item.id) ? prev : [...prev, item]
    );
    setAuthorInput("");
    setAuthorDropdownOpen(false);
  };

  const removeSpotlight = (id: string) => {
    setDraftSpotlights((prev) => prev.filter((s) => s.id !== id));
  };

  const makeSignature = (
    journals: SelectedJournalItem[],
    art: ArticleCategory,
    field: VenueFieldScope,
    yrs: number,
    role: "hybrid" | "pi" | "all",
    spots: SpotlightAuthorItem[],
    q: string
  ) =>
    `${journals.map((j) => j.id).join(",")}|${art}|${field}|${yrs}|${role}|${spots
      .map((s) => s.id)
      .join(",")}|${q.trim().toLowerCase()}`;

  const currentDraftSig = makeSignature(
    draftJournals,
    draftArticleType,
    draftFieldScope,
    draftYears,
    draftRole,
    draftSpotlights,
    draftQuery
  );
  const isDirty = hasExecuted && currentDraftSig !== lastExecutedSig;

  const executeSearch = useCallback(
    async (overrides?: {
      journals?: SelectedJournalItem[];
      articleType?: ArticleCategory;
      fieldScope?: VenueFieldScope;
      years?: number;
      role?: "hybrid" | "pi" | "all";
      spotlights?: SpotlightAuthorItem[];
      q?: string;
    }) => {
      const targetJournals = overrides?.journals ?? draftJournals;
      const targetArt = overrides?.articleType ?? draftArticleType;
      const targetField = overrides?.fieldScope ?? draftFieldScope;
      const targetYears = overrides?.years ?? draftYears;
      const targetRole = overrides?.role ?? draftRole;
      const targetSpots = overrides?.spotlights ?? draftSpotlights;
      const targetQ =
        overrides?.q !== undefined ? overrides.q.trim() : draftQuery.trim();

      if (targetJournals.length === 0) {
        setError("Please select at least one journal before searching.");
        return;
      }

      const params = new URLSearchParams();
      const matchingPreset = JOURNAL_PRESETS.find(
        (pr) =>
          pr.journals.length === targetJournals.length &&
          pr.journals.every((pj, i) => pj.id === targetJournals[i].id)
      );
      if (matchingPreset) {
        params.set("preset", matchingPreset.id);
      } else {
        params.set(
          "journals",
          targetJournals.map((j) => j.id).join(",")
        );
        params.set(
          "jnames",
          targetJournals.map((j) => j.name).join("|")
        );
      }
      params.set("articleType", targetArt);
      if (targetField !== "all") params.set("field", targetField);
      params.set("years", String(targetYears));
      if (targetRole !== "hybrid") params.set("role", targetRole);
      if (targetSpots.length > 0) {
        params.set(
          "spotlights",
          targetSpots.map((s) => s.id).join(",")
        );
        params.set(
          "snames",
          targetSpots.map((s) => s.name).join("|")
        );
      }
      if (targetQ) params.set("q", targetQ);
      router.replace(`/venues?${params.toString()}`, { scroll: false });

      const sig = makeSignature(
        targetJournals,
        targetArt,
        targetField,
        targetYears,
        targetRole,
        targetSpots,
        targetQ
      );

      setHasExecuted(true);
      setLoading(true);
      setError(null);

      try {
        const res = await analyzeVenueLandscape({
          journals: targetJournals,
          articleType: targetArt,
          fieldScope: targetField,
          teamRoleMode: targetRole,
          spotlightAuthors: targetSpots,
          yearFrom: currentYear - (targetYears - 1),
          yearTo: currentYear,
          query: targetQ,
        });
        setAnalysis(res);
        // If engine auto-detected an author name typed in draftQuery, reflect it cleanly in Spotlight pills
        if (res.spotlightAuthors.length > targetSpots.length) {
          setDraftSpotlights(res.spotlightAuthors);
          if (!res.query) setDraftQuery("");
        }
        setLastExecutedSig(sig);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyze selected journals."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      draftJournals,
      draftArticleType,
      draftFieldScope,
      draftYears,
      draftRole,
      draftSpotlights,
      draftQuery,
      currentYear,
      router,
    ]
  );

  useEffect(() => {
    if (searchParams.get("run") === "1" && !hasExecuted && !loading) {
      executeSearch();
    }
  }, [searchParams, hasExecuted, loading, executeSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamIds((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const fullSearchHref = useMemo(() => {
    const activeJournals = analysis?.journals ?? draftJournals;
    const activeArt = analysis?.articleType ?? draftArticleType;
    const activeQ = analysis?.query ?? draftQuery.trim();
    const yFrom = analysis?.yearFrom ?? currentYear - (draftYears - 1);
    const yTo = analysis?.yearTo ?? currentYear;

    const p = new URLSearchParams();
    if (activeQ) p.set("q", activeQ);
    if (activeJournals.length > 0) {
      p.set("journalId", activeJournals.map((j) => j.id).join(","));
    }
    p.set("articleType", activeArt);
    p.set("yearFrom", String(yFrom));
    p.set("yearTo", String(yTo));
    p.set("sort", "citations");
    return `/search?${p.toString()}`;
  }, [
    analysis,
    draftJournals,
    draftArticleType,
    draftQuery,
    draftYears,
    currentYear,
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" /> Multi-Journal Lab Streaks · Discipline Scope · Lab Spotlight
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white font-space tracking-tight">
          Lab &amp; Journal{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-mint-400 to-blue-400">
            Radar
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-3xl">
          Combine <strong className="text-gray-200">CNS + specialty journals</strong> (e.g.,{" "}
          <strong className="text-gray-200">Immuno + CNS 8 Venues</strong> or{" "}
          <strong className="text-gray-200">Virology + CNS</strong>), filter by discipline &amp; 2Y–All-Time windows, pin specific labs, and click{" "}
          <strong className="text-mint-300">Search Radar</strong>.
        </p>
      </div>

      {/* Staged Control Deck */}
      <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
        {/* 1. Multi-Journal Picker */}
        <JournalMultiSelect
          selected={draftJournals}
          onChange={setDraftJournals}
        />

        {/* 2. Discipline / Field Scope Filter */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-mint-400" />
            Discipline Scope (Prevents Physics/Materials from Crowding Out Bio/Virology/Immuno in CNS)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FIELD_SCOPES.map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setDraftFieldScope(scope.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  draftFieldScope === scope.id
                    ? "bg-mint-600 border-mint-500 text-white shadow-sm"
                    : "bg-black/40 border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Article Type + Time Window (2Y..All) + Hybrid Lab Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-white/10">
          {/* Article Type 3-Way Selector */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Article Classification
            </label>
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setDraftArticleType("research")}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  draftArticleType === "research"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Research (+Letter)
              </button>
              <button
                type="button"
                onClick={() => setDraftArticleType("review")}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  draftArticleType === "review"
                    ? "bg-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Review Only
              </button>
              <button
                type="button"
                onClick={() => setDraftArticleType("both")}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  draftArticleType === "both"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Both (All)
              </button>
            </div>
          </div>

          {/* Time Window: 2Y / 5Y / 10Y / 15Y / All */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Window (5Y–All catches pillars)
            </label>
            <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {WINDOW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftYears(opt.value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    draftYears === opt.value
                      ? "bg-amber-500/25 border border-amber-500/40 text-amber-200"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Team Role Mode: Hybrid (Default) / Strict PI / All */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-mint-400" />
              Ranking Mode
            </label>
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setDraftRole("hybrid")}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                  draftRole === "hybrid"
                    ? "bg-mint-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Combines Corresponding PIs + Last/Senior Authors (catches labs when publisher omits corresponding flag)"
              >
                PI + Senior
              </button>
              <button
                type="button"
                onClick={() => setDraftRole("pi")}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                  draftRole === "pi"
                    ? "bg-mint-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Strictly papers with explicit Crossref corresponding_author_ids"
              >
                Corr. Only
              </button>
              <button
                type="button"
                onClick={() => setDraftRole("all")}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                  draftRole === "all"
                    ? "bg-mint-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="All co-author positions (capped <=40 authors)"
              >
                All Co-Auth
              </button>
            </div>
          </div>
        </div>

        {/* 4. Spotlight Specific Researchers / Labs (0-credit autocomplete!) */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-cyan-400" />
              Spotlight Specific Labs / Researchers (Optional — pins any PI directly into the Radar &amp; Network)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray-500">Quick add:</span>
              {QUICK_SPOTLIGHT_LEGENDS.map((leg) => (
                <button
                  key={leg.id}
                  type="button"
                  onClick={() => addSpotlight(leg)}
                  className="px-2 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-[11px] transition-colors"
                >
                  + {leg.name}
                </button>
              ))}
            </div>
          </div>

          {draftSpotlights.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {draftSpotlights.map((sp) => (
                <span
                  key={sp.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-medium"
                >
                  <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                  <span>{sp.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSpotlight(sp.id)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative" ref={authorBoxRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              onFocus={() =>
                authorSuggestions.length > 0 && setAuthorDropdownOpen(true)
              }
              placeholder="Search & pin specific researchers (e.g., Yoshihiro Kawaoka, Akiko Iwasaki, Paul Kubes)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchingAuthors && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            )}

            {authorDropdownOpen && authorSuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1.5 w-full bg-[#0d1322] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                {authorSuggestions.map((au) => (
                  <button
                    key={au.id}
                    type="button"
                    onClick={() => addSpotlight(au)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] border-b border-white/5 last:border-b-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {au.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        {au.hint && (
                          <span className="truncate max-w-[260px]">
                            {au.hint}
                          </span>
                        )}
                        {typeof au.citedByCount === "number" && (
                          <span>
                            {au.citedByCount.toLocaleString()} citations
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-cyan-300 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Pin Lab
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Topic Input + Explicit Search Radar Trigger Button */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Optional topic/method keyword (e.g., intravital, influenza, mucosal immunity, CAR-T — leave blank for whole field)..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition-colors"
              />
              {draftQuery && (
                <button
                  type="button"
                  onClick={() => setDraftQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || draftJournals.length === 0}
              className={`px-7 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg disabled:opacity-50 ${
                !hasExecuted || isDirty
                  ? "bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white shadow-emerald-900/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? "Analyzing..." : "Search Radar"}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-500 mr-1">Quick topic:</span>
              {QUICK_TOPIC_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() =>
                    setDraftQuery((prev) => (prev === idea ? "" : idea))
                  }
                  className={`px-2.5 py-0.5 rounded-full border transition-colors ${
                    draftQuery.toLowerCase() === idea.toLowerCase()
                      ? "bg-mint-500/20 border-mint-500/40 text-mint-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {idea}
                </button>
              ))}
            </div>

            {isDirty && !loading && (
              <span className="text-amber-300 font-medium">
                Filters modified — click Search Radar to update results
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Initial Ready State */}
      {!hasExecuted && !loading && (
        <div className="py-16 px-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] text-center space-y-4">
          <div className="inline-flex p-3.5 rounded-full bg-amber-500/10 text-amber-300">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-space">
            Ready to Scan {draftJournals.length} Selected Venue
            {draftJournals.length > 1 ? "s" : ""} (
            {currentYear - (draftYears - 1)}–{currentYear})
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Tip: To see immunology or virology pillars across both CNS and specialty venues, pick{" "}
            <strong className="text-cyan-300">Immuno + CNS (8 Venues)</strong> or{" "}
            <strong className="text-rose-300">Virology &amp; Microbe + CNS</strong> with a{" "}
            <strong className="text-amber-200">5Y or 10Y</strong> window, then press{" "}
            <strong className="text-mint-300">Search Radar</strong>.
          </p>
          <button
            type="button"
            onClick={() => executeSearch()}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            Search Radar Now
          </button>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">
            Scanning {draftJournals.map((j) => j.name).join(", ")} for top labs, spotlight researchers, and topic links...
          </p>
        </div>
      )}

      {!loading && error && (
        <RateLimitHelpBanner error={error} onRetry={() => executeSearch()} />
      )}

      {!loading && !error && analysis && (
        <>
          {/* Summary Bar */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-amber-950/20 via-white/[0.02] to-blue-950/25 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-200">
                <span className="text-xl font-bold text-white font-space">
                  {analysis.totalMatchingWorks.toLocaleString()}
                </span>
                <span>
                  {analysis.articleType === "research"
                    ? "Research Articles (incl. Letters)"
                    : analysis.articleType === "review"
                    ? "Review Articles"
                    : "Research & Review Works"}{" "}
                  in{" "}
                  <strong className="text-white">
                    {analysis.yearFrom}–{analysis.yearTo}
                  </strong>
                  {analysis.fieldScope !== "all" && (
                    <>
                      {" "}
                      · Scope:{" "}
                      <span className="text-mint-300 font-semibold capitalize">
                        {analysis.fieldScope}
                      </span>
                    </>
                  )}
                  {analysis.query ? (
                    <>
                      {" "}
                      · Keyword:{" "}
                      <span className="text-mint-300 font-semibold">
                        &ldquo;{analysis.query}&rdquo;
                      </span>
                    </>
                  ) : null}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysis.journalCounts.map((jc) => (
                  <Link
                    key={jc.id}
                    href={`/journal/${jc.id}`}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium transition-opacity hover:opacity-90 ${getJournalBadgeStyle(
                      jc.id
                    )}`}
                  >
                    <span>{jc.name}</span>
                    <span className="font-bold">
                      {jc.count.toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href={fullSearchHref}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs sm:text-sm font-medium text-white transition-colors"
            >
              Browse All {analysis.totalMatchingWorks.toLocaleString()} Papers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Interactive 3-Mode Ecosystem Network */}
          {analysis.teams.length > 0 && (
            <VenueEcosystemGraph
              teams={analysis.teams}
              teamEdges={analysis.teamEdges}
              topics={analysis.topics}
              topicEdges={analysis.topicEdges}
              teamTopicLinks={analysis.teamTopicLinks}
              onSelectTopicFilter={(topic) => {
                setDraftQuery(topic);
                executeSearch({ q: topic });
              }}
            />
          )}

          {/* Streak & Foundational Research Teams Leaderboard */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-400" />
                Leading &amp; Streak Research Teams ({analysis.teams.length})
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {analysis.teamRoleMode === "hybrid"
                  ? "Hybrid ranking combining Corresponding PIs and Last/Senior co-investigators across your selected venues."
                  : analysis.teamRoleMode === "pi"
                  ? "Ranked strictly by Crossref Corresponding PI records."
                  : "Ranked across all non-consortium authorship positions."}
              </p>
            </div>

            {analysis.teams.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-gray-400 text-sm">
                No multi-paper research teams matched this exact filter combination. Try widening the year window (5Y or 10Y) or clearing the keyword filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysis.teams.map((team, idx) => {
                  const expanded = Boolean(expandedTeamIds[team.id]);
                  const visiblePapers = expanded
                    ? team.papers
                    : team.papers.slice(0, 2);

                  return (
                    <div
                      key={team.id}
                      className={`rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-colors border ${
                        team.isSpotlight
                          ? "bg-cyan-950/20 border-cyan-400/45 hover:border-cyan-300/60"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {team.isSpotlight ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                                  <Star className="w-3 h-3 fill-cyan-300" />
                                  Spotlight
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300 font-space">
                                  #{idx + 1}
                                </span>
                              )}
                              <Link
                                href={`/author/${team.id}`}
                                className="text-lg font-bold text-white hover:text-blue-400 transition-colors font-space flex items-center gap-1 truncate"
                              >
                                <span>{team.name}</span>
                                <ArrowUpRight className="w-4 h-4 shrink-0 text-blue-400" />
                              </Link>
                            </div>
                            {team.institution && (
                              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                <span className="truncate">
                                  {team.institution}
                                </span>
                                {team.countryCode && (
                                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase">
                                    {team.countryCode}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-white font-space leading-none">
                              {team.totalVenuePapers}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">
                              venue papers
                              {team.piLeadCount > 0
                                ? ` (${team.piLeadCount} PI)`
                                : ""}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {team.streakYears >= 2 && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 font-semibold">
                              <Flame className="w-3 h-3" />
                              {team.streakYears}-Yr Streak (
                              {team.activeYears[0]}–
                              {team.activeYears[team.activeYears.length - 1]})
                            </span>
                          )}
                          {team.journalBreakdown.map((jb) => (
                            <span
                              key={jb.journalId}
                              className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${getJournalBadgeStyle(
                                jb.journalId
                              )}`}
                            >
                              {jb.journalName} ×{jb.count}
                            </span>
                          ))}
                        </div>

                        {team.topTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {team.topTopics.slice(0, 3).map((tp) => (
                              <button
                                key={tp}
                                type="button"
                                onClick={() => setDraftQuery(tp)}
                                className="text-[11px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-blue-500/20 border border-white/10 text-gray-300 transition-colors"
                                title="Set topic filter (click Search Radar to run)"
                              >
                                {tp}
                              </button>
                            ))}
                          </div>
                        )}

                        {team.keyMembers.length > 0 && (
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>Key co-authors:</span>
                            {team.keyMembers.slice(0, 3).map((m) => (
                              <Link
                                key={m.id}
                                href={`/author/${m.id}`}
                                className="text-gray-300 hover:text-blue-300 underline decoration-dotted"
                              >
                                {m.name} ({m.count})
                              </Link>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 pt-1">
                          {visiblePapers.map((p) => (
                            <Link
                              key={p.id}
                              href={`/paper/${p.id}`}
                              className="block p-2.5 rounded-xl bg-black/35 hover:bg-black/55 border border-white/5 hover:border-white/15 transition-colors"
                            >
                              <div className="text-xs font-medium text-blue-300 line-clamp-2">
                                {p.title}
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px] text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-gray-300 font-medium">
                                    {p.journal?.displayName}
                                  </span>
                                  <span>· {p.publicationYear}</span>
                                  {p.type === "review" && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                                      Review
                                    </span>
                                  )}
                                  {p.type === "letter" && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                                      Letter
                                    </span>
                                  )}
                                </span>
                                <span>
                                  {p.citedByCount.toLocaleString()} cites
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {team.papers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => toggleTeamExpand(team.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 pt-1"
                        >
                          {expanded ? (
                            <>
                              Show fewer <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Show all {team.papers.length} sampled papers{" "}
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Dominant Fields & Hot Keywords Breakdown */}
          {(analysis.topics.length > 0 || analysis.hotKeywords.length > 0) && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Dominant Topics in Sampled Works
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Click a topic to stage it in the filter bar above, or open it in Concept Atlas.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {analysis.topics.slice(0, 8).map((tp) => {
                    const maxCount = analysis.topics[0]?.count || 1;
                    const barPct = Math.max(
                      6,
                      Math.round((tp.count / maxCount) * 100)
                    );
                    return (
                      <div
                        key={tp.id}
                        className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setDraftQuery(tp.name)}
                            className="text-sm font-medium text-white hover:text-mint-300 text-left transition-colors"
                          >
                            {tp.name}
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">
                              {tp.count} sampled ({tp.sharePct}%)
                            </span>
                            <Link
                              href={`/concept?q=${encodeURIComponent(tp.name)}`}
                              className="text-mint-400 hover:text-mint-300"
                              title="Open in Concept Atlas"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${barPct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-mint-400" />
                    High-Frequency Keywords
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Click any keyword to stage it in the filter input above.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.hotKeywords.map((kw) => (
                    <button
                      key={kw.name}
                      type="button"
                      onClick={() => setDraftQuery(kw.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-mint-500/20 border border-white/10 hover:border-mint-500/30 text-xs text-gray-200 transition-colors"
                    >
                      <span>{kw.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {kw.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Direct Paper Browser */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaperTab("cited")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    paperTab === "cited"
                      ? "bg-blue-600/25 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Highest-Impact Papers ({analysis.topCitedPapers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaperTab("latest")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    paperTab === "latest"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Latest Published ({analysis.latestPapers.length})
                </button>
              </div>

              <Link
                href={fullSearchHref}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                Paginate all {analysis.totalMatchingWorks.toLocaleString()} papers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {(paperTab === "cited"
                ? analysis.topCitedPapers
                : analysis.latestPapers
              ).map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
