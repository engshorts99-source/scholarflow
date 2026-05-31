"use client";

interface AdUnitProps {
  slotId?: string;
  width?: number;
  height?: number;
  className?: string;
}

// Placeholder component – Adsterra ads removed because they caused
// aggressive redirects on mobile / Edge / non-blocking browsers.
// Replace with Google AdSense once approved.
export default function AdUnit({ width = 300, height = 250, className = "" }: AdUnitProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl ${className}`}
      style={{
        width: width === 0 ? '100%' : width,
        minHeight: height,
      }}
      aria-hidden="true"
    />
  );
}
