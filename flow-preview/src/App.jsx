import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, BarChart2, Activity, Plus, Mic, Send, 
  ChevronRight, Home, CheckCircle, Clock, RefreshCw, 
  X, Edit3, Trash2, Zap, Play, Pause, RotateCcw,
  Paperclip, ArrowLeft, Settings as SettingsIcon,
  Moon, Sun, Bell, Database, Key, ShieldAlert,
  ChevronDown, ChevronUp, ChevronLeft
} from 'lucide-react';

// Stats (FlowCat extension)
import StatsTabs from './stats/StatsTabs';
import FlowCatPanel from './stats/FlowCatPanel';
import CollectionPanel from './stats/CollectionPanel';
import TimeRangeStats from './stats/TimeRangeStats';
import { loadFlowCatState } from './stats/flowcatStore';

// ==========================================
// 1. MOCK DATA & TYPES
// ==========================================

const INITIAL_TASKS = [
  {
    id: 't1', title: 'Assignment 1: History Essay', progress: 40, status: 'pending', date: '2026-02-25',
    desc: 'Complete the final draft for the History 101 assignment covering the industrial revolution. Must include at least 5 primary sources and follow Chicago formatting.',
    children: [
      {
        id: 't1-1', title: 'Research primary sources', progress: 100, status: 'done',
        desc: 'Find at least 3 primary sources from the university library database regarding textile factories and labor conditions.',
        children: []
      },
      {
        id: 't1-2', title: 'Draft body paragraphs', progress: 20, status: 'pending',
        desc: 'Write 3 paragraphs focusing on social impact, economic shift, and technological advancements during the 18th century.',
        children: [
           { id: 't1-2-1', title: 'Outline social impact', progress: 0, status: 'pending', desc: 'Detail the shift from agrarian lifestyle to urban slums. Mention the working class struggles.' },
           { id: 't1-2-2', title: 'Draft economic shift section', progress: 0, status: 'pending', desc: 'Focus on the transition to mass production and the rise of factory owners. 250 words minimum.' },
           { id: 't1-2-3', title: 'Review flow and transitions', progress: 0, status: 'pending', desc: 'Ensure paragraph 1 seamlessly connects to paragraph 2 using appropriate transition words.' }
        ]
      },
      {
        id: 't1-3', title: 'Proofread & Format', progress: 0, status: 'pending',
        desc: 'Run through Grammarly, check Chicago style citations, and generate the final bibliography page.',
        children: []
      }
    ]
  },
  {
    id: 't2', title: 'Team Sync Preparation', progress: 60, status: 'pending', date: '2026-02-26',
    desc: 'Prepare the slide deck and discussion points for the weekly marketing sync.',
    children: []
  },
  {
    id: 't3', title: 'Read Chapter 3', progress: 0, status: 'pending', date: '2026-02-24',
    desc: 'Read chapter 3 of the Biology textbook regarding cellular respiration.',
    children: []
  },
  {
    id: 't4', title: 'Study for Math Midterm', progress: 15, status: 'pending', date: '2026-03-02',
    desc: 'Review all calculus notes from week 1 to 5. Practice integration problems.',
    children: []
  }
];

const INITIAL_STATS = {
  focusTimeToday: 185, // minutes
  sessions: 4,
  avgSession: 46, // minutes
  completionRate: 78, // percent
  topDistractions: ['Instagram', 'TikTok', 'Email'],
  distractCount: 5,
  distractTime: 25, // minutes
  peakFocusTime: '10:00 AM - 12:00 PM',
  streak: 12, // days
  focusScore: 420,
  maxScore: 1000
};

const INITIAL_EVENTS = [
  { id: 1, time: '09:00 AM', type: 'focus', desc: 'Started Focus Session' },
  { id: 2, time: '10:15 AM', type: 'distract', desc: 'Distracted → Instagram (5m)' },
  { id: 3, time: '10:20 AM', type: 'focus', desc: 'Back to Focus' },
  { id: 4, time: '11:45 AM', type: 'distract', desc: 'Distracted → Email (10m)' },
  { id: 5, time: '11:55 AM', type: 'focus', desc: 'Back to Focus' },
];

const INITIAL_NOTES = [
  { id: 'n1', text: 'Ask professor about the extension for the essay.', timestamp: '10:00 AM' },
  { id: 'n2', text: 'Buy milk and coffee beans later.', timestamp: '11:30 AM' }
];

// ==========================================
// 2. THEME DEFINITIONS
// ==========================================

const THEMES = {
  dark: {
    bgApp: 'bg-[#0f1115]',
    bgPanel: 'bg-[#161920]',
    bgCard: 'bg-[#1c202a]',
    bgInput: 'bg-[#161920]',
    border: 'border-white/5',
    borderFocus: 'border-indigo-500/50',
    textMain: 'text-gray-100',
    textMuted: 'text-gray-400',
    accentHover: 'hover:bg-indigo-500/10 hover:text-indigo-400',
    accentActive: 'bg-indigo-500/15 text-indigo-400',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondaryBtn: 'bg-white/5 hover:bg-white/10 text-gray-300',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]'
  },
  light: {
    bgApp: 'bg-slate-50',
    bgPanel: 'bg-white',
    bgCard: 'bg-white',
    bgInput: 'bg-slate-50',
    border: 'border-slate-200',
    borderFocus: 'border-indigo-400',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-500',
    accentHover: 'hover:bg-indigo-50 hover:text-indigo-600',
    accentActive: 'bg-indigo-50 text-indigo-600',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondaryBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    glow: 'shadow-lg shadow-indigo-100'
  }
};

// ==========================================
// 3. MAIN APP COMPONENT
// ==========================================

export default function FlowCrusadeApp() {
  // Global States
  // Default to Day theme (user request)
  const [theme, setTheme] = useState('light');
  const t = THEMES[theme];
  
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeTaskId, setActiveTaskId] = useState(null); // Which root task is active
  const [path, setPath] = useState([]); // Subtask drill-down path: [taskId, subtaskId, ...]
  
  const [stats, setStats] = useState(INITIAL_STATS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [isNotesOpen, setIsNotesOpen] = useState(false); // mobile / tablet drawer
  const [settings, setSettings] = useState({
    theme: 'light',
    monitorEnabled: true,
    distractThreshold: 5,
    storagePath: '/Users/local/flow-crusade/data',
    apiKey: 'sk-mock-123456',
    notifications: true
  });

  // UI States
  const [activePanel, setActivePanel] = useState(null); // 'calendar'|'stats'|'monitor'|'settings'
  const [isFocusedMode, setIsFocusedMode] = useState(false); // Collapses sidebars
  const [toast, setToast] = useState(null);
  const [rewardAnim, setRewardAnim] = useState(false);

  // Sync settings theme to state
  useEffect(() => { setTheme(settings.theme); }, [settings.theme]);

  // Determine App State
  // State A: !activeTaskId
  // State B: activeTaskId && path.length === 0
  // State C/E: activeTaskId && path.length > 0
  // State D is handled inline when a specific subtask is actively being focused (local state inside ViewCE)
  
  const activeRootTask = tasks.find(tsk => tsk.id === activeTaskId);
  
  // Helpers
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLevelUp = () => {
    setRewardAnim(true);
    showToast("Level Up! Excellent Focus!", 'success');
    setTimeout(() => setRewardAnim(false), 2000);
    setStats(prev => ({ ...prev, focusScore: prev.focusScore + 100 }));
  };

  const createNewTask = (title, date = '2026-02-28') => {
    const newTask = {
      id: `task_${Date.now()}`,
      title,
      progress: 0,
      status: 'pending',
      date,
      desc: 'No description provided.',
      children: []
    };
    setTasks([...tasks, newTask]);
    showToast('Task added successfully');
    return newTask;
  };

  const handleBreakdown = (taskIdToBreakdown) => {
    setPath([...path, taskIdToBreakdown]);
    setIsFocusedMode(true);
  };

  const handleReturnToRoot = () => {
    setPath([]);
    setIsFocusedMode(false);
  };

  const handleSimulateDistraction = () => {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    setEvents([{ id: Date.now(), time, type: 'distract', desc: 'Distracted → Reddit (Simulated)' }, ...events]);
    setStats(prev => ({
      ...prev,
      distractCount: prev.distractCount + 1,
      distractTime: prev.distractTime + 2
    }));
    showToast('Distraction recorded', 'warning');
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden selection:bg-indigo-500/30 transition-colors duration-300 ${t.bgApp} ${t.textMain}`}>
      
      {/* ================= LEFT SIDEBAR ================= */}
      <nav className={`flex flex-col items-center py-6 ${t.bgPanel} ${t.border} border-r transition-all duration-300 z-20 shrink-0 ${isFocusedMode ? 'w-16' : 'w-20 lg:w-64'}`}>
        
        {/* Logo */}
        <div className={`flex items-center gap-3 mb-10 ${t.textMain}`}>
          <div className="relative">
            <Zap className="w-7 h-7 text-indigo-500 fill-indigo-500/20" />
            {rewardAnim && <div className="absolute inset-0 bg-indigo-500 rounded-full blur-lg animate-ping opacity-50" />}
          </div>
          {!isFocusedMode && <span className="text-xl font-bold tracking-tight hidden lg:block">Flow Crusade</span>}
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-3 w-full px-3">
          <NavItem t={t} icon={<CalendarIcon/>} label="Calendar" active={activePanel === 'calendar'} isFocusedMode={isFocusedMode} onClick={() => setActivePanel(activePanel === 'calendar' ? null : 'calendar')} />
          <NavItem t={t} icon={<BarChart2/>} label="Statistics" active={activePanel === 'stats'} isFocusedMode={isFocusedMode} onClick={() => setActivePanel(activePanel === 'stats' ? null : 'stats')} />
          <NavItem t={t} icon={<Activity/>} label="Monitor" active={activePanel === 'monitor'} isFocusedMode={isFocusedMode} onClick={() => setActivePanel(activePanel === 'monitor' ? null : 'monitor')} />
          <NavItem t={t} icon={<SettingsIcon/>} label="Settings" active={activePanel === 'settings'} isFocusedMode={isFocusedMode} onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')} />
        </div>

        <div className="flex-grow" />

        {/* Score Mascot */}
        <div className={`mb-4 relative group cursor-pointer transition-transform duration-300 ${rewardAnim ? 'scale-110 -translate-y-4' : ''}`} onClick={handleLevelUp}>
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-[#1c202a] border-white/5' : 'bg-slate-50 border-slate-200'} border shadow-sm`}>
              <div className={`w-8 h-8 rounded-full border-[3px] border-indigo-500/30 flex items-center justify-center relative overflow-hidden`}>
                 <div className="absolute bottom-0 left-0 w-full bg-indigo-500" style={{ height: `${(stats.focusScore / stats.maxScore) * 100}%` }} />
                 <Zap className="w-4 h-4 text-white relative z-10" />
              </div>
           </div>
           {!isFocusedMode && <div className="text-center mt-2 text-xs font-bold text-indigo-500 hidden lg:block">{stats.focusScore} <span className={t.textMuted}>/ {stats.maxScore}</span></div>}
        </div>
      </nav>

      {/* LEFT PANELS OVERLAYS */}
      <LeftPanels 
        t={t} theme={theme} activePanel={activePanel} close={() => setActivePanel(null)} 
        stats={stats} events={events} tasks={tasks} settings={settings} setSettings={setSettings}
        onSimulateDistraction={handleSimulateDistraction}
        onSelectTask={(id) => { setActiveTaskId(id); setPath([]); setIsFocusedMode(false); }}
        onCreateTask={(title, date) => createNewTask(title, date)}
        activeTaskId={activeTaskId}
        showToast={showToast}
      />

      {/* ================= MAIN CANVAS ================= */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Header / Breadcrumbs */}
        {activeTaskId && (
          <header className={`h-16 flex items-center justify-between px-6 md:px-10 border-b ${t.border} ${theme === 'dark' ? 'bg-[#0f1115]/80' : 'bg-slate-50/80'} backdrop-blur-md z-10 shrink-0`}>
             <div className="flex items-center gap-2 text-sm font-medium">
                <button 
                  onClick={() => { setActiveTaskId(null); setPath([]); setIsFocusedMode(false); }} 
                  className={`flex items-center gap-1 ${t.textMuted} hover:text-indigo-500 transition-colors`}
                >
                  <Home className="w-4 h-4" /> Home
                </button>
                
                {path.length >= 0 && (
                  <>
                    <ChevronRight className={`w-4 h-4 ${t.textMuted}`} />
                    <button 
                      onClick={handleReturnToRoot}
                      className={`truncate max-w-[120px] transition-colors ${path.length === 0 ? 'text-indigo-500 font-bold' : `${t.textMuted} hover:text-indigo-500`}`}
                    >
                      {activeRootTask?.title}
                    </button>
                  </>
                )}

                {path.map((stepId, index) => {
                  let stepTitle = "Subtask";
                  let list = activeRootTask?.children || [];
                  // Traverse to find title
                  for(let i=0; i<=index; i++){
                    const node = list.find(n => n.id === path[i]);
                    if(node) {
                      stepTitle = node.title;
                      list = node.children || [];
                    }
                  }
                  const isLast = index === path.length - 1;
                  return (
                    <React.Fragment key={stepId}>
                      <ChevronRight className={`w-4 h-4 ${t.textMuted}`} />
                      <button 
                        onClick={() => setPath(path.slice(0, index + 1))}
                        className={`truncate max-w-[150px] transition-colors ${isLast ? 'text-indigo-500 font-bold' : `${t.textMuted} hover:text-indigo-500`}`}
                      >
                        {stepTitle}
                      </button>
                    </React.Fragment>
                  )
                })}
             </div>

             <div className="flex items-center gap-3">
               <button onClick={() => {setActiveTaskId(null); setPath([]); setIsFocusedMode(false);}} className={`text-xs px-3 py-1.5 rounded-lg ${t.secondaryBtn}`}>
                 Clear Active Task
               </button>
             </div>
          </header>
        )}

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col relative custom-scrollbar">
          
          {/* STATE A: No Pending Task */}
          {!activeTaskId && (
            <ViewA t={t} theme={theme} onSubmit={(val) => {
              const newTask = createNewTask(val);
              setActiveTaskId(newTask.id);
            }} showToast={showToast} />
          )}

          {/* STATE B: Active Task Overview */}
          {activeTaskId && path.length === 0 && (
            <ViewB t={t} theme={theme} task={activeRootTask} onBreakdown={() => handleBreakdown(activeRootTask.id)} tasks={tasks} onSwitchTask={(id) => {setActiveTaskId(id); setPath([])}} showToast={showToast} />
          )}

          {/* STATE C & E: Breakdown & Focus Views */}
          {activeTaskId && path.length > 0 && (
            <ViewCE 
              t={t} theme={theme}
              rootTask={activeRootTask} 
              path={path}
              onBreakdown={handleBreakdown}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* ================= RIGHT SIDEBAR: QUICK NOTES ================= */}
      <aside className={`flex flex-col border-l transition-all duration-300 z-10 shrink-0 ${t.bgPanel} ${t.border} ${isFocusedMode ? `w-16 cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}` : 'w-0 lg:w-80 hidden lg:flex'}`}
             onClick={() => isFocusedMode && setIsFocusedMode(false)}>
        
        {isFocusedMode ? (
          <div className={`flex flex-col items-center py-6 h-full ${t.textMuted}`}>
            <Edit3 className="w-5 h-5 mb-4" />
            <div className="writing-vertical-rl text-[10px] tracking-[0.2em] uppercase opacity-50">Quick Notes</div>
          </div>
        ) : (
          <QuickNotesPanel t={t} theme={theme} notes={notes} setNotes={setNotes} />
        )}
      </aside>

      {/* Mobile/Tablet: Quick Notes FAB + Drawer (so notes work below lg) */}
      <button
        onClick={() => setIsNotesOpen(true)}
        className={`fixed bottom-6 right-6 lg:hidden z-30 p-4 rounded-2xl shadow-xl border transition-colors ${t.bgPanel} ${t.border} ${t.textMain} hover:border-indigo-500/40 hover:bg-indigo-500/5`}
        aria-label="Open Quick Notes"
        title="Quick Notes"
      >
        <Edit3 className="w-5 h-5" />
      </button>

      {isNotesOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsNotesOpen(false)}
          />
          <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md border-l shadow-2xl flex flex-col ${t.bgPanel} ${t.border} animate-slide-up`}>
            <div className={`p-6 flex items-center justify-between border-b ${t.border}`}>
              <h3 className={`font-bold text-lg ${t.textMain}`}>Quick Notes</h3>
              <button
                onClick={() => setIsNotesOpen(false)}
                className={`p-2 rounded-xl transition-colors ${t.textMuted} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                aria-label="Close Quick Notes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <QuickNotesPanel t={t} theme={theme} notes={notes} setNotes={setNotes} showHeader={false} />
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 animate-fade-in-up">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${theme === 'dark' ? 'bg-[#2a2e38] border-white/10 text-white' : 'bg-gray-900 border-gray-800 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-amber-400" />}
            {toast.msg}
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// VIEW COMPONENTS
// ==========================================

// STATE A: No Task
function ViewA({ t, theme, onSubmit, showToast }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full animate-fade-in">
      <div className="text-center mb-12">
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center border ${theme === 'dark' ? 'bg-[#1c202a] border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'bg-white border-slate-200 shadow-xl shadow-indigo-100'}`}>
           <Zap className="w-8 h-8 text-indigo-500 fill-indigo-500/20" />
        </div>
        <h1 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${t.textMain}`}>What are we crushing today?</h1>
        <p className={`text-lg ${t.textMuted}`}>Enter a task, drop an assignment, and let's break it down.</p>
      </div>

      <div className="w-full mt-4">
        <ChatInput t={t} theme={theme} onSubmit={onSubmit} onUploadClick={() => showToast('Mock Upload Triggered')} placeholder="e.g. Write a 5-page history essay by Friday..." />
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-10">
         <SuggestionBadge t={t} text="Study for Math Midterm" onClick={() => onSubmit("Study for Math Midterm")} />
         <SuggestionBadge t={t} text="Clean my room" onClick={() => onSubmit("Clean my room")} />
         <SuggestionBadge t={t} text="Read 2 chapters" onClick={() => onSubmit("Read 2 chapters")} />
      </div>
    </div>
  );
}

function SuggestionBadge({ t, text, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 border rounded-full text-sm transition-all shadow-sm ${t.bgCard} ${t.border} ${t.textMuted} hover:border-indigo-500/50 hover:text-indigo-400`}>
      {text}
    </button>
  );
}

// STATE B: Active Task Overview
function ViewB({ t, theme, task, tasks, onBreakdown, onSwitchTask, showToast }) {
  if (!task) return null;
  const [showSwitch, setShowSwitch] = useState(false);

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-fade-in pb-20">
      
      <div className="mt-6 mb-8 flex items-center justify-between">
         <span className={`inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-xs font-bold tracking-wider uppercase border border-indigo-500/20`}>Active Mission</span>
         
         <div className="relative">
            <button onClick={() => setShowSwitch(!showSwitch)} className={`text-sm px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors ${t.bgCard} ${t.border} ${t.textMain} hover:border-indigo-500/50`}>
              Switch Task <ChevronDown className="w-4 h-4" />
            </button>
            {showSwitch && (
              <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-20 py-2 animate-slide-up ${t.bgPanel} ${t.border}`}>
                {tasks.map(tk => (
                  <button key={tk.id} onClick={() => {onSwitchTask(tk.id); setShowSwitch(false);}} className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors ${tk.id === task.id ? 'text-indigo-500 font-bold bg-indigo-500/5' : t.textMuted}`}>
                    {tk.title}
                  </button>
                ))}
              </div>
            )}
         </div>
      </div>

      <div className={`rounded-3xl p-8 md:p-12 shadow-2xl border relative overflow-hidden group ${t.bgCard} ${t.border}`}>
        {/* Decorative background glow in dark mode */}
        {theme === 'dark' && <div className="absolute -right-32 -top-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />}

        <div className="relative z-10">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 leading-tight ${t.textMain}`}>{task.title}</h2>
          
          <CollapsibleText t={t} text={task.desc} />
          
          <div className="mt-10 mb-10">
            <div className={`flex justify-between text-sm font-semibold mb-3 ${t.textMuted}`}>
              <span>Overall Progress</span>
              <span className="text-indigo-400">{task.progress}%</span>
            </div>
            <div className={`w-full h-4 rounded-full overflow-hidden border ${theme === 'dark' ? 'bg-[#0f1115] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
              <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out relative" style={{ width: `${task.progress}%` }}>
                 <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onBreakdown}
              className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl overflow-hidden hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]`}
            >
              <Zap className="w-5 h-5 relative z-10 fill-white/20" />
              <span className="relative z-10">Breakdown Task</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 w-full max-w-3xl mx-auto">
        <ChatInput t={t} theme={theme} onSubmit={() => showToast("Context added to task")} onUploadClick={() => showToast('Mock Upload')} placeholder="Add more context to this task before breaking it down..." />
      </div>
    </div>
  );
}

// STATE C & E: Breakdown List / Detail Handlers
function ViewCE({ t, theme, rootTask, path, onBreakdown, showToast }) {
  const [focusingSubtask, setFocusingSubtask] = useState(null); // Local state for State D

  // Resolve current context based on path
  let currentContext = rootTask;
  let contextList = rootTask.children || [];
  
  for (let i = 0; i < path.length; i++) {
    const node = contextList.find(n => n.id === path[i]);
    if (node) {
      currentContext = node;
      contextList = node.children || [];
    }
  }

  // STATE D: Specific Focus View
  if (focusingSubtask) {
    const activeSubtask = contextList.find(n => n.id === focusingSubtask) || currentContext;
    return <FocusDetailView t={t} theme={theme} task={activeSubtask} onBack={() => setFocusingSubtask(null)} onComplete={() => {showToast("Subtask Completed!", 'success'); setFocusingSubtask(null);}} onFurtherBreakdown={() => { setFocusingSubtask(null); onBreakdown(activeSubtask.id); }} />
  }

  // STATE C / E: List View
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full animate-fade-in pb-10">
      
      <div className={`mb-8 mt-2 flex justify-between items-end border-b pb-6 ${t.border}`}>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${t.textMain}`}>{currentContext.title}</h2>
          <p className={`text-sm ${t.textMuted}`}>Select a step to focus on, or break it down further.</p>
        </div>
        <button onClick={() => showToast("AI Mock: Regenerating structure...", 'success')} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${t.secondaryBtn}`}>
          <RefreshCw className="w-4 h-4" /> Global Retry
        </button>
      </div>

      <div className="space-y-4">
        {contextList.map((sub, index) => (
          <div key={sub.id} className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-start justify-between gap-6 animate-slide-up ${t.bgCard} ${t.border} hover:${t.borderFocus}`} style={{animationDelay: `${index * 0.05}s`}}>
            
            <div className="flex items-start gap-4 flex-1 pt-1">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 mt-1 border border-indigo-500/20">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold transition-colors cursor-pointer hover:text-indigo-400 ${t.textMain}`} onClick={() => setFocusingSubtask(sub.id)}>
                  {sub.title}
                </h3>
                <div className="mt-2">
                   <CollapsibleText t={t} text={sub.desc} defaultExpanded={false} />
                </div>
                
                {sub.children && sub.children.length > 0 && (
                  <div className={`flex items-center gap-2 mt-4 text-xs font-semibold px-3 py-1.5 rounded-md w-fit ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} ${t.textMuted}`}>
                     <ChevronRight className="w-3 h-3" />
                     {sub.children.length} deeper sub-steps available
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center bg-transparent p-1 rounded-xl">
              <button 
                onClick={() => showToast("Mock: Regenerating this step...")}
                className={`p-2.5 rounded-lg transition-colors tooltip-trigger ${t.textMuted} hover:text-indigo-400 hover:bg-indigo-500/10`}
                title="Regenerate / Modify"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => onBreakdown(sub.id)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${t.secondaryBtn}`}
              >
                Breakdown
              </button>

              <button 
                onClick={() => setFocusingSubtask(sub.id)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${t.primaryBtn}`}
              >
                <Play className="w-4 h-4 fill-current" /> Focus
              </button>
            </div>
          </div>
        ))}

        {contextList.length === 0 && (
          <div className={`text-center py-16 border-2 border-dashed rounded-3xl ${t.border} ${t.bgCard}`}>
            <p className={`mb-6 text-lg ${t.textMuted}`}>No sub-steps yet. Need help starting?</p>
            <button onClick={() => onBreakdown(currentContext.id)} className={`px-8 py-3 font-bold rounded-xl transition-colors ${t.primaryBtn}`}>
              Auto-Breakdown via AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// STATE D: Focus Detail View
function FocusDetailView({ t, theme, task, onComplete, onBack, onFurtherBreakdown }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full animate-fade-in relative pt-2">
      
      <button onClick={onBack} className={`flex items-center gap-2 font-semibold mb-8 w-fit transition-colors ${t.textMuted} hover:text-indigo-400`}>
        <ChevronLeft className="w-5 h-5" /> Back to list
      </button>

      <div className={`rounded-3xl p-8 md:p-14 shadow-2xl border flex flex-col items-center text-center relative overflow-hidden ${t.bgCard} ${t.border}`}>
        
        {/* Radar Ping Animation for Focus */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square rounded-full border-[2px] border-indigo-500/10 pointer-events-none transition-transform duration-1000 ${isActive ? 'scale-110 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]' : 'scale-100 opacity-0'}`} />

        <div className="relative z-10 w-full">
          <span className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-indigo-500/20">Hyper Focus Mode</span>
          <h2 className={`text-2xl md:text-3xl font-bold mb-6 leading-tight ${t.textMain}`}>{task.title}</h2>
          
          <div className="max-w-xl mx-auto mb-12">
            <p className={`text-base leading-relaxed ${t.textMuted}`}>
              {task.desc || "Focus on this single step. Eliminate distractions. You can do this."}
            </p>
          </div>

          {/* Timer Display */}
          <div className={`text-7xl md:text-8xl font-black tracking-tighter mb-12 font-mono drop-shadow-lg ${t.textMain}`}>
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <button onClick={resetTimer} className={`p-4 rounded-2xl transition-colors ${t.secondaryBtn}`} title="Reset Timer">
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button 
              onClick={toggleTimer}
              className={`flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-xl font-bold text-white transition-all active:scale-95 shadow-lg ${isActive ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-400' : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500'}`}
            >
              {isActive ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
              {isActive ? 'Pause Focus' : 'Start Focus'}
            </button>
          </div>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pt-8 border-t w-full ${t.border}`}>
            <button onClick={onFurtherBreakdown} className={`px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto ${t.secondaryBtn}`}>
              Too hard? Breakdown further
            </button>
            <button onClick={onComplete} className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
              <CheckCircle className="w-5 h-5" /> Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UI & UTILITY COMPONENTS
// ==========================================

function NavItem({ t, icon, label, active, isFocusedMode, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-4 p-3.5 rounded-xl transition-all group font-semibold text-sm ${active ? t.accentActive : `${t.textMuted} ${t.accentHover}`} ${isFocusedMode ? 'justify-center' : 'justify-start'}`}
      title={isFocusedMode ? label : undefined}
    >
      <div className={`w-5 h-5 shrink-0 ${active ? '' : ''}`}>
        {icon}
      </div>
      {!isFocusedMode && <span className="hidden lg:block whitespace-nowrap">{label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
    </button>
  );
}

function ChatInput({ t, theme, onSubmit, onUploadClick, placeholder }) {
  const [val, setVal] = useState('');
  const disabledSendCls = theme === 'dark'
    ? 'bg-white/5 text-gray-500'
    : 'bg-slate-200 text-slate-400';
  
  return (
    <div className={`relative flex items-center border shadow-xl rounded-full p-2 focus-within:ring-2 focus-within:border-indigo-500 transition-all w-full max-w-3xl mx-auto ${t.bgInput} ${t.border}`}>
      <button onClick={onUploadClick} className={`p-3 rounded-full transition-colors shrink-0 ${t.textMuted} hover:bg-indigo-500/10 hover:text-indigo-400`} title="Upload File">
        <Paperclip className="w-5 h-5" />
      </button>
      
      <input 
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if(e.key === 'Enter' && val.trim()) { onSubmit(val); setVal(''); } }}
        placeholder={placeholder}
        className={`flex-1 bg-transparent px-3 py-2 focus:outline-none text-base ${t.textMain}`}
      />
      
      <div className="flex items-center gap-1 shrink-0 pr-1">
        <button className={`p-3 rounded-full transition-colors hidden sm:block ${t.textMuted} hover:bg-indigo-500/10 hover:text-indigo-400`}>
          <Mic className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { if(val.trim()) { onSubmit(val); setVal(''); } }}
          disabled={!val.trim()}
          className={`p-3 rounded-full transition-all flex items-center justify-center ${val.trim() ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-500 active:scale-95' : disabledSendCls}`}
        >
          <Send className={`w-5 h-5 ${val.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function CollapsibleText({ t, text, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div>
      <p className={`text-base leading-relaxed transition-all ${t.textMuted} ${!expanded ? 'line-clamp-2' : ''}`}>
        {text}
      </p>
      {text && text.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} className="text-indigo-400 text-sm font-semibold mt-1 hover:text-indigo-300">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

// ==========================================
// LEFT PANELS (Overlays)
// ==========================================

function LeftPanels({ t, theme, activePanel, close, stats, events, tasks, settings, setSettings, onSimulateDistraction, onSelectTask, onCreateTask, activeTaskId, showToast }) {
  if (!activePanel) return null;

  return (
    <div className="fixed inset-0 z-30">
      {/* Mobile backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={close}
      />

      <div className={`absolute left-0 md:left-[80px] lg:left-[256px] top-0 bottom-0 w-full sm:w-96 border-r shadow-2xl animate-slide-right flex flex-col ${t.bgPanel} ${t.border}`}>
        <div className={`p-6 flex items-center justify-between border-b ${t.border}`}>
          <h3 className={`font-bold text-lg capitalize ${t.textMain}`}>{activePanel}</h3>
          <button onClick={close} className={`p-2 rounded-xl transition-colors ${t.textMuted} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {activePanel === 'calendar' && <CalendarPanel t={t} tasks={tasks} onSelectTask={onSelectTask} onCreateTask={onCreateTask} activeTaskId={activeTaskId} />}
          {activePanel === 'stats' && <StatsPanel t={t} theme={theme} stats={stats} />}
          {activePanel === 'monitor' && <MonitorPanel t={t} theme={theme} events={events} onSimulate={onSimulateDistraction} enabled={settings.monitorEnabled} onToggle={(v) => setSettings({...settings, monitorEnabled: v})} />}
          {activePanel === 'settings' && <SettingsPanel t={t} settings={settings} setSettings={setSettings} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// Quick Notes content (used both in the right sidebar and the mobile drawer)
function QuickNotesPanel({ t, theme, notes, setNotes, showHeader = true }) {
  const [val, setVal] = useState('');

  const addNote = () => {
    const text = val.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const note = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, time };
    setNotes([note, ...notes]);
    setVal('');
  };

  const removeNote = (id) => setNotes(notes.filter(n => n.id !== id));

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className={`p-6 border-b ${t.border}`}>
          <h3 className={`font-bold text-lg ${t.textMain}`}>Quick Notes</h3>
          <p className={`text-xs mt-1 ${t.textMuted}`}>Scratchpad for passing thoughts (not persisted in this demo).</p>
        </div>
      )}

      <div className={`p-6 flex-1 overflow-y-auto custom-scrollbar ${showHeader ? '' : 'pt-0'}`}>
        {notes.length === 0 ? (
          <div className={`rounded-xl border p-4 text-sm ${t.bgCard} ${t.border} ${t.textMuted}`}>
            No notes yet. Capture a thought before it slips.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className={`rounded-xl border p-3 ${t.bgCard} ${t.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-[10px] font-bold ${t.textMuted}`}>{n.time}</div>
                    <div className={`text-sm mt-1 break-words ${t.textMain}`}>{n.text}</div>
                  </div>
                  <button
                    onClick={() => removeNote(n.id)}
                    className={`p-2 rounded-lg transition-colors ${t.textMuted} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                    title="Remove"
                    aria-label="Remove note"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 border-t ${t.border}`}>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${t.bgInput} ${t.border}`}>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
            placeholder="Type a quick note and press Enter"
            className={`flex-1 bg-transparent focus:outline-none text-sm ${t.textMain}`}
          />
          <button
            onClick={addNote}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${val.trim() ? t.primaryBtn : t.secondaryBtn}`}
            disabled={!val.trim()}
            title="Add"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// 4.1 Calendar Panel
function CalendarPanel({ t, tasks, onSelectTask, onCreateTask, activeTaskId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  // Dummy Calendar Grid Generation (Feb 2026)
  const days = Array.from({length: 28}, (_, i) => i + 1);
  const getTaskForDay = (day) => tasks.filter(tk => tk.date === `2026-02-${day.toString().padStart(2, '0')}`);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-bold text-lg ${t.textMain}`}>Feb 2026</h4>
        <div className="flex gap-2">
          <button className={`p-1.5 rounded-lg border ${t.border} ${t.textMuted} hover:text-indigo-400 hover:border-indigo-500/50`}><ChevronLeft className="w-4 h-4"/></button>
          <button className={`p-1.5 rounded-lg border ${t.border} ${t.textMuted} hover:text-indigo-400 hover:border-indigo-500/50`}><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6 text-center">
        {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className={`text-xs font-bold ${t.textMuted}`}>{d}</div>)}
        {/* Padding days */}
        <div className="aspect-square"></div>
        {days.map(d => {
           const dayTasks = getTaskForDay(d);
           const hasPending = dayTasks.some(tk => tk.status === 'pending');
           const hasDone = dayTasks.some(tk => tk.status === 'done');
           return (
             <div key={d} className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-sm relative transition-all cursor-pointer hover:border-indigo-500/50 ${d === 25 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : `${t.bgCard} ${t.border} ${t.textMain}`}`}>
                {d}
                <div className="flex gap-0.5 mt-1 absolute bottom-1">
                  {hasDone && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                  {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                </div>
             </div>
           )
        })}
      </div>

      <button onClick={() => setShowAdd(!showAdd)} className={`w-full py-3 rounded-xl font-bold border border-dashed flex items-center justify-center gap-2 transition-colors ${t.border} ${t.textMuted} hover:border-indigo-500/50 hover:text-indigo-400`}>
        <Plus className="w-4 h-4" /> Add Task
      </button>

      {showAdd && (
        <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border} animate-slide-up`}>
          <input type="text" placeholder="Task title..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} className={`w-full bg-transparent border-b pb-2 mb-4 focus:outline-none focus:border-indigo-500 text-sm ${t.border} ${t.textMain}`} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${t.secondaryBtn}`}>Cancel</button>
            <button onClick={() => { if(newTitle) { onCreateTask(newTitle); setNewTitle(''); setShowAdd(false); } }} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${t.primaryBtn}`}>Save</button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${t.textMuted}`}>Upcoming List</h4>
        {tasks.map(tk => (
          <div key={tk.id} onClick={() => onSelectTask(tk.id)} className={`p-3 rounded-xl border flex gap-3 cursor-pointer transition-all ${activeTaskId === tk.id ? 'border-indigo-500 bg-indigo-500/5' : `${t.bgCard} ${t.border} hover:border-indigo-500/30`}`}>
            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${tk.status === 'done' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div>
              <h4 className={`font-bold text-sm ${activeTaskId === tk.id ? 'text-indigo-400' : t.textMain}`}>{tk.title}</h4>
              <p className={`text-[10px] mt-1 ${t.textMuted}`}>{tk.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4.2 Stats Panel
// function StatsPanel({ t, theme, stats }) {
//   return (
//     <div className="space-y-4 animate-fade-in">
       
//        <div className={`p-6 rounded-2xl border relative overflow-hidden mb-6 shadow-xl ${theme === 'dark' ? 'bg-[#1c202a] border-white/10' : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white'}`}>
//           <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-indigo-500 opacity-10 pointer-events-none" />
//           <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-100'}`}>Current Focus Score</h4>
//           <div className="flex items-baseline gap-2 mb-4">
//              <span className={`text-4xl font-black ${theme === 'dark' ? t.textMain : 'text-white'}`}>{stats.focusScore}</span>
//              <span className={`text-sm font-semibold ${theme === 'dark' ? t.textMuted : 'text-indigo-200'}`}>/ {stats.maxScore}</span>
//           </div>
//           <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#0f1115]' : 'bg-white/20'}`}>
//             <div className="h-full bg-indigo-500" style={{width: `${(stats.focusScore/stats.maxScore)*100}%`}}></div>
//           </div>
//           <p className={`text-xs mt-3 font-semibold ${theme === 'dark' ? t.textMuted : 'text-indigo-100'}`}>Only {stats.maxScore - stats.focusScore} pts to level up. Keep going!</p>
//        </div>

//        <div className="grid grid-cols-2 gap-3">
//          <StatBox t={t} title="Focus Time" value={`${stats.focusTimeToday}m`} />
//          <StatBox t={t} title="Avg Session" value={`${stats.avgSession}m`} />
//          <StatBox t={t} title="Sessions" value={stats.sessions} />
//          <StatBox t={t} title="Completion Rate" value={`${stats.completionRate}%`} />
//        </div>

//        <div className={`p-4 rounded-xl border mt-4 ${t.bgCard} ${t.border}`}>
//          <h4 className={`text-xs font-bold uppercase mb-4 ${t.textMuted}`}>Distraction Report</h4>
//          <div className="flex justify-between items-center mb-2">
//             <span className={`text-sm ${t.textMain}`}>Total Count</span>
//             <span className="text-rose-400 font-bold">{stats.distractCount} times</span>
//          </div>
//          <div className="flex justify-between items-center mb-4">
//             <span className={`text-sm ${t.textMain}`}>Time Wasted</span>
//             <span className="text-rose-400 font-bold">{stats.distractTime} mins</span>
//          </div>
//          <div className="mt-4">
//             <span className={`text-xs font-bold uppercase ${t.textMuted} block mb-2`}>Top Triggers</span>
//             <div className="flex flex-wrap gap-2">
//               {stats.topDistractions.map(d => (
//                 <span key={d} className={`text-xs px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20`}>{d}</span>
//               ))}
//             </div>
//          </div>
//        </div>
//     </div>
//   );
// }

function StatsPanel({ t, theme, stats }) {
  const [tab, setTab] = useState('overview');
  const [flowcat, setFlowcat] = useState(() => loadFlowCatState());

  // Keep Stats UI in sync if another tab updates localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'flowcat_v1') setFlowcat(loadFlowCatState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <StatsTabs
        t={t}
        theme={theme}
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'flowcat', label: 'FlowCat' },
          { key: 'collection', label: 'Collection' },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <TimeRangeStats t={t} theme={theme} sessions={flowcat.sessions} />

          {/* keep your original focus score + stat boxes + distraction report unchanged */}
          <div className={`p-6 rounded-2xl border relative overflow-hidden mb-6 shadow-xl ${theme === 'dark' ? 'bg-[#1c202a] border-white/10' : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white'}`}>
            <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-indigo-500 opacity-10 pointer-events-none" />
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-100'}`}>Current Focus Score</h4>
            <div className="flex items-baseline gap-2 mb-4">
              <span className={`text-4xl font-black ${theme === 'dark' ? t.textMain : 'text-white'}`}>{stats.focusScore}</span>
              <span className={`text-sm font-semibold ${theme === 'dark' ? t.textMuted : 'text-indigo-200'}`}>/ {stats.maxScore}</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#0f1115]' : 'bg-white/20'}`}>
              <div className="h-full bg-indigo-500" style={{width: `${(stats.focusScore/stats.maxScore)*100}%`}}></div>
            </div>
            <p className={`text-xs mt-3 font-semibold ${theme === 'dark' ? t.textMuted : 'text-indigo-100'}`}>Only {stats.maxScore - stats.focusScore} pts to level up. Keep going!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox t={t} title="Focus Time" value={`${stats.focusTimeToday}m`} />
            <StatBox t={t} title="Avg Session" value={`${stats.avgSession}m`} />
            <StatBox t={t} title="Sessions" value={stats.sessions} />
            <StatBox t={t} title="Completion Rate" value={`${stats.completionRate}%`} />
          </div>

          <div className={`p-4 rounded-xl border mt-4 ${t.bgCard} ${t.border}`}>
            <h4 className={`text-xs font-bold uppercase mb-4 ${t.textMuted}`}>Distraction Report</h4>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${t.textMain}`}>Total Count</span>
              <span className="text-rose-400 font-bold">{stats.distractCount} times</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-sm ${t.textMain}`}>Time Wasted</span>
              <span className="text-rose-400 font-bold">{stats.distractTime} mins</span>
            </div>
            <div className="mt-4">
              <span className={`text-xs font-bold uppercase ${t.textMuted} block mb-2`}>Top Triggers</span>
              <div className="flex flex-wrap gap-2">
                {stats.topDistractions.map(d => (
                  <span key={d} className={`text-xs px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20`}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'flowcat' && (
        <FlowCatPanel
          t={t}
          theme={theme}
          state={flowcat}
          onStateChange={setFlowcat}
        />
      )}

      {tab === 'collection' && (
        <CollectionPanel t={t} theme={theme} state={flowcat} />
      )}
    </div>
  );
}

function StatBox({ t, title, value }) {
  return (
    <div className={`p-4 rounded-xl border ${t.bgCard} ${t.border}`}>
      <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${t.textMuted}`}>{title}</h4>
      <p className={`text-xl font-bold ${t.textMain}`}>{value}</p>
    </div>
  )
}

// 4.3 Monitor Panel
function MonitorPanel({ t, theme, events, onSimulate, enabled, onToggle }) {
  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className={`p-5 rounded-xl border flex items-center justify-between ${t.bgCard} ${t.border}`}>
        <div>
           <h4 className={`font-bold ${t.textMain}`}>Active Monitor</h4>
           <p className={`text-xs mt-1 ${t.textMuted}`}>Track off-screen activity</p>
        </div>
        <button 
          onClick={() => onToggle(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-500' : (theme === 'dark' ? 'bg-gray-600' : 'bg-slate-300')}`}
        >
           <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      <button onClick={onSimulate} className={`w-full py-3 rounded-xl font-bold border border-dashed flex items-center justify-center gap-2 transition-colors ${t.border} text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50`}>
         Simulate Distraction
      </button>

      <div className="mt-8">
        <h4 className={`font-bold text-xs uppercase tracking-wider mb-4 ${t.textMuted}`}>Activity Timeline</h4>
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {events.map((ev, i) => (
            <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
               <div className={`w-5 h-5 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${ev.type === 'focus' ? 'bg-emerald-500 border-[#161920]' : 'bg-rose-500 border-[#161920]'} z-10 mx-auto absolute left-0 md:left-1/2 -translate-x-1/2`}></div>
               
               <div className={`w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] ml-8 md:ml-0 p-4 rounded-xl border shadow-sm ${t.bgCard} ${t.border}`}>
                 <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${ev.type === 'focus' ? 'text-emerald-400' : 'text-rose-400'}`}>{ev.type === 'focus' ? 'Focus' : 'Alert'}</span>
                    <span className={`text-[10px] font-bold ${t.textMuted}`}>{ev.time}</span>
                 </div>
                 <p className={`text-xs ${t.textMain}`}>{ev.desc}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// 4.4 Settings Panel
function SettingsPanel({ t, settings, setSettings, showToast }) {
  const handleChange = (k, v) => setSettings({...settings, [k]: v});

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Theme */}
      <div>
        <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${t.textMuted}`}>Appearance</h4>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleChange('theme', 'dark')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.theme === 'dark' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : `${t.bgCard} ${t.border} ${t.textMuted}`}`}>
            <Moon className="w-5 h-5" />
            <span className="text-xs font-bold">Night</span>
          </button>
          <button onClick={() => handleChange('theme', 'light')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.theme === 'light' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : `${t.bgCard} ${t.border} ${t.textMuted}`}`}>
            <Sun className="w-5 h-5" />
            <span className="text-xs font-bold">Day</span>
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 mt-8 ${t.textMuted}`}>Preferences</h4>
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border flex items-center justify-between ${t.bgCard} ${t.border}`}>
             <div className="flex items-center gap-3">
               <Bell className={`w-4 h-4 ${t.textMuted}`} />
               <span className={`text-sm font-bold ${t.textMain}`}>Notifications</span>
             </div>
             <button onClick={() => handleChange('notifications', !settings.notifications)} className={`relative w-10 h-5 rounded-full transition-colors ${settings.notifications ? 'bg-indigo-500' : (settings.theme === 'dark' ? 'bg-gray-600' : 'bg-slate-300')}`}>
               <span className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>
          
          <div className={`p-4 rounded-xl border flex items-center justify-between ${t.bgCard} ${t.border}`}>
             <span className={`text-sm font-bold ${t.textMain}`}>Distract Threshold (mins)</span>
             <input type="number" value={settings.distractThreshold} onChange={(e) => handleChange('distractThreshold', e.target.value)} className={`w-16 bg-transparent border-b text-center focus:outline-none focus:border-indigo-500 ${t.border} ${t.textMain}`} />
          </div>
        </div>
      </div>

      {/* Data & API */}
      <div>
        <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 mt-8 ${t.textMuted}`}>Developer & Data</h4>
        <div className="space-y-4">
           <div>
             <label className={`block text-xs mb-2 flex items-center gap-2 ${t.textMuted}`}><Database className="w-3 h-3"/> Local Storage Path</label>
             <input type="text" value={settings.storagePath} onChange={(e) => handleChange('storagePath', e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${t.bgInput} ${t.border} ${t.textMain}`} />
           </div>
           <div>
             <label className={`block text-xs mb-2 flex items-center gap-2 ${t.textMuted}`}><Key className="w-3 h-3"/> AI API Key</label>
             <input type="password" value={settings.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${t.bgInput} ${t.border} ${t.textMain}`} />
           </div>
        </div>
      </div>

      {/* About */}
      <div className={`pt-6 mt-6 border-t ${t.border} text-center`}>
        <p className={`text-xs font-bold ${t.textMain}`}>Flow Crusade v2.0.1</p>
        <div className={`flex justify-center gap-4 mt-2 text-xs ${t.textMuted}`}>
          <a href="#" className="hover:text-indigo-400">Changelog</a>
          <a href="#" className="hover:text-indigo-400">Contact Us</a>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// CSS INJECTIONS (Animations & Scrollbar)
// ==========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-right { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-in-up { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
  @keyframes slide { 0% { background-position: 0 0; } 100% { background-position: 20px 20px; } }
  
  .animate-slide-right { animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
  .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  .writing-vertical-rl { writing-mode: vertical-rl; text-orientation: mixed; }
  
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
`;
document.head.appendChild(style);