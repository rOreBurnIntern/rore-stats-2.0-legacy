'use client';

import StatCard from './StatCard';

interface MotherlodeCardProps {
  totalValue: number | null;
  totalORELocked: number | null;
  participants: number | null;
}

export default function MotherlodeCard({ totalValue, totalORELocked, participants }: MotherlodeCardProps) {
  return (
    <div className="dashboard-panel rounded-2xl p-6">
      <h3 className="dashboard-heading mb-4 text-base font-semibold">Motherlode</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          title="Total Value" 
          value={totalValue !== null ? totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} 
          isCurrency={true} 
          subtitle="Locked WETH" 
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
    </div>
  );
}
