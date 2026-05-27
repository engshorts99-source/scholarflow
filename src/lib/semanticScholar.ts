const BASE_URL = "https://api.semanticscholar.org/graph/v1";

export async function getPaperTldr(doi: string | null): Promise<string | null> {
  if (!doi) return null;
  // Clean DOI if it's a URL
  const cleanDoi = doi.replace("https://doi.org/", "");
  const url = `${BASE_URL}/paper/DOI:${cleanDoi}?fields=tldr`;
  
  try {
    // Semantic Scholar limits without API key are strict. We fetch and return null on failure.
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tldr?.text || null;
  } catch (error) {
    console.error("Semantic Scholar API error:", error);
    return null;
  }
}

export async function getBatchTldrs(dois: string[]): Promise<Record<string, string>> {
  const cleanDois = dois.map(doi => "DOI:" + doi.replace("https://doi.org/", ""));
  if (cleanDois.length === 0) return {};
  
  const url = `${BASE_URL}/paper/batch?fields=tldr,externalIds`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: cleanDois }),
      next: { revalidate: 86400 }
    });
    
    if (!res.ok) return {};
    const data = await res.json();
    
    const result: Record<string, string> = {};
    for (const paper of data) {
      if (paper && paper.externalIds?.DOI && paper.tldr?.text) {
        result[paper.externalIds.DOI.toLowerCase()] = paper.tldr.text;
      }
    }
    return result;
  } catch (error) {
    console.error("Semantic Scholar Batch API error:", error);
    return {};
  }
}
