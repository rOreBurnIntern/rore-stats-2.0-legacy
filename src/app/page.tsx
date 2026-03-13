import DashboardHeader from './components/DashboardHeader';
import ErrorDisplay from './components/ErrorDisplay';
import InteractiveBarChart from './components/InteractiveBarChart';
import ProtocolStatCards from './components/ProtocolStatCards';
import WinnerTypePieChart from './components/WinnerTypePieChart';
import MotherlodeLineChart from './components/MotherlodeLineChart';
import getStatsData from './lib/stats';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const statsData = await getStatsData().catch(() => null);

  const lastUpdatedAt = statsData?.lastUpdated ?? null;

  const blockPerformanceChartPoints = statsData?.blockPerformance
    ? statsData.blockPerformance.map((point: any) => ({
        label: point.block.toString(),
        value: point.wins,
        formattedValue: point.wins.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        detail: `Completed wins ending on block ${point.block}.`,
      }))
    : [];

  return (
    <div className="flex flex-col gap-8 text-theme-text">
      <DashboardHeader lastUpdatedAt={lastUpdatedAt} />
      {!statsData && (
        <ErrorDisplay message="We could not load the latest stats right now. Please try again in a few minutes." />
      )}
      <ProtocolStatCards statsData={statsData} />
      {statsData && (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
            {statsData.winnerTypes && (
              <WinnerTypePieChart
                winnerTakeAll={statsData.winnerTypes.winnerTakeAll}
                split={statsData.winnerTypes.split}
              />
            )}
          </div>
          {statsData.motherlode && (
            <MotherlodeLineChart points={statsData.motherlode.history ?? []} />
          )}
        </>
      )}
    </div>
  );
}
