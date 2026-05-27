"use client";

import { useRouter, useSearchParams } from 'next/navigation';

export default function SortControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'relevance';
  const query = searchParams.get('q') || '';

  const handleSort = (sortOption: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortOption);
    router.push(`/search?${params.toString()}`);
  };

  const options = [
    { value: 'relevance', label: 'Relevance', showIfNoQuery: false },
    { value: 'citations', label: 'Most Cited', showIfNoQuery: true },
    { value: 'date', label: 'Newest', showIfNoQuery: true },
    { value: 'oldest', label: 'Oldest', showIfNoQuery: true },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        if (!opt.showIfNoQuery && !query) return null;
        const isActive = currentSort === opt.value || (!searchParams.get('sort') && opt.value === 'relevance' && query) || (!searchParams.get('sort') && opt.value === 'date' && !query);
        
        return (
          <button
            key={opt.value}
            onClick={() => handleSort(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
              isActive 
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-900/50' 
                : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
