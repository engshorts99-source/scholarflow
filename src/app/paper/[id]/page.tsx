"use client";
import { useEffect, useState } from 'react';
import { getPaperById } from '@/lib/openalex';
import { getPaperTldr } from '@/lib/semanticScholar';
import AdUnit from '@/components/AdUnit';
import { Quote, ExternalLink, FileText, Calendar, Building } from 'lucide-react';
import Link from 'next/link';

export default function PaperPage({ params }: { params: { id: string } }) {
  const [paper, setPaper] = useState<any>(null);
  const [tldr, setTldr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const paperData = await getPaperById(params.id);
        if (!isMounted) return;
        
        setPaper(paperData);
        
        if (paperData && paperData.doi) {
          const tldrData = await getPaperTldr(paperData.doi);
          if (isMounted) setTldr(tldrData);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load paper');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [params.id]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 font-space">{paper.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {paper.publicationDate || paper.publicationYear}</span>
              {paper.journal && (
                <Link href={`/journal/${paper.journal.id}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Building className="w-4 h-4" /> {paper.journal.displayName}
                </Link>
              )}
            </div>
          </div>

          {/* Authors */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Authors</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-gray-300">
              {paper.authors.map((author: any, i: number) => (
                <div key={author.id || i} className="flex flex-col">
                  <span className="text-blue-400 font-medium">{author.name}</span>
                  {author.institution && <span className="text-xs text-gray-500 max-w-[200px] truncate">{author.institution}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {paper.isOpenAccess && paper.pdfUrl && (
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-mint-500 hover:bg-mint-400 text-gray-900 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-mint-500/20">
                <FileText className="w-5 h-5" /> Read PDF
              </a>
            )}
            {paper.doi && (
              <a href={paper.doi} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
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
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-justify">{paper.abstract}</p>
            </div>
          )}
          
          <div className="my-10 border-t border-white/10 pt-8">
            <AdUnit slotId="paper-inline" width={0} height={90} className="w-full" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center shadow-lg">
            <div className="text-gray-400 mb-2 uppercase tracking-widest text-xs font-semibold">Citations</div>
            <div className="text-5xl font-bold text-white flex items-center justify-center gap-3">
              <Quote className="w-8 h-8 text-yellow-500 opacity-50" />
              {paper.citedByCount?.toLocaleString() || 0}
            </div>
          </div>

          {paper.concepts && paper.concepts.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-widest">Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {paper.concepts.map((c: any) => (
                  <Link key={c.id} href={`/search?q=${encodeURIComponent(c.displayName)}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 transition-colors">
                    {c.displayName}
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
