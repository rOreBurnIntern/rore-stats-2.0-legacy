import type { CSSProperties } from 'react';

interface InteractiveBarChartPoint {
  label: string;
  value: number;
  formattedValue: string;
  detail?: string;
}

interface InteractiveBarChartProps {
  title: string;
  subtitle: string;
  ariaLabel: string;
  points: InteractiveBarChartPoint[];
  note?: string;
  minColumnWidth?: string;
  maxBarWidth?: string;
}

const BAR_COLORS = ['#ff8a2a', '#ffb347', '#ff6b2c', '#ffd166', '#ff9f4a'];

export default function InteractiveBarChart({
  title,
  subtitle,
  ariaLabel,
  points,
  note = 'Hover or focus a bar for exact values.',
  minColumnWidth = '3.5rem',
  maxBarWidth = '4.5rem',
}: InteractiveBarChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const chartStyles: CSSProperties = {
    gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(${minColumnWidth}, 1fr))`,
    minWidth: `calc(${Math.max(points.length, 1)} * ${minColumnWidth})`,
  };

  return (
    <section className="dashboard-panel dashboard-frame rounded-2xl p-6" aria-label={ariaLabel}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="dashboard-kicker mb-2 text-[0.65rem] font-semibold uppercase">Burncoin spread</p>
          <h3 className="dashboard-heading text-base font-semibold">{title}</h3>
          <p className="dashboard-muted text-sm">{subtitle}</p>
        </div>
        <p className="dashboard-chart-note dashboard-subtle rounded-full px-3 py-1 text-xs">
          {note}
        </p>
      </div>

      <div className="interactive-chart">
        <div className="interactive-chart__plot">
          <div className="interactive-chart__grid" aria-hidden="true" style={chartStyles}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <ul className="interactive-chart__bars" style={chartStyles}>
            {points.map((point, index) => {
              const barHeight = point.value > 0 ? `${Math.max((point.value / maxValue) * 100, 12)}%` : '4%';
              const tooltipLabel = point.detail
                ? `${point.label}: ${point.formattedValue}. ${point.detail}`
                : `${point.label}: ${point.formattedValue}`;

              return (
                <li key={point.label} className="interactive-chart__item">
                  <div className="interactive-chart__bar-group">
                    <button
                      type="button"
                      className="interactive-chart__bar"
                      aria-label={tooltipLabel}
                      style={{
                        height: barHeight,
                        maxWidth: maxBarWidth,
                        background: `linear-gradient(180deg, ${BAR_COLORS[index % BAR_COLORS.length]}, rgba(255, 138, 42, 0.18))`,
                      }}
                    >
                      <span className="sr-only">{tooltipLabel}</span>
                    </button>
                    <div className="interactive-chart__tooltip" role="tooltip">
                      <p className="dashboard-heading text-sm font-semibold">{point.label}</p>
                      <p className="dashboard-accent text-sm">{point.formattedValue}</p>
                      {point.detail && <p className="dashboard-muted text-xs">{point.detail}</p>}
                    </div>
                  </div>
                  <p className="dashboard-subtle mt-3 text-center text-xs">{point.label}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
