import { NextResponse } from "next/server";


import { getPaperById } from "@/lib/openalex";
import { getPaperTldr } from "@/lib/semanticScholar";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paper = await getPaperById(params.id);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }
    
    if (paper.doi) {
      const tldr = await getPaperTldr(paper.doi);
      paper.tldr = tldr;
    }
    
    return NextResponse.json(paper);
  } catch (error) {
    console.error("Paper API Error:", error);
    return NextResponse.json({ error: "Failed to fetch paper details" }, { status: 500 });
  }
}
