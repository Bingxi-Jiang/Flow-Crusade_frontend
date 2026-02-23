import React, { useMemo } from 'react';
import { Images, BookText, MapPin } from 'lucide-react';

const DEST_LABEL = {
  library: 'Library Town',
  tech: 'Future Tech City',
  forest: 'Forest Trail',
};

export default function CollectionPanel({ t, theme, state }) {
  const photos = useMemo(() => state.collection || [], [state]);
  const diaries = useMemo(() => state.diaryEntries || [], [state]);

  return (
    <div className="space-y-4">
      <div className={`p-5 rounded-2xl border ${t.bgCard} ${t.border}`}>
        <div className="flex items-center gap-2">
          <Images className={`w-4 h-4 ${t.textMuted}`} />
          <h3 className={`text-sm font-black ${t.textMain}`}>Collection</h3>
        </div>
        <p className={`text-xs mt-2 ${t.textMuted}`}>
          Photos are placeholders (no image generation). Each card is a small memory from a trip.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {photos.slice(0, 8).map((p) => (
            <div key={p.id} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} ${t.border}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={`text-sm font-black ${t.textMain}`}>{p.title || 'Trip Photo'}</div>
                  <div className={`text-[11px] mt-1 ${t.textMuted}`}>{new Date(p.createdAt).toLocaleString()}</div>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-md border ${t.border} ${t.textMuted}`}>
                  {DEST_LABEL[p.destination] || p.destination}
                </div>
              </div>
              <div className={`mt-3 h-28 rounded-xl border flex items-center justify-center ${t.border} ${theme === 'dark' ? 'bg-[#0f1115]' : 'bg-white/40'}`}>
                <div className="text-center">
                  <div className={`text-xs font-black ${t.textMain}`}>Photo Placeholder</div>
                  <div className={`text-[11px] mt-1 ${t.textMuted}`}>Saved to album</div>
                </div>
              </div>
              {p.diary && (
                <div className={`mt-3 text-xs whitespace-pre-wrap leading-relaxed ${t.textMuted}`}>
                  {p.diary.split('\n').slice(0, 2).join('\n')}
                </div>
              )}
            </div>
          ))}

          {photos.length === 0 && (
            <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
              <p className={`text-xs ${t.textMuted}`}>No collection yet. Log one session in FlowCat to unlock a photo + diary.</p>
            </div>
          )}
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${t.bgCard} ${t.border}`}>
        <div className="flex items-center gap-2">
          <BookText className={`w-4 h-4 ${t.textMuted}`} />
          <h3 className={`text-sm font-black ${t.textMain}`}>Diary</h3>
        </div>
        <p className={`text-xs mt-2 ${t.textMuted}`}>
          Gentle, non-judgmental templates. No “you should”, no “you did bad”.
        </p>

        <div className="mt-4 space-y-2">
          {diaries.slice(0, 10).map((d) => (
            <div key={d.id} className={`p-4 rounded-2xl border ${t.bgCard} ${t.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${t.textMuted}`} />
                  <span className={`text-xs font-black ${t.textMain}`}>{DEST_LABEL[d.destination] || d.destination}</span>
                </div>
                <span className={`text-[10px] font-bold ${t.textMuted}`}>{new Date(d.createdAt).toLocaleString()}</span>
              </div>
              <pre className={`mt-2 whitespace-pre-wrap text-xs leading-relaxed ${t.textMain}`}>{d.text}</pre>
            </div>
          ))}

          {diaries.length === 0 && (
            <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
              <p className={`text-xs ${t.textMuted}`}>No diary entries yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}