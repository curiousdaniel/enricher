'use client';

import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import type { EnrichedLot, LotStatus } from '@/lib/types';

interface Props {
  lot: EnrichedLot;
  onUpdate: (updates: Partial<EnrichedLot>) => void;
  onRerun: () => void;
}

export function LotRow({ lot, onUpdate, onRerun }: Props) {
  const [showImageModal, setShowImageModal] = useState(false);
  const el = lot;
  const hasError = el.status === 'error';

  const handleTitleChange = (v: string) =>
    onUpdate({
      enrichedTitle: v,
      status: (el.status === 'enriched' ? 'edited' : el.status) as LotStatus,
    });
  const handleDescChange = (v: string) =>
    onUpdate({
      enrichedDescription: v,
      status: (el.status === 'enriched' ? 'edited' : el.status) as LotStatus,
    });

  const imgSrc =
    el.original.imageBase64 && el.original.imageMimeType
      ? `data:${el.original.imageMimeType};base64,${el.original.imageBase64}`
      : null;

  return (
    <tr
      className={`border-b border-[#2A2A2A] ${
        hasError ? 'bg-error/10' : 'hover:bg-surface/50'
      }`}
    >
      <td className="p-3 align-top">
        {imgSrc ? (
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="block w-20 h-20 rounded overflow-hidden border border-[#2A2A2A] hover:border-accent transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={`Lot ${el.original.lotNumber}`}
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <div className="w-20 h-20 rounded bg-[#2A2A2A] flex items-center justify-center text-text-secondary text-xs">
            No img
          </div>
        )}
      </td>
      <td className="p-3 align-top max-w-xs">
        <p className="text-text-secondary text-sm font-medium">
          Lot {el.original.lotNumber}
        </p>
        <p className="text-text-secondary/80 text-sm mt-1 line-clamp-2">
          {el.original.title || '(no title)'}
        </p>
        <p className="text-text-secondary/60 text-xs mt-1 line-clamp-2">
          {el.original.description || '(no description)'}
        </p>
      </td>
      <td className="p-3 align-top">
        <input
          type="text"
          value={el.enrichedTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full bg-surface border border-[#2A2A2A] rounded px-2 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          placeholder="Enriched title"
        />
        <textarea
          value={el.enrichedDescription}
          onChange={(e) => handleDescChange(e.target.value)}
          rows={3}
          className="w-full mt-2 bg-surface border border-[#2A2A2A] rounded px-2 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent resize-y"
          placeholder="Enriched description"
        />
      </td>
      <td className="p-3 align-top">
        <div className="flex flex-col gap-2">
          <StatusBadge status={el.status} />
          {hasError && el.error && (
            <p className="text-error text-xs max-w-[200px]">{el.error}</p>
          )}
          <button
            type="button"
            onClick={onRerun}
            className="text-accent hover:text-accent/80 text-xs underline"
          >
            Re-run
          </button>
        </div>
      </td>

      {showImageModal && imgSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowImageModal(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setShowImageModal(false)}
          aria-label="Close"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={`Lot ${el.original.lotNumber} - full size`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </tr>
  );
}
