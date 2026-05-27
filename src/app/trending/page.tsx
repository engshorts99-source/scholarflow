import PaperCard from '@/components/PaperCard';
import AdUnit from '@/components/AdUnit';
import { Flame } from 'lucide-react';
import { Paper } from '@/lib/types';
import { mapWorkToPaper } from '@/lib/openalex';
import { format, subDays } from 'date-fns';

export const metadata = {
  title: 'Trending Papers - ScholarFlow',
  description: 'Discover the most cited and trending academic papers from the past week.',
};

async function getTrendingPapers(): Promise<Paper[]> {
  try {
    const oneWeekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const url = `https://api.openalex.org/works?filter=from_publication_date:${oneWeekAgo},type:article&sort=cited_by_count:desc&per-page=20&mailto=scholarflow.project@example.com`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map(mapWorkToPaper);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function TrendingPage() {
  const papers = await getTrendingPapers();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full mb-6">
          <Flame className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-space">Trending Research</h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          The most impactful papers published in the last 7 days, ranked by citation count and community attention.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <AdUnit slotId="trending-top" width={728} height={90} className="w-full max-w-[728px]" />
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Unable to load trending papers at this time.
        </div>
      ) : (
        <div className="space-y-6 pl-4 md:pl-12">
          {papers.map((paper, index) => (
            <div key={paper.id} className="relative">
              <div className="absolute -left-8 md:-left-12 top-6 text-2xl font-bold text-white/10 font-space w-8 text-right">
                #{index + 1}
              </div>
              <PaperCard paper={paper} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
