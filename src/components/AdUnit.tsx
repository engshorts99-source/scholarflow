"use client";
import { useRef } from "react";

interface AdUnitProps {
  slotId?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function AdUnit({ width = 300, height = 250, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);

  if (process.env.NODE_ENV === "development") {
    return (
      <div 
        className={`flex items-center justify-center bg-white/[0.02] border border-white/10 text-gray-500 text-xs rounded-xl ${className}`}
        style={{ width: width === 0 ? '100%' : width, height }}
      >
        Advertisement Placeholder
      </div>
    );
  }

  return (
    <div ref={adRef} className={`ad-container overflow-hidden rounded-xl bg-black/20 ${className}`}>
      {/* Real ad code will go here for production */}
    </div>
  );
}
