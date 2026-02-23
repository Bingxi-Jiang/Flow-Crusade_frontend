import React, { useMemo, useState } from 'react';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function inSameYear(a, b) {
  return a.getFullYear() === b.getFullYear();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmtMins(mins) {
  const m = Math.round(mins);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export default function TimeRangeStats({ t, theme, sessions = [] }) {
  const [range, setRange] = useState('day');

  const filtered = useMemo(() => {
    const n = new Date();
    return sessions.filter((s) => {
      const d = new Date(s.createdAt);
      if (range === 'day') return sameDay(d, n);
      if (range === 'month') return inSameMonth(d, n);
      return inSameYear(d, n);
    });
  }, [sessions, range]);

  const totals = useMemo(() => {
    const totalSessions = filtered.length;
    const totalMinutes = filtered.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const dist = { 'Deep Focus': 0, Logic: 0, Recovery: 0 };
    filtered.forEach((s) => {
      const k = s.focusType in dist ? s.focusType : 'Deep Focus';
      dist[k] += Number(s.durationMinutes) || 0;
    });

    let avgDaily = 0;
    if (range === 'day') {
      avgDaily = totalMinutes;
    } else {
      const end = startOfDay(new Date());
      const start = new Date(end);
      if (range === 'month') start.setDate(1);
      else start.setMonth(0, 1);

      const days = clamp(Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1, 1, 370);
      avgDaily = totalMinutes / days;
    }

    return { totalSessions, totalMinutes, avgDaily, dist };
  }, [filtered, range]);

  const maxDist = Math.max(1, ...Object.values(totals.dist));

  return (
    <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted}`}>Focus Summary</h4>
          <p className={`text-sm font-bold mt-1 ${t.textMain}`}>
            {range === 'day' ? 'Today' : range === 'month' ? 'This Month' : 'This Year'}
          </p>
        </div>

        <div className={`p-1 rounded-lg border flex gap-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} ${t.border}`}>
          {[
            { k: 'day', label: 'Day' },
            { k: 'month', label: 'Month' },
            { k: 'year', label: 'Year' },
          ].map((x) => {
            const active = x.k === range;
            return (
              <button
                key={x.k}
                onClick={() => setRange(x.k)}
                className={
                  `px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ` +
                  (active
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : `${t.textMuted} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`)
                }
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <MetricCard t={t} label="Sessions" value={`${totals.totalSessions}`} />
        <MetricCard t={t} label="Total Time" value={fmtMins(totals.totalMinutes)} />
        <MetricCard t={t} label="Avg / Day" value={range === 'day' ? fmtMins(totals.totalMinutes) : fmtMins(totals.avgDaily)} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h5 className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Distribution</h5>
          <span className={`text-[10px] font-bold ${t.textMuted}`}>minutes</span>
        </div>

        <div className="mt-3 space-y-2">
          {Object.entries(totals.dist).map(([k, v]) => (
            <div key={k} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.textMain}`}>{k}</span>
                <span className={`text-xs font-bold ${t.textMuted}`}>{Math.round(v)}m</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className="h-full bg-indigo-500" style={{ width: `${Math.round((v / maxDist) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className={`text-xs mt-4 ${t.textMuted}`}>
            No sessions yet for this range. Log a tiny 3-minute session to start.
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ t, label, value }) {
  return (
    <div className={`p-3 rounded-xl border ${t.bgCard} ${t.border}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{label}</div>
      <div className={`text-lg font-black mt-1 ${t.textMain}`}>{value}</div>
    </div>
  );
}