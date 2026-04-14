import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  // This portal is private — no public pages to index
  return [];
}
