# Hummly Strict Song Ingestion Protocol

When the user asks to add songs to the catalog:

1. **NO PLACEHOLDERS OR FALLBACK AUDIO**:
   - NEVER reuse an existing song's audio preview URL as a placeholder.
   - NEVER insert arbitrary or unverified audio streams.

2. **MANDATORY PRE-INGESTION VERIFICATION**:
   - Every song requested by the user MUST be queried against the official iTunes/Apple Music CDN via `scripts/add-verified-songs.mjs` before being committed to `src/lib/mock-data.ts`.
   - The query must match the exact song title and primary artist.
   - Automatically filter out Lofi, Slowed+Reverb, Covers, Tributes, Karaoke, and Unofficial Remixes to ensure only the original studio track is used.

3. **AUTHENTIC AUDIO OR EXCLUDE**:
   - If an official, authentic audio preview is found, assign the verified CDN URL and high-res cover art.
   - If no official preview stream exists for a track, do NOT assign a fake preview; explicitly inform the user or leave `deezer_preview_url: null` so it is safely excluded from gameplay rotation.
