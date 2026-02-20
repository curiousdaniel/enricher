import type { LotData } from './types';

export interface EnrichResult {
  enrichedTitle: string;
  enrichedDescription: string;
}

export async function enrichLot(
  lot: LotData
): Promise<EnrichResult> {
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

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    const msg = data?.error ?? data?.message ?? `Enrich failed: ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return res.json();
}
