import AdUnit from '@/components/AdUnit';
import Link from 'next/link';
import {
  Search,
  Database,
  Compass,
  BookOpen,
  Users,
  GitBranch,
  ExternalLink,
  Heart,
} from 'lucide-react';

export const metadata = {
  title: 'About - Schox',
  description:
    'Learn about Schox: trace concept origins, live research maturity states, and interactive researcher collaboration networks across 250M+ papers.',
};

export default function AboutPage() {
  const features = [
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Concept Origin & Research State",
      description:
        "See when a scientific concept was first defined, inspect its earliest defining abstract, track 4-stage historical evolution, and measure live 2-year research momentum.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "People Relationship Networks",
      description:
        "Explore interactive co-author networks from Pioneers to Frontier Leaders, see advisor/mentee dynamics, and click any connection to view every shared paper.",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Intellectual Lineage",
      description:
        "Trace who a researcher or paper builds upon via foundational references, and see which active groups are extending their ideas today.",
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "250M+ Open Works",
      description:
        "Powered directly by OpenAlex across journal articles, conference proceedings, preprints, and reviews in every discipline.",
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Concept-Aware Search",
      description:
        "Every paper query surfaces a live Concept Snapshot banner alongside filters for publication year, open access PDFs, journals, and co-authors.",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "AI Summaries & Journals",
      description:
        "Read instant Semantic Scholar TL;DR summaries when available and inspect venue impact across thousands of academic journals.",
    },
  ];

  const dataSources = [
    {
      name: "OpenAlex",
      url: "https://openalex.org",
      description:
        "Open catalog of 250M+ scholarly works, authors, collaboration links, citations, venues, and institutions.",
    },
    {
      name: "Semantic Scholar",
      url: "https://www.semanticscholar.org",
      description: "AI-powered research tool providing concise TL;DR paper summaries.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
          <Heart className="w-4 h-4" /> Free &amp; Open for Everyone
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-space">
          About{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-mint-400">
            Schox
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Schox turns 250M+ scholarly works into living concept lineages and human collaboration graphs — showing not only what papers exist, but when ideas began, who connects them, and where research is heading.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4 font-space">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Understanding a new research domain takes more than a flat list of links. Schox combines paper-backed concept evolution (origin papers, historical phases, and quantitative momentum) with interactive researcher networks so students, engineers, and scientists can grasp the human story and live frontier of any topic in seconds.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">
          What Makes Schox Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all group"
            >
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-16">
        <AdUnit
          slotId="about-mid"
          width={728}
          height={90}
          className="w-full max-w-[728px] h-[90px]"
        />
      </div>

      {/* Data Sources */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">
          Data Sources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataSources.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all group flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {source.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "How are Concept Origins and Research States computed?",
              a: "Every origin year, defining quote, publication trajectory, and maturity label in Concept Atlas is calculated deterministically from real indexed OpenAlex papers — never guessed or hallucinated.",
            },
            {
              q: "Is Schox free?",
              a: "Yes, completely free. Schox requires no login or institutional subscription.",
            },
            {
              q: "How do the Researcher Relationship Networks work?",
              a: "Edges represent real co-authored papers across a concept or researcher's career. Clicking any researcher or connection reveals the exact papers they wrote together plus their citation lineage.",
            },
            {
              q: "Can I download PDFs?",
              a: "Whenever a paper is open access, Schox links directly to its free PDF. For subscription venues, we link to the publisher's DOI source.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mb-12 flex flex-wrap justify-center gap-4">
        <Link
          href="/concept"
          className="inline-flex items-center gap-2 bg-mint-600 hover:bg-mint-500 text-white px-7 py-3 rounded-full font-medium transition-colors text-base shadow-lg shadow-emerald-900/30"
        >
          <Compass className="w-5 h-5" /> Open Concept Atlas
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-full font-medium transition-colors text-base shadow-lg shadow-blue-600/20"
        >
          <Search className="w-5 h-5" /> Search Papers
        </Link>
      </div>

      <div className="flex justify-center">
        <AdUnit
          slotId="about-bottom"
          width={728}
          height={90}
          className="w-full max-w-[728px] h-[90px]"
        />
      </div>
    </div>
  );
}
