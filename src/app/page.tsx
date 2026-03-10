import DashboardHeader from './components/DashboardHeader';
import ErrorDisplay from './components/ErrorDisplay';
import InteractiveBarChart from './components/InteractiveBarChart';
import MotherlodeCard from './components/MotherlodeCard';
import ProtocolStatCards from './components/ProtocolStatCards';
import RoundCard from './components/RoundCard';
import WinnerTypePieChart from './components/WinnerTypePieChart';
import { waitForRequest } from './lib/request';
import { getStatsData } from './lib/stats';

function getTimeRemaining(endTime: number, referenceTime: number) {
  return endTime > referenceTime
    ? `${Math.ceil((endTime - referenceTime) / (1000 * 60))} min`
    : 'Ended';
}

function formatCurrency(value: number, maximumFractionDigits: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })}`;
}

function formatNumber(value: number, suffix?: string, maximumFractionDigits = 0) {
  const formattedValue = value.toLocaleString(undefined, { maximumFractionDigits });

  return suffix ? `${formattedValue} ${suffix}` : formattedValue;
}

function formatWins(value: number) {
  return formatNumber(value, value === 1 ? 'win' : 'wins');
}

export default async function Home() {
  await waitForRequest();
  const statsData = await getStatsData();

  const lastUpdatedAt = statsData?.lastUpdated ?? null;
  const remainingMinutes = statsData?.currentRound
    ? Math.max(Math.ceil((statsData.currentRound.endTime - statsData.lastUpdated) / (1000 * 60)), 0)
    : null;

  const marketChartPoints = statsData
    ? [
        {
          label: 'WETH',
          value: statsData.wethPrice,
          formattedValue: formatCurrency(statsData.wethPrice, 2),
          detail: 'Current upstream WETH spot price in USD.',
        },
        {
          label: 'rORE',
          value: statsData.rorePrice,
          formattedValue: formatCurrency(statsData.rorePrice, 6),
          detail: 'Current upstream rORE spot price in USD.',
        },
      ]
    : [];
  const protocolChartPoints = statsData
    ? [
        {
          label: 'Amount',
          value: statsData.motherlode.totalValue,
          formattedValue: formatNumber(statsData.motherlode.totalValue, 'WETH', 4),
          detail: 'Total WETH currently locked in Motherlode.',
        },
        {
          label: 'ORE',
          value: statsData.motherlode.totalORELocked,
          formattedValue: formatNumber(statsData.motherlode.totalORELocked, 'ORE'),
          detail: 'Total ORE committed to Motherlode.',
        },
        {
          label: 'Users',
          value: statsData.motherlode.participants,
          formattedValue: formatNumber(statsData.motherlode.participants, 'participants'),
          detail: 'Active Motherlode participants.',
        },
        {
          label: 'Prize',
          value: statsData.currentRound.prize,
          formattedValue: formatNumber(statsData.currentRound.prize, 'rORE'),
          detail: 'Current round prize pool.',
        },
        {
          label: 'Time',
          value: remainingMinutes ?? 0,
          formattedValue: remainingMinutes === null ? 'N/A' : formatNumber(remainingMinutes, 'minutes'),
          detail: 'Minutes remaining in the current round.',
        },
      ]
    : [];
  const blockPerformanceChartPoints = statsData?.blockPerformance
    ? statsData.blockPerformance.map((point) => ({
        label: point.block.toString(),
        value: point.wins,
        formattedValue: formatWins(point.wins),
        detail: `Completed wins ending on block ${point.block}.`,
      }))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader lastUpdatedAt={lastUpdatedAt} />

      {!statsData && (
        <ErrorDisplay message="We could not load the latest stats right now. Please try again in a few minutes." />
      )}

      <ProtocolStatCards statsData={statsData} />

      {statsData && (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <InteractiveBarChart
              title="Market Snapshot"
              subtitle="Current token prices normalized to the highest price in this chart."
              ariaLabel="Market snapshot bar chart for WETH/USD and rORE prices"
              points={marketChartPoints}
            />
            <InteractiveBarChart
              title="Protocol Snapshot"
              subtitle="Current protocol metrics normalized to the largest value in this chart."
              ariaLabel="Protocol snapshot bar chart for Motherlode and round metrics"
              points={protocolChartPoints}
            />
          </div>

          {blockPerformanceChartPoints.length > 0 && (
            <InteractiveBarChart
              title="Block Performance"
              subtitle="Completed wins grouped by ending block for blocks 1 through 25."
              ariaLabel="Block performance bar chart for wins per block 1 through 25"
              note="Hover or focus a bar for exact values. Scroll to view all 25 blocks."
              minColumnWidth="2.5rem"
              maxBarWidth="2.5rem"
              points={blockPerformanceChartPoints}
            />
          )}
        </>
      )}

      {statsData?.winnerTypes && (
        <WinnerTypePieChart
          winnerTakeAll={statsData.winnerTypes.winnerTakeAll}
          split={statsData.winnerTypes.split}
        />
      )}

      {statsData?.motherlode && <MotherlodeCard {...statsData.motherlode} />}

      {statsData?.currentRound && (
        <RoundCard
          {...statsData.currentRound}
          timeRemaining={getTimeRemaining(statsData.currentRound.endTime, statsData.lastUpdated)}
        />
      )}
    </div>
  );
}
