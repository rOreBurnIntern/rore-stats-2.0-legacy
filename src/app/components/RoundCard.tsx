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
    <div className="dashboard-panel rounded-2xl p-6">
      <h3 className="dashboard-heading mb-4 text-base font-semibold">
        Current Round #{number !== null ? number : '—'}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
