"use client";
import { useEffect, useRef } from "react";

interface AdUnitProps {
  slotId?: string;
  width?: number;
  height?: number;
  className?: string;
}

// 5 Adsterra Ad Zones
const AD_ZONES = {
  // Zone 29462930 - Native Banner
  native: {
    type: 'native' as const,
    containerId: 'container-dfaab409fb3ed4145a693d4fe1d33eea',
    scriptSrc: 'https://pl29563429.effectivecpmnetwork.com/dfaab409fb3ed4145a693d4fe1d33eea/invoke.js',
  },
  // Zone 29463724 - Banner 728x90
  'banner-728x90': {
    type: 'iframe' as const,
    key: '823ee3457314273b146915b0ccbd007c',
    width: 728,
    height: 90,
  },
  // Zone 29463725 - Banner 300x250
  'banner-300x250': {
    type: 'iframe' as const,
    key: 'db8e4a8d12bb6b67d3bebc5bf330764a',
    width: 300,
    height: 250,
  },
  // Zone 29463726 - Banner 468x60
  'banner-468x60': {
    type: 'iframe' as const,
    key: 'f4a874b895b24598216826e9dc2ef300',
    width: 468,
    height: 60,
  },
  // Zone 29463727 - Banner 160x300
  'banner-160x300': {
    type: 'iframe' as const,
    key: 'be7cb204d6caeb602d785d4ae9dc5ae6',
    width: 160,
    height: 300,
  },
};

type ZoneKey = keyof typeof AD_ZONES;

// Auto-select the best ad zone based on requested dimensions
function selectZone(width: number, height: number): ZoneKey {
  // Full-width responsive slots (width=0)
  if (width === 0 || width >= 700) {
    return 'banner-728x90';
  }
  // Sidebar medium rectangle
  if (width >= 250 && height <= 300 && height >= 150) {
    return 'banner-300x250';
  }
  // Sidebar tall / skyscraper
  if (width >= 100 && height > 300) {
    return 'banner-160x300';
  }
  // Small inline banner
  if (width >= 300 && height <= 100) {
    return 'banner-468x60';
  }
  // Default: medium rectangle
  return 'banner-300x250';
}

export default function AdUnit({ width = 300, height = 250, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const zoneKey = selectZone(width, height);
  const zone = AD_ZONES[zoneKey];

  useEffect(() => {
    if (!adRef.current || typeof window === 'undefined') return;
    
    const container = adRef.current;
    container.innerHTML = '';

    if (zone.type === 'native') {
      // Native Banner: create container div + invoke.js
      const adContainer = document.createElement('div');
      adContainer.id = zone.containerId;
      container.appendChild(adContainer);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = zone.scriptSrc;
      container.appendChild(script);
    } else {
      // Iframe Banner: set atOptions then load invoke.js
      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.textContent = `atOptions = { 'key': '${zone.key}', 'format': 'iframe', 'height': ${zone.height}, 'width': ${zone.width}, 'params': {} };`;
      container.appendChild(optionsScript);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `https://www.highperformanceformat.com/${zone.key}/invoke.js`;
      container.appendChild(invokeScript);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [zone, zoneKey]);

  if (process.env.NODE_ENV === 'development') {
    const z = zone.type === 'iframe' ? zone : { width: 300, height: 250 };
    return (
      <div 
        className={`flex items-center justify-center bg-white/[0.02] border border-dashed border-white/10 text-gray-600 text-xs rounded-xl ${className}`}
        style={{ width: width === 0 ? '100%' : width, height }}
      >
        Ad {zoneKey} ({(z as any).width}×{(z as any).height})
      </div>
    );
  }

  return (
    <div 
      ref={adRef} 
      className={`ad-container overflow-hidden flex items-center justify-center ${className}`}
      style={{ 
        minHeight: zone.type === 'iframe' ? zone.height : height,
        width: width === 0 ? '100%' : undefined,
      }}
    />
  );
}
