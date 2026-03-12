'use client';

import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  zoomPlugin,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MotherlodeHistoryPoint {
  label: string;
  value: number;
  timestamp?: number;
}

interface MotherlodeLineChartProps {
  points?: MotherlodeHistoryPoint[];
}

export default function MotherlodeLineChart({ points = [] }: MotherlodeLineChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  if (points.length === 0) {
    return (
      <div className="motherlode-trend mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="dashboard-heading text-sm font-semibold">Motherlode Over Time</h4>
            <p className="dashboard-muted text-sm">Recent total value history in rORE.</p>
          </div>
        </div>
        <p className="dashboard-muted text-sm">Motherlode history is not available.</p>
      </div>
    );
  }

  const data = {
    labels: points.map(p => p.label),
    datasets: [
      {
        label: 'Total Value (rORE)',
        data: points.map(p => p.value),
        borderColor: '#ff8a2a',
        backgroundColor: 'rgba(255, 138, 42, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    plugins: {
      legend: { display: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x' as const,
        },
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#ff8a2a',
        bodyColor: '#fff',
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} rORE`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { maxTicksLimit: 8, color: '#999' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          callback: (value: any) => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
          color: '#999',
        },
      },
    },
  };

  return (
    <div className="motherlode-trend mt-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="dashboard-heading text-sm font-semibold">Motherlode Over Time</h4>
          <p className="dashboard-muted text-sm">Total value history in rORE.</p>
        </div>
        <p className="dashboard-chart-note dashboard-subtle rounded-full px-3 py-1 text-xs">
          {points.length} points
        </p>
      </div>

      <figure className="motherlode-trend__figure" aria-label="Motherlode over time line chart">
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <Line ref={chartRef} data={data} options={options} />
        </div>
        <button
          type="button"
          className="mt-2 text-xs text-orange-400 hover:text-orange-300"
          onClick={() => {
            if (chartRef.current) {
              // @ts-ignore
              chartRef.current.resetZoom();
            }
          }}
        >
          Reset Zoom
        </button>
      </figure>

      <ul className="sr-only">
        {points.map((point) => (
          <li key={`sr-${point.label}-${point.value}`}>
            {point.label}: {point.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} rORE
          </li>
        ))}
      </ul>
    </div>
  );
}
