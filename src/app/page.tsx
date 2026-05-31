import SearchBar from '@/components/SearchBar';
import AdUnit from '@/components/AdUnit';
import Link from 'next/link';
import { TrendingUp, Clock, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center space-y-6 mt-12 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Access 250M+ Papers Free Forever
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold font-space tracking-tight text-white">
          Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-mint-400">Unknown</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          The modern academic search engine. Sort by citations, track latest publications, and read AI-powered summaries instantly.
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-3xl mb-12">
        <SearchBar size="large" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-16">
        <Link href="/search?sort=citations" className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-200 group-hover:text-white transition-colors">Most Cited</div>
            <div className="text-xs text-gray-500">High impact papers</div>
          </div>
        </Link>
        
        <Link href="/search?sort=date" className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-200 group-hover:text-white transition-colors">Latest Pubs</div>
            <div className="text-xs text-gray-500">Published this week</div>
          </div>
        </Link>
        
        <Link href="/trending" className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center gap-3">
          <div className="p-2 rounded-lg bg-mint-500/10 text-mint-400 group-hover:bg-mint-500/20 transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-200 group-hover:text-white transition-colors">Trending</div>
            <div className="text-xs text-gray-500">Hot topics right now</div>
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
