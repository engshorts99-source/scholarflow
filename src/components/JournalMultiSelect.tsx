"use client";

import { useEffect, useRef, useState } from "react";
import { JournalProfile, SelectedJournalItem } from "@/lib/types";
import { searchJournals } from "@/lib/openalex";
import {
  JOURNAL_PRESETS,
  getJournalBadgeStyle,
} from "@/lib/journalPresets";
import { Search, X, Plus, Sparkles } from "lucide-react";

interface JournalMultiSelectProps {
  selected: SelectedJournalItem[];
  onChange: (next: SelectedJournalItem[]) => void;
  compact?: boolean;
}

export default function JournalMultiSelect({
  selected,
  onChange,
  compact = false,
}: JournalMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<JournalProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchJournals(query.trim(), 1);
        setSuggestions(res.results.slice(0, 8));
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedIds = new Set(selected.map((s) => s.id));

  const addJournal = (item: SelectedJournalItem) => {
    if (!selectedIds.has(item.id)) {
      onChange([...selected, item]);
    }
    setQuery("");
    setOpen(false);
  };

  const removeJournal = (id: string) => {
    onChange(selected.filter((j) => j.id !== id));
  };

  const applyPreset = (presetJournals: SelectedJournalItem[]) => {
    onChange(presetJournals);
  };

  const appendPreset = (presetJournals: SelectedJournalItem[]) => {
    const merged = [...selected];
    const existing = new Set(merged.map((m) => m.id));
    for (const pj of presetJournals) {
      if (!existing.has(pj.id)) {
        merged.push(pj);
        existing.add(pj.id);
      }
    }
    onChange(merged);
  };

  const isPresetActive = (presetJournals: SelectedJournalItem[]) => {
    if (selected.length !== presetJournals.length) return false;
    return presetJournals.every((pj) => selectedIds.has(pj.id));
  };

  return (
    <div className="space-y-3">
      {/* Quick Presets */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {compact ? "Quick Bundles" : "1-Click Journal Bundles (or combine freely below)"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(compact ? JOURNAL_PRESETS.slice(0, 4) : JOURNAL_PRESETS).map(
            (preset) => {
              const active = isPresetActive(preset.journals);
              return (
                <div key={preset.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => applyPreset(preset.journals)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? `bg-gradient-to-r ${preset.accent} shadow-sm`
                        : "bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.07] hover:text-white"
                    }`}
                    title={preset.description}
                  >
                    {preset.shortLabel}
                  </button>
                  {!compact && !active && selected.length > 0 && (
                    <button
                      type="button"
                      onClick={() => appendPreset(preset.journals)}
                      className="ml-0.5 px-1.5 py-1 rounded-md text-[10px] text-gray-500 hover:text-mint-300 hover:bg-white/5 transition-colors"
                      title={`Add ${preset.shortLabel} to current selection`}
                    >
                      +add
                    </button>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Selected Journal Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {selected.map((j) => (
            <span
              key={j.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getJournalBadgeStyle(
                j.id
              )}`}
            >
              <span className="truncate max-w-[180px]">{j.name}</span>
              <button
                type="button"
                onClick={() => removeJournal(j.id)}
                className="hover:text-white opacity-80 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${j.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selected.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([selected[0]])}
              className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-0.5"
            >
              Keep first only
            </button>
          )}
        </div>
      )}

      {/* Search & Add Any Journal Input */}
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Add any journal (e.g., Science Immunology, Nature Medicine, PNAS, JACS)..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 pl-9 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1.5 w-full bg-[#0d1322] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
            {suggestions.map((journal) => {
              const already = selectedIds.has(journal.id);
              return (
                <button
                  key={journal.id}
                  type="button"
                  onClick={() =>
                    addJournal({ id: journal.id, name: journal.displayName })
                  }
                  disabled={already}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] disabled:opacity-50 transition-colors border-b border-white/5 last:border-b-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {journal.displayName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      {journal.publisher && (
                        <span className="truncate max-w-[200px]">
                          {journal.publisher}
                        </span>
                      )}
                      <span>{journal.worksCount.toLocaleString()} works</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-mint-400 flex items-center gap-1">
                    {already ? "Added" : <><Plus className="w-3.5 h-3.5" /> Add</>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
