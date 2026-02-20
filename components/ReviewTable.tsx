'use client';

import { useCallback } from 'react';
import { LotRow } from './LotRow';
import { enrichLot } from '@/lib/enrichLot';
import type { EnrichedLot } from '@/lib/types';

interface Props {
  lots: EnrichedLot[];
  onLotsUpdate: (lots: EnrichedLot[]) => void;
}

export function ReviewTable({ lots, onLotsUpdate }: Props) {
  const updateOne = useCallback(
    (index: number, updates: Partial<EnrichedLot>) => {
      const next = [...lots];
      next[index] = { ...next[index], ...updates };
      onLotsUpdate(next);
    },
    [lots, onLotsUpdate]
  );

  const rerunOne = useCallback(
    async (index: number) => {
      const el = lots[index];
      updateOne(index, { status: 'processing' });
      try {
        const result = await enrichLot(el.original);
        updateOne(index, {
          enrichedTitle: result.enrichedTitle,
          enrichedDescription: result.enrichedDescription,
          status: 'enriched',
          error: undefined,
        });
      } catch (err) {
        updateOne(index, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Enrichment failed',
        });
      }
    },
    [lots, updateOne]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-accent bg-surface sticky top-0">
            <th className="text-left p-3 text-text-secondary text-sm font-display w-24">
              Image
            </th>
            <th className="text-left p-3 text-text-secondary text-sm font-display">
              Original
            </th>
            <th className="text-left p-3 text-text-secondary text-sm font-display">
              Enriched (editable)
            </th>
            <th className="text-left p-3 text-text-secondary text-sm font-display w-32">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot, i) => (
            <LotRow
              key={`${lot.original.lotNumber}-${i}`}
              lot={lot}
              onUpdate={(u) => updateOne(i, u)}
              onRerun={() => rerunOne(i)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
