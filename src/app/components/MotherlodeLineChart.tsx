import type { MotherlodeHistoryPoint } from '../lib/motherlode';

interface MotherlodeLineChartProps {
  points?: MotherlodeHistoryPoint[];
}

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 140;
const CHART_PADDING_X = 14;
const CHART_PADDING_Y = 14;

function formatValue(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export default function MotherlodeLineChart({ points = [] }: MotherlodeLineChartProps) {
  if (points.length < 2) {
    return (
      <div className="motherlode-trend mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="dashboard-heading text-sm font-semibold">Motherlode Over Time</h4>
            <p className="dashboard-muted text-sm">Recent total value history in WETH.</p>
          </div>
        </div>
        <p className="dashboard-muted text-sm">Motherlode history is not available from the upstream payload yet.</p>
      </div>
    );
  }

  const minValue = Math.min(...points.map((point) => point.value), 0);
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const valueRange = Math.max(maxValue - minValue, 1);
  const chartWidth = VIEWBOX_WIDTH - CHART_PADDING_X * 2;
  const chartHeight = VIEWBOX_HEIGHT - CHART_PADDING_Y * 2;
  const coordinates = points.map((point, index) => {
    const x = CHART_PADDING_X + (chartWidth * index) / (points.length - 1);
    const y = CHART_PADDING_Y + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

    return { ...point, x, y };
  });
  const polylinePoints = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div className="motherlode-trend mt-6">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="dashboard-heading text-sm font-semibold">Motherlode Over Time</h4>
          <p className="dashboard-muted text-sm">Recent total value history in WETH.</p>
        </div>
        <p className="dashboard-chart-note dashboard-subtle rounded-full px-3 py-1 text-xs">
          {points.length} points
        </p>
      </div>

      <figure className="motherlode-trend__frame" aria-label="Motherlode over time line chart">
        <svg
          className="motherlode-trend__svg"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-label="Motherlode total value over time"
        >
          <g className="motherlode-trend__grid" aria-hidden="true">
            <line x1={CHART_PADDING_X} y1={CHART_PADDING_Y} x2={VIEWBOX_WIDTH - CHART_PADDING_X} y2={CHART_PADDING_Y} />
            <line
              x1={CHART_PADDING_X}
              y1={CHART_PADDING_Y + chartHeight / 2}
              x2={VIEWBOX_WIDTH - CHART_PADDING_X}
              y2={CHART_PADDING_Y + chartHeight / 2}
            />
            <line
              x1={CHART_PADDING_X}
              y1={VIEWBOX_HEIGHT - CHART_PADDING_Y}
              x2={VIEWBOX_WIDTH - CHART_PADDING_X}
              y2={VIEWBOX_HEIGHT - CHART_PADDING_Y}
            />
          </g>
          <polyline className="motherlode-trend__line" points={polylinePoints} />
          {coordinates.map((point) => (
            <circle
              key={`${point.label}-${point.value}`}
              className="motherlode-trend__dot"
              cx={point.x}
              cy={point.y}
              r="4"
            />
          ))}
        </svg>

        <ul className="motherlode-trend__labels">
          {points.map((point) => (
            <li key={`${point.label}-${point.value}`} className="motherlode-trend__label">
              <span className="dashboard-subtle block text-[0.7rem] uppercase tracking-[0.18em]">{point.label}</span>
              <span className="dashboard-muted block text-xs">{formatValue(point.value)} WETH</span>
            </li>
          ))}
        </ul>

        <ul className="sr-only">
          {points.map((point) => (
            <li key={`sr-${point.label}-${point.value}`}>
              {point.label}: {formatValue(point.value)} WETH
            </li>
          ))}
        </ul>
      </figure>
    </div>
  );
}
