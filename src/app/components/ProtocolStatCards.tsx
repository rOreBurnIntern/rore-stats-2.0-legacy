import type { StatsData } from '../lib/stats';

import StatCard from './StatCard';

interface ProtocolStatCardsProps {
  statsData: StatsData | null;
}

function formatTokenAmount(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatFixed(value: number, fractionDigits: number) {
  return value.toFixed(fractionDigits);
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

export default function ProtocolStatCards({ statsData }: ProtocolStatCardsProps) {
  const motherlodeSubtitle = statsData
    ? `${formatNumber(statsData.motherlode.totalORELocked)} ORE locked across ${formatNumber(statsData.motherlode.participants)} participants`
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard
        title="Motherlode"
        value={statsData ? formatTokenAmount(statsData.motherlode.totalValue) : '—'}
        valueLabel="WETH"
        subtitle={motherlodeSubtitle}
        loading={!statsData}
      />
      <StatCard
        title="WETH"
        value={statsData ? formatFixed(statsData.wethPrice, 2) : '—'}
        subtitle="Current upstream WETH spot price in USD."
        isCurrency={true}
        loading={!statsData}
      />
      <StatCard
        title="rORE"
        value={statsData ? formatFixed(statsData.rorePrice, 6) : '—'}
        subtitle="Current upstream rORE spot price in USD."
        isCurrency={true}
        loading={!statsData}
      />
    </div>
  );
}
