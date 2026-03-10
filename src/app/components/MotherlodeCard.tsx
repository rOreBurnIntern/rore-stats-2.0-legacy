'use client';

import StatCard from './StatCard';

interface MotherlodeCardProps {
  totalValue: number | null;
  totalORELocked: number | null;
  participants: number | null;
}

export default function MotherlodeCard({ totalValue, totalORELocked, participants }: MotherlodeCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Motherlode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
