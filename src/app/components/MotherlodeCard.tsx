'use client';

import type { MotherlodeHistoryPoint } from '../lib/motherlode';

import MotherlodeLineChart from './MotherlodeLineChart';
import StatCard from './StatCard';

interface MotherlodeCardProps {
  totalValue: number | null;
  totalORELocked: number | null;
  participants: number | null;
  history?: MotherlodeHistoryPoint[];
}

export default function MotherlodeCard({
  totalValue,
  totalORELocked,
  participants,
  history = [],
}: MotherlodeCardProps) {
  return (
    <div className="dashboard-panel dashboard-frame rounded-2xl p-6">
      <p className="dashboard-kicker mb-2 text-[0.65rem] font-semibold uppercase">Burncoin reserves</p>
      <h3 className="dashboard-heading mb-4 text-base font-semibold">Motherlode</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          title="Amount" 
          value={totalValue !== null ? totalValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'} 
          valueLabel="WETH" 
          subtitle="Locked" 
        />
        <StatCard 
          title="ORE Locked" 
          value={totalORELocked !== null ? totalORELocked.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} 
          valueLabel="ORE" 
        />
        <StatCard 
          title="Participants" 
          value={participants !== null ? participants.toLocaleString() : '—'} 
          subtitle="Active" 
        />
      </div>

      <MotherlodeLineChart points={history} />
    </div>
  );
}
