'use client';

import { useCallback, useState } from 'react';
import { parseAuctionZip } from '@/lib/parseZip';
import type { LotData } from '@/lib/types';

interface Props {
  onLotsLoaded: (lots: LotData[]) => void;
}

interface AmTestStep {
  step: string;
  status: 'ok' | 'error';
  message?: string;
}

export function UploadZone({ onLotsLoaded }: Props) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amTestLoading, setAmTestLoading] = useState(false);
  const [amTestResult, setAmTestResult] = useState<{
    success: boolean;
    steps: AmTestStep[];
  } | null>(null);

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

  const testAmConnection = useCallback(async () => {
    setAmTestLoading(true);
    setAmTestResult(null);
    try {
      const res = await fetch('/api/am-test');
      const data = await res.json();
      if (!res.ok) {
        setAmTestResult({
          success: false,
          steps: [{ step: 'Request failed', status: 'error', message: data?.error ?? `HTTP ${res.status}` }],
        });
        return;
      }
      setAmTestResult({ success: data.success, steps: data.steps ?? [] });
    } catch (err) {
      setAmTestResult({
        success: false,
        steps: [
          {
            step: 'Request failed',
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    } finally {
      setAmTestLoading(false);
    }
  }, []);

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

      <div className="mt-12 w-full max-w-2xl">
        <h2 className="text-text-secondary text-sm font-medium mb-2">
          AuctionMethod connection
        </h2>
        <button
          type="button"
          onClick={testAmConnection}
          disabled={amTestLoading}
          className="px-4 py-2 rounded bg-[#2A2A2A] text-text-primary hover:bg-[#333] text-sm border border-[#333] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {amTestLoading ? 'Testing...' : 'Test connection'}
        </button>
        {amTestResult && (
          <div
            className={`mt-3 p-3 rounded text-sm border ${
              amTestResult.success
                ? 'bg-success/10 border-success/30'
                : 'bg-error/10 border-error/30'
            }`}
          >
            <p className={`font-medium mb-2 ${amTestResult.success ? 'text-success' : 'text-error'}`}>
              {amTestResult.success ? 'Connection successful' : 'Connection failed'}
            </p>
            <ul className="space-y-2 text-text-primary">
              {amTestResult.steps.map((s, i) => (
                <li key={i}>
                  <span className={s.status === 'ok' ? 'text-success' : 'text-error'}>
                    {s.status === 'ok' ? '✓' : '✗'}
                  </span>{' '}
                  {s.step}
                  {s.message && (
                    <span className="block ml-5 mt-0.5 text-text-secondary break-words">
                      {s.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
