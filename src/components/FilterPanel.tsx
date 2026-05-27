"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [yearFrom, setYearFrom] = useState(searchParams.get('yearFrom') || '');
  const [yearTo, setYearTo] = useState(searchParams.get('yearTo') || '');
  const [oaOnly, setOaOnly] = useState(searchParams.get('oaOnly') === 'true');
  const [journalId, setJournalId] = useState(searchParams.get('journalId') || '');

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (yearFrom) params.set('yearFrom', yearFrom);
    else params.delete('yearFrom');
    
    if (yearTo) params.set('yearTo', yearTo);
    else params.delete('yearTo');
    
    if (oaOnly) params.set('oaOnly', 'true');
    else params.delete('oaOnly');
    
    if (journalId) params.set('journalId', journalId);
    else params.delete('journalId');

    params.set('page', '1'); // Reset page on filter
    
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setYearFrom('');
    setYearTo('');
    setOaOnly(false);
    setJournalId('');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('yearFrom');
    params.delete('yearTo');
    params.delete('oaOnly');
    params.delete('journalId');
    params.set('page', '1');
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-6 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300">Clear all</button>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Publication Year</h4>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="From" 
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-gray-500">-</span>
          <input 
            type="number" 
            placeholder="To" 
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Access</h4>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={oaOnly}
              onChange={(e) => setOaOnly(e.target.checked)}
              className="peer appearance-none h-4 w-4 border border-gray-600 rounded bg-black/40 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Open Access only</span>
        </label>
      </div>

      <button 
        onClick={applyFilters}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-sm transition-colors border border-white/5"
      >
        Apply Filters
      </button>
    </div>
  );
}
