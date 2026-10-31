import type { Report } from "@/lib/stats";

const AREAS = [
  ["sleep", "Sleep"],
  ["water", "Water"],
  ["steps", "Steps"],
] as const;

export default function WeekReport({ report }: { report: Report }) {
  const span = Math.round((Date.parse(report.end) - Date.parse(report.start)) / 86_400_000) + 1;
  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">
        Last {span} days · {report.days_logged} logged
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {AREAS.map(([key, label]) => (
          <div key={key}>
            <dt className="text-xs text-mist">{label} goal</dt>
            <dd className="font-serif text-2xl">
              {report.goal_hits[key]}/{span}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-mist">
        Avg {report.avg_sleep_minutes === null ? "-" : `${(report.avg_sleep_minutes / 60).toFixed(1)} h`}{" "}
        sleep · {Math.round(report.avg_steps).toLocaleString("en")} steps ·{" "}
        {Math.round(report.avg_calories)} kcal
      </p>
      {report.best_steps_day && (
        <p className="mt-1 text-sm text-mist">Most active day: {report.best_steps_day}</p>
      )}
    </div>
  );
}
