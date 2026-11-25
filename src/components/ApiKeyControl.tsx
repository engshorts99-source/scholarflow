"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSavedOpenAlexApiKey,
  setSavedOpenAlexApiKey,
} from "@/lib/openalex";
import { KeyRound, Check, ExternalLink, AlertTriangle } from "lucide-react";

export function RateLimitHelpBanner({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeyInput(getSavedOpenAlexApiKey());
  }, []);

  const isRateLimit =
    error.includes("429") ||
    error.toLowerCase().includes("limit") ||
    error.toLowerCase().includes("quota");

  if (!isRateLimit) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
        {error}
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedOpenAlexApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-100 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-amber-200 text-sm">
            OpenAlex Free Anonymous IP Quota Reached
          </h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            OpenAlex limits anonymous shared IPs to $0.10/day (~100 search credits, resetting daily at 09:00 KST). You can unlock{" "}
            <strong className="text-white">10x more free daily quota ($1.00/day = 10,000 credits)</strong>{" "}
            immediately by pasting a free OpenAlex API key below (saved only in your browser).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2 pt-1">
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="Paste free OpenAlex API key..."
          className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-xs transition-colors shrink-0"
        >
          {saved ? "Saved!" : "Save Key & Retry"}
        </button>
        <a
          href="https://openalex.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          Get Free Key <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </form>
    </div>
  );
}

export default function ApiKeyControl() {
  const [open, setOpen] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getSavedOpenAlexApiKey();
    setKeyValue(existing);
    setHasKey(Boolean(existing));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedOpenAlexApiKey(keyValue);
    setHasKey(Boolean(keyValue.trim()));
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setOpen(false);
    }, 900);
  };

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
          hasKey
            ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
            : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"
        }`}
        title="Configure optional free OpenAlex API key for 10x daily quota"
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{hasKey ? "10x Key Active" : "API Key"}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0d1322] border border-white/15 rounded-xl shadow-2xl p-4 z-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              OpenAlex API Key (Optional)
            </span>
            <a
              href="https://openalex.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Get free key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Raises your free OpenAlex limit 10x (from $0.10/day shared IP to $1.00/day personal quota). Stored locally in your browser only.
          </p>
          <form onSubmit={handleSave} className="space-y-2">
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="Paste API key (leave blank to clear)..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              {hasKey && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyValue("");
                    setSavedOpenAlexApiKey("");
                    setHasKey(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold inline-flex items-center gap-1"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Saved
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
