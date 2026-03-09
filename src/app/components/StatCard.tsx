'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isCurrency?: boolean;
  loading?: boolean;
}

export default function StatCard({ title, value, subtitle, change, isCurrency = false, loading = false }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</h3>
      {loading ? (
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
      ) : (
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isCurrency ? '$' : ''}{value}
          </p>
          {change && (
            <p className={`ml-2 text-sm font-medium ${change.includes('+') ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
      )}
      {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}