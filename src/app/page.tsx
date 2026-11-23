import SearchBar from '@/components/SearchBar';
import AdUnit from '@/components/AdUnit';
import Link from 'next/link';
import { Compass, Users, Flame } from 'lucide-react';

const CONCEPT_QUICK_DEMOS = [
  "CRISPR",
  "Retrieval-Augmented Generation",
  "Graph Neural Network",
  "Diffusion Models",
  "Autophagy",
  "Quantum Error Correction",
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[82vh] px-4">
      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center space-y-6 mt-10 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-mint-400"></span>
          </span>
          Concept Origin · Research State · People Networks
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-space tracking-tight text-white">
          Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-mint-400">Unknown</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Trace when scientific concepts were first defined, see where the frontier stands today, and explore the researcher networks connecting 250M+ papers.
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-3xl mb-6">
        <SearchBar size="large" initialType="papers" />
      </div>

      {/* Explore Concept Demos */}
      <div className="w-full max-w-3xl mb-12 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-gray-500 font-medium mr-1">
          Explore a Concept &amp; Its People:
        </span>
        {CONCEPT_QUICK_DEMOS.map((term) => (
          <Link
            key={term}
            href={`/concept?q=${encodeURIComponent(term)}`}
            className="text-xs px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-mint-500/15 border border-white/10 hover:border-mint-500/40 text-gray-300 hover:text-mint-300 transition-colors"
          >
            {term}
          </Link>
        ))}
      </div>

      {/* Feature / Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-16">
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
              See when an idea began, defining abstracts, 4-era paper timelines, and growth momentum.
            </div>
          </div>
        </Link>

        <Link
          href="/search?type=author&q=Jennifer+Doudna"
          className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
              Researcher Networks
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              Interactive collaboration maps, co-authored paper inspection, and citation lineage.
            </div>
          </div>
        </Link>

        <Link
          href="/trending"
          className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-colors shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
              Live Frontier
            </div>
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              Track high-velocity papers published this week and fast-rising sub-directions.
            </div>
          </div>
        </Link>
      </div>

      {/* Ad Space */}
      <div className="w-full max-w-4xl flex justify-center mt-auto">
        <AdUnit slotId="home-bottom" width={728} height={90} className="w-full max-w-[728px] h-[90px]" />
      </div>
    </div>
  );
}
