"use client";
import { useEffect, useState } from 'react';
import { getPaperById, getWorksByIds, searchPapers } from '@/lib/openalex';
import { getPaperTldr } from '@/lib/semanticScholar';
import AdUnit from '@/components/AdUnit';
import PaperCard from '@/components/PaperCard';
import { MiniSparkline } from '@/components/ConceptTimelineChart';
import {
  Quote,
  ExternalLink,
  FileText,
  Calendar,
  Building,
  ArrowUpRight,
  Loader2,
  Compass,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import { Paper } from '@/lib/types';

export default function PaperPage({ params }: { params: { id: string } }) {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [tldr, setTldr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intellectual Genealogy: Foundations (referenced works)
  const [foundations, setFoundations] = useState<Paper[]>([]);
  const [foundationsLoading, setFoundationsLoading] = useState(false);

  // Citation tracking state
  const [citingPapers, setCitingPapers] = useState<Paper[]>([]);
  const [citingCount, setCitingCount] = useState(0);
  const [citingSort, setCitingSort] = useState<'citations' | 'date'>('citations');
  const [citingLoading, setCitingLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const paperData = await getPaperById(params.id);
        if (!isMounted) return;

        setPaper(paperData);
        setLoading(false);

        if (paperData?.doi) {
          getPaperTldr(paperData.doi)
            .then((tldrData) => {
              if (isMounted) setTldr(tldrData);
            })
            .catch(() => {});
        }

        // Fetch foundational referenced works
        if (paperData?.referencedWorks && paperData.referencedWorks.length > 0) {
          setFoundationsLoading(true);
          getWorksByIds(paperData.referencedWorks.slice(0, 25), 6)
            .then((refs) => {
              if (isMounted) setFoundations(refs);
            })
            .catch(() => {})
            .finally(() => {
              if (isMounted) setFoundationsLoading(false);
            });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load paper');
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  // Fetch citing papers whenever paper or sort changes
  useEffect(() => {
    if (!paper || paper.citedByCount <= 0) return;

    let isMounted = true;
    setCitingLoading(true);
    searchPapers({
      citesId: paper.id,
      sort: citingSort,
      page: 1,
    })
      .then((citingResult) => {
        if (isMounted) {
          setCitingPapers(citingResult.results.slice(0, 10));
          setCitingCount(citingResult.totalCount);
        }
      })
      .catch((citErr) => {
        console.error("Failed to fetch citing papers:", citErr);
      })
      .finally(() => {
        if (isMounted) setCitingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paper, citingSort]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Paper Not Found</h1>
        <p className="text-gray-400 mb-8">{error || "We couldn't find the paper you're looking for."}</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  const citationSparkPoints = (paper.countsByYear || []).map((c) => ({
    label: String(c.year),
    value: c.citedByCount,
  }));

  const conceptLinks: { id: string; name: string }[] = [];
  const seenNames = new Set<string>();
  if (paper.primaryTopic?.displayName) {
    seenNames.add(paper.primaryTopic.displayName.toLowerCase());
    conceptLinks.push({
      id: paper.primaryTopic.id || 'primary-topic',
      name: paper.primaryTopic.displayName,
    });
  }
  for (const c of paper.concepts || []) {
    if (!c.displayName || seenNames.has(c.displayName.toLowerCase())) continue;
    seenNames.add(c.displayName.toLowerCase());
    conceptLinks.push({ id: c.id || c.displayName, name: c.displayName });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            {paper.primaryTopic?.displayName && (
              <Link
                href={`/concept?q=${encodeURIComponent(paper.primaryTopic.displayName)}`}
                className="inline-flex items-center gap-1.5 text-xs text-mint-400 hover:text-mint-300 mb-3 font-medium"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {[paper.primaryTopic.field, paper.primaryTopic.displayName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 font-space">
              {paper.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {paper.publicationDate || paper.publicationYear}
              </span>
              {paper.journal && (
                <Link
                  href={`/journal/${paper.journal.id}`}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <Building className="w-4 h-4" /> {paper.journal.displayName}
                </Link>
              )}
              {paper.type && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs capitalize text-gray-300">
                  {paper.type.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Authors with Role Badges */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Authors &amp; Roles
            </h3>
            <div className="flex flex-wrap gap-3">
              {paper.authors.map((author, i) => (
                <div
                  key={author.id || i}
                  className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-1 max-w-[260px]"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {author.id ? (
                      <Link
                        href={`/author/${author.id}`}
                        className="text-blue-400 font-medium hover:text-blue-300 transition-colors flex items-center gap-0.5 group text-sm"
                      >
                        <span>{author.name}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="text-blue-400 font-medium text-sm">{author.name}</span>
                    )}
                  </div>

                  {(author.position === 'first' ||
                    author.position === 'last' ||
                    author.isCorresponding) && (
                    <div className="flex flex-wrap gap-1">
                      {author.position === 'first' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          First Author
                        </span>
                      )}
                      {author.position === 'last' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                          Senior / Last
                        </span>
                      )}
                      {author.isCorresponding && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                          Corresponding
                        </span>
                      )}
                    </div>
                  )}

                  {author.institution && (
                    <span className="text-[11px] text-gray-500 truncate">
                      {author.institution}
                      {author.countryCode ? ` (${author.countryCode})` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            {paper.isOpenAccess && paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-mint-500 hover:bg-mint-400 text-gray-900 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-mint-500/20"
              >
                <FileText className="w-5 h-5" /> Read PDF
              </a>
            )}
            {paper.doi && (
              <a
                href={paper.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-5 h-5" /> Publisher Source
              </a>
            )}
          </div>

          {/* TLDR */}
          {tldr && (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 shadow-inner">
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-3">
                <span className="uppercase tracking-widest text-xs">AI Summary</span>
              </div>
              <p className="text-blue-50 text-lg leading-relaxed">{tldr}</p>
            </div>
          )}

          {/* Abstract */}
          {paper.abstract && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white font-space">Abstract</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-justify">
                {paper.abstract}
              </p>
            </div>
          )}

          {/* Intellectual Genealogy: Foundations (Built Upon) */}
          {(foundationsLoading || foundations.length > 0) && (
            <div className="space-y-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                  Key Foundations Cited by This Work
                </h3>
                {paper.referencedWorksCount ? (
                  <span className="text-xs text-gray-500">
                    Top from {paper.referencedWorksCount.toLocaleString()} references
                  </span>
                ) : null}
              </div>

              {foundationsLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {foundations.map((refPaper) => (
                    <PaperCard key={refPaper.id} paper={refPaper} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="my-10 border-t border-white/10 pt-8">
            <AdUnit slotId="paper-inline" width={0} height={90} className="w-full" />
          </div>

          {/* Citation Tracking Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
                <Quote className="w-5 h-5 text-yellow-500" />
                Papers Citing This Work
                {citingCount > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({citingCount.toLocaleString()} total)
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCitingSort('citations')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    citingSort === 'citations'
                      ? 'bg-blue-600/25 border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Most Cited
                </button>
                <button
                  onClick={() => setCitingSort('date')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    citingSort === 'date'
                      ? 'bg-blue-600/25 border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Most Recent
                </button>
                {citingCount > 10 && (
                  <Link
                    href={`/search?citesId=${paper.id}&sort=${citingSort}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors ml-2"
                  >
                    View all →
                  </Link>
                )}
              </div>
            </div>

            {citingLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              </div>
            ) : citingPapers.length > 0 ? (
              <div className="space-y-4">
                {citingPapers.map((citingPaper) => (
                  <PaperCard key={citingPaper.id} paper={citingPaper} />
                ))}
              </div>
            ) : paper.citedByCount > 0 ? (
              <p className="text-gray-500 text-sm py-6">
                Unable to load citing papers at this time.
              </p>
            ) : (
              <p className="text-gray-500 text-sm py-6">
                No papers have cited this work yet.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center shadow-lg space-y-4">
            <div>
              <div className="text-gray-400 mb-2 uppercase tracking-widest text-xs font-semibold">
                Citations
              </div>
              <div className="text-5xl font-bold text-white flex items-center justify-center gap-3">
                <Quote className="w-8 h-8 text-yellow-500 opacity-50" />
                {paper.citedByCount?.toLocaleString() || 0}
              </div>
            </div>

            {citationSparkPoints.length > 1 && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                  <span>Citations by Year</span>
                  <span>
                    {citationSparkPoints[0].label}–
                    {citationSparkPoints[citationSparkPoints.length - 1].label}
                  </span>
                </div>
                <MiniSparkline
                  points={citationSparkPoints}
                  height={42}
                  strokeColor="#f59e0b"
                  fillColor="rgba(245, 158, 11, 0.16)"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {conceptLinks.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-widest">
                Concepts &amp; Atlas
              </h3>
              <p className="text-[11px] text-gray-500 mb-3">
                Click any concept to trace its origin &amp; research state.
              </p>
              <div className="flex flex-wrap gap-2">
                {conceptLinks.map((c) => (
                  <Link
                    key={c.id}
                    href={`/concept?q=${encodeURIComponent(c.name)}`}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-colors"
                  >
                    <Compass className="w-3 h-3 text-mint-400 shrink-0" />
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="sticky top-24 pt-4">
            <AdUnit slotId="paper-sidebar" width={300} height={600} className="w-full h-[600px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
