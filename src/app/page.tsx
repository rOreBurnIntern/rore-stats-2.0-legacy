import DashboardHeader from './components/DashboardHeader';
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

export default async function Home() {
  await waitForRequest();
  const statsData = await getStatsData();

  const lastUpdate = statsData?.lastUpdated ? new Date(statsData.lastUpdated).toLocaleTimeString() : 'N/A';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8 px-4 py-8 mx-auto">
        <DashboardHeader lastUpdated={lastUpdate} />
        
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
          Data sourced from rORE Protocol API • Updated {lastUpdate}
        </div>
      </main>
    </div>
  );
}
