import type { StatsData } from '../lib/stats';

import StatCard from './StatCard';

interface ProtocolStatCardsProps {
  statsData: StatsData | null;
}

function formatCurrency(value: number, maximumFractionDigits: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
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
        value={statsData ? formatCurrency(statsData.motherlode.totalValue, 0) : '—'}
        valueLabel="TVL"
        subtitle={motherlodeSubtitle}
        isCurrency={true}
        loading={!statsData}
      />
      <StatCard
        title="WETH"
        value={statsData ? formatFixed(statsData.wethPrice, 2) : '—'}
        subtitle="Current upstream spot price."
        isCurrency={true}
        loading={!statsData}
      />
      <StatCard
        title="rORE"
        value={statsData ? formatFixed(statsData.rorePrice, 6) : '—'}
        subtitle="Estimated as 95% of the ORE price feed."
        isCurrency={true}
        loading={!statsData}
      />
    </div>
  );
}
