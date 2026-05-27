import AdUnit from '@/components/AdUnit';
import Link from 'next/link';
import { Search, Database, Zap, BookOpen, Users, Quote, ExternalLink, Heart } from 'lucide-react';

export const metadata = {
  title: 'About - ScholarFlow',
  description: 'Learn about ScholarFlow, the modern academic search engine providing free access to 250M+ research papers.',
};

export default function AboutPage() {
  const features = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "250M+ Papers",
      description: "Access the entire OpenAlex database - one of the largest open catalogs of scholarly works, spanning every academic discipline."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Search",
      description: "Search papers, authors, and journals simultaneously. Filter by year, open access, journal, and sort by citations or recency."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI Summaries",
      description: "Get instant TL;DR summaries powered by Semantic Scholar, so you can quickly decide which papers to read."
    },
    {
      icon: <Quote className="w-6 h-6" />,
      title: "Citation Tracking",
      description: "See which papers cite a given work. Track the impact and lineage of any research across the academic graph."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Author Profiles",
      description: "Explore researcher profiles with publication history, co-author networks, citation counts, and institutional affiliations."
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Journal Profiles",
      description: "Browse journals by name, discover their most cited and latest papers, and filter search results by multiple journals."
    },
  ];

  const dataSources = [
    { name: "OpenAlex", url: "https://openalex.org", description: "Open catalog of 250M+ scholarly works, authors, venues, and institutions." },
    { name: "Semantic Scholar", url: "https://www.semanticscholar.org", description: "AI-powered research tool providing TL;DR paper summaries." },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
          <Heart className="w-4 h-4" /> Free & Open for Everyone
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-space">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-mint-400">ScholarFlow</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          ScholarFlow is a modern, free academic search engine designed to make research discovery fast, intuitive, and accessible to everyone — from students to seasoned researchers.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4 font-space">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Academic knowledge should be discoverable by anyone, anywhere. ScholarFlow provides a clean, ad-supported alternative to expensive institutional databases, giving free access to paper search, citation tracking, author discovery, and AI-powered summaries — all in one place.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all group">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-16">
        <AdUnit slotId="about-mid" width={728} height={90} className="w-full max-w-[728px] h-[90px]" />
      </div>

      {/* Data Sources */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">Data Sources</h2>
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
              <p className="text-sm text-gray-400 leading-relaxed">{source.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 font-space text-center">FAQ</h2>
        <div className="space-y-4">
          {[
            { q: "Is ScholarFlow free?", a: "Yes, completely free. ScholarFlow is funded by advertisements and will always remain free to use." },
            { q: "Where does the data come from?", a: "All paper, author, and journal data comes from OpenAlex, a fully open catalog of scholarly metadata. AI summaries are provided by Semantic Scholar." },
            { q: "Can I download PDFs?", a: "If a paper is open access, we provide a direct link to the PDF. For paywalled papers, we link to the publisher's page where you can access it through your institution." },
            { q: "How often is the data updated?", a: "OpenAlex updates its database daily with new publications. Search results reflect the most current data available." },
            { q: "I found an error in a paper's metadata.", a: "Paper metadata is sourced from OpenAlex. If you find an error, please report it directly to the OpenAlex community." },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-white mb-4 font-space">Start Searching</h2>
        <p className="text-gray-400 mb-6">Discover your next breakthrough paper.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-medium transition-colors text-lg shadow-lg shadow-blue-600/20">
          <Search className="w-5 h-5" /> Search Papers
        </Link>
      </div>

      <div className="flex justify-center">
        <AdUnit slotId="about-bottom" width={728} height={90} className="w-full max-w-[728px] h-[90px]" />
      </div>
    </div>
  );
}
