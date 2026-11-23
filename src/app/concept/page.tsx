import { Suspense } from "react";
import ClientConcept from "./ClientConcept";

export const runtime = "edge";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  return {
    title: q
      ? `${q} — Concept Origin, Research State & People | Schox`
      : "Concept Atlas | Schox",
    description: q
      ? `Explore when ${q} was first defined, its current research state, multi-era paper evolution, and researcher collaboration network.`
      : "Explore the paper-backed origin, evolution timeline, current research state, and researcher networks behind any scientific concept.",
  };
}

export default function ConceptPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-mint-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ClientConcept />
    </Suspense>
  );
}
