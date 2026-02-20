'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ReviewTable } from '@/components/ReviewTable';
import { ActionBar } from '@/components/ActionBar';
import type { LotData, EnrichedLot } from '@/lib/types';

function toEnrichedLot(lot: LotData): EnrichedLot {
  return {
    original: lot,
    enrichedTitle: lot.title,
    enrichedDescription: lot.description ?? '',
    status: 'pending',
  };
}

export default function HomePage() {
  const [lots, setLots] = useState<EnrichedLot[] | null>(null);
  const [phase, setPhase] = useState<'upload' | 'processing' | 'review'>(
    'upload'
  );

  const handleLotsLoaded = useCallback((raw: LotData[]) => {
    setLots(raw.map(toEnrichedLot));
    setPhase('processing');
  }, []);

  const handleLotsUpdate = useCallback((updated: EnrichedLot[]) => {
    setLots(updated);
  }, []);

  const handleProcessingComplete = useCallback(() => {
    setPhase('review');
  }, []);

  if (phase === 'upload') {
    return <UploadZone onLotsLoaded={handleLotsLoaded} />;
  }

  if (phase === 'processing' && lots) {
    return (
      <ProcessingProgress
        lots={lots}
        onLotsUpdate={handleLotsUpdate}
        onComplete={handleProcessingComplete}
      />
    );
  }

  if (phase === 'review' && lots) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="font-display text-3xl text-text-primary mb-6">
            Review Enriched Lots
          </h1>
          <ReviewTable lots={lots} onLotsUpdate={handleLotsUpdate} />
        </div>
        <ActionBar lots={lots} onLotsUpdate={handleLotsUpdate} />
      </div>
    );
  }

  return null;
}
