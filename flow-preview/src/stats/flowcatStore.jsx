const STORAGE_KEY = 'flowcat_v1';

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function seededMockState() {
  // A tiny bit of data so the UI isn't empty.
  const now = new Date();
  const mk = (daysAgo, minutes, focusType, destination, interrupted = false) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return {
      id: `s_${d.getTime()}_${minutes}_${focusType}`,
      createdAt: d.toISOString(),
      durationMinutes: minutes,
      focusType,
      destination,
      interrupted,
      task: focusType === 'Recovery' ? 'Light reset' : 'Small task',
      fishEarned: Math.max(1, Math.round((minutes - 3) * (4 / 22) + 1)),
      bonusFish: 0,
    };
  };

  const sessions = [
    mk(0, 10, 'Deep Focus', 'library', false),
    mk(1, 6, 'Logic', 'tech', true),
    mk(3, 15, 'Recovery', 'forest', false),
    mk(7, 25, 'Deep Focus', 'library', false),
  ];

  const collection = sessions.slice(0, 3).map((s, idx) => ({
    id: `c_${s.id}`,
    createdAt: s.createdAt,
    destination: s.destination,
    title: idx === 0 ? 'Quiet Aisles' : idx === 1 ? 'A Small Spark' : 'Leaf in Pocket',
    diary: '',
  }));

  return {
    version: 1,
    fishBalance: 8,
    inventory: {
      scarf: 0,
      backpack: 0,
      raincoat: 0,
      travelHat: 0,
      stickerSet: 0,
      cameraCharm: 0,
    },
    mapProgress: {
      library: 30,
      tech: 18,
      forest: 22,
    },
    unlockedStories: {
      library: [
        'FlowCat wandered between tall shelves and found a book that glowed softly.',
      ],
      tech: [
        'FlowCat accidentally entered a lab and helped a tiny robot reboot.',
      ],
      forest: [
        'FlowCat climbed a tree, failed politely, and laughed at the wind.',
      ],
    },
    sessions,
    collection,
    diaryEntries: [],
    lastTrip: {
      createdAt: todayISO(),
      destination: 'library',
      photoTitle: 'Soft Light',
      diary:
        'Today in Library Town, pages moved like slow wind. You stayed quiet, and I learned to breathe slower too.',
    },
  };
}

export function loadFlowCatState() {
  if (typeof window === 'undefined') return seededMockState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const init = seededMockState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== 'object') {
    const init = seededMockState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  // lightweight forward-compat
  return {
    ...seededMockState(),
    ...parsed,
    inventory: { ...seededMockState().inventory, ...(parsed.inventory || {}) },
    mapProgress: { ...seededMockState().mapProgress, ...(parsed.mapProgress || {}) },
    unlockedStories: { ...seededMockState().unlockedStories, ...(parsed.unlockedStories || {}) },
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : seededMockState().sessions,
    collection: Array.isArray(parsed.collection) ? parsed.collection : seededMockState().collection,
    diaryEntries: Array.isArray(parsed.diaryEntries) ? parsed.diaryEntries : [],
  };
}

export function saveFlowCatState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const FLOWCAT_STORAGE_KEY = STORAGE_KEY;