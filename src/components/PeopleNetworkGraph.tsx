"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CoauthorshipEdge,
  ConceptPersonNode,
  ConceptPersonRole,
  Paper,
} from "@/lib/types";
import { getCoauthoredPapers } from "@/lib/openalex";
import { computeDeterministicGraphLayout } from "@/lib/relationshipEngine";
import {
  Users,
  ArrowUpRight,
  Building,
  Link2,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface PeopleNetworkGraphProps {
  query: string;
  people: ConceptPersonNode[];
  edges: CoauthorshipEdge[];
}

const ROLE_META: Record<
  ConceptPersonRole,
  {
    label: string;
    short: string;
    fill: string;
    ring: string;
    badge: string;
    description: string;
  }
> = {
  pioneer: {
    label: "Pioneer",
    short: "Origin",
    fill: "#10b981",
    ring: "rgba(16, 185, 129, 0.35)",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    description: "Authored earliest defining or origin-era papers",
  },
  bridge: {
    label: "Cross-Era Bridge",
    short: "Bridge",
    fill: "#a855f7",
    ring: "rgba(168, 85, 247, 0.35)",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    description: "Active from early foundations straight through the current frontier",
  },
  authority: {
    label: "Core Authority",
    short: "Authority",
    fill: "#3b82f6",
    ring: "rgba(59, 130, 246, 0.35)",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    description: "Major citation impact and foundational papers in the field",
  },
  frontier: {
    label: "Frontier Leader",
    short: "Frontier",
    fill: "#f59e0b",
    ring: "rgba(245, 158, 11, 0.35)",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "Driving high-impact recent breakthroughs (last 2 years)",
  },
};

function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

export default function PeopleNetworkGraph({
  query,
  people,
  edges,
}: PeopleNetworkGraphProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | ConceptPersonRole>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    people[0]?.id || null
  );
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<string | null>(null);

  const [fullSharedCache, setFullSharedCache] = useState<
    Record<string, { papers: Paper[]; totalCount: number }>
  >({});
  const [loadingEdgeKey, setLoadingEdgeKey] = useState<string | null>(null);
  const [edgeFetchError, setEdgeFetchError] = useState<string | null>(null);

  const width = 760;
  const height = 460;

  const visiblePeople = useMemo(() => {
    if (roleFilter === "all") return people;
    return people.filter((p) => p.role === roleFilter);
  }, [people, roleFilter]);

  const visibleIdSet = useMemo(
    () => new Set(visiblePeople.map((p) => p.id)),
    [visiblePeople]
  );

  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) => visibleIdSet.has(e.source) && visibleIdSet.has(e.target)
    );
  }, [edges, visibleIdSet]);

  const positions = useMemo(() => {
    const layoutNodes = visiblePeople.map((p) => ({
      id: p.id,
      role: p.role,
      weight: p.citationsInConcept + p.samplePaperCount * 300,
    }));
    const layoutEdges = visibleEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
    return computeDeterministicGraphLayout(
      layoutNodes,
      layoutEdges,
      width,
      height,
      "concept"
    );
  }, [visiblePeople, visibleEdges]);

  const personMap = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  const maxCitations = useMemo(
    () => Math.max(...people.map((p) => p.citationsInConcept), 1),
    [people]
  );

  const activeHoverNeighbors = useMemo(() => {
    if (!hoveredId) return null;
    const set = new Set<string>([hoveredId]);
    for (const e of visibleEdges) {
      if (e.source === hoveredId) set.add(e.target);
      if (e.target === hoveredId) set.add(e.source);
    }
    return set;
  }, [hoveredId, visibleEdges]);

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeKey) return null;
    return (
      edges.find(
        (e) =>
          `${e.source}__${e.target}` === selectedEdgeKey ||
          `${e.target}__${e.source}` === selectedEdgeKey
      ) || null
    );
  }, [edges, selectedEdgeKey]);

  const selectedPerson = useMemo(() => {
    if (selectedEdge) return null;
    if (selectedNodeId && personMap.has(selectedNodeId)) {
      return personMap.get(selectedNodeId)!;
    }
    return visiblePeople[0] || people[0] || null;
  }, [selectedEdge, selectedNodeId, personMap, visiblePeople, people]);

  const selectedPersonEdges = useMemo(() => {
    if (!selectedPerson) return [];
    return edges.filter(
      (e) => e.source === selectedPerson.id || e.target === selectedPerson.id
    );
  }, [selectedPerson, edges]);

  const handleLoadAllCoauthored = async (idA: string, idB: string) => {
    const key = [idA, idB].sort().join("__");
    if (fullSharedCache[key]) return;
    setLoadingEdgeKey(key);
    setEdgeFetchError(null);
    try {
      const res = await getCoauthoredPapers(idA, idB, 15);
      setFullSharedCache((prev) => ({
        ...prev,
        [key]: { papers: res.results, totalCount: res.totalCount },
      }));
    } catch (err) {
      setEdgeFetchError(
        err instanceof Error ? err.message : "Unable to load shared papers."
      );
    } finally {
      setLoadingEdgeKey(null);
    }
  };

  if (people.length === 0) {
    return null;
  }

  const filterTabs: { key: "all" | ConceptPersonRole; label: string; count: number }[] = [
    { key: "all", label: "All Researchers", count: people.length },
    {
      key: "pioneer",
      label: "Pioneers",
      count: people.filter((p) => p.role === "pioneer").length,
    },
    {
      key: "bridge",
      label: "Bridges",
      count: people.filter((p) => p.role === "bridge").length,
    },
    {
      key: "authority",
      label: "Authorities",
      count: people.filter((p) => p.role === "authority").length,
    },
    {
      key: "frontier",
      label: "Frontier",
      count: people.filter((p) => p.role === "frontier").length,
    },
  ];

  const activeEdgeCacheKey = selectedEdge
    ? [selectedEdge.source, selectedEdge.target].sort().join("__")
    : null;
  const cachedEdgeData = activeEdgeCacheKey
    ? fullSharedCache[activeEdgeCacheKey]
    : null;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
      {/* Header & Role Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
            <Users className="w-5 h-5 text-mint-400" />
            Researcher Relationship Network
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Left-to-right flow from <span className="text-emerald-400">Origins</span> to{" "}
            <span className="text-blue-400">Authorities</span> &amp;{" "}
            <span className="text-amber-400">Current Frontier</span>. Click any person or line to inspect real co-authored papers.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setRoleFilter(tab.key);
                setSelectedEdgeKey(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                roleFilter === tab.key
                  ? "bg-blue-600/90 border-blue-500 text-white"
                  : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Graph Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* SVG Canvas */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#070b14] border border-white/10 rounded-xl relative overflow-hidden flex flex-col">
          {/* Chronological Era Guide Strip */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-500 bg-white/[0.01]">
            <span className="text-emerald-400/90 font-medium">← Origins</span>
            <span className="text-purple-400/90 font-medium">Cross-Era Bridges &amp; Authorities</span>
            <span className="text-amber-400/90 font-medium">Frontier Leaders →</span>
          </div>

          {visiblePeople.length === 0 ? (
            <div className="flex-1 min-h-[380px] flex items-center justify-center text-sm text-gray-500 p-6 text-center">
              No sampled researchers matched this specific role filter for &ldquo;{query}&rdquo;. Switch back to All Researchers.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[540px] h-auto select-none"
                role="img"
                aria-label={`Researcher collaboration graph for ${query}`}
              >
                {/* Faint vertical era dividers */}
                <line
                  x1={width * 0.3}
                  y1={20}
                  x2={width * 0.3}
                  y2={height - 20}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="4 4"
                />
                <line
                  x1={width * 0.71}
                  y1={20}
                  x2={width * 0.71}
                  y2={height - 20}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="4 4"
                />

                {/* Co-authorship Edges */}
                {visibleEdges.map((edge) => {
                  const p1 = positions[edge.source];
                  const p2 = positions[edge.target];
                  if (!p1 || !p2) return null;

                  const key = `${edge.source}__${edge.target}`;
                  const isEdgeSelected =
                    selectedEdgeKey === key ||
                    selectedEdgeKey === `${edge.target}__${edge.source}`;
                  const isConnectedToHover =
                    hoveredId !== null &&
                    (edge.source === hoveredId || edge.target === hoveredId);
                  const isDimmed =
                    hoveredId !== null && !isConnectedToHover && !isEdgeSelected;

                  const strokeW = Math.min(5.5, 1.4 + edge.weight * 0.85);

                  return (
                    <g
                      key={key}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedEdgeKey(key);
                        setEdgeFetchError(null);
                      }}
                    >
                      {/* Wide transparent hit line */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="transparent"
                        strokeWidth={14}
                      />
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={
                          isEdgeSelected
                            ? "#38bdf8"
                            : isConnectedToHover
                            ? "rgba(96, 165, 250, 0.85)"
                            : edge.sameInstitution
                            ? "rgba(52, 211, 153, 0.38)"
                            : "rgba(148, 163, 184, 0.28)"
                        }
                        strokeWidth={isEdgeSelected ? strokeW + 1.5 : strokeW}
                        strokeOpacity={isDimmed ? 0.15 : 1}
                      />
                      <title>{`${personMap.get(edge.source)?.name} ↔ ${
                        personMap.get(edge.target)?.name
                      }: ${edge.weight} shared paper(s)`}</title>
                    </g>
                  );
                })}

                {/* Researcher Nodes */}
                {visiblePeople.map((person) => {
                  const p = positions[person.id];
                  if (!p) return null;

                  const meta = ROLE_META[person.role];
                  const normSize = Math.sqrt(
                    Math.max(person.citationsInConcept, 1) / maxCitations
                  );
                  const r = 10 + normSize * 12;

                  const isSelected =
                    !selectedEdge && selectedPerson?.id === person.id;
                  const isEdgeEndpoint =
                    selectedEdge &&
                    (selectedEdge.source === person.id ||
                      selectedEdge.target === person.id);
                  const isDimmed =
                    activeHoverNeighbors !== null &&
                    !activeHoverNeighbors.has(person.id) &&
                    !isSelected;

                  return (
                    <g
                      key={person.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      className="cursor-pointer transition-opacity duration-150"
                      style={{ opacity: isDimmed ? 0.25 : 1 }}
                      onMouseEnter={() => setHoveredId(person.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => {
                        setSelectedNodeId(person.id);
                        setSelectedEdgeKey(null);
                      }}
                    >
                      {(isSelected || isEdgeEndpoint) && (
                        <circle
                          r={r + 6}
                          fill={meta.ring}
                          stroke={meta.fill}
                          strokeWidth={1.5}
                        />
                      )}
                      <circle
                        r={r}
                        fill={meta.fill}
                        stroke="#0b0f19"
                        strokeWidth={2.2}
                      />
                      <text
                        y={r + 14}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={isSelected ? 700 : 500}
                        fill={isSelected ? "#ffffff" : "#cbd5e1"}
                        style={{
                          paintOrder: "stroke",
                          stroke: "#070b14",
                          strokeWidth: 3,
                        }}
                      >
                        {shortenName(person.name)}
                      </text>
                      <title>
                        {`${person.name} (${meta.label})\n${
                          person.institution || "Independent / Unaffiliated"
                        }\n${person.citationsInConcept.toLocaleString()} citations in sampled works (${
                          person.firstYear
                        }–${person.lastYear})`}
                      </title>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Legend */}
          <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01] flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400">
            {(Object.keys(ROLE_META) as ConceptPersonRole[]).map((roleKey) => (
              <span key={roleKey} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ROLE_META[roleKey].fill }}
                ></span>
                {ROLE_META[roleKey].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 ml-auto text-gray-500">
              Line thickness = co-authored works
            </span>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-black/30 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
          {selectedEdge ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-sky-400">
                  <Link2 className="w-3.5 h-3.5" /> Collaboration Link
                </span>
                <button
                  onClick={() => setSelectedEdgeKey(null)}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Back to researcher
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                  <Link
                    href={`/author/${selectedEdge.source}`}
                    className="text-blue-400 hover:underline"
                  >
                    {personMap.get(selectedEdge.source)?.name || selectedEdge.source}
                  </Link>
                  <span className="text-gray-500">↔</span>
                  <Link
                    href={`/author/${selectedEdge.target}`}
                    className="text-blue-400 hover:underline"
                  >
                    {personMap.get(selectedEdge.target)?.name || selectedEdge.target}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>
                    Span: {selectedEdge.firstYear}–{selectedEdge.lastYear}
                  </span>
                  <span>•</span>
                  <span>{selectedEdge.weight} sampled co-authored paper(s)</span>
                  {selectedEdge.sameInstitution && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Same Institution
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {cachedEdgeData
                    ? `All Co-authored Papers (${cachedEdgeData.totalCount})`
                    : "Shared Papers in Sample"}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(cachedEdgeData
                    ? cachedEdgeData.papers.map((p) => ({
                        id: p.id,
                        title: p.title,
                        year: p.publicationYear,
                        citedByCount: p.citedByCount,
                      }))
                    : selectedEdge.sharedPapers
                  ).map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/paper/${sp.id}`}
                      className="block p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                    >
                      <div className="text-xs font-medium text-blue-300 line-clamp-2">
                        {sp.title}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                        <span>{sp.year}</span>
                        <span>{sp.citedByCount.toLocaleString()} citations</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {edgeFetchError && (
                <p className="text-xs text-red-400">{edgeFetchError}</p>
              )}

              {!cachedEdgeData && (
                <button
                  onClick={() =>
                    handleLoadAllCoauthored(
                      selectedEdge.source,
                      selectedEdge.target
                    )
                  }
                  disabled={loadingEdgeKey === activeEdgeCacheKey}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loadingEdgeKey === activeEdgeCacheKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Querying OpenAlex...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Fetch all co-authored papers across OpenAlex
                    </>
                  )}
                </button>
              )}

              <Link
                href={`/search?authorId=${selectedEdge.source}&coauthorId=${selectedEdge.target}&sort=citations`}
                className="block text-center text-xs text-gray-400 hover:text-white transition-colors"
              >
                Open pair in Paper Search →
              </Link>
            </div>
          ) : selectedPerson ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${
                      ROLE_META[selectedPerson.role].badge
                    }`}
                  >
                    {ROLE_META[selectedPerson.role].label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedPerson.firstYear}–{selectedPerson.lastYear}
                  </span>
                </div>

                <Link
                  href={`/author/${selectedPerson.id}`}
                  className="text-lg font-bold text-white hover:text-blue-400 transition-colors font-space flex items-center gap-1"
                >
                  {selectedPerson.name}
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </Link>

                {selectedPerson.institution && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{selectedPerson.institution}</span>
                    {selectedPerson.countryCode && (
                      <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase">
                        {selectedPerson.countryCode}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-sm font-semibold text-white">
                    {selectedPerson.citationsInConcept.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Sample Cites
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-sm font-semibold text-white">
                    {selectedPerson.corpusPaperCount ??
                      selectedPerson.samplePaperCount}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    {selectedPerson.corpusPaperCount
                      ? "Total Works"
                      : "Key Papers"}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-sm font-semibold text-white">
                    {selectedPerson.leadCount}/{selectedPerson.seniorCount}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    1st / Last Auth
                  </div>
                </div>
              </div>

              {/* Key Papers */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Key Papers in Concept
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedPerson.papers.slice(0, 3).map((paper) => (
                    <Link
                      key={paper.id}
                      href={`/paper/${paper.id}`}
                      className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                    >
                      <div className="text-xs text-blue-300 font-medium line-clamp-2">
                        {paper.title}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex justify-between">
                        <span>{paper.publicationYear}</span>
                        <span>{paper.citedByCount.toLocaleString()} cites</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Direct Collaborators in Graph */}
              {selectedPersonEdges.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Connected Co-authors ({selectedPersonEdges.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPersonEdges.slice(0, 6).map((edge) => {
                      const peerId =
                        edge.source === selectedPerson.id
                          ? edge.target
                          : edge.source;
                      const peer = personMap.get(peerId);
                      if (!peer) return null;
                      return (
                        <button
                          key={`${edge.source}__${edge.target}`}
                          onClick={() =>
                            setSelectedEdgeKey(`${edge.source}__${edge.target}`)
                          }
                          className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-white transition-colors"
                        >
                          {peer.name} ({edge.weight})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link
                href={`/author/${selectedPerson.id}`}
                className="w-full py-2.5 px-3 rounded-lg bg-mint-500/15 hover:bg-mint-500/25 border border-mint-500/30 text-mint-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                View Full Author Relationship Profile
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
