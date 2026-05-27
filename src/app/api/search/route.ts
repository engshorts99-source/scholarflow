import { NextResponse } from "next/server";

export const runtime = 'edge';
import { searchPapers } from "@/lib/openalex";
import { getBatchTldrs } from "@/lib/semanticScholar";
import { SearchParams } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const params: SearchParams = {
    q: searchParams.get("q") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    sort: (searchParams.get("sort") as SearchParams["sort"]) || undefined,
    journalId: searchParams.get("journalId") || undefined,
    yearFrom: searchParams.get("yearFrom") || undefined,
    yearTo: searchParams.get("yearTo") || undefined,
    oaOnly: searchParams.get("oaOnly") === "true",
  };
  
  try {
    const searchResult = await searchPapers(params);
    
    // Batch fetch TLDRs from Semantic Scholar
    const dois = searchResult.results
      .map(p => p.doi)
      .filter((doi): doi is string => doi !== null);
      
    if (dois.length > 0) {
      const tldrs = await getBatchTldrs(dois);
      searchResult.results = searchResult.results.map(paper => ({
        ...paper,
        tldr: paper.doi ? tldrs[paper.doi.toLowerCase().replace("https://doi.org/", "")] || null : null
      }));
    }
    
    return NextResponse.json(searchResult);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
