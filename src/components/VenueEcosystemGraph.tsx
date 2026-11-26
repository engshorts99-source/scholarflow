"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  VenueResearchTeam,
  VenueTeamEdge,
  VenueTeamTopicLink,
  VenueTopicCluster,
  VenueTopicSynergyEdge,
} from "@/lib/types";
import { computeDeterministicGraphLayout } from "@/lib/relationshipEngine";
import { getJournalBadgeStyle } from "@/lib/journalPresets";
import {
  Users,
  Sparkles,
  GitBranch,
  Flame,
  Building,
  ArrowUpRight,
  Link2,
  BookOpen,
  Compass,
} from "lucide-react";

interface VenueEcosystemGraphProps {
  teams: VenueResearchTeam[];
  teamEdges: VenueTeamEdge[];
  topics: VenueTopicCluster[];
  topicEdges: VenueTopicSynergyEdge[];
  teamTopicLinks: VenueTeamTopicLink[];
  onSelectTopicFilter?: (topicName: string) => void;
}

type GraphMode = "teams" | "bipartite" | "topics";
type EdgeFilter = "all" | "coauthorship" | "thematic";

function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function truncateText(str: string, max = 28): string {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

export default function VenueEcosystemGraph({
  teams,
  teamEdges,
  topics,
  topicEdges,
  teamTopicLinks,
  onSelectTopicFilter,
}: VenueEcosystemGraphProps) {
  const [mode, setMode] = useState<GraphMode>("teams");
  const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    teams[0]?.id || null
  );
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    topics[0]?.id || null
  );

  const width = 760;
  const height = 480;

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );
  const topicMap = useMemo(
    () => new Map(topics.map((t) => [t.id, t])),
    [topics]
  );

  const filteredTeamEdges = useMemo(() => {
    if (edgeFilter === "all") return teamEdges;
    return teamEdges.filter((e) => e.kind === edgeFilter);
  }, [teamEdges, edgeFilter]);

  // Mode 1 Layout: Team <-> Team Network
  const teamPositions = useMemo(() => {
    const nodes = teams.map((t, idx) => ({
      id: t.id,
      role: (t.streakYears >= 2
        ? "bridge"
        : idx < 5
        ? "pioneer"
        : idx < 12
        ? "authority"
        : "frontier") as "pioneer" | "bridge" | "authority" | "frontier",
      weight: t.totalVenuePapers * 200 + t.totalCitations,
    }));
    const edges = filteredTeamEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.kind === "coauthorship" ? e.weight * 2 : e.weight,
    }));
    return computeDeterministicGraphLayout(nodes, edges, width, height, "concept");
  }, [teams, filteredTeamEdges]);

  // Mode 3 Layout: Topic <-> Topic Synergy Network
  const topicPositions = useMemo(() => {
    const nodes = topics.map((t, idx) => ({
      id: t.id,
      role: (idx < 3
        ? "pioneer"
        : idx < 6
        ? "bridge"
        : idx < 9
        ? "authority"
        : "frontier") as "pioneer" | "bridge" | "authority" | "frontier",
      weight: t.count * 100,
    }));
    const edges = topicEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
    return computeDeterministicGraphLayout(nodes, edges, width, height, "concept");
  }, [topics, topicEdges]);

  // Mode 2 Layout: Team <-> Topic Bipartite Sankey/Flow
  const bipartiteTeams = useMemo(() => teams.slice(0, 12), [teams]);
  const bipartiteTopics = useMemo(() => topics.slice(0, 10), [topics]);
  const bipartiteLinks = useMemo(() => {
    const tSet = new Set(bipartiteTeams.map((t) => t.id));
    const tpSet = new Set(bipartiteTopics.map((tp) => tp.id));
    return teamTopicLinks.filter(
      (l) => tSet.has(l.teamId) && tpSet.has(l.topicId)
    );
  }, [bipartiteTeams, bipartiteTopics, teamTopicLinks]);

  const maxTeamPapers = useMemo(
    () => Math.max(...teams.map((t) => t.totalVenuePapers), 1),
    [teams]
  );
  const maxTopicCount = useMemo(
    () => Math.max(...topics.map((t) => t.count), 1),
    [topics]
  );

  const selectedPair = useMemo(() => {
    if (!selectedPairKey) return null;
    return (
      teamEdges.find(
        (e) =>
          `${e.source}__${e.target}` === selectedPairKey ||
          `${e.target}__${e.source}` === selectedPairKey
      ) || null
    );
  }, [teamEdges, selectedPairKey]);

  const activeTeam = useMemo(() => {
    if (selectedTeamId && teamMap.has(selectedTeamId)) {
      return teamMap.get(selectedTeamId)!;
    }
    return teams[0] || null;
  }, [selectedTeamId, teamMap, teams]);

  const activeTopic = useMemo(() => {
    if (selectedTopicId && topicMap.has(selectedTopicId)) {
      return topicMap.get(selectedTopicId)!;
    }
    return topics[0] || null;
  }, [selectedTopicId, topicMap, topics]);

  if (teams.length === 0 && topics.length === 0) {
    return null;
  }

  const coauthCount = teamEdges.filter((e) => e.kind === "coauthorship").length;
  const thematicCount = teamEdges.filter((e) => e.kind === "thematic").length;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5">
      {/* Top Mode Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white font-space flex items-center gap-2">
            <Users className="w-5 h-5 text-mint-400" />
            Research Team &amp; Topic Ecosystem Map
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Switch views to inspect direct lab collaborations, shared topic overlap between rival/parallel teams, and topic-to-topic synergy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("teams");
              setSelectedPairKey(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              mode === "teams"
                ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                : "bg-white/[0.03] border-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            1. Team ↔ Team Network
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("bipartite");
              setSelectedPairKey(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              mode === "bipartite"
                ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                : "bg-white/[0.03] border-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            2. Team ↔ Topic Flow
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("topics");
              setSelectedPairKey(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              mode === "topics"
                ? "bg-purple-600 border-purple-500 text-white shadow-sm"
                : "bg-white/[0.03] border-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3. Topic ↔ Topic Synergy
          </button>
        </div>
      </div>

      {/* Sub-filter when in Team <-> Team mode */}
      {mode === "teams" && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setEdgeFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                edgeFilter === "all"
                  ? "bg-white/15 border-white/30 text-white font-medium"
                  : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              All Links ({teamEdges.length})
            </button>
            <button
              type="button"
              onClick={() => setEdgeFilter("coauthorship")}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                edgeFilter === "coauthorship"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-medium"
                  : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              Solid: Direct Co-authorship ({coauthCount})
            </button>
            <button
              type="button"
              onClick={() => setEdgeFilter("thematic")}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                edgeFilter === "thematic"
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-medium"
                  : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              Dashed: Shared Topic Similarity ({thematicCount})
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Spotlight Lab
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Consecutive-Yr Streak
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              High-Output Lab
            </span>
          </div>
        </div>
      )}

      {/* Main Split: SVG Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 bg-[#070b14] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="w-full overflow-x-auto">
            {/* MODE 1: TEAM <-> TEAM NETWORK */}
            {mode === "teams" && (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[540px] h-auto select-none"
                role="img"
                aria-label="Research team relationship network"
              >
                {filteredTeamEdges.map((edge) => {
                  const p1 = teamPositions[edge.source];
                  const p2 = teamPositions[edge.target];
                  if (!p1 || !p2) return null;
                  const key = `${edge.source}__${edge.target}`;
                  const isSelected =
                    selectedPairKey === key ||
                    selectedPairKey === `${edge.target}__${edge.source}`;
                  const isLit =
                    hoveredId === edge.source ||
                    hoveredId === edge.target ||
                    (!selectedPairKey &&
                      (activeTeam?.id === edge.source ||
                        activeTeam?.id === edge.target));

                  return (
                    <g
                      key={key}
                      className="cursor-pointer"
                      onClick={() => setSelectedPairKey(key)}
                    >
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
                          isSelected
                            ? "#38bdf8"
                            : edge.kind === "coauthorship"
                            ? isLit
                              ? "rgba(16, 185, 129, 0.9)"
                              : "rgba(16, 185, 129, 0.42)"
                            : isLit
                            ? "rgba(168, 85, 247, 0.78)"
                            : "rgba(168, 85, 247, 0.24)"
                        }
                        strokeDasharray={
                          edge.kind === "thematic" ? "5 4" : undefined
                        }
                        strokeWidth={
                          edge.kind === "coauthorship"
                            ? Math.min(5, 2 + edge.weight * 0.9)
                            : Math.min(3.2, 1.1 + edge.weight * 0.35)
                        }
                      />
                    </g>
                  );
                })}

                {teams.map((team) => {
                  const p = teamPositions[team.id];
                  if (!p) return null;
                  const r =
                    11 +
                    Math.sqrt(team.totalVenuePapers / maxTeamPapers) * 13;
                  const isSelected =
                    !selectedPair && activeTeam?.id === team.id;
                  const isStreak = team.streakYears >= 2;
                  const fill = team.isSpotlight
                    ? "#22d3ee"
                    : isStreak
                    ? "#f59e0b"
                    : "#3b82f6";

                  return (
                    <g
                      key={team.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(team.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setSelectedPairKey(null);
                      }}
                    >
                      {isSelected && (
                        <circle
                          r={r + 6}
                          fill="rgba(255,255,255,0.12)"
                          stroke={fill}
                          strokeWidth={1.6}
                        />
                      )}
                      <circle
                        r={r}
                        fill={fill}
                        stroke="#070b14"
                        strokeWidth={2.2}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontWeight={700}
                        fill="#070b14"
                      >
                        {team.totalVenuePapers}
                      </text>
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
                        {shortenName(team.name)}
                      </text>
                      <title>{`${team.name} (${
                        team.institution || "Lab"
                      })\n${team.totalVenuePapers} papers in selected journals`}</title>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* MODE 2: TEAM <-> TOPIC BIPARTITE FLOW */}
            {mode === "bipartite" && (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[560px] h-auto select-none"
                role="img"
                aria-label="Research team to topic flow diagram"
              >
                <text
                  x={195}
                  y={26}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight={600}
                  fill="#94a3b8"
                >
                  TOP STREAK TEAMS
                </text>
                <text
                  x={width - 245}
                  y={26}
                  textAnchor="start"
                  fontSize={11}
                  fontWeight={600}
                  fill="#94a3b8"
                >
                  DOMINANT RESEARCH TOPICS
                </text>

                {/* Curved Bezier Links */}
                {bipartiteLinks.map((link) => {
                  const tIdx = bipartiteTeams.findIndex(
                    (t) => t.id === link.teamId
                  );
                  const tpIdx = bipartiteTopics.findIndex(
                    (tp) => tp.id === link.topicId
                  );
                  if (tIdx < 0 || tpIdx < 0) return null;

                  const y1 =
                    52 +
                    (tIdx / Math.max(bipartiteTeams.length - 1, 1)) *
                      (height - 84);
                  const y2 =
                    52 +
                    (tpIdx / Math.max(bipartiteTopics.length - 1, 1)) *
                      (height - 84);
                  const x1 = 212;
                  const x2 = width - 262;

                  const isHighlighted =
                    hoveredId === link.teamId ||
                    hoveredId === link.topicId ||
                    activeTeam?.id === link.teamId ||
                    activeTopic?.id === link.topicId;

                  const d = `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${
                    (x1 + x2) / 2
                  } ${y2}, ${x2} ${y2}`;

                  return (
                    <path
                      key={`${link.teamId}__${link.topicId}`}
                      d={d}
                      fill="none"
                      stroke={
                        isHighlighted
                          ? "rgba(52, 211, 153, 0.78)"
                          : "rgba(148, 163, 184, 0.16)"
                      }
                      strokeWidth={Math.min(5, 1.3 + link.count * 0.9)}
                    />
                  );
                })}

                {/* Left Column: Teams */}
                {bipartiteTeams.map((team, idx) => {
                  const y =
                    52 +
                    (idx / Math.max(bipartiteTeams.length - 1, 1)) *
                      (height - 84);
                  const isSel = activeTeam?.id === team.id;
                  return (
                    <g
                      key={team.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(team.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      <circle
                        cx={212}
                        cy={y}
                        r={isSel ? 7.5 : 5.5}
                        fill={team.streakYears >= 2 ? "#f59e0b" : "#3b82f6"}
                      />
                      <text
                        x={198}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={11.5}
                        fontWeight={isSel ? 700 : 500}
                        fill={isSel ? "#ffffff" : "#cbd5e1"}
                      >
                        {truncateText(team.name, 22)} ({team.totalVenuePapers})
                      </text>
                    </g>
                  );
                })}

                {/* Right Column: Topics */}
                {bipartiteTopics.map((topic, idx) => {
                  const y =
                    52 +
                    (idx / Math.max(bipartiteTopics.length - 1, 1)) *
                      (height - 84);
                  const isSel = activeTopic?.id === topic.id;
                  return (
                    <g
                      key={topic.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(topic.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <rect
                        x={width - 262}
                        y={y - 6}
                        width={12}
                        height={12}
                        rx={3}
                        fill={isSel ? "#34d399" : "#a855f7"}
                      />
                      <text
                        x={width - 242}
                        y={y + 4}
                        textAnchor="start"
                        fontSize={11}
                        fontWeight={isSel ? 700 : 500}
                        fill={isSel ? "#ffffff" : "#cbd5e1"}
                      >
                        {truncateText(topic.name, 30)} ({topic.count})
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* MODE 3: TOPIC <-> TOPIC SYNERGY NETWORK */}
            {mode === "topics" && (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[540px] h-auto select-none"
                role="img"
                aria-label="Research topic synergy network"
              >
                {topicEdges.map((edge) => {
                  const p1 = topicPositions[edge.source];
                  const p2 = topicPositions[edge.target];
                  if (!p1 || !p2) return null;
                  const isLit =
                    activeTopic?.id === edge.source ||
                    activeTopic?.id === edge.target ||
                    hoveredId === edge.source ||
                    hoveredId === edge.target;
                  return (
                    <line
                      key={`${edge.source}__${edge.target}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={
                        isLit
                          ? "rgba(192, 132, 252, 0.85)"
                          : "rgba(148, 163, 184, 0.22)"
                      }
                      strokeWidth={Math.min(5, 1.2 + edge.weight * 0.6)}
                    />
                  );
                })}

                {topics.map((tp) => {
                  const p = topicPositions[tp.id];
                  if (!p) return null;
                  const r = 12 + Math.sqrt(tp.count / maxTopicCount) * 15;
                  const isSel = activeTopic?.id === tp.id;

                  return (
                    <g
                      key={tp.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(tp.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedTopicId(tp.id)}
                    >
                      {isSel && (
                        <circle
                          r={r + 6}
                          fill="rgba(168, 85, 247, 0.22)"
                          stroke="#c084fc"
                          strokeWidth={1.5}
                        />
                      )}
                      <circle
                        r={r}
                        fill="#8b5cf6"
                        stroke="#070b14"
                        strokeWidth={2.2}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontWeight={700}
                        fill="#ffffff"
                      >
                        {tp.count}
                      </text>
                      <text
                        y={r + 14}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight={isSel ? 700 : 500}
                        fill={isSel ? "#ffffff" : "#cbd5e1"}
                        style={{
                          paintOrder: "stroke",
                          stroke: "#070b14",
                          strokeWidth: 3,
                        }}
                      >
                        {truncateText(tp.name, 22)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01] text-xs text-gray-500 flex flex-wrap justify-between gap-2">
            {mode === "teams" && (
              <span>
                Number inside node = papers in selected journals. Click any team or connecting line to inspect.
              </span>
            )}
            {mode === "bipartite" && (
              <span>
                Curves link top labs (left) to the primary topics they publish on (right) in your selected journals.
              </span>
            )}
            {mode === "topics" && (
              <span>
                Topics are linked when leading labs bridge both areas or share core experimental keywords.
              </span>
            )}
          </div>
        </div>

        {/* Right Side Inspector */}
        <div className="lg:col-span-5 xl:col-span-4 bg-black/30 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
          {mode === "teams" && selectedPair ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    selectedPair.kind === "coauthorship"
                      ? "text-emerald-400"
                      : "text-purple-400"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {selectedPair.kind === "coauthorship"
                    ? "Direct Co-Authorship"
                    : "Shared Research Topic Link"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPairKey(null)}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Back to team
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-sm font-semibold text-white flex flex-wrap items-center gap-2">
                  <Link
                    href={`/author/${selectedPair.source}`}
                    className="text-blue-400 hover:underline"
                  >
                    {teamMap.get(selectedPair.source)?.name ||
                      selectedPair.source}
                  </Link>
                  <span className="text-gray-500">↔</span>
                  <Link
                    href={`/author/${selectedPair.target}`}
                    className="text-blue-400 hover:underline"
                  >
                    {teamMap.get(selectedPair.target)?.name ||
                      selectedPair.target}
                  </Link>
                </div>

                {selectedPair.sharedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPair.sharedTopics.map((st) => (
                      <span
                        key={st}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-200"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedPair.sharedPapers.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Co-authored Papers in Selected Journals
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedPair.sharedPapers.map((sp) => (
                      <Link
                        key={sp.id}
                        href={`/paper/${sp.id}`}
                        className="block p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                      >
                        <div className="text-xs font-medium text-blue-300 line-clamp-2">
                          {sp.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
                          <span>
                            {sp.journalName ? `${sp.journalName} · ` : ""}
                            {sp.year}
                          </span>
                          <span>{sp.citedByCount.toLocaleString()} cites</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  These two teams have not co-authored in this window, but both actively publish on the shared topics above in your selected journals.
                </p>
              )}
            </div>
          ) : mode === "topics" && activeTopic ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-400">
                  {activeTopic.field || "Research Topic Cluster"}
                </span>
                <h4 className="text-lg font-bold text-white font-space mt-1">
                  {activeTopic.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTopic.count.toLocaleString()} papers ({activeTopic.sharePct}% of selected venue output)
                </p>
              </div>

              {activeTopic.topKeywords.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Core Keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTopic.topKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => onSelectTopicFilter?.(kw)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 text-gray-200 transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTopic.leadingTeamIds.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Streak Teams Publishing Here
                  </div>
                  <div className="space-y-1.5">
                    {activeTopic.leadingTeamIds.slice(0, 5).map((tid) => {
                      const t = teamMap.get(tid);
                      if (!t) return null;
                      return (
                        <button
                          key={tid}
                          type="button"
                          onClick={() => {
                            setSelectedTeamId(tid);
                            setMode("teams");
                          }}
                          className="w-full text-left p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="text-white font-medium truncate">
                            {t.name}
                          </span>
                          <span className="text-mint-400 shrink-0">
                            {t.totalVenuePapers} papers
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {onSelectTopicFilter && (
                  <button
                    type="button"
                    onClick={() => onSelectTopicFilter(activeTopic.name)}
                    className="w-full py-2 px-3 rounded-lg bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-colors"
                  >
                    Filter Radar by &ldquo;{truncateText(activeTopic.name, 26)}&rdquo;
                  </button>
                )}
                <Link
                  href={`/concept?q=${encodeURIComponent(activeTopic.name)}`}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-mint-400" />
                  Open in Concept Atlas
                </Link>
              </div>
            </div>
          ) : activeTeam ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {activeTeam.streakYears >= 2 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                      <Flame className="w-3 h-3" />
                      {activeTeam.streakYears}-Yr Consecutive Streak
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
                      High-Impact Lab
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-semibold">
                    {activeTeam.totalVenuePapers} venue papers
                  </span>
                </div>

                <Link
                  href={`/author/${activeTeam.id}`}
                  className="text-lg font-bold text-white hover:text-blue-400 transition-colors font-space flex items-center gap-1"
                >
                  {activeTeam.name} Lab
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </Link>

                {activeTeam.institution && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                    <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{activeTeam.institution}</span>
                    {activeTeam.countryCode && (
                      <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase">
                        {activeTeam.countryCode}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Journal Breakdown Pills */}
              {activeTeam.journalBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeTeam.journalBreakdown.map((jb) => (
                    <span
                      key={jb.journalId}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${getJournalBadgeStyle(
                        jb.journalId
                      )}`}
                    >
                      {jb.journalName} ×{jb.count}
                    </span>
                  ))}
                </div>
              )}

              {/* Topics */}
              {activeTeam.topTopics.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTeam.topTopics.map((tp) => (
                      <Link
                        key={tp}
                        href={`/concept?q=${encodeURIComponent(tp)}`}
                        className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-blue-500/20 border border-white/10 text-gray-300 transition-colors"
                      >
                        {tp}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sampled Papers */}
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Recent Papers in Selected Journals
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {activeTeam.papers.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/paper/${p.id}`}
                      className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
                    >
                      <div className="text-xs text-blue-300 font-medium line-clamp-2">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                        <span>
                          {p.journal?.displayName} ({p.publicationYear})
                        </span>
                        <span>{p.citedByCount.toLocaleString()} cites</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href={`/author/${activeTeam.id}`}
                className="w-full py-2 px-3 rounded-lg bg-mint-500/15 hover:bg-mint-500/25 border border-mint-500/30 text-mint-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Full Lab &amp; Co-Author Network
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
