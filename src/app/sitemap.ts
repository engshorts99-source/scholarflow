import { MetadataRoute } from 'next';
import { format, subDays } from 'date-fns';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://scholarflow.pages.dev';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.8,
    },
  ];

  // Try to fetch top trending papers to include in sitemap
  try {
    const oneWeekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const url = `https://api.openalex.org/works?filter=from_publication_date:${oneWeekAgo},type:article&sort=cited_by_count:desc&per-page=50&mailto=scholarflow.project@example.com`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      data.results.forEach((paper: { id: string }) => {
        const id = paper.id.replace("https://openalex.org/", "");
        routes.push({
          url: `${baseUrl}/paper/${id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        });
      });
    }
  } catch (e) {
    console.error("Sitemap generation error", e);
  }

  return routes;
}
