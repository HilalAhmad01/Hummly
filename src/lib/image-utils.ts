/**
 * Image optimization & preloading utilities for fast zero-latency artwork rendering.
 */

export function getOptimizedCoverUrl(url?: string | null, size = 300): string | null {
  if (!url || typeof url !== 'string') return null;

  // Optimize Apple Music / iTunes CDN image dimensions (e.g. 600x600bb.jpg -> 300x300bb.jpg)
  if (url.includes('mzstatic.com')) {
    return url.replace(/\/\d+x\d+bb\.jpg$/, `/${size}x${size}bb.jpg`);
  }

  return url;
}

export function preloadImage(url?: string | null, size = 300): void {
  if (!url || typeof window === 'undefined') return;

  const targetUrl = getOptimizedCoverUrl(url, size);
  if (!targetUrl) return;

  try {
    const img = new Image();
    img.src = targetUrl;
  } catch {
    // Ignore preload errors gracefully
  }
}
