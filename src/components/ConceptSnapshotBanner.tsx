"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ConceptSnapshot, Paper, ResearchMaturityStage } from "@/lib/types";
import { getConceptSnapshot } from "@/lib/conceptEngine";
import { MiniSparkline } from "./ConceptTimelineChart";
import {
  Compass,
  Clock,
  TrendingUp,
  Users,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface ConceptSnapshotBannerProps {
  query: string;
  samplePapers?: Paper[];
}

const STAGE_STYLES: Record<ResearchMaturityStage, string> = {
  "Explosive Frontier":
    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Rapidly Accelerating":
    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Emerging Niche":
    "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "Mature & Active":
    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Established Classic":
    "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "Quiet / Specialized":
    "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

export default function ConceptSnapshotBanner({
  query,
  samplePapers = [],
}: ConceptSnapshotBannerProps) {
  const [snapshot, setSnapshot] = useState<ConceptSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getConceptSnapshot(clean)
      .then((res) => {
        if (isMounted) setSnapshot(res);
      })
      .catch(() => {
        if (isMounted) setSnapshot(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  // Derive key people chips immediately from defining paper + current sample papers (0 extra API calls)
  const keyPeople = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; tag: string; score: number }
    >();

    if (snapshot?.definingPaper) {
      for (const a of snapshot.definingPaper.authors.slice(0, 2)) {
        if (!a.id) continue;
        map.set(a.id, {
          id: a.id,
          name: a.name,
          tag: `Pioneer · ${snapshot.definingPaper.publicationYear}`,
          score: 100000,
        });
      }
    }

    for (const p of samplePapers.slice(0, 10)) {
      for (const a of p.authors.slice(0, 2)) {
        if (!a.id) continue;
        const existing = map.get(a.id);
        if (existing) {
          existing.score += p.citedByCount || 1;
        } else {
          map.set(a.id, {
            id: a.id,
            name: a.name,
            tag: `${p.publicationYear}`,
            score: (p.citedByCount || 1) + 50,
          });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [snapshot, samplePapers]);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-white/[0.02] to-mint-500/[0.04] p-5 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-3"></div>
        <div className="h-3 w-full max-w-xl bg-white/5 rounded mb-4"></div>
        <div className="h-8 w-64 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!snapshot) return null;

  const sparkPoints = snapshot.yearCounts.slice(-25).map((yc) => ({
    label: String(yc.year),
    value: yc.count,
  }));

  return (
    <div className="mb-6 rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-950/35 via-[#0f1628] to-emerald-950/20 p-5 md:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex-1 space-y-3">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Concept Snapshot
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                STAGE_STYLES[snapshot.stage]
              }`}
            >
              {snapshot.stage}
            </span>
            {snapshot.growthRate2Yr !== null && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-200">
                <TrendingUp className="w-3 h-3 text-mint-400" />
                {snapshot.growthRate2Yr >= 0 ? "+" : ""}
                {snapshot.growthRate2Yr}% 2-yr momentum
              </span>
            )}
            {snapshot.originYear && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Clock className="w-3 h-3" />
                Origin: {snapshot.originYear}
              </span>
            )}
          </div>

          {/* Factual Paper-based Summary */}
          <p className="text-sm text-gray-200 leading-relaxed">
            {snapshot.summaryText}
          </p>

          {/* Defining Paper Excerpt */}
          {snapshot.definingPaper && (
            <div className="text-xs text-gray-400 bg-black/25 border border-white/5 rounded-lg px-3.5 py-2.5 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-gray-400">Earliest landmark ({snapshot.definingPaper.publicationYear}):</span>
                <Link
                  href={`/paper/${snapshot.definingPaper.id}`}
                  className="text-blue-300 hover:text-blue-200 font-medium underline underline-offset-2 line-clamp-1"
                >
                  {snapshot.definingPaper.title}
                </Link>
              </div>
              {snapshot.definitionalExcerpt && (
                <p className="text-gray-400 italic line-clamp-2 pl-5">
                  &ldquo;{snapshot.definitionalExcerpt}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Key People Chips */}
          {keyPeople.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Key People:
              </span>
              {keyPeople.map((person) => (
                <Link
                  key={person.id}
                  href={`/author/${person.id}`}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-gray-200 transition-colors"
                >
                  <span>{person.name}</span>
                  <span className="text-[10px] text-gray-500">{person.tag}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sparkline + Primary CTA */}
        <div className="lg:w-64 shrink-0 flex flex-col justify-between gap-4 bg-black/25 border border-white/5 rounded-xl p-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
              <span>Trajectory ({sparkPoints[0]?.label}–{sparkPoints[sparkPoints.length - 1]?.label})</span>
              {snapshot.peakYear && (
                <span className="text-mint-400">Peak {snapshot.peakYear}</span>
              )}
            </div>
            <MiniSparkline points={sparkPoints} height={46} className="w-full" />
          </div>

          <Link
            href={`/concept?q=${encodeURIComponent(query)}`}
            className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-mint-600 hover:from-blue-500 hover:to-mint-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-900/30 text-center"
          >
            <span>Open Full Concept Evolution &amp; People Graph</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
