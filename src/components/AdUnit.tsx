"use client";
import { useEffect, useRef, useId } from "react";

interface AdUnitProps {
  slotId?: string;
  width?: number;
  height?: number;
  className?: string;
}

// Track load attempts to stagger script loading
let adsterraLoadAttempts = 0;

export default function AdUnit({ width = 300, height = 250, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '_'); // React useId generates ids with colons

  useEffect(() => {
    if (!adRef.current || typeof window === 'undefined') return;
    
    const container = adRef.current;
    
    // Create a unique container div for this ad instance
    container.innerHTML = '';
    
    const adContainer = document.createElement('div');
    adContainer.id = `container-dfaab409fb3ed4145a693d4fe1d33eea`;
    container.appendChild(adContainer);
    
    // Slight delay to prevent multiple rapid loads hitting rate limits
    const delay = adsterraLoadAttempts * 200;
    adsterraLoadAttempts++;
    
    const timer = setTimeout(() => {
      // Create and inject the script for this instance
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = `https://pl29563429.effectivecpmnetwork.com/dfaab409fb3ed4145a693d4fe1d33eea/invoke.js`;
      
      // Only append if container is still in DOM
      if (container.isConnected) {
        container.appendChild(script);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [uniqueId]);

  if (process.env.NODE_ENV === "development") {
    return (
      <div 
        className={`flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 text-gray-600 text-xs rounded-xl ${className}`}
        style={{ width: width === 0 ? '100%' : width, height }}
      >
        Ad Slot
      </div>
    );
  }

  return (
    <div 
      ref={adRef} 
      className={`ad-container overflow-hidden rounded-xl ${className}`}
      style={{ minHeight: height }}
    />
  );
}
