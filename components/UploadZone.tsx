'use client';

import { useCallback, useState } from 'react';
import { parseAuctionZip } from '@/lib/parseZip';
import type { LotData } from '@/lib/types';

interface Props {
  onLotsLoaded: (lots: LotData[]) => void;
}

export function UploadZone({ onLotsLoaded }: Props) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setError('Please upload a .zip file');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { lots } = await parseAuctionZip(file);
        if (!lots.length) {
          setError('No lots found in zip');
          return;
        }
        onLotsLoaded(lots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse zip');
      } finally {
        setLoading(false);
      }
    },
    [onLotsLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const onDragLeave = useCallback(() => setDrag(false), []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
          drag
            ? 'border-accent bg-accent/5'
            : 'border-[#2A2A2A] hover:border-accent/60 hover:bg-surface/50'
        }`}
      >
        <input
          type="file"
          accept=".zip"
          onChange={onInputChange}
          disabled={loading}
          className="sr-only"
          id="zip-upload"
        />
        <label htmlFor="zip-upload" className="cursor-pointer block">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-4xl animate-spin">⟳</span>
              <p className="text-text-secondary">Parsing zip...</p>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-4 text-accent">📦</div>
              <p className="text-text-primary text-lg font-display">
                Drop your auction zip here
              </p>
              <p className="text-text-secondary text-sm mt-2">
                Accepts .zip from AuctionMethod export (Items List.csv + Lead Images/)
              </p>
              <p className="text-accent/80 text-sm mt-4">
                or click to browse
              </p>
            </>
          )}
        </label>
      </div>
      {error && (
        <p className="mt-4 text-error text-sm">{error}</p>
      )}
    </div>
  );
}
