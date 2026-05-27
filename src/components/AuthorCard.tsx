import Link from 'next/link';
import { AuthorProfile } from '@/lib/types';
import { Building, Quote, BookOpen } from 'lucide-react';

export default function AuthorCard({ author }: { author: AuthorProfile }) {
  return (
    <Link href={`/author/${author.id}`} className="block group">
      <div className="bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-xl p-5 md:p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-mint-500/0 group-hover:from-blue-500/5 group-hover:via-transparent group-hover:to-mint-500/5 transition-all duration-500 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors mb-2 font-space">
              {author.displayName}
            </h2>
            
            {author.lastKnownInstitution && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Building className="w-4 h-4" />
                <span>{author.lastKnownInstitution.displayName}</span>
                {author.lastKnownInstitution.countryCode && (
                  <span className="text-xs px-1.5 py-0.5 bg-white/5 rounded text-gray-500 uppercase">
                    {author.lastKnownInstitution.countryCode}
                  </span>
                )}
              </div>
            )}
            
            {author.concepts && author.concepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {author.concepts.slice(0, 4).map(c => (
                  <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                    {c.displayName}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-row md:flex-col gap-4 md:gap-3 shrink-0 md:text-right w-full md:w-auto p-4 md:p-0 bg-black/20 md:bg-transparent rounded-lg">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center md:justify-end gap-1.5 mb-1">
                <BookOpen className="w-3 h-3" /> Works
              </div>
              <div className="text-lg font-medium text-white">{author.worksCount.toLocaleString()}</div>
            </div>
            <div className="w-px md:h-px md:w-full bg-white/10"></div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center md:justify-end gap-1.5 mb-1">
                <Quote className="w-3 h-3" /> Citations
              </div>
              <div className="text-lg font-medium text-white flex items-center gap-2">
                {author.citedByCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
