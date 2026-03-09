'use client';

export default function DashboardHeader() {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">rORE Stats Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Live protocol analytics and market data</p>
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500">
        Last updated: <span id="last-update">Loading...</span>
      </div>
    </header>
  );
}