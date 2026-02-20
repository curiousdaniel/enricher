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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Enrich failed: ${res.status}`);
  }

  return res.json();
}
