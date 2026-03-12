'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WinnerTypePieChartProps {
  winnerTakeAll: number;
  split: number;
}

const WINNER_TYPE_COLORS = {
  split: '#ffd166',
  winnerTakeAll: '#ff8a2a',
} as const;

function formatCount(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

export default function WinnerTypePieChart({ winnerTakeAll, split }: WinnerTypePieChartProps) {
  const total = winnerTakeAll + split;

  if (total <= 0) {
    return null;
  }

  const data = {
    labels: ['Winner Take All', 'Split'],
    datasets: [
      {
        data: [winnerTakeAll, split],
        backgroundColor: [WINNER_TYPE_COLORS.winnerTakeAll, WINNER_TYPE_COLORS.split],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (context: any) => {
            const value = context.raw as number;
            const percent = Math.round((value / total) * 100);
            return `${context.label}: ${formatCount(value)} rounds (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <section
      className="dashboard-panel dashboard-frame rounded-2xl p-6"
      aria-label="Winner type distribution"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="dashboard-kicker mb-2 text-[0.65rem] font-semibold uppercase">Burncoin outcomes</p>
          <h3 className="dashboard-heading text-base font-semibold">Winner Types</h3>
          <p className="dashboard-muted text-sm">Distribution of Winner Take All versus Split round outcomes.</p>
        </div>
        <p className="dashboard-chart-note dashboard-subtle rounded-full px-3 py-1 text-xs">
          {formatCount(total)} total rounds
        </p>
      </div>

      <div className="winner-type-chart">
        <figure className="winner-type-chart__figure" aria-label="Winner type distribution">
          <div style={{ position: 'relative', height: '250px', width: '100%' }}>
            <Doughnut data={data} options={options} />
          </div>
        </figure>

        <ul className="winner-type-chart__legend">
          <li className="winner-type-chart__legend-item">
            <span className="winner-type-chart__swatch" aria-hidden="true" style={{ background: WINNER_TYPE_COLORS.winnerTakeAll }}></span>
            <div>
              <p className="dashboard-heading text-sm font-semibold">Winner Take All</p>
              <p className="dashboard-muted text-sm">
                {formatCount(winnerTakeAll)} rounds / {Math.round((winnerTakeAll / total) * 100)}%
              </p>
            </div>
          </li>
          <li className="winner-type-chart__legend-item">
            <span className="winner-type-chart__swatch" aria-hidden="true" style={{ background: WINNER_TYPE_COLORS.split }}></span>
            <div>
              <p className="dashboard-heading text-sm font-semibold">Split</p>
              <p className="dashboard-muted text-sm">
                {formatCount(split)} rounds / {Math.round((split / total) * 100)}%
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
