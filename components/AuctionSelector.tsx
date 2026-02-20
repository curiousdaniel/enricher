'use client';

import { useEffect, useState } from 'react';

export interface Auction {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  city: string;
  state: string;
}

interface Props {
  onSelect: (auction: Auction | null) => void;
}

export function AuctionSelector({ onSelect }: Props) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  const fetchAuctions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auctions');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error ?? `Failed to load auctions (${res.status})`;
        throw new Error(msg);
      }
      setAuctions(data.auctions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedId(val);
    const found = auctions.find((a) => String(a.id) === val) ?? null;
    onSelect(found);
  };

  const formatLabel = (a: Auction) => {
    const date = new Date(a.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const location = a.city && a.state ? ` · ${a.city}, ${a.state}` : '';
    return `${a.title}${location} — ends ${date} (ID: ${a.id})`;
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-amber-400/70 text-sm">
        <span className="animate-spin">⟳</span> Loading auctions...
      </div>
    );

  if (error)
    return (
      <div className="text-red-400 text-sm flex items-center gap-3">
        {error}
        <button
          onClick={fetchAuctions}
          className="underline hover:text-red-300"
          type="button"
        >
          Retry
        </button>
      </div>
    );

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="w-full bg-[#111] border border-[#333] text-[#F5F0E8] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors hover:border-[#555] cursor-pointer"
    >
      <option value="">— Select an auction —</option>
      {auctions.map((a) => (
        <option key={a.id} value={String(a.id)}>
          {formatLabel(a)}
        </option>
      ))}
    </select>
  );
}
