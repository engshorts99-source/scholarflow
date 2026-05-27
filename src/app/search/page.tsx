import { Suspense } from 'react';

export const runtime = 'edge';
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

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const q = searchParams.q as string;
  const type = searchParams.type as string;
  const titleSuffix = type === 'author' ? "Author Search" : "Paper Search";
  return {
    title: q ? `${q} - ScholarFlow ${titleSuffix}` : `Search - ScholarFlow`,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = searchParams.q as string || '';
  const page = parseInt((searchParams.page as string) || '1');
  const sort = (searchParams.sort as string) || undefined;
  const searchType = (searchParams.type as string) === 'author' ? 'authors' : 'papers';
  
  const params: SearchParams = {
    q,
    page,
    sort: sort as SearchParams['sort'],
    yearFrom: searchParams.yearFrom as string,
    yearTo: searchParams.yearTo as string,
    oaOnly: searchParams.oaOnly === 'true',
    journalId: searchParams.journalId as string,
  };

  let paperResults: Paper[] = [];
  let authorResults: AuthorProfile[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    if (searchType === 'authors') {
      const searchResult = await searchAuthors(q, page);
      authorResults = searchResult.results;
      totalCount = searchResult.totalCount;
    } else {
      const searchResult = await searchPapers(params);
      
      // Server-side TLDR fetching
      const dois = searchResult.results
        .map(p => p.doi)
        .filter((doi): doi is string => doi !== null);
        
      let tldrs: Record<string, string> = {};
      if (dois.length > 0) {
        tldrs = await getBatchTldrs(dois);
      }
      
      paperResults = searchResult.results.map(paper => ({
        ...paper,
        tldr: paper.doi ? tldrs[paper.doi.toLowerCase().replace("https://doi.org/", "")] || null : null
      }));
      totalCount = searchResult.totalCount;
    }
  } catch (e) {
    error = "Failed to fetch search results. Please try again later.";
    console.error(e);
  }

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 max-w-3xl">
        <SearchBar initialQuery={q} initialType={searchType} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Filters (Only for papers currently) */}
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

        {/* Main Content - Results */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-medium text-white">
              {q ? `Results for "${q}"` : `All ${searchType === 'authors' ? 'Authors' : 'Papers'}`}
              <span className="text-gray-500 text-sm ml-3">{totalCount.toLocaleString()} found</span>
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

          {!error && paperResults.length === 0 && authorResults.length === 0 && (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link 
                  href={`/search?${new URLSearchParams({...searchParams as Record<string, string>, page: (page - 1).toString()}).toString()}`}
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
                  href={`/search?${new URLSearchParams({...searchParams as Record<string, string>, page: (page + 1).toString()}).toString()}`}
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
