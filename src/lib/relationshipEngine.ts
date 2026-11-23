import {
  Paper,
  ConceptPersonNode,
  ConceptPersonRole,
  CoauthorshipEdge,
  AuthorRelationshipNetwork,
  CollaboratorProfile,
  LineagePerson,
} from "./types";
import {
  getWorksByIds,
  normalizeAuthorId,
  searchPapers,
} from "./openalex";

interface MutablePersonAcc {
  id: string;
  name: string;
  institution?: string;
  countryCode?: string;
  citationsInConcept: number;
  samplePaperCount: number;
  corpusPaperCount?: number;
  firstYear: number;
  lastYear: number;
  leadCount: number;
  seniorCount: number;
  inOrigin: boolean;
  inSeminal: boolean;
  inFrontier: boolean;
  papers: Paper[];
  paperIds: Set<string>;
}

export function buildConceptPeopleGraph(args: {
  originPapers: Paper[];
  seminalPapers: Paper[];
  frontierPapers: Paper[];
  prolificAuthors: { id: string; name: string; count: number }[];
  originYear: number;
  currentYear: number;
}): {
  people: ConceptPersonNode[];
  edges: CoauthorshipEdge[];
  topInstitutions: { name: string; countryCode?: string; count: number }[];
} {
  const {
    originPapers,
    seminalPapers,
    frontierPapers,
    prolificAuthors,
    originYear,
    currentYear,
  } = args;

  const originIds = new Set(originPapers.map((p) => p.id));
  const seminalIds = new Set(seminalPapers.map((p) => p.id));
  const frontierIds = new Set(frontierPapers.map((p) => p.id));

  const uniquePapersMap = new Map<string, Paper>();
  for (const p of [...originPapers, ...seminalPapers, ...frontierPapers]) {
    if (p.id && !uniquePapersMap.has(p.id)) {
      uniquePapersMap.set(p.id, p);
    }
  }
  const allPapers = Array.from(uniquePapersMap.values());

  const prolificMap = new Map<string, number>();
  for (const pa of prolificAuthors) {
    prolificMap.set(normalizeAuthorId(pa.id), pa.count);
  }

  const authorMap = new Map<string, MutablePersonAcc>();
  const instCounts = new Map<string, { name: string; countryCode?: string; count: number }>();

  for (const paper of allPapers) {
    const year = paper.publicationYear || currentYear;
    const isOrigin = originIds.has(paper.id);
    const isSeminal = seminalIds.has(paper.id);
    const isFrontier = frontierIds.has(paper.id);

    // Count unique institutions per paper (avoid multi-author inflation)
    const seenInstInPaper = new Set<string>();
    const cappedAuthors = paper.authors.slice(0, 10);

    for (const auth of cappedAuthors) {
      if (auth.institution) {
        const instKey = auth.institution.toLowerCase();
        if (!seenInstInPaper.has(instKey)) {
          seenInstInPaper.add(instKey);
          const existingInst = instCounts.get(instKey);
          if (existingInst) {
            existingInst.count += 1;
            if (!existingInst.countryCode && auth.countryCode) {
              existingInst.countryCode = auth.countryCode;
            }
          } else {
            instCounts.set(instKey, {
              name: auth.institution,
              countryCode: auth.countryCode,
              count: 1,
            });
          }
        }
      }

      if (!auth.id) continue;
      const cleanId = normalizeAuthorId(auth.id);
      let acc = authorMap.get(cleanId);
      if (!acc) {
        acc = {
          id: cleanId,
          name: auth.name,
          institution: auth.institution,
          countryCode: auth.countryCode,
          citationsInConcept: 0,
          samplePaperCount: 0,
          corpusPaperCount: prolificMap.get(cleanId),
          firstYear: year,
          lastYear: year,
          leadCount: 0,
          seniorCount: 0,
          inOrigin: false,
          inSeminal: false,
          inFrontier: false,
          papers: [],
          paperIds: new Set<string>(),
        };
        authorMap.set(cleanId, acc);
      }

      if (!acc.paperIds.has(paper.id)) {
        acc.paperIds.add(paper.id);
        acc.papers.push(paper);
        acc.samplePaperCount += 1;
        acc.citationsInConcept += paper.citedByCount || 0;
        if (year > 0) {
          acc.firstYear = Math.min(acc.firstYear, year);
          acc.lastYear = Math.max(acc.lastYear, year);
        }
        if (auth.position === "first") acc.leadCount += 1;
        if (auth.position === "last") acc.seniorCount += 1;
        if (auth.institution && (!acc.institution || year >= acc.lastYear)) {
          acc.institution = auth.institution;
          acc.countryCode = auth.countryCode || acc.countryCode;
        }
      }

      if (isOrigin) acc.inOrigin = true;
      if (isSeminal) acc.inSeminal = true;
      if (isFrontier) acc.inFrontier = true;
    }
  }

  // Classify each candidate researcher deterministically
  const classifyRole = (acc: MutablePersonAcc): ConceptPersonRole => {
    if (
      (acc.inOrigin || acc.firstYear <= originYear + 5 || acc.inSeminal) &&
      acc.inFrontier
    ) {
      return "bridge";
    }
    if (acc.inOrigin || acc.firstYear <= originYear + 3) {
      return "pioneer";
    }
    if (acc.inFrontier && acc.firstYear >= currentYear - 4) {
      return "frontier";
    }
    return "authority";
  };

  const scoreCandidate = (acc: MutablePersonAcc): number => {
    return (
      acc.citationsInConcept +
      acc.samplePaperCount * 350 +
      (acc.corpusPaperCount || 0) * 180 +
      (acc.inOrigin ? 600 : 0) +
      (acc.inFrontier ? 250 : 0)
    );
  };

  const classified = Array.from(authorMap.values())
    .map((acc) => ({
      acc,
      role: classifyRole(acc),
      score: scoreCandidate(acc),
    }))
    .sort((a, b) => b.score - a.score);

  // Balanced selection up to 24 researchers so Pioneers, Bridges, Authorities, and Frontier Leaders are all visible
  const selectedIds = new Set<string>();
  const quotas: { role: ConceptPersonRole; limit: number }[] = [
    { role: "pioneer", limit: 5 },
    { role: "bridge", limit: 5 },
    { role: "frontier", limit: 6 },
    { role: "authority", limit: 8 },
  ];

  const selectedEntries: { acc: MutablePersonAcc; role: ConceptPersonRole }[] = [];

  for (const { role, limit } of quotas) {
    let taken = 0;
    for (const item of classified) {
      if (taken >= limit) break;
      if (item.role === role && !selectedIds.has(item.acc.id)) {
        selectedIds.add(item.acc.id);
        selectedEntries.push({ acc: item.acc, role: item.role });
        taken += 1;
      }
    }
  }

  for (const item of classified) {
    if (selectedEntries.length >= 24) break;
    if (!selectedIds.has(item.acc.id)) {
      selectedIds.add(item.acc.id);
      selectedEntries.push({ acc: item.acc, role: item.role });
    }
  }

  const people: ConceptPersonNode[] = selectedEntries.map(({ acc, role }) => ({
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    countryCode: acc.countryCode,
    role,
    citationsInConcept: acc.citationsInConcept,
    samplePaperCount: acc.samplePaperCount,
    corpusPaperCount: acc.corpusPaperCount,
    firstYear: acc.firstYear,
    lastYear: acc.lastYear,
    leadCount: acc.leadCount,
    seniorCount: acc.seniorCount,
    papers: acc.papers
      .slice()
      .sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0))
      .slice(0, 6),
  }));

  const personLookup = new Map(people.map((p) => [p.id, p]));
  const edgeMap = new Map<string, CoauthorshipEdge>();

  for (const paper of allPapers) {
    const participants = Array.from(
      new Set(
        paper.authors
          .slice(0, 10)
          .map((a) => normalizeAuthorId(a.id))
          .filter((id) => personLookup.has(id))
      )
    ).sort();

    if (participants.length < 2) continue;

    const year = paper.publicationYear || currentYear;
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const source = participants[i];
        const target = participants[j];
        const key = `${source}__${target}`;
        let edge = edgeMap.get(key);
        if (!edge) {
          const pA = personLookup.get(source)!;
          const pB = personLookup.get(target)!;
          const sameInst = Boolean(
            pA.institution &&
              pB.institution &&
              pA.institution.toLowerCase() === pB.institution.toLowerCase()
          );
          edge = {
            source,
            target,
            weight: 0,
            sharedPapers: [],
            sameInstitution: sameInst,
            firstYear: year,
            lastYear: year,
          };
          edgeMap.set(key, edge);
        }

        edge.weight += 1;
        edge.firstYear = Math.min(edge.firstYear, year);
        edge.lastYear = Math.max(edge.lastYear, year);
        edge.sharedPapers.push({
          id: paper.id,
          title: paper.title,
          year,
          citedByCount: paper.citedByCount || 0,
        });
      }
    }
  }

  const edges = Array.from(edgeMap.values())
    .map((e) => ({
      ...e,
      sharedPapers: e.sharedPapers
        .slice()
        .sort((a, b) => b.citedByCount - a.citedByCount),
    }))
    .sort((a, b) => b.weight - a.weight);

  const topInstitutions = Array.from(instCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { people, edges, topInstitutions };
}

interface MutableCollabAcc {
  id: string;
  name: string;
  institution?: string;
  countryCode?: string;
  sharedCount: number;
  firstYear: number;
  lastYear: number;
  sameInstitution: boolean;
  targetFirstCount: number;
  targetLastCount: number;
  coFirstCount: number;
  coLastCount: number;
  sharedPapers: {
    id: string;
    title: string;
    year: number;
    citedByCount: number;
  }[];
  paperIds: Set<string>;
}

export async function buildAuthorRelationshipNetwork(
  authorId: string,
  authorName: string,
  works: Paper[]
): Promise<AuthorRelationshipNetwork> {
  const cleanCenterId = normalizeAuthorId(authorId);
  const currentYear = new Date().getFullYear();

  const collabMap = new Map<string, MutableCollabAcc>();
  const paperCollaborators = new Map<string, string[]>();

  for (const paper of works) {
    const year = paper.publicationYear || currentYear;
    const capped = paper.authors.slice(0, 15);
    const centerAuth = capped.find(
      (a) => a.id && normalizeAuthorId(a.id) === cleanCenterId
    );
    const centerInst = centerAuth?.institution?.toLowerCase();
    const centerInstId = centerAuth?.institutionId;
    const centerPos = centerAuth?.position;

    const peerIdsInPaper: string[] = [];

    for (const auth of capped) {
      if (!auth.id) continue;
      const cid = normalizeAuthorId(auth.id);
      if (cid === cleanCenterId) continue;

      peerIdsInPaper.push(cid);
      let acc = collabMap.get(cid);
      if (!acc) {
        acc = {
          id: cid,
          name: auth.name,
          institution: auth.institution,
          countryCode: auth.countryCode,
          sharedCount: 0,
          firstYear: year,
          lastYear: year,
          sameInstitution: false,
          targetFirstCount: 0,
          targetLastCount: 0,
          coFirstCount: 0,
          coLastCount: 0,
          sharedPapers: [],
          paperIds: new Set<string>(),
        };
        collabMap.set(cid, acc);
      }

      if (!acc.paperIds.has(paper.id)) {
        acc.paperIds.add(paper.id);
        acc.sharedCount += 1;
        if (year > 0) {
          acc.firstYear = Math.min(acc.firstYear, year);
          acc.lastYear = Math.max(acc.lastYear, year);
        }
        if (auth.institution && (!acc.institution || year >= acc.lastYear)) {
          acc.institution = auth.institution;
          acc.countryCode = auth.countryCode || acc.countryCode;
        }
        if (
          (centerInstId && auth.institutionId && centerInstId === auth.institutionId) ||
          (centerInst && auth.institution && centerInst === auth.institution.toLowerCase())
        ) {
          acc.sameInstitution = true;
        }
        if (centerPos === "first") acc.targetFirstCount += 1;
        if (centerPos === "last") acc.targetLastCount += 1;
        if (auth.position === "first") acc.coFirstCount += 1;
        if (auth.position === "last") acc.coLastCount += 1;

        acc.sharedPapers.push({
          id: paper.id,
          title: paper.title,
          year,
          citedByCount: paper.citedByCount || 0,
        });
      }
    }

    if (peerIdsInPaper.length >= 2) {
      paperCollaborators.set(paper.id, Array.from(new Set(peerIdsInPaper)).sort());
    }
  }

  const topCollaboratorsRaw = Array.from(collabMap.values())
    .sort((a, b) => {
      if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
      if (b.lastYear !== a.lastYear) return b.lastYear - a.lastYear;
      const aMaxCite = Math.max(...a.sharedPapers.map((p) => p.citedByCount), 0);
      const bMaxCite = Math.max(...b.sharedPapers.map((p) => p.citedByCount), 0);
      return bMaxCite - aMaxCite;
    })
    .slice(0, 18);

  const collaborators: CollaboratorProfile[] = topCollaboratorsRaw.map((acc) => {
    let phase: "ongoing" | "longterm" | "early" = "early";
    if (acc.lastYear >= currentYear - 2) {
      phase = "ongoing";
    } else if (acc.lastYear - acc.firstYear >= 4 && acc.sharedCount >= 3) {
      phase = "longterm";
    }

    let roleDynamic = "Research Collaborator";
    if (acc.targetFirstCount >= 2 && acc.coLastCount >= 2) {
      roleDynamic = "Senior / Advisor-side";
    } else if (acc.targetLastCount >= 2 && acc.coFirstCount >= 2) {
      roleDynamic = "Lead / Mentee-side";
    } else if (
      (acc.targetLastCount >= 1 && acc.coLastCount >= 1) ||
      (acc.targetFirstCount >= 1 && acc.coFirstCount >= 1)
    ) {
      roleDynamic = "Co-Lead / Peer PI";
    } else if (acc.sameInstitution) {
      roleDynamic = "Same-Lab Collaborator";
    }

    return {
      id: acc.id,
      name: acc.name,
      institution: acc.institution,
      countryCode: acc.countryCode,
      sharedCount: acc.sharedCount,
      firstYear: acc.firstYear,
      lastYear: acc.lastYear,
      phase,
      roleDynamic,
      sameInstitution: acc.sameInstitution,
      sharedPapers: acc.sharedPapers
        .slice()
        .sort((a, b) => b.citedByCount - a.citedByCount)
        .slice(0, 6),
    };
  });

  const selectedCollabSet = new Set(collaborators.map((c) => c.id));
  const peerEdgeMap = new Map<string, { source: string; target: string; weight: number }>();

  for (const ids of Array.from(paperCollaborators.values())) {
    const filtered = ids.filter((id) => selectedCollabSet.has(id));
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        const key = `${filtered[i]}__${filtered[j]}`;
        const existing = peerEdgeMap.get(key);
        if (existing) existing.weight += 1;
        else peerEdgeMap.set(key, { source: filtered[i], target: filtered[j], weight: 1 });
      }
    }
  }

  // Intellectual Lineage (Influenced By via referenced_works & Influences via citing works)
  const topCitedWorks = works
    .slice()
    .sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));

  const refFreq = new Map<string, number>();
  for (const w of topCitedWorks.slice(0, 20)) {
    for (const refId of w.referencedWorks || []) {
      if (!refId || refId === w.id) continue;
      refFreq.set(refId, (refFreq.get(refId) || 0) + 1);
    }
  }

  const topRefIds = Array.from(refFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id]) => id);

  const highestWork = topCitedWorks[0];

  const [refPapers, citingRes] = await Promise.all([
    topRefIds.length > 0
      ? getWorksByIds(topRefIds, 20).catch(() => [])
      : Promise.resolve([]),
    highestWork && highestWork.citedByCount > 0
      ? searchPapers({ citesId: highestWork.id, sort: "citations", page: 1 }).catch(
          () => ({ results: [], totalCount: 0, page: 1 })
        )
      : Promise.resolve({ results: [], totalCount: 0, page: 1 }),
  ]);

  const aggregateLineage = (
    papers: Paper[],
    weightFn: (p: Paper) => number
  ): LineagePerson[] => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        institution?: string;
        count: number;
        samplePapers: Map<string, { id: string; title: string; year: number }>;
      }
    >();

    for (const p of papers) {
      const w = weightFn(p);
      for (const a of p.authors.slice(0, 5)) {
        if (!a.id) continue;
        const cid = normalizeAuthorId(a.id);
        if (cid === cleanCenterId) continue;

        let entry = map.get(cid);
        if (!entry) {
          entry = {
            id: cid,
            name: a.name,
            institution: a.institution,
            count: 0,
            samplePapers: new Map(),
          };
          map.set(cid, entry);
        }
        if (!entry.samplePapers.has(p.id)) {
          entry.count += w;
          entry.samplePapers.set(p.id, {
            id: p.id,
            title: p.title,
            year: p.publicationYear,
          });
        }
        if (!entry.institution && a.institution) {
          entry.institution = a.institution;
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        name: item.name,
        institution: item.institution,
        count: item.count,
        samplePapers: Array.from(item.samplePapers.values()).slice(0, 3),
      }));
  };

  const influencedBy = aggregateLineage(refPapers, (p) => refFreq.get(p.id) || 1);
  const influences = aggregateLineage(citingRes.results || [], () => 1);

  return {
    centerId: cleanCenterId,
    centerName: authorName,
    collaborators,
    peerEdges: Array.from(peerEdgeMap.values()).sort((a, b) => b.weight - a.weight),
    sampledPapersCount: works.length,
    influencedBy,
    influences,
  };
}

export interface LayoutNodeInput {
  id: string;
  role?: ConceptPersonRole | "center";
  weight?: number;
}

export interface LayoutEdgeInput {
  source: string;
  target: string;
  weight: number;
}

export function computeDeterministicGraphLayout(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  width: number,
  height: number,
  mode: "concept" | "ego"
): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  if (nodes.length === 0) return pos;

  const padX = 68;
  const padY = 54;

  if (mode === "concept") {
    const sectorOrder: ConceptPersonRole[] = [
      "pioneer",
      "bridge",
      "authority",
      "frontier",
    ];
    const sectorAnchorX: Record<ConceptPersonRole, number> = {
      pioneer: width * 0.16,
      bridge: width * 0.44,
      authority: width * 0.58,
      frontier: width * 0.84,
    };

    const grouped: Record<ConceptPersonRole, LayoutNodeInput[]> = {
      pioneer: [],
      bridge: [],
      authority: [],
      frontier: [],
    };

    for (const n of nodes) {
      const r: ConceptPersonRole =
        n.role && n.role !== "center" ? n.role : "authority";
      grouped[r].push(n);
    }

    for (const role of sectorOrder) {
      const list = grouped[role]
        .slice()
        .sort((a, b) => (b.weight || 0) - (a.weight || 0) || a.id.localeCompare(b.id));
      const len = list.length;
      list.forEach((n, idx) => {
        const yFrac = (idx + 1) / (len + 1);
        const y = padY + yFrac * (height - padY * 2);
        const xJitter = ((idx % 2) - 0.5) * 46;
        pos[n.id] = {
          x: Math.max(padX, Math.min(width - padX, sectorAnchorX[role] + xJitter)),
          y,
        };
      });
    }

    const minDist = 66;
    const iterations = 110;
    for (let iter = 0; iter < iterations; iter++) {
      // Edge spring attraction
      for (const e of edges) {
        const pA = pos[e.source];
        const pB = pos[e.target];
        if (!pA || !pB) continue;
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ideal = 115;
        if (dist > ideal) {
          const strength = 0.035 * Math.min(e.weight, 4);
          const pull = ((dist - ideal) / dist) * strength;
          pA.x += dx * pull;
          pA.y += dy * pull;
          pB.x -= dx * pull;
          pB.y -= dy * pull;
        }
      }

      // Gentle pull toward chronological role X sector
      for (const n of nodes) {
        const r: ConceptPersonRole =
          n.role && n.role !== "center" ? n.role : "authority";
        const p = pos[n.id];
        p.x += (sectorAnchorX[r] - p.x) * 0.04;
      }

      // Pairwise collision repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pA = pos[nodes[i].id];
          const pB = pos[nodes[j].id];
          let dx = pB.x - pA.x;
          let dy = pB.y - pA.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.001) {
            dx = (i % 2 === 0 ? 1 : -1) * 0.5;
            dy = (j % 2 === 0 ? 1 : -1) * 0.5;
            dist = Math.hypot(dx, dy);
          }
          if (dist < minDist) {
            const push = ((minDist - dist) / dist) * 0.42;
            pA.x -= dx * push;
            pA.y -= dy * push;
            pB.x += dx * push;
            pB.y += dy * push;
          }
        }
      }

      // Bounds clamp
      for (const n of nodes) {
        const p = pos[n.id];
        p.x = Math.max(padX, Math.min(width - padX, p.x));
        p.y = Math.max(padY, Math.min(height - padY, p.y));
      }
    }

    return pos;
  }

  // Ego mode: pin center node at (width / 2, height / 2)
  const cx = width / 2;
  const cy = height / 2;
  const centerNode = nodes.find((n) => n.role === "center");
  const orbitNodes = nodes
    .filter((n) => n.id !== centerNode?.id)
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0) || a.id.localeCompare(b.id));

  if (centerNode) {
    pos[centerNode.id] = { x: cx, y: cy };
  }

  const maxWeight = Math.max(...orbitNodes.map((n) => n.weight || 1), 1);
  const rxBase = Math.min(width * 0.4, 300);
  const ryBase = Math.min(height * 0.39, 175);

  const targetRadius: Record<string, { rx: number; ry: number }> = {};

  orbitNodes.forEach((n, idx) => {
    const angle = (idx / Math.max(orbitNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const norm = (n.weight || 1) / maxWeight;
    const scale = 0.56 + (1 - norm) * 0.44;
    const rx = rxBase * scale;
    const ry = ryBase * scale;
    targetRadius[n.id] = { rx, ry };
    pos[n.id] = {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    };
  });

  const minDist = 66;
  const minCenterDist = 92;
  for (let iter = 0; iter < 90; iter++) {
    // Peer edges pull teammates into visible clusters
    for (const e of edges) {
      if (e.source === centerNode?.id || e.target === centerNode?.id) continue;
      const pA = pos[e.source];
      const pB = pos[e.target];
      if (!pA || !pB) continue;
      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 95) {
        const pull = 0.04 * Math.min(e.weight, 3);
        pA.x += dx * pull;
        pA.y += dy * pull;
        pB.x -= dx * pull;
        pB.y -= dy * pull;
      }
    }

    // Repulsion between orbiting nodes
    for (let i = 0; i < orbitNodes.length; i++) {
      for (let j = i + 1; j < orbitNodes.length; j++) {
        const pA = pos[orbitNodes[i].id];
        const pB = pos[orbitNodes[j].id];
        let dx = pB.x - pA.x;
        let dy = pB.y - pA.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.001) {
          dx = 1;
          dy = 1;
          dist = 1.414;
        }
        if (dist < minDist) {
          const push = ((minDist - dist) / dist) * 0.45;
          pA.x -= dx * push;
          pA.y -= dy * push;
          pB.x += dx * push;
          pB.y += dy * push;
        }
      }
    }

    // Maintain distance from fixed center + soft radial target
    for (const n of orbitNodes) {
      const p = pos[n.id];
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < minCenterDist) {
        const push = (minCenterDist - dist) / dist;
        p.x += dx * push * 0.6;
        p.y += dy * push * 0.6;
      } else {
        const target = targetRadius[n.id];
        const angle = Math.atan2(dy, dx);
        const tx = cx + Math.cos(angle) * target.rx;
        const ty = cy + Math.sin(angle) * target.ry;
        p.x += (tx - p.x) * 0.06;
        p.y += (ty - p.y) * 0.06;
      }

      p.x = Math.max(padX, Math.min(width - padX, p.x));
      p.y = Math.max(padY, Math.min(height - padY, p.y));
    }
  }

  return pos;
}
