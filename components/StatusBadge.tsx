import type { LotStatus } from '@/lib/types';

interface Props {
  status: LotStatus;
}

const STYLES: Record<LotStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  processing: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
  enriched: 'bg-success/20 text-success border-success/40',
  error: 'bg-error/20 text-error border-error/40',
  edited: 'bg-accent/20 text-accent border-accent/40',
  pushed: 'bg-success/20 text-success border-success/40',
};

const LABELS: Record<LotStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  enriched: 'Enriched',
  error: 'Error',
  edited: 'Edited',
  pushed: 'Pushed',
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
