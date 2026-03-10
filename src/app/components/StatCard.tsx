'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  valueLabel?: string;
  subtitle?: string;
  change?: string;
  isCurrency?: boolean;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  valueLabel,
  subtitle,
  change,
  isCurrency = false,
  loading = false,
}: StatCardProps) {
  return (
    <div className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</h3>
      {loading ? (
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="break-words text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isCurrency ? '$' : ''}{value}
          </p>
          {valueLabel && (
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {valueLabel}
            </span>
          )}
          {change && (
            <p className={`text-sm font-medium ${change.includes('+') ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
      )}
      {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}
