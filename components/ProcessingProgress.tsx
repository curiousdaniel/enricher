'use client';

import { useEffect, useRef } from 'react';
import { enrichLot } from '@/lib/enrichLot';
import { StatusBadge } from './StatusBadge';
import type { EnrichedLot } from '@/lib/types';

interface Props {
  lots: EnrichedLot[];
  onLotsUpdate: (lots: EnrichedLot[]) => void;
  onComplete: () => void;
}

export function ProcessingProgress({ lots, onLotsUpdate, onComplete }: Props) {
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function process() {
      const updated = [...lots];

      for (let i = 0; i < updated.length; i++) {
        if (cancelled || !mountedRef.current || pausedRef.current) break;
        const el = updated[i];
        if (el.status !== 'pending') continue;

        updated[i] = { ...el, status: 'processing' };
        onLotsUpdate([...updated]);

        try {
          const result = await enrichLot(el.original);
          if (!mountedRef.current) return;
          updated[i] = {
            ...el,
            enrichedTitle: result.enrichedTitle,
            enrichedDescription: result.enrichedDescription,
            status: 'enriched',
          };
        } catch (err) {
          if (!mountedRef.current) return;
          updated[i] = {
            ...el,
            enrichedTitle: el.original.title,
            enrichedDescription: el.original.description,
            status: 'error',
            error: err instanceof Error ? err.message : 'Enrichment failed',
          };
        }
        onLotsUpdate([...updated]);
      }

      const allDone = updated.every(
        (l) => l.status === 'enriched' || l.status === 'error'
      );
      if (allDone && mountedRef.current) onComplete();
    }

    process();
    return () => { cancelled = true; };
  }, [lots, onLotsUpdate, onComplete]);

  const done = lots.filter((l) => l.status === 'enriched' || l.status === 'error').length;
  const total = lots.length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-2xl text-text-primary mb-6">
          Enriching Lots
        </h1>
        <div className="mb-6">
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-text-secondary text-sm mt-2">
            Enriching lot {done + 1} of {total}...
          </p>
        </div>
        <div className="grid gap-3">
          {lots.map((el) => (
            <div
              key={el.original.lotNumber}
              className="flex items-center gap-4 p-3 rounded-lg bg-surface border border-[#2A2A2A]"
            >
              {el.original.imageBase64 ? (
                <img
                  src={`data:${el.original.imageMimeType ?? 'image/jpeg'};base64,${el.original.imageBase64}`}
                  alt={`Lot ${el.original.lotNumber}`}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-[#2A2A2A] rounded flex items-center justify-center text-text-secondary text-xs">
                  No img
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">
                  Lot {el.original.lotNumber}: {el.original.title || '(no title)'}
                </p>
              </div>
              <StatusBadge status={el.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
