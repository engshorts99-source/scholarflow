import { NextResponse } from "next/server";
import { mapWorkToPaper } from "@/lib/openalex";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sourceId = params.id.startsWith('S') ? params.id : `S${params.id}`;
  const url = `https://api.openalex.org/sources/${sourceId}?mailto=scholarflow.project@example.com`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.status === 404) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (!res.ok) throw new Error("API error");
    
    const data = await res.json();
    
    const journal = {
      id: data.id.replace("https://openalex.org/", ""),
      displayName: data.display_name,
      issn: data.issn,
      publisher: data.host_organization_name,
      worksCount: data.works_count,
      citedByCount: data.cited_by_count,
      homepageUrl: data.homepage_url
    };

    // Fetch latest papers for this journal
    const papersUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},type:article&sort=publication_date:desc&per-page=10&mailto=scholarflow.project@example.com`;
    const papersRes = await fetch(papersUrl, { next: { revalidate: 3600 } });
    let latestPapers = [];
    if (papersRes.ok) {
      const pData = await papersRes.json();
      latestPapers = pData.results.map(mapWorkToPaper);
    }
    
    return NextResponse.json({ journal, latestPapers });
  } catch (error) {
    console.error("Journal API Error:", error);
    return NextResponse.json({ error: "Failed to fetch journal details" }, { status: 500 });
  }
}
