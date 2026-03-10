'use client';

import StatCard from './StatCard';

interface RoundCardProps {
  number: number | null;
  status: string | null;
  prize: number | null;
  entries: number | null;
  endTime: number | null;
  timeRemaining: string;
}

export default function RoundCard({ number, status, prize, entries, endTime, timeRemaining }: RoundCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
        Current Round #{number !== null ? number : '—'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard 
          title="Status" 
          value={status || '—'} 
          subtitle={status === 'active' && endTime ? `Ends ${new Date(endTime).toLocaleTimeString()}` : ''} 
        />
        <StatCard 
          title="Prize Pool" 
          value={prize !== null ? prize.toLocaleString() : '—'} 
          valueLabel="rORE" 
        />
        <StatCard 
          title="Total Entries" 
          value={entries !== null ? entries.toLocaleString() : '—'} 
          valueLabel="Users" 
        />
        <StatCard 
          title="Time Remaining" 
          value={timeRemaining} 
        />
      </div>
    </div>
  );
}
