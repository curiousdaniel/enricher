'use client';

import { useState } from 'react';
import { exportEnrichedCSV } from '@/lib/exportCSV';
import { AuctionSelector, type Auction } from './AuctionSelector';
import type { EnrichedLot } from '@/lib/types';

interface Props {
  lots: EnrichedLot[];
  onLotsUpdate: (lots: EnrichedLot[]) => void;
}

export function ActionBar({ lots, onLotsUpdate }: Props) {
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [pushing, setPushing] = useState(false);
  const [pushResults, setPushResults] = useState<
    { lotNumber: string; success: boolean; error?: string }[] | null
  >(null);

  const enriched = lots.filter((l) => l.status === 'enriched' || l.status === 'edited').length;
  const errors = lots.filter((l) => l.status === 'error').length;
  const pushed = lots.filter((l) => l.status === 'pushed').length;
  const notCompleted = lots.filter(
    (l) => l.status === 'pending' || l.status === 'processing'
  ).length;

  const handleExportCSV = () => {
    const csv = exportEnrichedCSV(lots);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePush = async () => {
    if (!selectedAuction) return;
    setPushing(true);
    setPushResults(null);
    try {
      const toPush = lots.filter(
        (l) => l.status === 'enriched' || l.status === 'edited'
      );
      const res = await fetch('/api/push-to-am', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: String(selectedAuction.id),
          lots: toPush.map((l) => ({
            lotNumber: l.original.lotNumber,
            enrichedTitle: l.enrichedTitle,
            enrichedDescription: l.enrichedDescription,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Push failed');
      setPushResults(data.results ?? []);

      const next = lots.map((l) => {
        const r = (data.results as { lotNumber: string; success: boolean }[])?.find(
          (x) => x.lotNumber === l.original.lotNumber
        );
        if (r?.success) return { ...l, status: 'pushed' as const };
        return l;
      });
      onLotsUpdate(next);
    } catch (err) {
      setPushResults([
        {
          lotNumber: '-',
          success: false,
          error: err instanceof Error ? err.message : 'Push failed',
        },
      ]);
    } finally {
      setPushing(false);
    }
  };

  const toPushCount = lots.filter(
    (l) => l.status === 'enriched' || l.status === 'edited'
  ).length;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A]/95 backdrop-blur border-t border-[#2A2A2A] px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-text-secondary text-sm">
            {enriched} enriched
            {errors > 0 && <>, {errors} errors</>}
            {notCompleted > 0 && <>, {notCompleted} not completed</>}
            {pushed > 0 ? `, ${pushed} pushed` : ''}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm font-medium"
            >
              Export Enriched CSV
            </button>
            <button
              type="button"
              onClick={() => setPushModalOpen(true)}
              className="px-4 py-2 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm font-medium"
            >
              Push to AuctionMethod
            </button>
          </div>
        </div>
      </div>

      {pushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-[#2A2A2A] rounded-xl max-w-md w-full p-6">
            <h2 className="font-display text-xl text-text-primary mb-4">
              Push to AuctionMethod
            </h2>
            <div className="space-y-4">
              <AuctionSelector onSelect={setSelectedAuction} />
              {selectedAuction && (
                <div className="text-sm text-text-secondary space-y-1">
                  <p>
                    <strong className="text-text-primary">
                      {selectedAuction.title}
                    </strong>{' '}
                    (ID: {selectedAuction.id})
                  </p>
                  <p>{toPushCount} lots will be updated (title + description)</p>
                </div>
              )}
              {pushResults !== null && (
                <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                  {pushResults.map((r) => (
                    <div
                      key={r.lotNumber === '-' ? 'push-error' : r.lotNumber}
                      className={r.success ? 'text-success' : 'text-error'}
                    >
                      {r.lotNumber === '-'
                        ? (r.error ?? 'Push failed')
                        : `Lot ${r.lotNumber}: ${r.success ? '✓' : r.error}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handlePush}
                disabled={!selectedAuction || pushing}
                className="px-4 py-2 rounded bg-accent text-black hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {pushing ? 'Pushing...' : 'Confirm Push'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPushModalOpen(false);
                  setSelectedAuction(null);
                  setPushResults(null);
                }}
                className="px-4 py-2 rounded bg-[#2A2A2A] text-text-primary hover:bg-[#333] text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
