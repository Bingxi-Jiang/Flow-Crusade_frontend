import React, { useMemo, useState } from 'react';
import { Sparkles, ShoppingBag, MapPin, Fish, Camera, BookOpen, Wand2 } from 'lucide-react';
import { saveFlowCatState } from './flowcatStore';

const TASKS = [
  { id: 'w1', label: 'Write 1 paragraph', type: 'Deep Focus' },
  { id: 'r1', label: 'Read 2 pages', type: 'Deep Focus' },
  { id: 'c1', label: 'Fix one small bug', type: 'Logic' },
  { id: 'd1', label: 'Clean one dataset column', type: 'Logic' },
  { id: 'm1', label: 'Walk for 5 minutes', type: 'Recovery' },
  { id: 'h1', label: 'Tidy a small corner', type: 'Recovery' },
];

const DESTINATIONS = [
  { key: 'library', title: 'Library Town', subtitle: 'Deep Focus', hint: 'Writing • Reading • Coding' },
  { key: 'tech', title: 'Future Tech City', subtitle: 'Logic', hint: 'Math • Analysis • Slides' },
  { key: 'forest', title: 'Forest Trail', subtitle: 'Recovery', hint: 'Exercise • Cleaning • Reset' },
];

const SHOP_ITEMS = [
  { key: 'scarf', name: 'Cozy Scarf', cost: 3 },
  { key: 'backpack', name: 'Tiny Backpack', cost: 5 },
  { key: 'raincoat', name: 'Raincoat', cost: 4 },
  { key: 'travelHat', name: 'Travel Hat', cost: 4 },
  { key: 'stickerSet', name: 'Sticker Set', cost: 2 },
  { key: 'cameraCharm', name: 'Camera Charm', cost: 3 },
];

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function fishForMinutes(minutes) {
  // 3 min => 1 fish, 25 min => 5 fish (linear)
  const m = clamp(Number(minutes) || 3, 3, 25);
  const v = 1 + (m - 3) * (4 / 22);
  return Math.max(1, Math.round(v));
}

function timeOfDay(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return 'morning';
  if (h < 17) return 'afternoon';
  return 'night';
}

function gentleDiary({ minutes, focusType, interrupted, destination, consecutiveDays }) {
  const tod = timeOfDay();

  const placeLine =
    destination === 'library'
      ? 'Today in Library Town, the shelves felt taller than usual.'
      : destination === 'tech'
        ? 'Today in Future Tech City, tiny lights blinked like patient stars.'
        : 'Today on Forest Trail, the wind moved slowly through the leaves.';

  const focusLine =
    focusType === 'Deep Focus'
      ? 'Your attention found a quiet lane, and we walked it together.'
      : focusType === 'Logic'
        ? 'You gave the problem a shape, and it became easier to hold.'
        : 'You made space to reset, and that counts as real progress.';

  const interruptionLine = interrupted
    ? 'Even with a small pause, you still returned. That matters.'
    : 'You stayed with it, gently and steadily.';

  const todLine =
    tod === 'morning'
      ? 'Morning felt soft, like a fresh page.'
      : tod === 'afternoon'
        ? 'Afternoon had a steady rhythm.'
        : 'Night felt calm, like a dim lamp in a safe room.';

  const streakLine = consecutiveDays >= 3
    ? `It has been ${consecutiveDays} days in a row. Not louder—just more familiar.`
    : 'No pressure. One small session is already a beginning.';

  const closing = minutes <= 5
    ? 'A tiny start is still a start. Let’s keep it light.'
    : 'I’ll keep the memory warm in the backpack.';

  return [placeLine, todLine, focusLine, interruptionLine, streakLine, closing].join('\n');
}

function computeConsecutiveDays(sessions) {
  const days = new Set(sessions.map((s) => new Date(s.createdAt).toDateString()));
  let count = 0;
  const d = new Date();
  for (;;) {
    if (!days.has(d.toDateString())) break;
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function bumpProgress(prev, destination, minutes) {
  const add = clamp(Math.round((Number(minutes) || 3) * 1.2), 3, 30);
  const next = { ...prev };
  next[destination] = clamp((next[destination] || 0) + add, 0, 100);
  return { next, add };
}

function maybeUnlockStory(destKey, progress, unlockedStories) {
  const thresholds = [25, 50, 75, 100];
  const countUnlocked = (unlockedStories[destKey] || []).length;
  const shouldUnlock = thresholds[countUnlocked];
  if (shouldUnlock == null || progress < shouldUnlock) return null;

  const pool =
    destKey === 'library'
      ? [
          'FlowCat got lost between old shelves and met a cat wearing tiny glasses.',
          'A book pulsed with soft light. FlowCat listened for its quiet hum.',
          'A page turned by itself—like the room was breathing, slowly.',
          'FlowCat found a bookmark shaped like a small comet.',
        ]
      : destKey === 'tech'
        ? [
            'FlowCat helped a robot debug a chip and learned how to blink patiently.',
            'An AI lab door opened by accident, and nobody seemed angry—just curious.',
            'A city billboard lit up: “Nice work.” It felt oddly warm.',
            'FlowCat powered up a tiny star inside a glass sphere.',
          ]
        : [
            'FlowCat tried to climb a tree, failed politely, and laughed with the wind.',
            'By the lake, FlowCat fell asleep and woke up holding a leaf like a postcard.',
            'A trail sign pointed nowhere in particular. That was kind of nice.',
            'FlowCat found a pinecone that smelled like clean air.',
          ];

  return pool[Math.min(countUnlocked, pool.length - 1)];
}

export default function FlowCatPanel({ t, theme, state, onStateChange }) {
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [minutes, setMinutes] = useState(10);
  const [focusType, setFocusType] = useState('Deep Focus');
  const [interrupted, setInterrupted] = useState(false);
  const [destination, setDestination] = useState('library');
  const [toast, setToast] = useState(null);

  const fishBalance = state.fishBalance || 0;
  const selectedTask = useMemo(() => TASKS.find((x) => x.id === taskId) || TASKS[0], [taskId]);

  function commit(next) {
    onStateChange(next);
    saveFlowCatState(next);
  }

  function logSession() {
    const baseFish = fishForMinutes(minutes);
    const reduced = interrupted ? Math.max(1, Math.round(baseFish * 0.6)) : baseFish;

    const bonusFish = Math.random() < 0.18 ? Math.floor(Math.random() * 3) : 0; // 0~2
    const fishEarned = reduced;

    const createdAt = new Date().toISOString();
    const id = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const nextSessions = [
      {
        id,
        createdAt,
        durationMinutes: clamp(minutes, 3, 25),
        focusType,
        interrupted,
        destination,
        task: selectedTask.label,
        fishEarned,
        bonusFish,
      },
      ...(state.sessions || []),
    ];

    const consecutiveDays = computeConsecutiveDays(nextSessions);

    const diary = gentleDiary({
      minutes: clamp(minutes, 3, 25),
      focusType,
      interrupted,
      destination,
      consecutiveDays,
    });

    const photoTitle =
      destination === 'library'
        ? 'Glowing Bookmark'
        : destination === 'tech'
          ? 'Tiny Star Chip'
          : 'Leaf Postcard';

    const newEntry = {
      id: `c_${id}`,
      createdAt,
      destination,
      title: photoTitle,
      diary,
    };

    const { next: nextProgress } = bumpProgress(state.mapProgress || {}, destination, minutes);
    const maybeStory = maybeUnlockStory(destination, nextProgress[destination] || 0, state.unlockedStories || {});

    const nextUnlocked = { ...(state.unlockedStories || {}) };
    if (maybeStory) nextUnlocked[destination] = [...(nextUnlocked[destination] || []), maybeStory];

    const next = {
      ...state,
      fishBalance: fishBalance + fishEarned + bonusFish,
      sessions: nextSessions,
      collection: [newEntry, ...(state.collection || [])],
      diaryEntries: [
        { id: `d_${id}`, createdAt, destination, text: diary },
        ...(state.diaryEntries || []),
      ],
      mapProgress: nextProgress,
      unlockedStories: nextUnlocked,
      lastTrip: { createdAt, destination, photoTitle, diary },
    };

    commit(next);

    const earnedText = bonusFish ? `+${fishEarned} fish (+${bonusFish} bonus)` : `+${fishEarned} fish`;
    setToast({ title: 'Session saved', detail: `Nice. ${earnedText}. No pressure—just forward.` });
    setTimeout(() => setToast(null), 2800);
  }

  function buy(itemKey, cost) {
    if (fishBalance < cost) {
      setToast({ title: 'Not enough fish', detail: 'Try a tiny 3-minute session to restock.' });
      setTimeout(() => setToast(null), 2800);
      return;
    }
    const inv = { ...(state.inventory || {}) };
    inv[itemKey] = (inv[itemKey] || 0) + 1;

    const next = { ...state, fishBalance: fishBalance - cost, inventory: inv };
    commit(next);

    setToast({ title: 'Packed!', detail: 'Item added to FlowCat’s bag (visual only).' });
    setTimeout(() => setToast(null), 2200);
  }

  const last = state.lastTrip;

  return (
    <div className="space-y-4">
      <div className={`p-5 rounded-2xl border relative overflow-hidden ${t.bgCard} ${t.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${t.textMuted}`} />
              <h3 className={`text-sm font-black ${t.textMain}`}>FlowCat · Travel With You</h3>
            </div>
            <p className={`text-xs mt-2 max-w-[46ch] ${t.textMuted}`}>
              Tiny focus → fish jerky → pack items → a gentle trip → a photo + diary. No failure. If interrupted, you just earn fewer fish.
            </p>
          </div>

          <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} ${t.border}`}>
            <Fish className="w-4 h-4 text-amber-300" />
            <span className={`text-sm font-black ${t.textMain}`}>{fishBalance}</span>
            <span className={`text-[10px] font-bold uppercase ${t.textMuted}`}>Fish</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>1) Choose a micro task</h4>
            <select
              value={taskId}
              onChange={(e) => {
                const v = e.target.value;
                setTaskId(v);
                const task = TASKS.find((x) => x.id === v);
                if (task) setFocusType(task.type);
              }}
              className={`w-full mt-2 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-indigo-500 ${t.bgInput} ${t.border} ${t.textMain}`}
            >
              {TASKS.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Duration</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={3}
                    max={25}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className={`px-2 py-1 rounded-lg border text-xs font-bold ${t.bgCard} ${t.border} ${t.textMain}`}>{minutes}m</div>
                </div>
                <p className={`text-[11px] mt-2 ${t.textMuted}`}>3 minutes is valid (micro-start).</p>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Focus type</label>
                <select
                  value={focusType}
                  onChange={(e) => setFocusType(e.target.value)}
                  className={`w-full mt-2 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-indigo-500 ${t.bgInput} ${t.border} ${t.textMain}`}
                >
                  <option>Deep Focus</option>
                  <option>Logic</option>
                  <option>Recovery</option>
                </select>

                <label className={`mt-3 flex items-center gap-2 text-xs font-semibold ${t.textMain}`}>
                  <input
                    type="checkbox"
                    checked={interrupted}
                    onChange={(e) => setInterrupted(e.target.checked)}
                  />
                  Interrupted? (earns fewer fish)
                </label>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>2) Pick a destination map</h4>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {DESTINATIONS.map((d) => {
                const active = d.key === destination;
                const progress = (state.mapProgress || {})[d.key] || 0;
                return (
                  <button
                    key={d.key}
                    onClick={() => setDestination(d.key)}
                    className={
                      `p-3 rounded-xl border text-left transition-all ` +
                      (active ? 'border-indigo-500 bg-indigo-500/10' : `${t.border} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${t.bgCard}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${active ? 'text-indigo-400' : t.textMuted}`} />
                          <span className={`text-sm font-black ${t.textMain}`}>{d.title}</span>
                        </div>
                        <div className={`text-xs mt-1 ${t.textMuted}`}>{d.hint}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${t.border} ${t.textMuted}`}>{d.subtitle}</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden mt-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
                      <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className={`text-[10px] mt-2 font-bold ${t.textMuted}`}>{progress}% explored</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={logSession}
              className="mt-3 w-full py-3 rounded-xl font-black bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              Log Focus Session → Earn Fish
            </button>
            <p className={`text-[11px] mt-2 ${t.textMuted}`}>Interruptions do not fail anything. They just reduce fish.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border ${t.bgCard} ${t.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className={`w-4 h-4 ${t.textMuted}`} />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted}`}>3) Pack Items (visual only)</h4>
            </div>
            <span className={`text-[10px] font-bold ${t.textMuted}`}>Spend fish, no power-ups</span>
          </div>

          <div className="mt-3 space-y-2">
            {SHOP_ITEMS.map((it) => {
              const owned = (state.inventory || {})[it.key] || 0;
              return (
                <div key={it.key} className={`p-3 rounded-xl border flex items-center justify-between ${t.bgCard} ${t.border}`}>
                  <div>
                    <div className={`text-sm font-bold ${t.textMain}`}>{it.name}</div>
                    <div className={`text-[11px] mt-1 ${t.textMuted}`}>Cost: {it.cost} fish • Owned: {owned}</div>
                  </div>
                  <button
                    onClick={() => buy(it.key, it.cost)}
                    className={`px-3 py-2 rounded-lg text-xs font-black border transition-colors ${t.border} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${t.textMain}`}
                  >
                    Buy
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${t.bgCard} ${t.border}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Camera className={`w-4 h-4 ${t.textMuted}`} />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted}`}>4) Trip Result (mock)</h4>
              </div>
              <p className={`text-xs mt-2 ${t.textMuted}`}>
                After each logged session, FlowCat brings back a photo card + a gentle diary.
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${t.border} ${t.textMuted}`}>No judgment</span>
          </div>

          {last ? (
            <div className="mt-4 space-y-3">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} ${t.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-4 h-4 ${t.textMuted}`} />
                    <span className={`text-sm font-black ${t.textMain}`}>{last.photoTitle}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${t.textMuted}`}>{new Date(last.createdAt).toLocaleString()}</span>
                </div>
                <div className={`mt-3 h-28 rounded-xl border flex items-center justify-center ${t.border} ${theme === 'dark' ? 'bg-[#0f1115]' : 'bg-white/40'}`}>
                  <div className="text-center">
                    <div className={`text-xs font-black ${t.textMain}`}>Photo Placeholder</div>
                    <div className={`text-[11px] mt-1 ${t.textMuted}`}>A soft memory card (no real image)</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
                <div className="flex items-center gap-2">
                  <Wand2 className={`w-4 h-4 ${t.textMuted}`} />
                  <span className={`text-sm font-black ${t.textMain}`}>AI Diary (template)</span>
                </div>
                <pre className={`mt-3 whitespace-pre-wrap text-xs leading-relaxed ${t.textMain}`}>{last.diary}</pre>
              </div>
            </div>
          ) : (
            <div className={`mt-4 p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
              <p className={`text-xs ${t.textMuted}`}>Log one session to see a photo + diary.</p>
            </div>
          )}

          <div className="mt-4">
            <h5 className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Unlocked story snippets</h5>
            <div className="mt-2 space-y-2">
              {DESTINATIONS.map((d) => (
                <div key={d.key} className={`p-3 rounded-xl border ${t.bgCard} ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${t.textMain}`}>{d.title}</span>
                    <span className={`text-[10px] font-bold ${t.textMuted}`}>{((state.unlockedStories || {})[d.key] || []).length} unlocked</span>
                  </div>
                  <div className={`mt-2 text-xs ${t.textMuted}`}>
                    {(((state.unlockedStories || {})[d.key] || [])[0]) || 'No snippet yet. Tiny steps unlock stories.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80]">
          <div className={`px-4 py-3 rounded-xl border shadow-xl ${t.bgCard} ${t.border}`}>
            <div className={`text-sm font-black ${t.textMain}`}>{toast.title}</div>
            <div className={`text-xs mt-1 ${t.textMuted}`}>{toast.detail}</div>
          </div>
        </div>
      )}
    </div>
  );
}