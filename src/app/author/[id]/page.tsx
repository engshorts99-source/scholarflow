"use client";
import { useEffect, useMemo, useState } from 'react';
import {
  getAuthorById,
  getAuthorWorksForNetwork,
  searchPapers,
} from '@/lib/openalex';
import { buildAuthorRelationshipNetwork } from '@/lib/relationshipEngine';
import {
  AuthorProfile,
  AuthorRelationshipNetwork,
  Paper,
} from '@/lib/types';
import AdUnit from '@/components/AdUnit';
import PaperCard from '@/components/PaperCard';
import AuthorNetworkGraph from '@/components/AuthorNetworkGraph';
import {
  Building,
  Quote,
  BookOpen,
  Users,
  Compass,
  Award,
  GitBranch,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function AuthorPage({ params }: { params: { id: string } }) {
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [latestPapers, setLatestPapers] = useState<Paper[]>([]);
  const [topPapers, setTopPapers] = useState<Paper[]>([]);
  const [network, setNetwork] = useState<AuthorRelationshipNetwork | null>(null);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredYear, setHoveredYear] = useState<{
    year: number;
    worksCount: number;
    citedByCount: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setNetworkLoading(true);
      setError(null);
      try {
        const authorData = await getAuthorById(params.id);
        if (!isMounted) return;

        if (!authorData) {
          setError("Author not found");
          setLoading(false);
          setNetworkLoading(false);
          return;
        }

        setAuthor(authorData);

        const [latest, top, networkWorks] = await Promise.all([
          searchPapers({ authorId: authorData.id, sort: 'date', page: 1 }),
          searchPapers({ authorId: authorData.id, sort: 'citations', page: 1 }),
          getAuthorWorksForNetwork(authorData.id).catch(() => []),
        ]);

        if (!isMounted) return;

        setLatestPapers(latest.results || []);
        setTopPapers(top.results || []);
        setLoading(false);

        const combinedSeedWorks =
          networkWorks.length > 0
            ? networkWorks
            : [...(top.results || []), ...(latest.results || [])];

        buildAuthorRelationshipNetwork(
          authorData.id,
          authorData.displayName,
          combinedSeedWorks
        )
          .then((net) => {
            if (isMounted) setNetwork(net);
          })
          .catch(() => {
            // Silently ignore secondary lineage errors
          })
          .finally(() => {
            if (isMounted) setNetworkLoading(false);
          });
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load author data');
          setLoading(false);
          setNetworkLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const sortedCareerYears = useMemo(() => {
    if (!author?.countsByYear) return [];
    return author.countsByYear
      .slice()
      .filter((y) => y.year > 1900)
      .sort((a, b) => a.year - b.year)
      .slice(-15);
  }, [author]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        <h1 className="text-2xl font-bold text-white mb-2">Author Not Found</h1>
        <p>{error || "The author you're looking for doesn't exist or has been removed."}</p>
        <Link href="/search" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
          Return to Search
        </Link>
      </div>
    );
  }

  const institutions =
    author.lastKnownInstitutions && author.lastKnownInstitutions.length > 0
      ? author.lastKnownInstitutions
      : author.lastKnownInstitution
      ? [author.lastKnownInstitution]
      : [];

  const clickableTopics =
    author.topics && author.topics.length > 0
      ? author.topics.slice(0, 8).map((t) => ({ id: t.id, name: t.displayName }))
      : (author.concepts || []).slice(0, 8).map((c) => ({ id: c.id, name: c.displayName }));

  const maxCareerWorks = Math.max(
    ...sortedCareerYears.map((y) => y.worksCount),
    1
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* Top Banner & Profile Info */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-mint-500/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white font-space">
                {author.displayName}
              </h1>
              {author.orcid && (
                <a
                  href={author.orcid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  ORCID <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Last Known Institutions */}
            {institutions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-300 mb-5">
                {institutions.slice(0, 3).map((inst) => (
                  <div
                    key={inst.id || inst.displayName}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10"
                  >
                    <Building className="w-3.5 h-3.5 text-mint-400 shrink-0" />
                    <span>{inst.displayName}</span>
                    {inst.countryCode && (
                      <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase text-gray-400">
                        {inst.countryCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Clickable Research Topics -> Concept Atlas */}
            {clickableTopics.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2.5">
                  Research Topics (click to open Concept Atlas)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clickableTopics.map((topic) => (
                    <Link
                      key={topic.id || topic.name}
                      href={`/concept?q=${encodeURIComponent(topic.name)}`}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border border-blue-500/20 transition-colors"
                    >
                      <Compass className="w-3 h-3 text-blue-400" />
                      <span>{topic.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Institutional Career History */}
            {author.affiliations && author.affiliations.length > 1 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Institutional Timeline
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {author.affiliations.slice(0, 5).map((aff) => {
                    const maxY = aff.years[0];
                    const minY = aff.years[aff.years.length - 1];
                    const spanLabel =
                      minY && maxY
                        ? minY === maxY
                          ? `${maxY}`
                          : `${minY}–${maxY}`
                        : "";
                    return (
                      <span
                        key={aff.institution.id || aff.institution.displayName}
                        className="text-[11px] px-2.5 py-1 rounded bg-white/[0.03] border border-white/10 text-gray-400"
                      >
                        <span className="text-gray-200">{aff.institution.displayName}</span>
                        {spanLabel && <span className="text-gray-500 ml-1.5">({spanLabel})</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {author.alternatives && author.alternatives.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold">Also published as:</span>{" "}
                {author.alternatives.slice(0, 3).join(', ')}
              </div>
            )}
          </div>

          {/* Stats Box */}
          <div className="w-full lg:w-72 bg-black/40 border border-white/10 rounded-xl p-5 grid grid-cols-2 gap-4 shrink-0">
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Works
              </div>
              <div className="text-2xl font-semibold text-white font-space">
                {author.worksCount?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Quote className="w-3.5 h-3.5 text-mint-400" /> Citations
              </div>
              <div className="text-2xl font-semibold text-white font-space">
                {author.citedByCount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> h-index
              </div>
              <div className="text-xl font-semibold text-white font-space">
                {author.hIndex ?? "—"}
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="text-xs text-gray-400 mb-1">i10 / 2yr Imp.</div>
              <div className="text-xl font-semibold text-white font-space">
                {author.i10Index ?? "—"}
                {typeof author.twoYearMeanCitedness === "number" && (
                  <span className="text-xs text-gray-400 font-normal ml-1.5">
                    ({author.twoYearMeanCitedness.toFixed(1)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Collaboration & Lab Network (People Hero) */}
      <section>
        {networkLoading ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 flex items-center justify-center gap-3 text-sm text-gray-400">
            <div className="w-5 h-5 border-2 border-mint-400 border-t-transparent rounded-full animate-spin"></div>
            Building collaboration ego-network and intellectual lineage...
          </div>
        ) : network ? (
          <AuthorNetworkGraph network={network} />
        ) : null}
      </section>

      {/* Intellectual Lineage: Influenced By <-> Influences */}
      {network &&
        (network.influencedBy.length > 0 || network.influences.length > 0) && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Influenced By */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-space flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                  Builds Upon (Influenced By)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Researchers most frequently cited across {author.displayName}&apos;s foundational works.
                </p>
              </div>
              {network.influencedBy.length > 0 ? (
                <div className="space-y-2.5">
                  {network.influencedBy.map((person) => (
                    <div
                      key={person.id}
                      className="p-3 rounded-xl bg-black/25 border border-white/5 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/author/${person.id}`}
                          className="text-sm font-medium text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
                        >
                          {person.name}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                          {person.count} ref links
                        </span>
                      </div>
                      {person.institution && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {person.institution}
                        </div>
                      )}
                      {person.samplePapers[0] && (
                        <Link
                          href={`/paper/${person.samplePapers[0].id}`}
                          className="text-xs text-gray-400 hover:text-blue-300 line-clamp-1 mt-1.5 block"
                        >
                          ↳ {person.samplePapers[0].title} ({person.samplePapers[0].year})
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No outgoing reference lineage data available.</p>
              )}
            </div>

            {/* Influences / Extended By */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-space flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Extended By (Top Citing Researchers)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  High-impact researchers building directly on {author.displayName}&apos;s landmark work.
                </p>
              </div>
              {network.influences.length > 0 ? (
                <div className="space-y-2.5">
                  {network.influences.map((person) => (
                    <div
                      key={person.id}
                      className="p-3 rounded-xl bg-black/25 border border-white/5 hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/author/${person.id}`}
                          className="text-sm font-medium text-blue-300 hover:text-blue-200 flex items-center gap-1"
                        >
                          {person.name}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                          {person.count} citing papers
                        </span>
                      </div>
                      {person.institution && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {person.institution}
                        </div>
                      )}
                      {person.samplePapers[0] && (
                        <Link
                          href={`/paper/${person.samplePapers[0].id}`}
                          className="text-xs text-gray-400 hover:text-blue-300 line-clamp-1 mt-1.5 block"
                        >
                          ↳ {person.samplePapers[0].title} ({person.samplePapers[0].year})
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No incoming citing lineage data available.</p>
              )}
            </div>
          </section>
        )}

      {/* Career Output & Papers Split */}
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
              {topPapers.slice(0, 5).map((paper, index) => (
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
              {latestPapers.slice(0, 5).map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Career Activity Chart & Ads */}
        <div className="space-y-8">
          {sortedCareerYears.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Career Output
                </h3>
                {hoveredYear && (
                  <span className="text-xs text-blue-300 font-medium">
                    {hoveredYear.year}: {hoveredYear.worksCount}w · {hoveredYear.citedByCount.toLocaleString()}c
                  </span>
                )}
              </div>

              <svg viewBox="0 0 280 110" className="w-full h-auto select-none">
                {sortedCareerYears.map((yr, idx) => {
                  const barW = Math.max(8, 250 / sortedCareerYears.length - 4);
                  const x = 14 + idx * (252 / sortedCareerYears.length);
                  const barH = Math.max(3, (yr.worksCount / maxCareerWorks) * 74);
                  const y = 84 - barH;
                  const isHovered = hoveredYear?.year === yr.year;
                  return (
                    <g
                      key={yr.year}
                      onMouseEnter={() => setHoveredYear(yr)}
                      onMouseLeave={() => setHoveredYear(null)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={2}
                        fill={isHovered ? "#34d399" : "rgba(59, 130, 246, 0.55)"}
                      />
                      {(idx === 0 ||
                        idx === sortedCareerYears.length - 1 ||
                        idx % Math.max(1, Math.floor(sortedCareerYears.length / 4)) === 0) && (
                        <text
                          x={x + barW / 2}
                          y={102}
                          textAnchor="middle"
                          fontSize={8.5}
                          fill="#64748b"
                        >
                          {String(yr.year).slice(-2)}
                        </text>
                      )}
                      <title>{`${yr.year}: ${yr.worksCount} works, ${yr.citedByCount.toLocaleString()} citations`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          <AdUnit slotId="author-sidebar-1" width={300} height={250} />
          <AdUnit slotId="author-sidebar-2" width={300} height={600} />
        </div>
      </div>
    </div>
  );
}
