"use client";
import { useEffect, useRef } from "react";

interface AdUnitProps {
  slotId?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function AdUnit({ width = 300, height = 250, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run in browser, and only once per mount
    if (!adRef.current || typeof window === 'undefined') return;
    
    // Clean up any existing content
    adRef.current.innerHTML = '';
    
    // Create the container div required by Adsterra
    const container = document.createElement('div');
    container.id = 'container-dfaab409fb3ed4145a693d4fe1d33eea';
    adRef.current.appendChild(container);
    
    // Create and inject the script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl29563429.effectivecpmnetwork.com/dfaab409fb3ed4145a693d4fe1d33eea/invoke.js";
    
    adRef.current.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }
    };
  }, []);

  if (process.env.NODE_ENV === "development") {
    return (
      <div 
        className={`flex items-center justify-center bg-white/[0.02] border border-white/10 text-gray-500 text-xs rounded-xl ${className}`}
        style={{ width: width === 0 ? '100%' : width, height }}
      >
        Adsterra Ad Placeholder (Hidden in Dev)
      </div>
    );
  }

  return (
    <div 
      ref={adRef} 
      className={`ad-container overflow-hidden rounded-xl bg-black/20 flex items-center justify-center ${className}`}
      style={{ minHeight: height }}
    />
  );
}
