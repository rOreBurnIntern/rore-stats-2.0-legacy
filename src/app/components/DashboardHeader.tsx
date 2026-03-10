'use client';

import { useEffect, useState } from 'react';

import { formatTimeAgo } from '../lib/time';

interface DashboardHeaderProps {
  lastUpdatedAt: number | null;
  initialLastUpdatedLabel: string;
}

export default function DashboardHeader({ lastUpdatedAt, initialLastUpdatedLabel }: DashboardHeaderProps) {
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState(initialLastUpdatedLabel);

  useEffect(() => {
    if (lastUpdatedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLastUpdatedLabel(formatTimeAgo(lastUpdatedAt, Date.now()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [lastUpdatedAt]);

  return (
    <header className="dashboard-panel flex flex-col gap-4 rounded-2xl px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="dashboard-heading text-2xl font-bold">rORE Stats Dashboard</h1>
        <p className="dashboard-muted text-sm">Live protocol analytics and market data</p>
      </div>
      <div className="dashboard-subtle text-xs">
        Last updated{' '}
        <span id="last-update" suppressHydrationWarning className="dashboard-accent">
          {lastUpdatedLabel}
        </span>
      </div>
    </header>
  );
}
