import { Suspense } from "react";
import ClientVenues from "./ClientVenues";

export const runtime = "edge";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const preset =
    typeof searchParams.preset === "string" ? searchParams.preset : "";
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const suffix =
    preset === "immunology"
      ? "Immunology Elite Lab & Topic Radar"
      : preset === "cns"
      ? "Nature · Cell · Science Lab Streaks"
      : "Top-Journal Lab & Topic Radar";

  return {
    title: q ? `${q} — ${suffix} | Schox` : `${suffix} | Schox`,
    description:
      "Discover which research teams publish repeatedly in Nature, Cell, Science, or custom multi-journal selections, how their research topics connect, and filter between Research Articles (incl. Letters) and Reviews.",
  };
}

export default function VenuesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ClientVenues />
    </Suspense>
  );
}
