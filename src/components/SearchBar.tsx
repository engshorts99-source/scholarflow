"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, BookOpen, Layers } from 'lucide-react';

type SearchType = "papers" | "authors" | "journals" | "all";

export default function SearchBar({ initialQuery = "", size = "default", initialType = "papers" }: { initialQuery?: string, size?: "large" | "default", initialType?: SearchType }) {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const q = encodeURIComponent(query.trim());
    
    if (searchType === "authors") {
      router.push(`/search?type=author&q=${q}`);
    } else if (searchType === "journals") {
      router.push(`/search?type=journal&q=${q}`);
    } else if (searchType === "all") {
      router.push(`/search?type=all&q=${q}`);
    } else {
      router.push(`/search?q=${q}`);
    }
  };

  const isLarge = size === "large";

  const tabs: { type: SearchType; label: string; icon: React.ReactNode; activeColor: string }[] = [
    { type: "all", label: "All", icon: <Layers className="w-4 h-4" />, activeColor: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm" },
    { type: "papers", label: "Papers", icon: <FileText className="w-4 h-4" />, activeColor: "bg-blue-600 text-white shadow-sm" },
    { type: "authors", label: "Authors", icon: <User className="w-4 h-4" />, activeColor: "bg-mint-600 text-white shadow-sm" },
    { type: "journals", label: "Journals", icon: <BookOpen className="w-4 h-4" />, activeColor: "bg-purple-600 text-white shadow-sm" },
  ];

  const placeholders: Record<SearchType, string> = {
    all: "Search papers, authors, and journals at once...",
    papers: "Search 250M+ papers by title, DOI, or keyword...",
    authors: "Search for authors, researchers, professors...",
    journals: "Search journals by name (e.g., Nature, Science, Cell)...",
  };

  const buttonColors: Record<SearchType, string> = {
    all: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
    papers: "bg-blue-600 hover:bg-blue-500",
    authors: "bg-mint-600 hover:bg-mint-500",
    journals: "bg-purple-600 hover:bg-purple-500",
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {/* Type Toggle */}
      <div className="flex items-center gap-1.5 px-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.type}
            onClick={() => setSearchType(tab.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              searchType === tab.type 
                ? tab.activeColor
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className={`relative flex items-center w-full ${isLarge ? 'h-16' : 'h-12'}`}>
        <Search className={`absolute left-4 text-gray-400 ${isLarge ? 'h-6 w-6' : 'h-5 w-5'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholders[searchType]}
          className={`w-full bg-white/[0.03] border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${isLarge ? 'pl-14 pr-32 text-lg h-full' : 'pl-12 pr-24 text-base h-full'}`}
        />
        <button 
          type="submit"
          className={`absolute right-1.5 ${buttonColors[searchType]} text-white font-medium rounded-full transition-colors ${isLarge ? 'px-6 py-2.5 text-base' : 'px-4 py-1.5 text-sm'}`}
        >
          Search
        </button>
      </form>
    </div>
  );
}
