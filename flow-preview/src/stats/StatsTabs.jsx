import React from 'react';

export default function StatsTabs({ t, theme, tabs, value, onChange }) {
  return (
    <div className={`p-2 rounded-xl border flex gap-2 ${t.bgCard} ${t.border}`}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={
              `flex-1 py-2 rounded-lg text-xs font-bold transition-all ` +
              (active
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : `${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${t.textMuted}`)
            }
            aria-pressed={active}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}