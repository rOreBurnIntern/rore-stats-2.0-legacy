import DashboardHeader from './components/DashboardHeader';
import MotherlodeCard from './components/MotherlodeCard';
import RoundCard from './components/RoundCard';
import StatCard from './components/StatCard';
import { waitForRequest } from './lib/request';
import { getStatsData } from './lib/stats';
import { formatTimeAgo } from './lib/time';

function getTimeRemaining(endTime: number, referenceTime: number) {
  return endTime > referenceTime
    ? `${Math.ceil((endTime - referenceTime) / (1000 * 60))} min`
    : 'Ended';
}

export default async function Home() {
  await waitForRequest();
  const statsData = await getStatsData();

  const lastUpdatedAt = statsData?.lastUpdated ?? null;
  const lastUpdatedLabel = lastUpdatedAt === null ? 'N/A' : formatTimeAgo(lastUpdatedAt, lastUpdatedAt);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8 px-4 py-8 mx-auto">
        <DashboardHeader lastUpdatedAt={lastUpdatedAt} initialLastUpdatedLabel={lastUpdatedLabel} />

        {!statsData && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
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

        {statsData?.motherlode && <MotherlodeCard {...statsData.motherlode} />}
        
        {statsData?.currentRound && (
          <RoundCard
            {...statsData.currentRound}
            timeRemaining={getTimeRemaining(statsData.currentRound.endTime, statsData.lastUpdated)}
          />
        )}

        <div className="text-center mt-12 text-sm text-zinc-500 dark:text-zinc-600">
          Data sourced from rORE Protocol API • Updated {lastUpdatedLabel}
        </div>
      </main>
    </div>
  );
}
