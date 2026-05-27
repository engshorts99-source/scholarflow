import Link from 'next/link';
import { FileText, ExternalLink, Quote } from 'lucide-react';
import { Paper } from '@/lib/types';
import { format } from 'date-fns';

export default function PaperCard({ paper }: { paper: Paper }) {
  // Format authors
  const authorText = paper.authors.slice(0, 3).map(a => a.name).join(", ") + 
                     (paper.authors.length > 3 ? " et al." : "");
                     
  // Citation badge color
  let badgeColor = "bg-gray-800 text-gray-300 border-gray-700";
  if (paper.citedByCount >= 1000) badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
  else if (paper.citedByCount >= 100) badgeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  else if (paper.citedByCount >= 10) badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";

  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Link href={`/paper/${paper.id}`} className="block">
            <h3 className="text-lg font-medium leading-snug text-blue-400 group-hover:text-blue-300 transition-colors">
              {paper.title}
            </h3>
          </Link>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
            <span>{authorText}</span>
            {paper.journal && (
              <>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span className="italic truncate max-w-[200px] sm:max-w-xs">{paper.journal.displayName}</span>
              </>
            )}
            <span className="h-1 w-1 rounded-full bg-gray-600" />
            <span>{paper.publicationDate ? format(new Date(paper.publicationDate), 'MMM yyyy') : paper.publicationYear}</span>
          </div>

          {paper.tldr && (
            <div className="mt-2 rounded-lg bg-blue-900/10 px-4 py-3 border border-blue-500/10">
              <p className="text-sm text-blue-100/80 leading-relaxed">
                <span className="font-semibold text-blue-400 mr-2 tracking-wide text-xs uppercase">TLDR</span>
                {paper.tldr}
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeColor}`}>
              <Quote className="h-3 w-3" />
              {paper.citedByCount.toLocaleString()} Citations
            </div>
            
            {paper.isOpenAccess && paper.pdfUrl && (
              <a 
                href={paper.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-mint-500/10 border border-mint-500/20 px-2.5 py-1 text-xs font-medium text-mint-400 transition-colors hover:bg-mint-500/20"
              >
                <FileText className="h-3 w-3" />
                PDF
              </a>
            )}
            
            {paper.doi && (
              <a 
                href={paper.doi} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                DOI <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
