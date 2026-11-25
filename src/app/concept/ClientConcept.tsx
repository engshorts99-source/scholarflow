"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import PaperCard from "@/components/PaperCard";
import ConceptTimelineChart from "@/components/ConceptTimelineChart";
import PeopleNetworkGraph from "@/components/PeopleNetworkGraph";
import { RateLimitHelpBanner } from "@/components/ApiKeyControl";
import { getFullConceptAnalysis } from "@/lib/conceptEngine";
import { ConceptAnalysis, ResearchMaturityStage } from "@/lib/types";
import {
  Compass,
  Clock,
  TrendingUp,
  Layers,
  BookOpen,
  Users,
  Sparkles,
  Building,
  ArrowRight,
  ArrowUpRight,
  Quote,
  Flame,
  History,
  FileText,
} from "lucide-react";

const FEATURED_CONCEPTS = [
  {
    term: "CRISPR",
    field: "Molecular Biology",
    note: "From bacterial immunity origins to clinical gene editing",
  },
  {
    term: "Retrieval-Augmented Generation",
    field: "AI & NLP",
    note: "Grounding LLMs in dynamic external knowledge bases",
  },
  {
    term: "Graph Neural Network",
    field: "Machine Learning",
    note: "Deep learning on relational and topological structures",
  },
  {
    term: "Diffusion Models",
    field: "Generative AI",
    note: "Thermodynamic noise-reversal foundations to modern synthesis",
  },
  {
    term: "Autophagy",
    field: "Cell Biology",
    note: "Decades-long cellular recycling lineage & disease mechanisms",
  },
  {
    term: "Quantum Error Correction",
    field: "Quantum Computing",
    note: "Fault-tolerant codes from theory to physical qubits",
  },
  {
    term: "mRNA Vaccine",
    field: "Immunology",
    note: "Decades of lipid & nucleoside research leading to clinical scale",
  },
  {
    term: "Transformer",
    field: "Deep Learning",
    note: "Self-attention architectures reshaping modern computation",
  },
];

const STAGE_STYLES: Record<
  ResearchMaturityStage,
  { badge: string; desc: string }
> = {
  "Explosive Frontier": {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    desc: "Publication volume is surging rapidly (+60%+ 2-year momentum) with intense current breakthroughs.",
  },
  "Rapidly Accelerating": {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    desc: "Strong upward momentum (+25%+ 2-year growth) and expanding community adoption.",
  },
  "Emerging Niche": {
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    desc: "Relatively young concept still consolidating core definitions and early benchmarks.",
  },
  "Mature & Active": {
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    desc: "Sustained high annual research output across established labs and sub-disciplines.",
  },
  "Established Classic": {
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    desc: "Foundational body of literature whose annual peak occurred earlier and now sees specialized follow-ups.",
  },
  "Quiet / Specialized": {
    badge: "bg-gray-500/15 text-gray-300 border-gray-500/30",
    desc: "Focused niche research thread with steady or specialized publication cadence.",
  },
};

export default function ClientConcept() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [analysis, setAnalysis] = useState<ConceptAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePaperTab, setActivePaperTab] = useState<
    "frontier" | "seminal" | "reviews"
  >("frontier");

  useEffect(() => {
    if (!q || q.length < 2) {
      setAnalysis(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getFullConceptAnalysis(q)
      .then((res) => {
        if (!isMounted) return;
        setAnalysis(res);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyze concept evolution."
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [q]);

  // Empty State: Concept Atlas Explorer
  if (!q) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-500/10 border border-mint-500/20 text-mint-400 text-sm font-medium">
            <Compass className="w-4 h-4" /> Paper-Backed Concept Evolution &amp; People Graph
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-space tracking-tight">
            Concept <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Atlas</span>
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            Trace when any scientific idea was first defined, see how it evolved across eras, inspect its live research state, and explore the researchers connecting the field.
          </p>
        </div>

        <div className="mb-14">
          <SearchBar size="large" initialType="concept" />
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 text-center">
            Explore Curated Concept Lineages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_CONCEPTS.map((item) => (
              <Link
                key={item.term}
                href={`/concept?q=${encodeURIComponent(item.term)}`}
                className="group p-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-mint-500/40 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-mint-400 font-semibold">
                    {item.field}
                  </span>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors mt-1 font-space">
                    {item.term}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {item.note}
                  </p>
                </div>
                <span className="text-xs text-blue-400 flex items-center gap-1 font-medium">
                  Inspect origin &amp; network
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Compact Search Bar */}
      <div className="max-w-3xl">
        <SearchBar initialQuery={q} initialType="concept" />
      </div>

      {loading && (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-mint-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">
            Tracing origin papers, historical trajectory, and researcher relationships for &ldquo;{q}&rdquo;...
          </p>
        </div>
      )}

      {!loading && error && <RateLimitHelpBanner error={error} />}

      {!loading && !error && !analysis && (
        <div className="py-20 text-center space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white font-space">
            No Concept Lineage Found for &ldquo;{q}&rdquo;
          </h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Try a broader concept name or switch to Paper Search for full-text query matching.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Search Papers for &ldquo;{q}&rdquo;
            </Link>
            <Link
              href="/concept"
              className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-medium transition-colors"
            >
              Back to Concept Atlas
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && analysis && (
        <>
          {/* Section 1: Concept Origin & Research State Hero Card */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/35 via-white/[0.02] to-emerald-950/20 p-6 md:p-8 relative overflow-hidden space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-3">
                {analysis.domainPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                    {analysis.domainPath.map((seg, i) => (
                      <span key={seg} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span className="text-gray-600">/</span>}
                        <Link
                          href={`/concept?q=${encodeURIComponent(seg)}`}
                          className="hover:text-mint-400 transition-colors"
                        >
                          {seg}
                        </Link>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white font-space">
                    {analysis.query}
                  </h1>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                      STAGE_STYLES[analysis.stage].badge
                    }`}
                    title={STAGE_STYLES[analysis.stage].desc}
                  >
                    {analysis.stage}
                  </span>
                </div>

                <p className="text-sm md:text-base text-gray-200 max-w-4xl leading-relaxed">
                  {analysis.summaryText}
                </p>
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(analysis.query)}`}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                Browse {analysis.totalCount.toLocaleString()} Papers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  First Defined
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-space">
                  {analysis.originYear ?? "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {analysis.definingPaper?.authors?.[0]?.name
                    ? `Early landmark: ${analysis.definingPaper.authors[0].name}`
                    : "Earliest sustained corpus"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Total Literature
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-space">
                  {analysis.totalCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.queryMode === "title"
                    ? "Exact title-focused corpus"
                    : "Title & abstract corpus"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  2-Year Momentum
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-space">
                  {analysis.growthRate2Yr !== null
                    ? `${analysis.growthRate2Yr >= 0 ? "+" : ""}${analysis.growthRate2Yr}%`
                    : "Emerging"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.recent2YrCount.toLocaleString()} papers in last 2 yrs
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/35 border border-white/10">
                <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Recent 3-Yr Share
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white font-space">
                  {analysis.recentSharePct}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Peak year: {analysis.peakYear ?? "—"} (
                  {analysis.peakCount.toLocaleString()})
                </div>
              </div>
            </div>

            {/* Earliest Defining Evidence Quote Box */}
            {analysis.definingPaper && (
              <div className="p-5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Earliest Defining Evidence
                  </span>
                  <span className="text-xs text-gray-400">
                    {analysis.definingPaper.publicationYear} •{" "}
                    {analysis.definingPaper.citedByCount.toLocaleString()} citations
                  </span>
                </div>

                {analysis.definitionalExcerpt && (
                  <blockquote className="text-sm text-gray-200 italic leading-relaxed border-l-2 border-emerald-500/50 pl-4">
                    &ldquo;{analysis.definitionalExcerpt}&rdquo;
                  </blockquote>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <Link
                    href={`/paper/${analysis.definingPaper.id}`}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    {analysis.definingPaper.title}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  {analysis.definingPaper.authors.length > 0 && (
                    <span className="text-gray-400">
                      —{" "}
                      {analysis.definingPaper.authors
                        .slice(0, 3)
                        .map((a, idx) => (
                          <span key={a.id || idx}>
                            {idx > 0 && ", "}
                            {a.id ? (
                              <Link
                                href={`/author/${a.id}`}
                                className="hover:text-white underline decoration-dotted"
                              >
                                {a.name}
                              </Link>
                            ) : (
                              a.name
                            )}
                          </span>
                        ))}
                      {analysis.definingPaper.authors.length > 3 && " et al."}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Publication Trajectory + Hot Sub-Directions */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <ConceptTimelineChart
                query={analysis.query}
                yearCounts={analysis.yearCounts}
                originYear={analysis.originYear}
                peakYear={analysis.peakYear}
              />
            </div>

            <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white font-space flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Current Sub-Directions
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Top keywords emerging across recent works. Click any direction to trace its own lineage.
                </p>

                {analysis.hotKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.hotKeywords.map((kw) => (
                      <Link
                        key={kw.name}
                        href={`/concept?q=${encodeURIComponent(kw.name)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-xs text-gray-200 transition-colors"
                      >
                        <span>{kw.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {kw.count.toLocaleString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No concentrated recent keyword clusters returned for this query.
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 text-xs text-gray-400">
                <strong className="text-gray-200">Research State Note:</strong>{" "}
                {STAGE_STYLES[analysis.stage].desc}
              </div>
            </div>
          </section>

          {/* Section 3: Interactive People Relationship Network + Curated People Columns */}
          <section className="space-y-6">
            <PeopleNetworkGraph
              query={analysis.query}
              people={analysis.people}
              edges={analysis.edges}
            />

            {/* 3 Curated People Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pioneers */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Pioneers &amp; Originators
                </h3>
                <div className="space-y-2.5">
                  {analysis.people
                    .filter((p) => p.role === "pioneer" || p.role === "bridge")
                    .slice(0, 5)
                    .map((p) => (
                      <Link
                        key={p.id}
                        href={`/author/${p.id}`}
                        className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-emerald-400 shrink-0">
                            {p.firstYear}
                          </span>
                        </div>
                        {p.institution && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {p.institution}
                          </div>
                        )}
                      </Link>
                    ))}
                </div>
              </div>

              {/* Most Prolific Authorities */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Most Prolific Contributors
                </h3>
                <div className="space-y-2.5">
                  {(analysis.prolificAuthors.length > 0
                    ? analysis.prolificAuthors.slice(0, 5).map((pa) => ({
                        id: pa.id,
                        name: pa.name,
                        meta: `${pa.count.toLocaleString()} papers in concept`,
                      }))
                    : analysis.people
                        .filter((p) => p.role === "authority")
                        .slice(0, 5)
                        .map((p) => ({
                          id: p.id,
                          name: p.name,
                          meta: `${p.citationsInConcept.toLocaleString()} sampled citations`,
                        }))
                  ).map((item) => (
                    <Link
                      key={item.id}
                      href={`/author/${item.id}`}
                      className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {item.name}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.meta}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Frontier Leaders */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Current Frontier Leaders
                </h3>
                <div className="space-y-2.5">
                  {analysis.people
                    .filter((p) => p.role === "frontier" || p.role === "bridge")
                    .slice(0, 5)
                    .map((p) => (
                      <Link
                        key={p.id}
                        href={`/author/${p.id}`}
                        className="block p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-amber-400 shrink-0">
                            {p.lastYear}
                          </span>
                        </div>
                        {p.institution && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {p.institution}
                          </div>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            </div>

            {/* Leading Institutions */}
            {analysis.topInstitutions.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Leading Institutions in Sampled Works
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.topInstitutions.map((inst) => (
                    <span
                      key={inst.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-gray-200"
                    >
                      <span>{inst.name}</span>
                      {inst.countryCode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                          {inst.countryCode}
                        </span>
                      )}
                      <span className="text-[11px] text-blue-400 font-medium">
                        {inst.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 4: How This Concept Evolved (Historical Era Timeline) */}
          {analysis.eras.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-400" />
                  How This Concept Evolved
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Real landmark papers anchoring each phase from origin to present day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysis.eras.map((era) => (
                  <div
                    key={era.id}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-mint-400">
                          {era.startYear === era.endYear
                            ? era.startYear
                            : `${era.startYear}–${era.endYear}`}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                          {era.paperCount.toLocaleString()} papers
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white font-space">
                        {era.label}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {era.subtitle}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {era.papers.length > 0 ? (
                        era.papers.map((paper) => (
                          <div
                            key={paper.id}
                            className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-colors space-y-1.5"
                          >
                            <Link
                              href={`/paper/${paper.id}`}
                              className="text-sm font-medium text-blue-300 hover:text-blue-200 line-clamp-2 block"
                            >
                              {paper.title}
                            </Link>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                              <span className="truncate max-w-[70%]">
                                {paper.authors.slice(0, 2).map((a, idx) => (
                                  <span key={a.id || idx}>
                                    {idx > 0 && ", "}
                                    {a.id ? (
                                      <Link
                                        href={`/author/${a.id}`}
                                        className="hover:text-gray-300 underline decoration-dotted"
                                      >
                                        {a.name}
                                      </Link>
                                    ) : (
                                      a.name
                                    )}
                                  </span>
                                ))}
                                {paper.authors.length > 2 && " et al."}
                              </span>
                              <span className="inline-flex items-center gap-1 text-gray-400 shrink-0">
                                <Quote className="w-3 h-3 text-yellow-500/70" />
                                {paper.citedByCount.toLocaleString()} ({paper.publicationYear})
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic py-2">
                          Representative papers in this window can be inspected via Search.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Current Frontier vs Foundational Classics vs Reviews */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActivePaperTab("frontier")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activePaperTab === "frontier"
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Current Frontier ({analysis.frontierPapers.length})
                </button>
                <button
                  onClick={() => setActivePaperTab("seminal")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activePaperTab === "seminal"
                      ? "bg-blue-600/25 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  All-Time Seminal ({analysis.seminalPapers.length})
                </button>
                <button
                  onClick={() => setActivePaperTab("reviews")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activePaperTab === "reviews"
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Surveys &amp; Reviews ({analysis.reviewPapers.length})
                </button>
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(analysis.query)}`}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                Browse all {analysis.totalCount.toLocaleString()} papers in Search
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {activePaperTab === "frontier" &&
                (analysis.frontierPapers.length > 0 ? (
                  analysis.frontierPapers.map((p) => (
                    <PaperCard key={p.id} paper={p} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No papers published in the last 2 years matched this filter.
                  </p>
                ))}

              {activePaperTab === "seminal" &&
                analysis.seminalPapers.map((p) => (
                  <PaperCard key={p.id} paper={p} />
                ))}

              {activePaperTab === "reviews" &&
                (analysis.reviewPapers.length > 0 ? (
                  analysis.reviewPapers.map((p) => (
                    <PaperCard key={p.id} paper={p} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No survey or review articles found in the top seminal set for &ldquo;{analysis.query}&rdquo;.
                  </p>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
