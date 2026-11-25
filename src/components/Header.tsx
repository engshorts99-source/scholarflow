import Link from 'next/link';
import { Search, Compass, Award } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-6xl">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Search className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-tight text-white font-space">
            Sch<span className="text-blue-500">ox</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-gray-300">
          <Link
            href="/venues"
            className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Lab &amp; Journal Radar</span>
          </Link>
          <Link
            href="/concept"
            className="hover:text-mint-400 transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-mint-400" />
            <span className="hidden xs:inline sm:inline">Concept Atlas</span>
            <span className="inline sm:hidden">Atlas</span>
          </Link>
          <Link href="/trending" className="hover:text-white transition-colors hidden md:inline">
            Trending
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
