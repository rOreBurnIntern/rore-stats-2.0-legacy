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

function getTrendDirection(change: string) {
  const normalizedChange = change.trim();

  if (normalizedChange.startsWith('+')) {
    return 'up';
  }

  if (normalizedChange.startsWith('-')) {
    return 'down';
  }

  return null;
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
  const trendDirection = change ? getTrendDirection(change) : null;
  const trendClassName = trendDirection === 'up'
    ? 'text-green-500'
    : trendDirection === 'down'
      ? 'text-red-400'
      : 'dashboard-muted';
  const trendIcon = trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : null;

  return (
    <div className="dashboard-card w-full min-w-0 rounded-xl p-6 transition-all hover:-translate-y-0.5">
      <h3 className="dashboard-subtle mb-1 text-sm font-medium">{title}</h3>
      {loading ? (
        <div className="h-8 animate-pulse rounded bg-[var(--accent-soft)]"></div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="dashboard-heading break-words text-2xl font-semibold">
            {isCurrency ? '$' : ''}{value}
          </p>
          {valueLabel && (
            <span className="dashboard-muted text-sm font-medium">
              {valueLabel}
            </span>
          )}
          {change && (
            <p
              className={`flex items-center gap-1 text-sm font-medium ${trendClassName}`}
              aria-label={trendDirection ? `${trendDirection} trend ${change}` : `trend ${change}`}
            >
              {trendIcon && <span aria-hidden="true">{trendIcon}</span>}
              {change}
            </p>
          )}
        </div>
      )}
      {subtitle && <p className="dashboard-muted mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
