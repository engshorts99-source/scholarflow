"use client";
import { useEffect, useState, Suspense } from 'react';
import SearchBar from '@/components/SearchBar';
import SortControls from '@/components/SortControls';
import FilterPanel from '@/components/FilterPanel';
import PaperCard from '@/components/PaperCard';
import AuthorCard from '@/components/AuthorCard';
import AdUnit from '@/components/AdUnit';
import { searchPapers, searchAuthors } from '@/lib/openalex';
import { getBatchTldrs } from '@/lib/semanticScholar';
import { SearchParams, Paper, AuthorProfile } from '@/lib/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ClientSearch() {
  const searchParams = useSearchParams();
  
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || undefined;
  const searchType = searchParams.get('type') === 'author' ? 'authors' : 'papers';
  
  const [paperResults, setPaperResults] = useState<Paper[]>([]);
  const [authorResults, setAuthorResults] = useState<AuthorProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setPaperResults([]);
      setAuthorResults([]);
      
      try {
        if (searchType === 'authors') {
          const searchResult = await searchAuthors(q, page);
          if (isMounted) {
            setAuthorResults(searchResult.results);
            setTotalCount(searchResult.totalCount);
          }
        } else {
          const params: SearchParams = {
            q,
            page,
            sort: sort as SearchParams['sort'],
            yearFrom: searchParams.get('yearFrom') || undefined,
            yearTo: searchParams.get('yearTo') || undefined,
            oaOnly: searchParams.get('oaOnly') === 'true',
            journalId: searchParams.get('journalId') || undefined,
          };
          
          const searchResult = await searchPapers(params);
          
          if (!isMounted) return;
          
          const dois = searchResult.results
            .map(p => p.doi)
            .filter((doi): doi is string => doi !== null);
            
          let tldrs: Record<string, string> = {};
          if (dois.length > 0) {
            tldrs = await getBatchTldrs(dois);
          }
          
          if (isMounted) {
            setPaperResults(searchResult.results.map(paper => ({
              ...paper,
              tldr: paper.doi ? tldrs[paper.doi.toLowerCase().replace("https://doi.org/", "")] || null : null
            })));
            setTotalCount(searchResult.totalCount);
          }
        }
      } catch (e: unknown) {
        if (isMounted) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setError(`Failed to fetch search results: ${errorMessage}`);
          console.error(e);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [q, page, sort, searchType, searchParams]);

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 max-w-3xl">
        <SearchBar initialQuery={q} initialType={searchType} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          {searchType === 'papers' ? (
            <Suspense fallback={<div className="h-64 bg-white/5 rounded-xl animate-pulse"></div>}>
              <FilterPanel />
            </Suspense>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="font-medium text-white">Author Filters</h3>
              <p className="text-sm text-gray-500">More filters coming soon.</p>
            </div>
          )}
          
          <div className="mt-6 sticky top-[450px]">
             <AdUnit slotId="sidebar-ad-1" width={250} height={250} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-medium text-white">
              {q ? `Results for "${q}"` : `All ${searchType === 'authors' ? 'Authors' : 'Papers'}`}
              {!loading && <span className="text-gray-500 text-sm ml-3">{totalCount.toLocaleString()} found</span>}
            </h1>
            
            {searchType === 'papers' && (
              <Suspense fallback={null}>
                <SortControls />
              </Suspense>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && !error && paperResults.length === 0 && authorResults.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              <p className="text-lg">No results found matching your criteria.</p>
              <p className="mt-2">Try adjusting your filters or search query.</p>
            </div>
          )}

          <div className="space-y-4">
            {searchType === 'authors' ? (
              authorResults.map((author, index) => (
                <div key={author.id}>
                  <AuthorCard author={author} />
                  {(index + 1) % 6 === 0 && (
                    <div className="my-6">
                      <AdUnit slotId={`inline-ad-author-${index}`} width={0} height={90} className="w-full h-[90px]" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              paperResults.map((paper, index) => (
                <div key={paper.id}>
                  <PaperCard paper={paper} />
                  {(index + 1) % 6 === 0 && (
                    <div className="my-6">
                      <AdUnit slotId={`inline-ad-paper-${index}`} width={0} height={90} className="w-full h-[90px]" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link 
                  href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}${sort ? `&sort=${sort}` : ''}${searchType === 'authors' ? '&type=author' : ''}`}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-gray-400">
                Page {page} of {Math.min(totalPages, 500).toLocaleString()}
              </span>
              {page < Math.min(totalPages, 500) && (
                <Link 
                  href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}${sort ? `&sort=${sort}` : ''}${searchType === 'authors' ? '&type=author' : ''}`}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
