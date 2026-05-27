"use client";
import { useEffect, useState } from 'react';
import PaperCard from '@/components/PaperCard';
import AdUnit from '@/components/AdUnit';
import { Flame } from 'lucide-react';
import { Paper } from '@/lib/types';
import { mapWorkToPaper } from '@/lib/openalex';
import { format, subDays } from 'date-fns';

export default function TrendingPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
      try {
        const oneWeekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
        const url = `https://api.openalex.org/works?filter=from_publication_date:${oneWeekAgo},type:article&sort=cited_by_count:desc&per-page=20&mailto=engshorts99@gmail.com`;
        
        // Let's also add some basic retry logic here for the client
        let res = null;
        for (let i = 0; i < 3; i++) {
          res = await fetch(url, { cache: 'no-store' });
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            continue;
          }
          break;
        }
        
        if (!res || !res.ok) {
          if (isMounted) setLoading(false);
          return;
        }
        
        const data = await res.json();
        if (isMounted) {
          setPapers(data.results.map(mapWorkToPaper));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchTrending();
    return () => { isMounted = false; };
  }, []);

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

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : papers.length === 0 ? (
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
