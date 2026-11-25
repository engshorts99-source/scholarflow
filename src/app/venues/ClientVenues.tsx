"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import JournalMultiSelect from "@/components/JournalMultiSelect";
import VenueEcosystemGraph from "@/components/VenueEcosystemGraph";
import PaperCard from "@/components/PaperCard";
import {
  ArticleCategory,
  SelectedJournalItem,
  VenueRadarAnalysis,
} from "@/lib/types";
import {
  JOURNAL_PRESETS,
  getJournalBadgeStyle,
  resolveJournalName,
} from "@/lib/journalPresets";
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
} from "lucide-react";

const QUICK_TOPIC_IDEAS = [
  "T cell exhaustion",
  "CRISPR",
  "spatial transcriptomics",
  "CAR-T",
  "microglia",
  "protein design",
  "ferroptosis",
  "organoid",
];

export default function ClientVenues() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  // Parse initial state from URL
  const parsedJournals: SelectedJournalItem[] = useMemo(() => {
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

    // Default to CNS Flagship (Nature, Cell, Science)
    return JOURNAL_PRESETS[0].journals;
  }, [searchParams]);

  const articleTypeParam = searchParams.get("articleType");
  const articleType: ArticleCategory =
    articleTypeParam === "review" || articleTypeParam === "both"
      ? articleTypeParam
      : "research";

  const roleParam = searchParams.get("role");
  const teamRoleMode: "pi" | "all" = roleParam === "all" ? "all" : "pi";

  const yearsSpan = useMemo(() => {
    const raw = parseInt(searchParams.get("years") || "2", 10);
    if ([1, 2, 3, 5].includes(raw)) return raw;
    return 2;
  }, [searchParams]);

  const yearFrom = currentYear - (yearsSpan - 1);
  const yearTo = currentYear;

  const urlQuery = (searchParams.get("q") || "").trim();

  const [topicInput, setTopicInput] = useState(urlQuery);
  const [analysis, setAnalysis] = useState<VenueRadarAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({});
  const [paperTab, setPaperTab] = useState<"cited" | "latest">("cited");

  useEffect(() => {
    setTopicInput(urlQuery);
  }, [urlQuery]);

  const updateUrl = useCallback(
    (next: {
      journals?: SelectedJournalItem[];
      articleType?: ArticleCategory;
      years?: number;
      role?: "pi" | "all";
      q?: string;
    }) => {
      const targetJournals = next.journals ?? parsedJournals;
      const targetArticle = next.articleType ?? articleType;
      const targetYears = next.years ?? yearsSpan;
      const targetRole = next.role ?? teamRoleMode;
      const targetQ = next.q !== undefined ? next.q.trim() : urlQuery;

      const params = new URLSearchParams();
      if (targetJournals.length > 0) {
        // Check if matches a known preset cleanly
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
      }

      params.set("articleType", targetArticle);
      params.set("years", String(targetYears));
      if (targetRole !== "pi") params.set("role", targetRole);
      if (targetQ) params.set("q", targetQ);

      router.push(`/venues?${params.toString()}`);
    },
    [parsedJournals, articleType, yearsSpan, teamRoleMode, urlQuery, router]
  );

  // Run analysis whenever filters change
  const journalKey = parsedJournals.map((j) => j.id).join(",");

  useEffect(() => {
    if (parsedJournals.length === 0) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    analyzeVenueLandscape({
      journals: parsedJournals,
      articleType,
      teamRoleMode,
      yearFrom,
      yearTo,
      query: urlQuery,
    })
      .then((res) => {
        if (isMounted) setAnalysis(res);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to analyze selected journals."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalKey, articleType, teamRoleMode, yearFrom, yearTo, urlQuery]);

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: topicInput });
  };

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamIds((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const fullSearchHref = useMemo(() => {
    const p = new URLSearchParams();
    if (urlQuery) p.set("q", urlQuery);
    if (parsedJournals.length > 0) {
      p.set("journalId", parsedJournals.map((j) => j.id).join(","));
    }
    p.set("articleType", articleType);
    p.set("yearFrom", String(yearFrom));
    p.set("yearTo", String(yearTo));
    p.set("sort", "citations");
    return `/search?${p.toString()}`;
  }, [urlQuery, parsedJournals, articleType, yearFrom, yearTo]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" /> Elite Multi-Journal Lab Streaks &amp; Topic Ecosystem
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white font-space tracking-tight">
          Lab &amp; Journal{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-mint-400 to-blue-400">
            Radar
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-3xl">
          Select <strong className="text-gray-200">Nature, Cell, Science</strong> or any custom combination of journals (e.g.,{" "}
          <strong className="text-gray-200">Nature Immunology + Science Immunology + Immunity</strong>) to uncover which research labs publish there repeatedly, how teams connect, and which research topics dominate.
        </p>
      </div>

      {/* Control Deck */}
      <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
        {/* 1. Multi-Journal Picker */}
        <JournalMultiSelect
          selected={parsedJournals}
          onChange={(next) => {
            if (next.length > 0) updateUrl({ journals: next });
          }}
        />

        {/* 2. Article Type (Research incl. Letters vs Review vs Both) + Time Window + Team Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-white/10">
          {/* Article Type 3-Way Selector */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Article Classification
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => updateUrl({ articleType: "research" })}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  articleType === "research"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Research (incl. Letters)
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ articleType: "review" })}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  articleType === "review"
                    ? "bg-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Review Only
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ articleType: "both" })}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  articleType === "both"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Both (All)
              </button>
            </div>
          </div>

          {/* Time Window */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Publication Window
            </label>
            <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {[1, 2, 3, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => updateUrl({ years: yr })}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    yearsSpan === yr
                      ? "bg-amber-500/25 border border-amber-500/40 text-amber-200"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {yr}Y
                </button>
              ))}
            </div>
          </div>

          {/* Team Role Mode */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-mint-400" />
              Lab Ranking Basis
            </label>
            <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => updateUrl({ role: "pi" })}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  teamRoleMode === "pi"
                    ? "bg-mint-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Rank by Corresponding / Senior Lab Heads"
              >
                Lab PIs
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ role: "all" })}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  teamRoleMode === "all"
                    ? "bg-mint-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Rank across all co-author positions"
              >
                All Authors
              </button>
            </div>
          </div>
        </div>

        {/* 3. Optional Topic / Keyword Search within Selected Journals */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <form onSubmit={handleTopicSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Optional: narrow by research topic, cell type, gene, or method (leave blank for all fields)..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition-colors"
              />
              {topicInput && (
                <button
                  type="button"
                  onClick={() => {
                    setTopicInput("");
                    updateUrl({ q: "" });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shrink-0"
            >
              Filter Radar
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-500 mr-1">Quick topic focus:</span>
            {QUICK_TOPIC_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => updateUrl({ q: urlQuery === idea ? "" : idea })}
                className={`px-2.5 py-0.5 rounded-full border transition-colors ${
                  urlQuery.toLowerCase() === idea.toLowerCase()
                    ? "bg-mint-500/20 border-mint-500/40 text-mint-300"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">
            Scanning {parsedJournals.map((j) => j.name).join(", ")} ({yearFrom}–
            {yearTo}) for streak research teams &amp; topic synergies...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && analysis && (
        <>
          {/* Summary Bar: Venue Counts + Article Mode + Full Search Link */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-amber-950/20 via-white/[0.02] to-blue-950/25 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-200">
                <span className="text-xl font-bold text-white font-space">
                  {analysis.totalMatchingWorks.toLocaleString()}
                </span>
                <span>
                  {articleType === "research"
                    ? "Research Articles (incl. Letters)"
                    : articleType === "review"
                    ? "Review Articles"
                    : "Research & Review Works"}{" "}
                  published in{" "}
                  <strong className="text-white">
                    {analysis.yearFrom}–{analysis.yearTo}
                  </strong>
                  {analysis.query ? (
                    <>
                      {" "}
                      matching{" "}
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
              onSelectTopicFilter={(topic) => updateUrl({ q: topic })}
            />
          )}

          {/* Streak Research Teams Leaderboard */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                  <Flame className="w-6 h-6 text-amber-400" />
                  High-Frequency &amp; Consecutive Streak Research Teams
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {teamRoleMode === "pi"
                    ? "Ranked by Corresponding / Senior PI leadership across your selected journals."
                    : "Ranked across all authorship positions in your selected journals."}
                </p>
              </div>
            </div>

            {analysis.teams.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-gray-400 text-sm">
                No multi-paper research teams matched this exact filter combination. Try widening the year window or clearing the topic filter.
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
                      className="rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 p-5 space-y-4 flex flex-col justify-between transition-colors"
                    >
                      <div className="space-y-3">
                        {/* Rank + Name + Streak */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300 font-space">
                                #{idx + 1}
                              </span>
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
                            </div>
                          </div>
                        </div>

                        {/* Streak + Per-Journal Pills */}
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

                        {/* Topics & Key Team Members */}
                        {team.topTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {team.topTopics.slice(0, 3).map((tp) => (
                              <button
                                key={tp}
                                type="button"
                                onClick={() => updateUrl({ q: tp })}
                                className="text-[11px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-blue-500/20 border border-white/10 text-gray-300 transition-colors"
                                title="Filter Radar by this topic"
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

                        {/* Exact Papers in Selected Journals */}
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
              {/* Dominant Topics */}
              <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    What Topics Dominate These Journals?
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Click any topic to focus the Lab Radar on teams competing in that exact area, or open it in Concept Atlas.
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
                            onClick={() => updateUrl({ q: tp.name })}
                            className="text-sm font-medium text-white hover:text-mint-300 text-left transition-colors"
                          >
                            {tp.name}
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">
                              {tp.count.toLocaleString()} papers
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

              {/* Specific Trending Keywords */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-mint-400" />
                    High-Frequency Keywords
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Granular biological mechanisms, methods, and technologies appearing across these venues.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.hotKeywords.map((kw) => (
                    <button
                      key={kw.name}
                      type="button"
                      onClick={() => updateUrl({ q: kw.name })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-mint-500/20 border border-white/10 hover:border-mint-500/30 text-xs text-gray-200 transition-colors"
                    >
                      <span>{kw.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {kw.count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Direct Paper Browser for Selected Venues */}
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
