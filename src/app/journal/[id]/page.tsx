"use client";
import { useEffect, useState } from 'react';
import { getJournalById, searchPapers } from '@/lib/openalex';
import { ArticleCategory, JournalProfile, Paper } from '@/lib/types';
import AdUnit from '@/components/AdUnit';
import PaperCard from '@/components/PaperCard';
import {
  Building,
  Quote,
  BookOpen,
  ExternalLink,
  Activity,
  Award,
} from 'lucide-react';
import Link from 'next/link';

export default function JournalPage({ params }: { params: { id: string } }) {
  const [journal, setJournal] = useState<JournalProfile | null>(null);
  const [articleType, setArticleType] = useState<ArticleCategory>('research');
  const [latestPapers, setLatestPapers] = useState<Paper[]>([]);
  const [topPapers, setTopPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchJournal = async () => {
      setLoading(true);
      try {
        const journalData = await getJournalById(params.id);
        if (!isMounted) return;

        if (!journalData) {
          setError("Journal not found");
          setLoading(false);
          return;
        }
        setJournal(journalData);
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load journal data'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJournal();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (!journal) return;
    let isMounted = true;
    setPapersLoading(true);

    Promise.all([
      searchPapers({
        journalId: journal.id,
        articleType,
        sort: 'date',
        page: 1,
      }),
      searchPapers({
        journalId: journal.id,
        articleType,
        sort: 'citations',
        page: 1,
      }),
    ])
      .then(([latest, top]) => {
        if (isMounted) {
          setLatestPapers(latest.results || []);
          setTopPapers(top.results || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setPapersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [journal, articleType]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        <h1 className="text-2xl font-bold text-white mb-2">Journal Not Found</h1>
        <p>{error || "The journal you're looking for doesn't exist or has been removed."}</p>
        <Link href="/search" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-space">
              {journal.displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              {journal.publisher && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">{journal.publisher}</span>
                </div>
              )}
              {journal.issnL && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-xs">
                  ISSN: {journal.issnL}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/venues?journals=${journal.id}&jnames=${encodeURIComponent(
                  journal.displayName
                )}&articleType=${articleType}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-sm font-semibold transition-colors"
              >
                <Award className="w-4 h-4" />
                Analyze Streak Labs &amp; Topics in Radar →
              </Link>
              {journal.homepageUrl && (
                <a
                  href={journal.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Journal Website
                </a>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto bg-black/40 border border-white/5 rounded-xl p-6 flex flex-row md:flex-col justify-around gap-6 shrink-0">
            <div>
              <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-blue-400" /> Total Works
              </div>
              <div className="text-3xl font-semibold text-white font-space">
                {journal.worksCount?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                <Quote className="w-4 h-4 text-mint-400" /> Citations
              </div>
              <div className="text-3xl font-semibold text-white font-space">
                {journal.citedByCount?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Classification Switcher */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-xl p-4">
        <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
          Filter Venue Works by Article Type:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'research' as ArticleCategory, label: 'Research Articles (incl. Letters)' },
            { value: 'review' as ArticleCategory, label: 'Review Articles Only' },
            { value: 'both' as ArticleCategory, label: 'Both (Research + Review)' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setArticleType(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                articleType === opt.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {papersLoading ? (
            <div className="py-16 flex justify-center">
              <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Quote className="w-5 h-5 text-mint-400" /> Most Cited in Journal
                  </h2>
                  <Link
                    href={`/search?type=papers&journalId=${journal.id}&articleType=${articleType}&sort=citations`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-4">
                  {topPapers.slice(0, 5).map((paper, index) => (
                    <div key={paper.id}>
                      <PaperCard paper={paper} />
                      {index === 1 && (
                        <div className="my-6">
                          <AdUnit
                            slotId="journal-top-papers-inline"
                            width={0}
                            height={90}
                            className="w-full h-[90px]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" /> Latest Publications
                  </h2>
                  <Link
                    href={`/search?type=papers&journalId=${journal.id}&articleType=${articleType}&sort=date`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-4">
                  {latestPapers.slice(0, 5).map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="space-y-8">
          <AdUnit slotId="journal-sidebar-1" width={300} height={250} />

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Compare with Sister Journals
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Open this journal in the <strong className="text-white">Lab &amp; Journal Radar</strong> to combine it with sister venues (e.g. Nature + Science + Cell, or Nature Immunology + Science Immunology + Immunity) and spot multi-journal lab streaks.
            </p>
          </div>

          <AdUnit slotId="journal-sidebar-2" width={300} height={600} />
        </div>
      </div>
    </div>
  );
}
