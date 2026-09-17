export default function StatCard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border/50">
      <div className="text-xs font-medium uppercase tracking-[0.04em] text-ink-muted">
        {label}
      </div>
      <div
        className="text-[26px] font-medium mt-1"
        style={{ color: valueColor || undefined }}
      >
        {value}
      </div>
    </div>
  );
}
