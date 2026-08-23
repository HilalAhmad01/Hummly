import Fuse from 'fuse.js';
import { SearchableSong } from '@/types/game';
import { BOLLYWOOD_SEARCHABLE_CATALOG } from '@/lib/mock-data';

// Normalization function to handle common Hindi transliteration variations
export function normalizeHindiText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/chhaiya/g, 'chaiyya')
    .replace(/chaiya/g, 'chaiyya')
    .replace(/kesaria/g, 'kesariya')
    .replace(/kabhi/g, 'kabhie')
    .replace(/phir/g, 'fir')
    .replace(/shreya ghoshal/g, 'shreya ghosal')
    .replace(/[^a-z0-9\s]/gi, '');
}

// In-memory Fuse instance configured for sub-5ms instant autocomplete
let fuseInstance: Fuse<SearchableSong> | null = null;

export function getSearchEngine(customCatalog?: SearchableSong[]): Fuse<SearchableSong> {
  const catalog = customCatalog || BOLLYWOOD_SEARCHABLE_CATALOG;
  
  if (!fuseInstance || customCatalog) {
    fuseInstance = new Fuse(catalog, {
      keys: [
        { name: 'title', weight: 0.55 },
        { name: 'movie_or_album', weight: 0.3 },
        { name: 'artist', weight: 0.15 },
      ],
      threshold: 0.38,
      distance: 100,
      ignoreLocation: true,
      minMatchCharLength: 1,
      includeScore: true,
      shouldSort: true,
    });
  }

  return fuseInstance;
}

export function searchSongs(
  query: string,
  limit: number = 7,
  customCatalog?: SearchableSong[]
): SearchableSong[] {
  if (!query || typeof query !== 'string') {
    return [];
  }

  // Security Hardening: Bound max query length to 100 chars & strip control characters to prevent ReDoS / CPU stalls
  const cleanQuery = query
    .slice(0, 100)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  if (cleanQuery.length === 0) {
    return [];
  }

  const boundedLimit = Math.min(Math.max(1, limit), 20);
  const engine = getSearchEngine(customCatalog);
  const results = engine.search(cleanQuery);

  // Return top results up to limit
  return results.slice(0, boundedLimit).map((r) => r.item);
}

// Helper to check if a user guess matches target song (handles song ID match or title/movie fuzzy equivalence)
export function isGuessCorrect(
  selected: SearchableSong | null,
  targetSongId: string,
  targetSongTitle: string
): boolean {
  if (!selected) return false;

  if (selected.id === targetSongId) return true;

  // Secondary check: exact normalized title match
  const normSelected = normalizeHindiText(selected.title);
  const normTarget = normalizeHindiText(targetSongTitle);

  return normSelected === normTarget;
}
