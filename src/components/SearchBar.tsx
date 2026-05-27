"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar({ initialQuery = "", size = "default" }: { initialQuery?: string, size?: "large" | "default" }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSearch} className={`relative flex items-center w-full max-w-3xl ${isLarge ? 'h-16' : 'h-12'}`}>
      <Search className={`absolute left-4 text-gray-400 ${isLarge ? 'h-6 w-6' : 'h-5 w-5'}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 250M+ papers by title, author, DOI, or keyword..."
        className={`w-full bg-white/[0.03] border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${isLarge ? 'pl-14 pr-32 text-lg h-full' : 'pl-12 pr-24 text-base h-full'}`}
      />
      <button 
        type="submit"
        className={`absolute right-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-colors ${isLarge ? 'px-6 py-2.5 text-base' : 'px-4 py-1.5 text-sm'}`}
      >
        Search
      </button>
    </form>
  );
}
