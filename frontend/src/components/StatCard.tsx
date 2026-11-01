type Props = {
  label: string;
  value: string;
  goal?: string;
  progress?: number;
};

export default function StatCard({ label, value, goal, progress }: Props) {
  const pct = progress === undefined ? null : Math.min(100, Math.max(0, Math.round(progress * 100)));
  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight">{value}</p>
      {goal && <p className="mt-1 text-xs text-mist">of {goal}</p>}
      {pct !== null && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
