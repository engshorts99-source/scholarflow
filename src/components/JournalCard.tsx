import Link from 'next/link';
import { JournalProfile } from '@/lib/types';
import { Building, Quote, BookOpen, ExternalLink } from 'lucide-react';

export default function JournalCard({ journal }: { journal: JournalProfile }) {
  return (
    <Link href={`/journal/${journal.id}`} className="block group">
      <div className="bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-xl p-5 md:p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-transparent to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors mb-2 font-space truncate">
              {journal.displayName}
            </h2>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
              {journal.publisher && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[250px]">{journal.publisher}</span>
                </div>
              )}
              {journal.issnL && (
                <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-500">
                  ISSN: {journal.issnL}
                </span>
              )}
              {journal.type && (
                <span className="text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400 capitalize">
                  {journal.type}
                </span>
              )}
            </div>

            {journal.homepageUrl && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[250px]">{journal.homepageUrl.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-row md:flex-col gap-4 md:gap-3 shrink-0 md:text-right w-full md:w-auto p-4 md:p-0 bg-black/20 md:bg-transparent rounded-lg">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center md:justify-end gap-1.5 mb-1">
                <BookOpen className="w-3 h-3" /> Papers
              </div>
              <div className="text-lg font-medium text-white">{journal.worksCount.toLocaleString()}</div>
            </div>
            <div className="w-px md:h-px md:w-full bg-white/10"></div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center md:justify-end gap-1.5 mb-1">
                <Quote className="w-3 h-3" /> Citations
              </div>
              <div className="text-lg font-medium text-white">
                {journal.citedByCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
