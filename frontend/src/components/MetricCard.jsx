/** Purpose: Compact metric display component for predictions and model summaries. */
export default function MetricCard({ label, value, unit, tone = "leaf" }) {
  const toneMap = {
    leaf: "border-leaf/25 bg-leaf/5 text-leaf",
    pulp: "border-pulp/70 bg-pulp/20 text-canopy",
    ember: "border-ember/30 bg-ember/10 text-ember",
    neutral: "border-canopy/15 bg-white text-canopy",
  };

  return (
    <div className={`rounded-md border p-4 ${toneMap[tone] || toneMap.neutral}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium opacity-75">{unit}</span> : null}
      </p>
    </div>
  );
}
