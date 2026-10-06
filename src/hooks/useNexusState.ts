import { useState, useEffect, useRef } from 'react';
import { HudAudio } from '../utils/HudAudio';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type CloudSyncStatus = 'guest' | 'syncing' | 'synced' | 'error' | 'unconfigured';

// Sanitizer for Firestore to avoid storing undefined values
function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean;
}

// State Interfaces
export interface Habit {
  id: string;
  name: string;
  category: 'BODY' | 'MIND' | 'TECH';
  icon: string;
  streak: number;
  history: string[]; // dates formatted as YYYY-MM-DD
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  type: 'directive' | 'milestone'; // directive = short, milestone = long
  progress: number;
  category: 'SKILLS' | 'FITNESS' | 'WELLBEING' | 'CAREER';
  subtasks: SubTask[];
  deadline: string;
}

export interface MoodEnergyLog {
  date: string;
  timestamp: number;
  mood: number;    // 1-10 scale
  energy: number;  // 1-10 scale
}

export interface ReflectionLog {
  date: string; // YYYY-MM-DD
  wins: string;
  errors: string;
  optimizations: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  pinned: boolean;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  date: string;
  minutes: number;
  task: string;
}

export interface Profile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  status: 'OPTIMAL' | 'RECOVERY' | 'STANDBY' | 'AGITATED' | 'OVERLOAD';
  totalFocusMinutes: number;
}

export interface HudSettings {
  theme: 'cyan' | 'green' | 'crimson' | 'amber' | 'purple';
  fontSize: 'sm' | 'md' | 'lg';
  vocabulary: 'cyberpunk' | 'academic' | 'personal';
  volume: number;
  timerTickSound: boolean;
  timerMode: 'circular' | 'linear';
  fontFamily?: 'fira' | 'share-tech' | 'orbitron' | 'vt323' | 'space-mono' | 'jetbrains';
  apiKey?: string;
  apiProvider?: 'gemini' | 'mistral' | 'groq' | 'openrouter' | 'openai';
  apiModel?: string;
}

export interface NexusState {
  profile: Profile;
  habits: Habit[];
  goals: Goal[];
  moodLogs: MoodEnergyLog[];
  reflectionLogs: ReflectionLog[];
  notes: Note[];
  focusSessions: FocusSession[];
  diagnostics: string[];
  settings: HudSettings;
}

// Initial default configuration
const DEFAULT_STATE: NexusState = {
  profile: {
    name: "HACKER OPERATOR",
    level: 1,
    xp: 250,
    xpToNextLevel: 1000,
    status: 'OPTIMAL',
    totalFocusMinutes: 45
  },
  habits: [
    { id: 'h1', name: 'Drink water', category: 'BODY', icon: 'Droplet', streak: 3, history: [] },
    { id: 'h2', name: 'Read 10 pages', category: 'MIND', icon: 'BookOpen', streak: 5, history: [] },
    { id: 'h3', name: 'Write program codes', category: 'TECH', icon: 'Code', streak: 2, history: [] },
    { id: 'h4', name: 'Calibrate mind', category: 'MIND', icon: 'Brain', streak: 4, history: [] },
    { id: 'h5', name: 'Workout session', category: 'BODY', icon: 'Activity', streak: 0, history: [] }
  ],
  goals: [
    {
      id: 'g1',
      title: 'Initialize Dashboard Core',
      type: 'directive',
      progress: 33,
      category: 'CAREER',
      subtasks: [
        { id: 'st1', text: 'Bootstrap directories', completed: true },
        { id: 'st2', text: 'Configure custom themes', completed: false },
        { id: 'st3', text: 'Setup notebook editor panel', completed: false }
      ],
      deadline: '2026-09-01'
    },
    {
      id: 'g2',
      title: 'Personal Fitness Target',
      type: 'milestone',
      progress: 50,
      category: 'FITNESS',
      subtasks: [
        { id: 'st4', text: 'Complete focus minutes workout', completed: true },
        { id: 'st5', text: 'Keep 7 day habit streak', completed: false }
      ],
      deadline: '2026-10-15'
    }
  ],
  moodLogs: [
    { date: '2026-08-15', timestamp: Date.now() - 172800000, mood: 7, energy: 8 },
    { date: '2026-08-16', timestamp: Date.now() - 86400000, mood: 8, energy: 6 }
  ],
  reflectionLogs: [
    {
      date: '2026-08-16',
      wins: 'Setup visual custom themes and settings successfully.',
      errors: 'Got distracted by notifications during work.',
      optimizations: 'Mute incoming alerts during active timers.'
    }
  ],
  notes: [
    {
      id: 'n1',
      title: 'Daily Scratchpad',
      content: '1. Complete English quizzes.\n2. Do 25 minutes reading focus block.\n3. Drink water and workout.',
      tags: 'daily, lists',
      pinned: true,
      updatedAt: '2026-08-17'
    },
    {
      id: 'n2',
      title: 'Study Tips',
      content: 'Use Pomodoro timer presets to split study blocks. Set the sound loop to Binaural Theta waves to increase focus.',
      tags: 'references, tips',
      pinned: false,
      updatedAt: '2026-08-16'
    }
  ],
  focusSessions: [
    { id: 'fs_1', date: '2026-08-16', minutes: 25, task: 'Reading english articles' },
    { id: 'fs_2', date: '2026-08-15', minutes: 20, task: 'Grammar quiz test session' }
  ],
  diagnostics: [
    `[${new Date().toLocaleTimeString()}] [SYS] INITIALIZING REWRITING COGNITIVE PLATFORM...`,
    `[${new Date().toLocaleTimeString()}] [SYS] LOCAL STORAGE DATA LOADED: SUCCESS`,
    `[${new Date().toLocaleTimeString()}] [SYS] WELCOME BACK.`
  ],
  settings: {
    theme: 'cyan',
    fontSize: 'md',
    vocabulary: 'personal',
    volume: 0.5,
    timerTickSound: false,
    timerMode: 'circular',
    fontFamily: 'fira',
    apiKey: '',
    apiProvider: 'gemini',
    apiModel: 'gemini-3.7-flash'
  }
};

export function useNexusState() {
  const { user, isConfigured, loading: authLoading } = useAuth();
  const [state, setState] = useState<NexusState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(!isConfigured ? 'unconfigured' : 'guest');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstCloudLoadRef = useRef(true);

  // 1. Initialize and load immediately from local storage (ensures instant offline/guest UI)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_hub_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedState = {
          ...DEFAULT_STATE,
          ...parsed,
          profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
          settings: { ...DEFAULT_STATE.settings, ...parsed.settings }
        };
        setState(loadedState);
        
        if (loadedState.settings && loadedState.settings.volume !== undefined) {
          HudAudio.setVolume(loadedState.settings.volume);
        }
      } else {
        setState(DEFAULT_STATE);
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
      setState(DEFAULT_STATE);
    }
    setIsHydrated(true);
  }, []);

  // 2. React to Auth State: Load from or migrate to Firestore when user logs in
  useEffect(() => {
    if (!isConfigured) {
      setSyncStatus('unconfigured');
      return;
    }

    if (authLoading) return;

    if (!user) {
      setSyncStatus('guest');
      return;
    }

    // User is logged in, fetch their cloud state from Firestore
    const loadFromCloud = async () => {
      if (!db) return;
      try {
        setSyncStatus('syncing');
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data() as Partial<NexusState>;
          const merged: NexusState = {
            ...DEFAULT_STATE,
            ...cloudData,
            profile: {
              ...DEFAULT_STATE.profile,
              ...cloudData.profile,
              name: cloudData.profile?.name && cloudData.profile?.name !== 'HACKER OPERATOR' && cloudData.profile?.name !== 'NEW USER'
                ? cloudData.profile.name
                : (user.displayName || 'Google Operator')
            },
            settings: {
              ...DEFAULT_STATE.settings,
              ...cloudData.settings
            }
          };
          setState(merged);
          localStorage.setItem('nexus_hub_state', JSON.stringify(merged));
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          writeLog(`Cloud account linked: ${user.displayName || user.email}. Cloud data restored.`, 'success');
        } else {
          // First time sign-in for this user - migrate current local state to cloud so user work is preserved
          setState(prev => {
            const initialCloudState: NexusState = {
              ...prev,
              profile: {
                ...prev.profile,
                name: (prev.profile.name === 'HACKER OPERATOR' || prev.profile.name === 'NEW USER')
                  ? (user.displayName || 'Google Operator')
                  : prev.profile.name
              }
            };
            setDoc(userDocRef, sanitizeForFirestore(initialCloudState))
              .then(() => {
                setSyncStatus('synced');
                setLastSyncedAt(new Date());
                writeLog(`Initialized cloud profile for ${user.displayName || user.email}`, 'success');
              })
              .catch(err => {
                console.error('Failed to create initial cloud doc:', err);
                setSyncStatus('error');
              });
            localStorage.setItem('nexus_hub_state', JSON.stringify(initialCloudState));
            return initialCloudState;
          });
        }
      } catch (err: any) {
        console.error('Failed to load user data from cloud:', err);
        setSyncStatus('error');
        writeLog('Cloud sync error: ' + (err.message || 'Could not reach cloud storage'), 'alert');
      } finally {
        isFirstCloudLoadRef.current = false;
      }
    };

    loadFromCloud();
  }, [user?.uid, authLoading, isConfigured]);

  // 3. Always save to local storage (for guest or instant cache), and debounce save to cloud if signed in
  useEffect(() => {
    if (!isHydrated) return;

    // Always persist to local storage
    localStorage.setItem('nexus_hub_state', JSON.stringify(state));

    // If logged in, debounce save to Firestore
    if (user && db && isConfigured) {
      if (isFirstCloudLoadRef.current) return;

      setSyncStatus('syncing');
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      const currentDb = db;
      const uid = user.uid;
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          if (!currentDb) return;
          const userDocRef = doc(currentDb, 'users', uid);
          await setDoc(userDocRef, sanitizeForFirestore(state), { merge: true });
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        } catch (err: any) {
          console.error('Error saving state to Firestore:', err);
          setSyncStatus('error');
        }
      }, 1500);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, isHydrated, user?.uid, isConfigured]);

  const writeLog = (msg: string, type: 'info' | 'success' | 'alert' | 'xp' = 'info') => {
    const time = new Date().toLocaleTimeString();
    const tag = type === 'success' ? '[OK]' : type === 'alert' ? '[ALERT]' : type === 'xp' ? '[XP]' : '[SYS]';
    const line = `[${time}] ${tag} ${msg}`;
    
    setState(prev => ({
      ...prev,
      diagnostics: [line, ...prev.diagnostics.slice(0, 49)]
    }));
  };

  const gainXP = (amount: number) => {
    setState(prev => {
      let currentXp = prev.profile.xp + amount;
      let currentLevel = prev.profile.level;
      let nextLevelXp = prev.profile.xpToNextLevel;
      let leveledUp = false;

      while (currentXp >= nextLevelXp) {
        currentXp -= nextLevelXp;
        currentLevel += 1;
        nextLevelXp = currentLevel * 1000;
        leveledUp = true;
      }

      if (leveledUp) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#00F0FF', '#7000FF', '#00FF66']
          });
          HudAudio.playLevelUp();
        }, 100);
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          level: currentLevel,
          xp: currentXp,
          xpToNextLevel: nextLevelXp
        }
      };
    });

    writeLog(`Secured +${amount} Experience Points`, 'xp');
  };

  // Toggle Habit Complete
  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    HudAudio.playClick();

    setState(prev => {
      const updatedHabits = prev.habits.map(habit => {
        if (habit.id === id) {
          const isDone = habit.history.includes(today);
          let newHistory = [...habit.history];
          let newStreak = habit.streak;

          if (isDone) {
            newHistory = newHistory.filter(d => d !== today);
            newStreak = Math.max(0, newStreak - 1);
            return { ...habit, history: newHistory, streak: newStreak };
          } else {
            newHistory.push(today);
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const completedYesterday = habit.history.includes(yesterday);
            newStreak = completedYesterday ? newStreak + 1 : 1;
            return { ...habit, history: newHistory, streak: newStreak };
          }
        }
        return habit;
      });

      const habit = prev.habits.find(h => h.id === id);
      const isCompleting = habit ? !habit.history.includes(today) : false;

      if (habit) {
        setTimeout(() => {
          if (isCompleting) {
            writeLog(`Habit Complete: "${habit.name}"`, 'success');
            gainXP(50);
            
            const completeCountToday = updatedHabits.filter(h => h.history.includes(today)).length;
            if (completeCountToday === updatedHabits.length && updatedHabits.length > 0) {
              writeLog("Perfect synchronization: All daily habits completed!", 'success');
              gainXP(150);
              confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
              });
              confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
              });
            }
          } else {
            writeLog(`Habit Unchecked: "${habit.name}"`, 'alert');
          }
        }, 10);
      }

      return {
        ...prev,
        habits: updatedHabits
      };
    });
  };

  const addHabit = (name: string, category: 'BODY' | 'MIND' | 'TECH', icon: string) => {
    HudAudio.playClick();
    const newId = `h_${Date.now()}`;
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { id: newId, name, category, icon, streak: 0, history: [] }]
    }));
    writeLog(`Created new habit: "${name}"`, 'info');
  };

  const deleteHabit = (id: string) => {
    HudAudio.playClick();
    const habit = state.habits.find(h => h.id === id);
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id)
    }));
    if (habit) {
      writeLog(`Removed habit: "${habit.name}"`, 'alert');
    }
  };

  // Focus Timer Logging
  const logFocusSession = (minutes: number, task: string) => {
    const xpReward = minutes * 10;
    gainXP(xpReward);

    const newSession: FocusSession = {
      id: `fs_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      minutes,
      task: task || 'Focus Session'
    };

    setState(prev => ({
      ...prev,
      focusSessions: [newSession, ...prev.focusSessions.slice(0, 49)],
      profile: {
        ...prev.profile,
        totalFocusMinutes: prev.profile.totalFocusMinutes + minutes
      }
    }));

    writeLog(`Focus Session Concluded: ${minutes} minutes of "${task || 'Timer Session'}"`, 'success');
  };

  // Goals
  const toggleGoalSubtask = (goalId: string, subtaskId: string) => {
    HudAudio.playClick();
    setState(prev => {
      const updatedGoals = prev.goals.map(goal => {
        if (goal.id === goalId) {
          const updatedSubtasks = goal.subtasks.map(sub => {
            if (sub.id === subtaskId) {
              return { ...sub, completed: !sub.completed };
            }
            return sub;
          });

          const completedCount = updatedSubtasks.filter(s => s.completed).length;
          const totalCount = updatedSubtasks.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          if (progress === 100 && goal.progress !== 100) {
            const xpGrant = goal.type === 'directive' ? 200 : 500;
            setTimeout(() => {
              writeLog(`Goal Achieved: "${goal.title}"`, 'success');
              gainXP(xpGrant);
              HudAudio.playSuccess();
            }, 10);
          }

          return {
            ...goal,
            subtasks: updatedSubtasks,
            progress
          };
        }
        return goal;
      });

      return {
        ...prev,
        goals: updatedGoals
      };
    });
  };

  const addGoal = (title: string, type: 'directive' | 'milestone', category: 'SKILLS' | 'FITNESS' | 'WELLBEING' | 'CAREER', subtaskTexts: string[], deadline: string) => {
    HudAudio.playClick();
    const newId = `g_${Date.now()}`;
    const subtasks = subtaskTexts
      .filter(t => t.trim() !== '')
      .map((text, idx) => ({
        id: `st_${Date.now()}_${idx}`,
        text,
        completed: false
      }));

    const newGoal: Goal = {
      id: newId,
      title,
      type,
      progress: 0,
      category,
      subtasks,
      deadline: deadline || new Date(Date.now() + 604800000).toISOString().split('T')[0]
    };

    setState(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));

    writeLog(`Added new goal: "${title}"`, 'info');
  };

  const deleteGoal = (id: string) => {
    HudAudio.playClick();
    const goal = state.goals.find(g => g.id === id);
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
    if (goal) {
      writeLog(`Removed goal: "${goal.title}"`, 'alert');
    }
  };

  // Reflections
  const saveReflection = (wins: string, errors: string, optimizations: string) => {
    const today = new Date().toISOString().split('T')[0];
    HudAudio.playSuccess();

    setState(prev => {
      const activeReflections = prev.reflectionLogs.filter(r => r.date !== today);
      const newLog: ReflectionLog = { date: today, wins, errors, optimizations };

      return {
        ...prev,
        reflectionLogs: [...activeReflections, newLog]
      };
    });

    writeLog(`Saved daily journal reflection.`, 'success');
    gainXP(100);
  };

  const saveMoodEnergy = (mood: number, energy: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    setState(prev => {
      const activeMoods = prev.moodLogs.filter(m => m.date !== today);
      const newLog: MoodEnergyLog = { date: today, timestamp: Date.now(), mood, energy };

      let status: Profile['status'] = 'OPTIMAL';
      if (energy <= 3) status = 'STANDBY';
      else if (mood <= 4 && energy >= 7) status = 'AGITATED';
      else if (energy >= 9 && mood >= 8) status = 'OVERLOAD';
      else if (mood <= 4 && energy <= 4) status = 'RECOVERY';

      return {
        ...prev,
        moodLogs: [...activeMoods, newLog],
        profile: {
          ...prev.profile,
          status
        }
      };
    });

    writeLog(`Biometrics updated: Mood = ${mood}/10, Energy = ${energy}/10`, 'info');
  };

  // Notes Section Callbacks
  const addNote = (title: string, content: string, tags: string, pinned = false) => {
    HudAudio.playClick();
    const newNote: Note = {
      id: `n_${Date.now()}`,
      title: title || 'Untitled Note',
      content,
      tags,
      pinned,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setState(prev => {
      const notes = prev.notes.map(n => pinned ? { ...n, pinned: false } : n);
      return {
        ...prev,
        notes: [newNote, ...notes]
      };
    });
    writeLog(`Notebook: created "${newNote.title}"`, 'success');
  };

  const editNote = (id: string, title: string, content: string, tags: string, pinned = false) => {
    HudAudio.playClick();
    setState(prev => {
      const notes = prev.notes.map(n => {
        if (n.id === id) {
          return {
            ...n,
            title: title || 'Untitled Note',
            content,
            tags,
            pinned,
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return pinned ? { ...n, pinned: false } : n;
      });
      return {
        ...prev,
        notes
      };
    });
    writeLog(`Notebook: updated "${title || 'Untitled Note'}"`, 'info');
  };

  const deleteNote = (id: string) => {
    HudAudio.playClick();
    const target = state.notes.find(n => n.id === id);
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id)
    }));
    if (target) {
      writeLog(`Notebook: deleted "${target.title}"`, 'alert');
    }
  };

  const exportState = () => {
    HudAudio.playClick();
    return JSON.stringify(state, null, 2);
  };

  const importState = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.profile && parsed.habits && parsed.goals) {
        setState(parsed);
        writeLog("Restored entire local database from backup.", 'success');
        HudAudio.playSuccess();
        return true;
      }
    } catch (e) {
      writeLog("Restore Error: Invalid backup file.", 'alert');
      HudAudio.playAlert();
    }
    return false;
  };

  const resetToDefault = () => {
    HudAudio.playAlert();
    setState(DEFAULT_STATE);
    writeLog("Database reset to factory values.", 'alert');
  };

  const updateSettings = (newSettings: Partial<HudSettings>) => {
    setState(prev => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings
        }
      };

      if (newSettings.volume !== undefined) {
        HudAudio.setVolume(newSettings.volume);
      }

      return updated;
    });
  };

  const clearDiagnostics = () => {
    setState(prev => ({ ...prev, diagnostics: [] }));
  };

  const updateProfileName = (name: string) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: name || 'NEW USER'
      }
    }));
    writeLog(`Profile name updated to: "${name}"`, 'success');
  };

  const manualCloudSync = async () => {
    if (!user || !db || !isConfigured) return;
    try {
      setSyncStatus('syncing');
      HudAudio.playClick();
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, sanitizeForFirestore(state), { merge: true });
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      writeLog('Manual cloud synchronization complete', 'success');
      HudAudio.playSuccess();
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
      HudAudio.playAlert();
    }
  };

  return {
    isHydrated,
    state,
    syncStatus,
    lastSyncedAt,
    manualCloudSync,
    toggleHabit,
    addHabit,
    deleteHabit,
    gainXP,
    logFocusSession,
    toggleGoalSubtask,
    addGoal,
    deleteGoal,
    saveReflection,
    saveMoodEnergy,
    addNote,
    editNote,
    deleteNote,
    exportState,
    importState,
    resetToDefault,
    writeLog,
    updateSettings,
    clearDiagnostics,
    updateProfileName
  };
}
export type UseNexusStateReturn = ReturnType<typeof useNexusState>;

