import { NextResponse } from "next/server";
import { mapWorkToPaper } from "@/lib/openalex";
import { format, subDays } from "date-fns";

export const runtime = 'edge';

export async function GET() {
  try {
    const oneWeekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    
    // Fetch papers from the last week, sorted by citation count
    const url = `https://api.openalex.org/works?filter=from_publication_date:${oneWeekAgo},type:article&sort=cited_by_count:desc&per-page=20&mailto=scholarflow.project@example.com`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("API error");
    
    const data = await res.json();
    const trendingPapers = data.results.map(mapWorkToPaper);
    
    return NextResponse.json({ trendingPapers });
  } catch (error) {
    console.error("Trending API Error:", error);
    return NextResponse.json({ error: "Failed to fetch trending papers" }, { status: 500 });
  }
}
