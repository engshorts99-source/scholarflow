import PaperCard from '@/components/PaperCard';
import AdUnit from '@/components/AdUnit';
import { Building, Globe, BookOpen } from 'lucide-react';
import { mapWorkToPaper } from '@/lib/openalex';
import { Paper } from '@/lib/types';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const sourceId = params.id.startsWith('S') ? params.id : `S${params.id}`;
  const url = `https://api.openalex.org/sources/${sourceId}?mailto=scholarflow.project@example.com`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return { title: `${data.display_name} - ScholarFlow` };
    }
  } catch {
    // Ignore error
  }
  return { title: 'Journal Profile - ScholarFlow' };
}

async function getJournalData(id: string) {
  const sourceId = id.startsWith('S') ? id : `S${id}`;
  const url = `https://api.openalex.org/sources/${sourceId}?mailto=scholarflow.project@example.com`;
  const papersUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},type:article&sort=publication_date:desc&per-page=15&mailto=scholarflow.project@example.com`;
  
  try {
    const [res, papersRes] = await Promise.all([
      fetch(url, { next: { revalidate: 86400 } }),
      fetch(papersUrl, { next: { revalidate: 3600 } })
    ]);
    
    if (!res.ok) return null;
    const data = await res.json();
    const pData = papersRes.ok ? await papersRes.json() : { results: [] };
    
    return {
      journal: {
        id: data.id.replace("https://openalex.org/", ""),
        displayName: data.display_name,
        issn: data.issn,
        publisher: data.host_organization_name,
        worksCount: data.works_count,
        citedByCount: data.cited_by_count,
        homepageUrl: data.homepage_url
      },
      latestPapers: pData.results.map(mapWorkToPaper)
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function JournalPage({ params }: { params: { id: string } }) {
  const data = await getJournalData(params.id);

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Journal Not Found</h1>
        <Link href="/" className="text-blue-400 hover:underline">Go Home</Link>
      </div>
    );
  }

  const { journal, latestPapers } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Journal Header */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Building className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
            Journal Profile
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 font-space">{journal.displayName}</h1>
          
          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            {journal.publisher && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                {journal.publisher}
              </div>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              {journal.worksCount?.toLocaleString()} Papers
            </div>
            {journal.homepageUrl && (
              <a href={journal.homepageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
          </div>
          
          <div className="mt-8 flex gap-4">
            <Link 
              href={`/search?journalId=${journal.id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Search All Papers
            </Link>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-white/5">
              Subscribe to Alerts
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 font-space">
            Latest Publications
          </h2>
          
          {latestPapers.length === 0 ? (
            <p className="text-gray-500">No recent papers found.</p>
          ) : (
            latestPapers.map((paper: Paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))
          )}
        </div>
        
        <div className="w-full lg:w-72 space-y-6">
          <div className="sticky top-24">
            <AdUnit slotId="journal-sidebar" width={300} height={250} className="w-full" />
            <div className="mt-6">
              <AdUnit slotId="journal-sidebar-2" width={300} height={600} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
