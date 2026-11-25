"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AuthorRelationshipNetwork,
  CollaboratorProfile,
  Paper,
} from "@/lib/types";
import { getCoauthoredPapers } from "@/lib/openalex";
import { computeDeterministicGraphLayout } from "@/lib/relationshipEngine";
import {
  Users,
  Building,
  ArrowUpRight,
  Loader2,
  BookOpen,
  Search,
} from "lucide-react";

interface AuthorNetworkGraphProps {
  network: AuthorRelationshipNetwork;
}

const PHASE_META: Record<
  CollaboratorProfile["phase"],
  { label: string; fill: string; badge: string }
> = {
  ongoing: {
    label: "Ongoing Collaborator",
    fill: "#10b981",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  longterm: {
    label: "Long-Term Partner",
    fill: "#3b82f6",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  early: {
    label: "Earlier Collaborator",
    fill: "#a855f7",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
};

function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

export default function AuthorNetworkGraph({
  network,
}: AuthorNetworkGraphProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    network.collaborators[0]?.id || null
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [coauthoredCache, setCoauthoredCache] = useState<
    Record<string, { papers: Paper[]; totalCount: number }>
  >({});
  const [loadingPapers, setLoadingPapers] = useState(false);

  const width = 740;
  const height = 460;

  const selectedCollab = useMemo(
    () =>
      network.collaborators.find((c) => c.id === selectedId) ||
      network.collaborators[0] ||
      null,
    [network.collaborators, selectedId]
  );

  const handleLoadFullCoauthored = async (collabId: string) => {
    if (coauthoredCache[collabId]) return;
    setLoadingPapers(true);
    try {
      const res = await getCoauthoredPapers(network.centerId, collabId, 15);
      setCoauthoredCache((prev) => ({
        ...prev,
        [collabId]: { papers: res.results, totalCount: res.totalCount },
      }));
    } catch {
      // Fallback to sampled papers seamlessly
    } finally {
      setLoadingPapers(false);
    }
  };

  const positions = useMemo(() => {
    const layoutNodes = [
      { id: network.centerId, role: "center" as const, weight: 999 },
      ...network.collaborators.map((c) => ({
        id: c.id,
        weight: c.sharedCount,
      })),
    ];
    return computeDeterministicGraphLayout(
      layoutNodes,
      network.peerEdges,
      width,
      height,
      "ego"
    );
  }, [network]);

  const maxShared = useMemo(
    () => Math.max(...network.collaborators.map((c) => c.sharedCount), 1),
    [network.collaborators]
  );

  if (network.collaborators.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center text-sm text-gray-500">
        No multi-author collaborations found in this author&apos;s sampled works.
      </div>
    );
  }

  const centerPos = positions[network.centerId] || {
    x: width / 2,
    y: height / 2,
  };

  const fullCollabData = selectedCollab
    ? coauthoredCache[selectedCollab.id]
    : undefined;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white font-space flex items-center gap-2">
            <Users className="w-5 h-5 text-mint-400" />
            Collaboration &amp; Lab Network
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Mapped across {network.sampledPapersCount} highest-impact &amp; recent papers. Faint links between outer nodes show lab teammates who also publish together.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {(Object.keys(PHASE_META) as CollaboratorProfile["phase"][]).map(
            (phaseKey) => (
              <span key={phaseKey} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PHASE_META[phaseKey].fill }}
                ></span>
                {PHASE_META[phaseKey].label}
              </span>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Ego Graph SVG */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#070b14] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full min-w-[520px] h-auto select-none"
              role="img"
              aria-label={`Collaboration ego-network for ${network.centerName}`}
            >
              {/* Subtle peer-to-peer edges revealing lab clusters */}
              {network.peerEdges.map((pe) => {
                const p1 = positions[pe.source];
                const p2 = positions[pe.target];
                if (!p1 || !p2) return null;
                const isLit =
                  hoveredId === pe.source ||
                  hoveredId === pe.target ||
                  selectedCollab?.id === pe.source ||
                  selectedCollab?.id === pe.target;
                return (
                  <line
                    key={`${pe.source}__${pe.target}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={
                      isLit
                        ? "rgba(148, 163, 184, 0.45)"
                        : "rgba(148, 163, 184, 0.14)"
                    }
                    strokeDasharray="3 3"
                    strokeWidth={Math.min(2.5, 0.8 + pe.weight * 0.35)}
                  />
                );
              })}

              {/* Center-to-collaborator spokes */}
              {network.collaborators.map((collab) => {
                const p = positions[collab.id];
                if (!p) return null;
                const isActive =
                  selectedCollab?.id === collab.id || hoveredId === collab.id;
                const strokeW = Math.min(5, 1.3 + (collab.sharedCount / maxShared) * 3.5);
                return (
                  <line
                    key={`spoke_${collab.id}`}
                    x1={centerPos.x}
                    y1={centerPos.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={
                      isActive
                        ? PHASE_META[collab.phase].fill
                        : "rgba(96, 165, 250, 0.25)"
                    }
                    strokeWidth={isActive ? strokeW + 1.2 : strokeW}
                  />
                );
              })}

              {/* Center Author Node */}
              <g transform={`translate(${centerPos.x}, ${centerPos.y})`}>
                <circle r={30} fill="rgba(59, 130, 246, 0.18)" />
                <circle
                  r={22}
                  fill="#2563eb"
                  stroke="#93c5fd"
                  strokeWidth={2.5}
                />
                <text
                  y={36}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="#ffffff"
                  style={{
                    paintOrder: "stroke",
                    stroke: "#070b14",
                    strokeWidth: 4,
                  }}
                >
                  {shortenName(network.centerName)}
                </text>
              </g>

              {/* Collaborator Nodes */}
              {network.collaborators.map((collab) => {
                const p = positions[collab.id];
                if (!p) return null;
                const meta = PHASE_META[collab.phase];
                const isSelected = selectedCollab?.id === collab.id;
                const r = 9 + Math.sqrt(collab.sharedCount / maxShared) * 10;
                const dimmed =
                  hoveredId !== null &&
                  hoveredId !== collab.id &&
                  !isSelected;

                return (
                  <g
                    key={collab.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    className="cursor-pointer transition-opacity duration-150"
                    style={{ opacity: dimmed ? 0.35 : 1 }}
                    onMouseEnter={() => setHoveredId(collab.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(collab.id)}
                  >
                    {isSelected && (
                      <circle
                        r={r + 5}
                        fill="rgba(255,255,255,0.12)"
                        stroke={meta.fill}
                        strokeWidth={1.6}
                      />
                    )}
                    <circle
                      r={r}
                      fill={meta.fill}
                      stroke="#070b14"
                      strokeWidth={2}
                    />
                    <text
                      y={r + 13}
                      textAnchor="middle"
                      fontSize={10.5}
                      fontWeight={isSelected ? 700 : 500}
                      fill={isSelected ? "#ffffff" : "#cbd5e1"}
                      style={{
                        paintOrder: "stroke",
                        stroke: "#070b14",
                        strokeWidth: 3,
                      }}
                    >
                      {shortenName(collab.name)}
                    </text>
                    <title>
                      {`${collab.name} (${collab.roleDynamic})\n${
                        collab.sharedCount
                      } sampled co-authored paper(s) (${collab.firstYear}–${
                        collab.lastYear
                      })\n${collab.institution || ""}`}
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Shared Work Inspector */}
        <div className="lg:col-span-5 xl:col-span-4 bg-black/30 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
          {selectedCollab ? (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                      PHASE_META[selectedCollab.phase].badge
                    }`}
                  >
                    {PHASE_META[selectedCollab.phase].label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedCollab.firstYear}–{selectedCollab.lastYear}
                  </span>
                </div>

                <Link
                  href={`/author/${selectedCollab.id}`}
                  className="text-lg font-bold text-white hover:text-blue-400 transition-colors font-space flex items-center gap-1"
                >
                  {selectedCollab.name}
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </Link>

                {selectedCollab.institution && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{selectedCollab.institution}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                    {selectedCollab.roleDynamic}
                  </span>
                  {selectedCollab.sameInstitution && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Same Institution
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Co-authored Works
                    {fullCollabData && (
                      <span className="text-mint-400">
                        ({fullCollabData.totalCount} total)
                      </span>
                    )}
                  </h4>
                  {loadingPapers && (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  )}
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {(fullCollabData
                    ? fullCollabData.papers.map((p) => ({
                        id: p.id,
                        title: p.title,
                        year: p.publicationYear,
                        citedByCount: p.citedByCount,
                      }))
                    : selectedCollab.sharedPapers
                  ).map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/paper/${sp.id}`}
                      className="block p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                    >
                      <div className="text-xs font-medium text-blue-300 line-clamp-2">
                        {sp.title}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
                        <span>{sp.year}</span>
                        <span>{sp.citedByCount.toLocaleString()} cites</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {!fullCollabData && (
                  <button
                    type="button"
                    onClick={() => handleLoadFullCoauthored(selectedCollab.id)}
                    disabled={loadingPapers}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {loadingPapers
                      ? "Loading..."
                      : "Load Complete Co-authored History"}
                  </button>
                )}
                <Link
                  href={`/search?authorId=${network.centerId}&coauthorId=${selectedCollab.id}&sort=citations`}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search all shared papers
                </Link>
                <Link
                  href={`/author/${selectedCollab.id}`}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  Inspect {shortenName(selectedCollab.name)}&apos;s own network
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Clickable Collaborator Pill Strip */}
      <div className="pt-2 border-t border-white/5">
        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Top Co-authors ({network.collaborators.length}) — Click to inspect relationship
        </div>
        <div className="flex flex-wrap gap-2">
          {network.collaborators.map((c) => {
            const isSelected = selectedCollab?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors border flex items-center gap-2 ${
                  isSelected
                    ? "bg-blue-600/25 border-blue-500/50 text-white"
                    : "bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PHASE_META[c.phase].fill }}
                ></span>
                <span>{c.name}</span>
                <span className="text-[11px] text-gray-500">
                  {c.sharedCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
