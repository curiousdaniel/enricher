import type { LotData } from './types';

export interface EnrichResult {
  enrichedTitle: string;
  enrichedDescription: string;
}

/** Delay between API calls to stay under Claude's 30K input tokens/min limit (Tier 1) */
export const ENRICH_DELAY_MS = 30_000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichLot(lot: LotData): Promise<EnrichResult> {
  const res = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotNumber: lot.lotNumber,
      originalTitle: lot.title,
      originalDescription: lot.description ?? '',
      imageBase64: lot.imageBase64 ?? null,
      imageMimeType: lot.imageMimeType ?? null,
    }),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000;
    await sleep(Math.min(waitMs, 120_000));
    return enrichLot(lot);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    const msg = data?.error ?? data?.message ?? `Enrich failed: ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return res.json();
}
