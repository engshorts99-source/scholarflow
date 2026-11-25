"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { autocompleteJournals } from '@/lib/openalex';
import { ArticleCategory, JournalProfile } from '@/lib/types';
import { JOURNAL_PRESETS, resolveJournalName } from '@/lib/journalPresets';
import { X, Search, Award } from 'lucide-react';

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlYearFrom = searchParams.get('yearFrom') || '';
  const urlYearTo = searchParams.get('yearTo') || '';
  const urlOaOnly = searchParams.get('oaOnly') === 'true';
  const urlArticleType =
    (searchParams.get('articleType') as ArticleCategory) || 'both';
  const urlJournalId = searchParams.get('journalId') || '';

  const [yearFrom, setYearFrom] = useState(urlYearFrom);
  const [yearTo, setYearTo] = useState(urlYearTo);
  const [oaOnly, setOaOnly] = useState(urlOaOnly);
  const [articleType, setArticleType] =
    useState<ArticleCategory>(urlArticleType);

  // Multi-journal support
  const [journalQuery, setJournalQuery] = useState('');
  const [journalSuggestions, setJournalSuggestions] = useState<JournalProfile[]>([]);
  const [selectedJournals, setSelectedJournals] = useState<
    { id: string; name: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingJournals, setSearchingJournals] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync from URL parameters cleanly
  useEffect(() => {
    setYearFrom(urlYearFrom);
    setYearTo(urlYearTo);
    setOaOnly(urlOaOnly);
    setArticleType(
      urlArticleType === 'research' || urlArticleType === 'review'
        ? urlArticleType
        : 'both'
    );
    if (urlJournalId) {
      const ids = urlJournalId
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      setSelectedJournals((prev) => {
        const prevMap = new Map(prev.map((p) => [p.id, p.name]));
        return ids.map((id) => {
          const clean = id.startsWith('S') ? id : `S${id}`;
          return {
            id: clean,
            name: resolveJournalName(clean, prevMap.get(clean) || clean),
          };
        });
      });
    } else {
      setSelectedJournals([]);
    }
  }, [urlYearFrom, urlYearTo, urlOaOnly, urlArticleType, urlJournalId]);

  // Debounced journal search
  useEffect(() => {
    if (!journalQuery.trim() || journalQuery.length < 2) {
      setJournalSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingJournals(true);
      try {
        const results = await autocompleteJournals(journalQuery);
        setJournalSuggestions(results.slice(0, 6));
        setShowSuggestions(true);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingJournals(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [journalQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addJournal = (journal: { id: string; name: string }) => {
    setSelectedJournals((prev) =>
      prev.some((j) => j.id === journal.id) ? prev : [...prev, journal]
    );
    setJournalQuery('');
    setShowSuggestions(false);
  };

  const applyPresetJournals = (presetId: string) => {
    const preset = JOURNAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedJournals(
      preset.journals.map((j) => ({ id: j.id, name: j.name }))
    );
  };

  const removeJournal = (id: string) => {
    setSelectedJournals((prev) => prev.filter((j) => j.id !== id));
  };

  const applyFilters = (overrideArticleType?: ArticleCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextArticleType = overrideArticleType ?? articleType;

    if (nextArticleType && nextArticleType !== 'both') {
      params.set('articleType', nextArticleType);
    } else {
      params.delete('articleType');
    }

    if (yearFrom) params.set('yearFrom', yearFrom);
    else params.delete('yearFrom');

    if (yearTo) params.set('yearTo', yearTo);
    else params.delete('yearTo');

    if (oaOnly) params.set('oaOnly', 'true');
    else params.delete('oaOnly');

    if (selectedJournals.length > 0) {
      params.set('journalId', selectedJournals.map((j) => j.id).join(','));
    } else {
      params.delete('journalId');
    }

    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setYearFrom('');
    setYearTo('');
    setOaOnly(false);
    setArticleType('both');
    setSelectedJournals([]);
    setJournalQuery('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('yearFrom');
    params.delete('yearTo');
    params.delete('oaOnly');
    params.delete('journalId');
    params.delete('articleType');
    params.set('page', '1');

    router.push(`/search?${params.toString()}`);
  };

  const radarLink = (() => {
    const p = new URLSearchParams();
    if (selectedJournals.length > 0) {
      p.set('journals', selectedJournals.map((j) => j.id).join(','));
      p.set('jnames', selectedJournals.map((j) => j.name).join('|'));
    }
    p.set('articleType', articleType);
    const q = searchParams.get('q');
    if (q) p.set('q', q);
    return `/venues?${p.toString()}`;
  })();

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-6 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">Filters</h3>
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Clear all
        </button>
      </div>

      {/* Article Type Selector (Research incl. Letters vs Review vs Both) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Article Type</h4>
        <div className="flex flex-col gap-1.5">
          {[
            {
              value: 'both' as ArticleCategory,
              label: 'Both (Research + Review)',
            },
            {
              value: 'research' as ArticleCategory,
              label: 'Research Only (incl. Letters)',
            },
            {
              value: 'review' as ArticleCategory,
              label: 'Review Articles Only',
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setArticleType(opt.value)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                articleType === opt.value
                  ? 'bg-blue-600/25 border-blue-500/50 text-white'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Journal Filter with Presets + Autocomplete */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">
          Journals (Multi-Select)
        </h4>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'cns', label: '+ CNS' },
            { id: 'immunology', label: '+ Immunology' },
            { id: 'biomed', label: '+ Biomed' },
            { id: 'cancer', label: '+ Cancer' },
          ].map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => applyPresetJournals(pr.id)}
              className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-amber-200 transition-colors"
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* Selected journals */}
        {selectedJournals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedJournals.map((j) => (
              <span
                key={j.id}
                className="inline-flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 rounded-full px-2.5 py-1 text-xs text-purple-200"
              >
                <span className="truncate max-w-[130px]">{j.name}</span>
                <button
                  type="button"
                  onClick={() => removeJournal(j.id)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative" ref={suggestionsRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Add journals..."
              value={journalQuery}
              onChange={(e) => setJournalQuery(e.target.value)}
              onFocus={() =>
                journalSuggestions.length > 0 && setShowSuggestions(true)
              }
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 pl-8 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchingJournals && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {showSuggestions && journalSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {journalSuggestions.map((journal) => (
                <button
                  key={journal.id}
                  type="button"
                  onClick={() =>
                    addJournal({ id: journal.id, name: journal.displayName })
                  }
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <div className="text-sm text-white truncate">
                    {journal.displayName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    {journal.publisher && (
                      <span className="truncate">{journal.publisher}</span>
                    )}
                    <span>{journal.worksCount.toLocaleString()} papers</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJournals.length > 0 && (
          <Link
            href={radarLink}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            Lab &amp; Topic Radar for Selection
          </Link>
        )}
      </div>

      {/* Year filter */}
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
            <svg
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            Open Access only
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={() => applyFilters()}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-sm transition-colors border border-white/5"
      >
        Apply Filters
      </button>
    </div>
  );
}
