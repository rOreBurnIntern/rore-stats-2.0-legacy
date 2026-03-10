'use client';

import { useEffect, useState } from 'react';

import { scheduleAutoRefresh } from '../lib/auto-refresh';
import { formatTimeAgo, formatTimestamp } from '../lib/time';

interface DashboardHeaderProps {
  lastUpdatedAt: number | null;
}

export default function DashboardHeader({ lastUpdatedAt }: DashboardHeaderProps) {
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState(() =>
    lastUpdatedAt === null ? 'N/A' : formatTimeAgo(lastUpdatedAt, lastUpdatedAt)
  );

  useEffect(() => {
    if (lastUpdatedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLastUpdatedLabel(formatTimeAgo(lastUpdatedAt, Date.now()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [lastUpdatedAt]);

  useEffect(() => scheduleAutoRefresh(window), []);

  return (
    <header className="dashboard-panel flex flex-col gap-4 rounded-2xl px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="dashboard-heading text-2xl font-bold">rORE Stats Dashboard</h1>
        <p className="dashboard-muted text-sm">Live protocol analytics and market data</p>
      </div>
      <div className="dashboard-subtle text-xs">
        {lastUpdatedAt === null ? (
          <>
            Last updated{' '}
            <span id="last-update" className="dashboard-accent">
              N/A
            </span>
          </>
        ) : (
          <>
            Last updated{' '}
            <time
              id="last-update"
              dateTime={new Date(lastUpdatedAt).toISOString()}
              className="dashboard-accent"
            >
              {formatTimestamp(lastUpdatedAt)}
            </time>{' '}
            <span suppressHydrationWarning>({lastUpdatedLabel})</span>
          </>
        )}
      </div>
    </header>
  );
}
