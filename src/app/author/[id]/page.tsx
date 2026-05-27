import { getAuthorById, searchPapers } from '@/lib/openalex';
import AdUnit from '@/components/AdUnit';
import PaperCard from '@/components/PaperCard';
import { Building, Quote, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'edge';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const author = await getAuthorById(params.id);
  if (!author) return { title: "Author Not Found - ScholarFlow" };
  return {
    title: `${author.displayName} - ScholarFlow`,
    description: `Research profile for ${author.displayName}. ${author.worksCount} publications, ${author.citedByCount} citations.`,
  };
}

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const author = await getAuthorById(params.id);
  
  if (!author) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        <h1 className="text-2xl font-bold text-white mb-2">Author Not Found</h1>
        <p>The author you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/search" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
          Return to Search
        </Link>
      </div>
    );
  }

  // Fetch their latest and most cited papers
  const latestPapersReq = searchPapers({ authorId: author.id, sort: 'date', page: 1 });
  const topPapersReq = searchPapers({ authorId: author.id, sort: 'citations', page: 1 });

  const [latestPapersRes, topPapersRes] = await Promise.all([latestPapersReq, topPapersReq]);

  // Try to find common co-authors (simple heuristic from their top papers)
  const coauthorCounts: Record<string, { id: string, name: string, count: number }> = {};
  topPapersRes.results.forEach(paper => {
    paper.authors.forEach(a => {
      if (a.id && a.id !== author.id) {
        if (!coauthorCounts[a.id]) coauthorCounts[a.id] = { id: a.id, name: a.name, count: 0 };
        coauthorCounts[a.id].count += 1;
      }
    });
  });
  
  const topCoauthors = Object.values(coauthorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top Banner & Profile Info */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-10 mb-8 relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-mint-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-space">
              {author.displayName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              {author.lastKnownInstitution && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-mint-400" />
                  <span className="text-gray-300">{author.lastKnownInstitution.displayName}</span>
                  {author.lastKnownInstitution.countryCode && (
                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-xs uppercase ml-1">
                      {author.lastKnownInstitution.countryCode}
                    </span>
                  )}
                </div>
              )}
            </div>

            {author.concepts && author.concepts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Top Research Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {author.concepts.slice(0, 8).map(c => (
                    <span key={c.id} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                      {c.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {author.alternatives && author.alternatives.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Also published as:</span> {author.alternatives.slice(0, 3).join(', ')}
              </div>
            )}
          </div>

          {/* Stats Box */}
          <div className="w-full md:w-auto bg-black/40 border border-white/5 rounded-xl p-6 flex flex-row md:flex-col justify-around gap-6 shrink-0">
            <div>
              <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-blue-400" /> Total Works
              </div>
              <div className="text-3xl font-semibold text-white font-space">{author.worksCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                <Quote className="w-4 h-4 text-mint-400" /> Citations
              </div>
              <div className="text-3xl font-semibold text-white font-space">{author.citedByCount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {/* Top Papers */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <Quote className="w-5 h-5 text-mint-400" /> Most Cited Papers
              </h2>
              <Link href={`/search?type=papers&authorId=${author.id}&sort=citations`} className="text-sm text-blue-400 hover:text-blue-300">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {topPapersRes.results.slice(0, 5).map((paper, index) => (
                <div key={paper.id}>
                  <PaperCard paper={paper} />
                  {index === 1 && (
                    <div className="my-6">
                      <AdUnit slotId="author-top-papers-inline" width={0} height={90} className="w-full h-[90px]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Latest Papers */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" /> Latest Publications
              </h2>
              <Link href={`/search?type=papers&authorId=${author.id}&sort=date`} className="text-sm text-blue-400 hover:text-blue-300">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {latestPapersRes.results.slice(0, 5).map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <AdUnit slotId="author-sidebar-1" width={300} height={250} />

          {/* Top Co-authors */}
          {topCoauthors.length > 0 && (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Top Co-authors
              </h3>
              <p className="text-xs text-gray-400 mb-4">Often corresponds to mentors, advisors, or close lab members.</p>
              <div className="space-y-3">
                {topCoauthors.map(co => (
                  <Link href={`/author/${co.id}`} key={co.id} className="flex items-center justify-between group">
                    <span className="text-sm text-gray-300 group-hover:text-blue-400 transition-colors truncate pr-4">
                      {co.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                      {co.count} papers
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <AdUnit slotId="author-sidebar-2" width={300} height={600} />
        </div>
      </div>
    </div>
  );
}
