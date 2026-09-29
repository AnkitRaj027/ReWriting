'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FileText,
  Clipboard,
  Check
} from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { HudSettings, FocusSession } from '../hooks/useNexusState';

interface FocusChamberProps {
  settings: HudSettings;
  focusSessions: FocusSession[];
  updateSettings: (newSettings: Partial<HudSettings>) => void;
  logFocusSession: (minutes: number, task: string) => void;
  writeLog: (msg: string, type: 'info' | 'success' | 'alert' | 'xp') => void;
  exportState: () => string;
  importState: (json: string) => boolean;
  resetToDefault: () => void;
}

export default function FocusChamber({
  settings,
  focusSessions,
  updateSettings,
  logFocusSession,
  writeLog,
  exportState,
  importState,
  resetToDefault
}: FocusChamberProps) {
  // Custom timer duration states (in minutes)
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  // Timer Core States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [taskName, setTaskName] = useState('Deep Work');
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'history' | 'settings' | 'backup'>('timer');

  // Backup operations states
  const [backupJson, setBackupJson] = useState('');
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      const activeLength = mode === 'work' ? customWork : customBreak;
      setTimeLeft(activeLength * 60);
      setTotalTime(activeLength * 60);
    }
  }, [customWork, customBreak, mode, isActive]);

  useEffect(() => {
    const triggerMinStr = localStorage.getItem('nexus_trigger_focus_min');
    if (triggerMinStr) {
      const mins = parseInt(triggerMinStr);
      if (!isNaN(mins) && mins > 0) {
        setCustomWork(mins);
        setTimeLeft(mins * 60);
        setTotalTime(mins * 60);
        setMode('work');
        endTimeRef.current = Date.now() + mins * 60 * 1000;
        setIsActive(true);
        writeLog(`Focus session started: ${mins} minutes`, 'info');
      }
      localStorage.removeItem('nexus_trigger_focus_min');
    }
  }, [writeLog]);

  useEffect(() => {
    if (isActive) {
      if (endTimeRef.current === null) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      const tick = () => {
        if (endTimeRef.current !== null) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));

          setTimeLeft((prev) => {
            if (remaining <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              endTimeRef.current = null;
              handleTimerConclude();
              return 0;
            }
            if (settings.timerTickSound && remaining !== prev) {
              HudAudio.playTick();
            }
            return remaining;
          });
        }
      };

      tick();
      timerRef.current = setInterval(tick, 200);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      endTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, mode, settings.timerTickSound]);

  const handleTimerConclude = () => {
    setIsActive(false);
    endTimeRef.current = null;
    HudAudio.playSuccess();

    if (mode === 'work') {
      logFocusSession(customWork, taskName);
      writeLog(`Focus session concluded: ${customWork}m for "${taskName}"`, 'success');
      setMode('break');
      setTimeLeft(customBreak * 60);
      setTotalTime(customBreak * 60);
    } else {
      writeLog(`Rest break concluded. Return to focus.`, 'info');
      setMode('work');
      setTimeLeft(customWork * 60);
      setTotalTime(customWork * 60);
    }
  };

  const handleStartPause = () => {
    HudAudio.playClick();
    if (!isActive) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    HudAudio.playClick();
    setIsActive(false);
    const activeLength = mode === 'work' ? customWork : customBreak;
    setTimeLeft(activeLength * 60);
    setTotalTime(activeLength * 60);
  };

  const handleFinishEarly = () => {
    HudAudio.playClick();
    if (confirm('Finish this focus session now and record elapsed time?')) {
      const elapsedMins = Math.max(1, Math.round((totalTime - timeLeft) / 60));
      logFocusSession(elapsedMins, taskName);
      writeLog(`Focus session concluded: ${elapsedMins}m for "${taskName}"`, 'success');
      handleReset();
    }
  };

  const handleSkip = () => {
    HudAudio.playClick();
    setIsActive(false);
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(customBreak * 60);
      setTotalTime(customBreak * 60);
    } else {
      setMode('work');
      setTimeLeft(customWork * 60);
      setTotalTime(customWork * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  const handleExportBackup = () => {
    const json = exportState();
    setBackupJson(json);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    writeLog('Database backup copied to clipboard.', 'success');
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) return;
    const success = importState(backupJson);
    if (success) {
      setBackupJson('');
    }
  };

  const totalFocusMins = focusSessions.reduce((acc, s) => acc + s.minutes, 0);
  const totalHours = Math.floor(totalFocusMins / 60);
  const remainingMins = totalFocusMins % 60;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Subnavigation Bar */}
      <div className="flex items-center justify-between border-b border-[#252B33] pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('timer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'timer'
                ? 'bg-[#15191F] text-[#F1F3F5]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'history'
                ? 'bg-[#15191F] text-[#F1F3F5]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
            }`}
          >
            History ({focusSessions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'settings'
                ? 'bg-[#15191F] text-[#F1F3F5]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'backup'
                ? 'bg-[#15191F] text-[#F1F3F5]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
            }`}
          >
            Data & Backup
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#9AA2AD]">
          <span>Today:</span>
          <span className="font-medium text-[#F1F3F5]">
            {totalHours}h {remainingMins}m
          </span>
        </div>
      </div>

      {/* Main Timer SubTab */}
      {activeSubTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Focus Clock Card (Calm, Focused, not a futuristic HUD) */}
          <div className="app-card p-8 lg:col-span-2 flex flex-col items-center justify-center min-h-[440px]">
            {/* Context label */}
            <div className="text-center mb-6">
              <span className="text-xs font-medium text-[#68717D] tracking-wide">
                {mode === 'work' ? 'Focus Session' : 'Rest Break'}
              </span>
            </div>

            {/* Circular Timer Clock */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="#1A1F26"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke={mode === 'work' ? '#22C7D9' : '#10B981'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-semibold tracking-tight text-[#F1F3F5]">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-[#9AA2AD] mt-2 font-medium">
                  {mode === 'work' ? taskName : 'Short Rest'}
                </span>
              </div>
            </div>

            {/* Current Target / Task input */}
            <div className="w-full max-w-xs mb-8">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Session focus target (e.g. DSA, System Design)"
                className="w-full text-center bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none transition-colors"
              />
            </div>

            {/* Calm, readable controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartPause}
                onMouseEnter={() => HudAudio.playHover()}
                className={`px-8 py-2.5 rounded-md font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1F26] text-[#F1F3F5] border border-[#252B33] hover:bg-[#202630]'
                    : 'bg-[#22C7D9] text-[#0B0D10] hover:bg-[#1BB0C0]'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause size={14} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" />
                    <span>Start Session</span>
                  </>
                )}
              </button>

              {isActive && (
                <button
                  onClick={handleFinishEarly}
                  onMouseEnter={() => HudAudio.playHover()}
                  className="px-4 py-2.5 rounded-md bg-[#1A1F26] hover:bg-[#202630] border border-[#252B33] text-xs font-medium text-[#F1F3F5] transition-colors"
                >
                  Finish
                </button>
              )}

              <button
                onClick={handleReset}
                onMouseEnter={() => HudAudio.playHover()}
                className="p-2.5 rounded-md bg-[#1A1F26] hover:bg-[#202630] border border-[#252B33] text-[#9AA2AD] hover:text-[#F1F3F5] transition-colors"
                title="Reset"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={handleSkip}
                onMouseEnter={() => HudAudio.playHover()}
                className="p-2.5 rounded-md bg-[#1A1F26] hover:bg-[#202630] border border-[#252B33] text-[#9AA2AD] hover:text-[#F1F3F5] transition-colors"
                title="Skip interval"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>

          {/* Quiet stats & Presets */}
          <div className="space-y-6">
            {/* Presets */}
            <div className="app-card p-5 space-y-3">
              <h3 className="text-xs font-medium text-[#9AA2AD]">
                Presets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Pomodoro', work: 25, rest: 5 },
                  { label: 'Deep Work', work: 50, rest: 10 },
                  { label: 'Extended', work: 90, rest: 15 },
                  { label: 'Short Sprint', work: 15, rest: 3 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (!isActive) {
                        HudAudio.playClick();
                        setCustomWork(preset.work);
                        setCustomBreak(preset.rest);
                      }
                    }}
                    disabled={isActive}
                    className={`p-2.5 rounded-md text-left border transition-colors ${
                      customWork === preset.work
                        ? 'bg-[#1A1F26] border-[#22C7D9]/40 text-[#F1F3F5]'
                        : 'bg-[#101318] border-[#252B33] text-[#9AA2AD] hover:border-[#323B46] hover:text-[#F1F3F5]'
                    } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-xs font-medium">{preset.work}m</div>
                    <div className="text-[11px] text-[#68717D]">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiet stats below */}
            <div className="app-card p-5 space-y-3">
              <h3 className="text-xs font-medium text-[#9AA2AD]">
                Today
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#9AA2AD]">
                  <span>Today</span>
                  <span className="font-medium text-[#F1F3F5]">
                    {totalHours}h {remainingMins}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#9AA2AD]">
                  <span>Sessions</span>
                  <span className="font-medium text-[#F1F3F5]">
                    {focusSessions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#9AA2AD]">
                  <span>XP Earned</span>
                  <span className="font-medium text-[#10B981]">
                    +{totalFocusMins * 10} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session History SubTab */}
      {activeSubTab === 'history' && (
        <div className="app-card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#F1F3F5]">Session History</h3>
              <p className="text-xs text-[#9AA2AD] mt-0.5">Chronological log of completed sessions</p>
            </div>
          </div>

          {focusSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#68717D]">
              No focus sessions recorded yet today.
            </div>
          ) : (
            <div className="divide-y divide-[#252B33]">
              {focusSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#1A1F26] border border-[#252B33] flex items-center justify-center text-[#22C7D9]">
                      <FileText size={13} />
                    </div>
                    <div>
                      <div className="font-medium text-[#F1F3F5]">{session.task}</div>
                      <div className="text-[11px] text-[#68717D]">{session.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="font-medium text-[#F1F3F5]">
                      {session.minutes} mins
                    </span>
                    <span className="text-[11px] font-mono text-[#10B981]">
                      +{session.minutes * 10} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timer Settings SubTab */}
      {activeSubTab === 'settings' && (
        <div className="app-card p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-semibold text-[#F1F3F5]">Timer Configuration</h3>
            <p className="text-xs text-[#9AA2AD] mt-0.5">Customize durations and sound feedback</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#9AA2AD]">Work Duration</span>
                <span className="font-medium text-[#F1F3F5]">{customWork} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={customWork}
                disabled={isActive}
                onChange={(e) => setCustomWork(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#9AA2AD]">Break Duration</span>
                <span className="font-medium text-[#F1F3F5]">{customBreak} minutes</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={customBreak}
                disabled={isActive}
                onChange={(e) => setCustomBreak(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2 pt-3 border-t border-[#252B33]">
              <div className="flex justify-between text-xs">
                <span className="text-[#9AA2AD]">Audio Volume</span>
                <span className="font-medium text-[#F1F3F5]">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#252B33] text-xs">
              <div>
                <span className="text-[#F1F3F5] font-medium block">Audible Clock Tick</span>
                <span className="text-[#68717D]">Subtle click every second</span>
              </div>
              <input
                type="checkbox"
                checked={settings.timerTickSound}
                onChange={(e) => {
                  HudAudio.playClick();
                  updateSettings({ timerTickSound: e.target.checked });
                }}
                className="rounded border-[#252B33] text-[#22C7D9] h-4 w-4"
              />
            </div>
          </div>
        </div>
      )}

      {/* Data & Backup SubTab */}
      {activeSubTab === 'backup' && (
        <div className="app-card p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-semibold text-[#F1F3F5]">Data Management & Backup</h3>
            <p className="text-xs text-[#9AA2AD] mt-0.5">
              Export your local data or restore from a previous JSON backup
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={handleExportBackup}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                {copied ? <Check size={13} /> : <Clipboard size={13} />}
                <span>{copied ? 'Copied' : 'Export Backup'}</span>
              </button>

              <button
                onClick={handleImportBackup}
                disabled={!backupJson.trim()}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Restore from JSON
              </button>
            </div>

            <textarea
              value={backupJson}
              onChange={(e) => setBackupJson(e.target.value)}
              placeholder="Paste exported JSON here to restore your data..."
              rows={5}
              className="w-full bg-[#101318] border border-[#252B33] rounded-md p-3 text-xs font-mono text-[#F1F3F5] outline-none focus:border-[#22C7D9]"
            />

            <div className="pt-4 border-t border-[#252B33]">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data to default values?')) {
                    resetToDefault();
                  }
                }}
                className="text-xs text-[#EF4444] hover:underline"
              >
                Reset Database to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
