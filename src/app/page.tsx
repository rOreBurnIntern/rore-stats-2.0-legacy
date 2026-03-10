import DashboardHeader from './components/DashboardHeader';
import InteractiveBarChart from './components/InteractiveBarChart';
import MotherlodeCard from './components/MotherlodeCard';
import RoundCard from './components/RoundCard';
import StatCard from './components/StatCard';
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

function formatNumber(value: number, suffix?: string) {
  const formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return suffix ? `${formattedValue} ${suffix}` : formattedValue;
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
          detail: 'Current upstream spot price.',
        },
        {
          label: 'rORE',
          value: statsData.rorePrice,
          formattedValue: formatCurrency(statsData.rorePrice, 6),
          detail: 'Estimated as 95% of the ORE price feed.',
        },
      ]
    : [];
  const protocolChartPoints = statsData
    ? [
        {
          label: 'Value',
          value: statsData.motherlode.totalValue,
          formattedValue: formatCurrency(statsData.motherlode.totalValue, 0),
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

  return (
    <div className="app-shell flex min-h-screen flex-col overflow-x-auto font-sans">
      <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-4 py-8">
        <DashboardHeader lastUpdatedAt={lastUpdatedAt} />

        {!statsData && (
          <div
            role="alert"
            className="dashboard-alert rounded-lg px-4 py-3 text-sm"
          >
            We could not load the latest stats right now. Please try again in a few minutes.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="WETH Price" 
            value={statsData?.wethPrice ? statsData.wethPrice.toFixed(2) : '—'} 
            isCurrency={true} 
            loading={!statsData}
          />
          <StatCard 
            title="rORE Price" 
            value={statsData?.rorePrice ? statsData.rorePrice.toFixed(6) : '—'} 
            subtitle="Est. price" 
            isCurrency={true} 
            loading={!statsData}
          />
          <StatCard 
            title="24h Volume" 
            value="—" 
            subtitle="WETH" 
            isCurrency={true} 
            loading={true}
          />
          <StatCard 
            title="Transactions" 
            value="—" 
            subtitle="Today" 
            loading={true}
          />
        </div>

        {statsData && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <InteractiveBarChart
              title="Market Snapshot"
              subtitle="Current token prices normalized to the highest price in this chart."
              ariaLabel="Market snapshot bar chart for WETH and rORE prices"
              points={marketChartPoints}
            />
            <InteractiveBarChart
              title="Protocol Snapshot"
              subtitle="Current protocol metrics normalized to the largest value in this chart."
              ariaLabel="Protocol snapshot bar chart for Motherlode and round metrics"
              points={protocolChartPoints}
            />
          </div>
        )}

        {statsData?.motherlode && <MotherlodeCard {...statsData.motherlode} />}
        
        {statsData?.currentRound && (
          <RoundCard
            {...statsData.currentRound}
            timeRemaining={getTimeRemaining(statsData.currentRound.endTime, statsData.lastUpdated)}
          />
        )}

        <div className="dashboard-footer mt-12 text-center text-sm">Data sourced from rORE Protocol API</div>
      </main>
    </div>
  );
}
