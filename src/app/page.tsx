import SearchBar from '@/components/SearchBar';
import AdUnit from '@/components/AdUnit';
import Link from 'next/link';
import { Compass, Users, Award, Flame, BookOpen } from 'lucide-react';

const RADAR_SHORTCUTS = [
  {
    label: "Immuno + CNS Complete (8 Venues · 5Y)",
    href: "/venues?preset=immuno-cns&field=immunology&articleType=research&years=5",
    style:
      "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-200",
  },
  {
    label: "Virology & Microbe + CNS (8 Venues · 5Y)",
    href: "/venues?preset=virology-cns&field=virology&articleType=research&years=5",
    style:
      "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-200",
  },
  {
    label: "CNS Lab Streaks (Nature · Cell · Science)",
    href: "/venues?preset=cns&articleType=research&years=5",
    style:
      "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-200",
  },
  {
    label: "CNS Review Articles Only",
    href: "/venues?preset=cns&articleType=review&years=5",
    style:
      "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-200",
  },
];

const CONCEPT_QUICK_DEMOS = [
  "CRISPR",
  "Retrieval-Augmented Generation",
  "Graph Neural Network",
  "Autophagy",
  "Diffusion Models",
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[82vh] px-4">
      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center space-y-5 mt-10 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm font-medium mb-1">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          CNS Lab Streaks · Multi-Journal Radar · Concept Evolution
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-space tracking-tight text-white">
          Explore the{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-400 to-mint-400">
            Unknown
          </span>
        </h1>

        <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
          See which research teams publish repeatedly in Nature, Cell, Science &amp; top specialty journals, map how labs &amp; topics connect, and trace when any concept began.
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-3xl mb-6">
        <SearchBar size="large" initialType="papers" />
      </div>

      {/* 1-Click Lab & Journal Radar Bundles */}
      <div className="w-full max-w-4xl mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-gray-500 font-medium mr-1">
          Top-Journal Radar:
        </span>
        {RADAR_SHORTCUTS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${item.style}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Explore Concept Demos */}
      <div className="w-full max-w-3xl mb-12 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-gray-500 font-medium mr-1">
          Concept Atlas:
        </span>
        {CONCEPT_QUICK_DEMOS.map((term) => (
          <Link
            key={term}
            href={`/concept?q=${encodeURIComponent(term)}`}
            className="text-xs px-3 py-1 rounded-full bg-white/[0.03] hover:bg-mint-500/15 border border-white/10 hover:border-mint-500/40 text-gray-300 hover:text-mint-300 transition-colors"
          >
            {term}
          </Link>
        ))}
      </div>

      {/* 3 Flagship Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mb-16">
        <Link
          href="/venues"
          className="group p-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-white/[0.01] hover:border-amber-500/40 transition-all flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25 transition-colors shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
              Lab &amp; Journal Radar
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              Multi-select CNS or specialty journals, separate Research (incl. Letters) vs Reviews, and map streak labs &amp; topic links.
            </div>
          </div>
        </Link>

        <Link
          href="/concept"
          className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-mint-500/30 transition-all flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-lg bg-mint-500/10 text-mint-400 group-hover:bg-mint-500/20 transition-colors shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
              Concept Origin &amp; State
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              See when an idea was first defined, 4-era paper timelines, and quantitative growth momentum.
            </div>
          </div>
        </Link>

        <Link
          href="/search?type=author&q=Axel+Kallies"
          className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 group-hover:text-white transition-colors flex items-center gap-1.5">
              <span>People &amp; Lab Networks</span>
              <BookOpen className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              Interactive collaboration clusters, co-authored paper lookup, and incoming/outgoing citation lineage.
            </div>
          </div>
        </Link>
      </div>

      {/* Ad Space */}
      <div className="w-full max-w-4xl flex justify-center mt-auto">
        <AdUnit
          slotId="home-bottom"
          width={728}
          height={90}
          className="w-full max-w-[728px] h-[90px]"
        />
      </div>
    </div>
  );
}
