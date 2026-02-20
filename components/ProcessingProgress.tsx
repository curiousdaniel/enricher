'use client';

import { useEffect, useRef, useState } from 'react';
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
  const stoppedRef = useRef(false);
  const mountedRef = useRef(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    pausedRef.current = isPaused;
    stoppedRef.current = isStopped;

    async function process() {
      const updated = [...lots];

      for (let i = 0; i < updated.length; i++) {
        if (cancelled || !mountedRef.current || pausedRef.current || stoppedRef.current) break;
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
    }

    if (!isStopped && !isPaused) process();
    return () => { cancelled = true; };
  }, [lots, onLotsUpdate, isPaused, isStopped, resumeKey]);

  const done = lots.filter((l) => l.status === 'enriched' || l.status === 'error').length;
  const total = lots.length;
  const allDone = done === total;
  const hasPending = lots.some((l) => l.status === 'pending');
  const canViewResults = allDone || isStopped;

  const handlePause = () => {
    setIsPaused(true);
    pausedRef.current = true;
  };

  const handleResume = () => {
    setIsPaused(false);
    pausedRef.current = false;
    setResumeKey((k) => k + 1);
  };

  const handleStop = () => {
    setIsStopped(true);
    stoppedRef.current = true;
    pausedRef.current = true;
  };

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
            Enriching lot {Math.min(done + 1, total)} of {total}...
          </p>
          {(() => {
            const errorCount = lots.filter((l) => l.status === 'error').length;
            if (errorCount > 0) {
              return (
                <p className="text-error text-sm mt-1 font-medium">
                  {errorCount} lot{errorCount !== 1 ? 's' : ''} failed — see details below
                </p>
              );
            }
            return null;
          })()}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {hasPending && !isStopped && (
            isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className="px-4 py-2 rounded bg-accent text-black hover:bg-accent/90 text-sm font-medium"
              >
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="px-4 py-2 rounded bg-[#2A2A2A] text-text-primary hover:bg-[#333] text-sm font-medium border border-[#333]"
              >
                Pause
              </button>
            )
          )}
          {hasPending && !isStopped && (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 rounded bg-error/20 text-error hover:bg-error/30 text-sm font-medium border border-error/40"
            >
              Stop & View Results
            </button>
          )}
          {canViewResults && (
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 rounded bg-accent text-black hover:bg-accent/90 text-sm font-medium"
            >
              View Results
            </button>
          )}
        </div>
        <div className="grid gap-3">
          {lots.map((el) => (
            <div
              key={el.original.lotNumber}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                el.status === 'error'
                  ? 'bg-error/5 border-error/30'
                  : 'bg-surface border-[#2A2A2A]'
              }`}
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
                {el.status === 'error' && el.error && (
                  <p className="text-error text-sm mt-1.5 max-w-md break-words font-medium">
                    {el.error}
                  </p>
                )}
              </div>
              <StatusBadge status={el.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
