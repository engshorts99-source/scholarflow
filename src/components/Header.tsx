import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-6xl">
        <Link href="/" className="flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-tight text-white font-space">Scholar<span className="text-blue-500">Flow</span></span>
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}
