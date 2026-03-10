interface WinnerTypePieChartProps {
  winnerTakeAll: number;
  split: number;
}

const WINNER_TYPE_COLORS = {
  split: '#ffd166',
  winnerTakeAll: '#ff8a2a',
} as const;

function formatPercent(value: number, total: number) {
  return `${Math.round((value / total) * 100)}%`;
}

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

  const winnerTakeAllDegrees = (winnerTakeAll / total) * 360;
  const legendItems = [
    {
      color: WINNER_TYPE_COLORS.winnerTakeAll,
      label: 'Winner Take All',
      value: winnerTakeAll,
    },
    {
      color: WINNER_TYPE_COLORS.split,
      label: 'Split',
      value: split,
    },
  ];

  return (
    <section
      className="dashboard-panel dashboard-frame rounded-2xl p-6"
      aria-label="Winner type pie chart for Winner Take All and Split rounds"
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
          <div
            className="winner-type-chart__pie"
            style={{
              background: `conic-gradient(${WINNER_TYPE_COLORS.winnerTakeAll} 0deg ${winnerTakeAllDegrees}deg, ${WINNER_TYPE_COLORS.split} ${winnerTakeAllDegrees}deg 360deg)`,
            }}
          >
            <div className="winner-type-chart__center">
              <p className="dashboard-heading text-2xl font-semibold">{formatCount(total)}</p>
              <p className="dashboard-subtle text-xs uppercase tracking-[0.28em]">Rounds</p>
            </div>
          </div>
        </figure>

        <ul className="winner-type-chart__legend">
          {legendItems.map((item) => (
            <li key={item.label} className="winner-type-chart__legend-item">
              <span className="winner-type-chart__swatch" aria-hidden="true" style={{ background: item.color }}></span>
              <div>
                <p className="dashboard-heading text-sm font-semibold">{item.label}</p>
                <p className="dashboard-muted text-sm">
                  {formatCount(item.value)} rounds / {formatPercent(item.value, total)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
