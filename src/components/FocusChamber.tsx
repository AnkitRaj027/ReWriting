'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, Settings2, Sliders, Check, FileText, Database, Clipboard } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { HudSettings, FocusSession } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

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
  const [taskName, setTaskName] = useState('Study Session');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Backup operations states
  const [backupJson, setBackupJson] = useState('');
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync custom timer changes when state is not running
  useEffect(() => {
    if (!isActive) {
      const activeLength = mode === 'work' ? customWork : customBreak;
      setTimeLeft(activeLength * 60);
      setTotalTime(activeLength * 60);
    }
  }, [customWork, customBreak, mode, isActive]);

  // Terminal focus triggers
  useEffect(() => {
    const triggerMinStr = localStorage.getItem('nexus_trigger_focus_min');
    if (triggerMinStr) {
      const mins = parseInt(triggerMinStr);
      if (!isNaN(mins) && mins > 0) {
        setCustomWork(mins);
        setTimeLeft(mins * 60);
        setTotalTime(mins * 60);
        setMode('work');
        setIsActive(true);
        writeLog(`Timer triggered via terminal input for ${mins} minutes`, 'info');
      }
      localStorage.removeItem('nexus_trigger_focus_min');
    }
  }, [writeLog]);

  // Timer Interval Tick
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            handleTimerConclude();
            return 0;
          }
          // Optional ticking beep oscillator
          if (settings.timerTickSound) {
            HudAudio.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, settings.timerTickSound]);

  const handleTimerConclude = () => {
    setIsActive(false);
    HudAudio.playSuccess();

    if (mode === 'work') {
      logFocusSession(customWork, taskName);
      writeLog(`Interval complete: Work block logged for ${customWork} minutes.`, 'success');
      // Shift to break mode automatically
      setMode('break');
      setTimeLeft(customBreak * 60);
      setTotalTime(customBreak * 60);
    } else {
      writeLog(`Rest break complete. Return to focus target.`, 'success');
      setMode('work');
      setTimeLeft(customWork * 60);
      setTotalTime(customWork * 60);
    }
  };

  const handleStartPause = () => {
    HudAudio.playClick();
    setIsActive(!isActive);
  };

  const handleReset = () => {
    HudAudio.playClick();
    setIsActive(false);
    const activeLength = mode === 'work' ? customWork : customBreak;
    setTimeLeft(activeLength * 60);
    setTotalTime(activeLength * 60);
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

  // Convert seconds to human MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Circular stroke details
  const radius = 98;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  // Linear grid meter segments (visual EQ bar clock)
  const totalSegments = 16;
  const filledSegments = Math.min(totalSegments, Math.floor(progressPercent * totalSegments));

  const handleExportBackup = () => {
    const json = exportState();
    setBackupJson(json);
    navigator.clipboard.writeText(json);
    writeLog("State export copied to clipboard.", "success");
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) return;
    const success = importState(backupJson);
    if (success) {
      setBackupJson('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Visual Timer View panel */}
      <div className="cyber-card p-6 rounded-lg border-cyber-cyan/20 lg:col-span-2 flex flex-col items-center justify-center min-h-[440px] relative">
        <div className="w-full max-w-sm flex items-center justify-between mb-6 font-mono text-[10px]">
          <span className="text-cyber-cyan font-bold tracking-wider">
            {getTranslation(settings.vocabulary, 'focusTitle')} Timer
          </span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 border rounded font-bold ${
              mode === 'work' ? 'border-cyber-pink/40 text-cyber-pink bg-cyber-pink/5' : 'border-cyber-green/40 text-cyber-green bg-cyber-green/5'
            }`}>
              {mode.toUpperCase()} MODE
            </span>
            <button
              onClick={() => { HudAudio.playClick(); setShowConfigDrawer(!showConfigDrawer); }}
              onMouseEnter={() => HudAudio.playHover()}
              className="p-1 border border-cyber-cyan/20 hover:border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/5 rounded cursor-pointer"
              title="Configuration Console"
            >
              <Settings2 size={13} className={showConfigDrawer ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dynamic Timer Layout variant */}
        {settings.timerMode === 'circular' ? (
          /* CIRCULAR TIMER */
          <div className="relative w-56 h-56 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r={radius}
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r={radius}
                stroke={mode === 'work' ? 'var(--color-cyber-cyan)' : 'var(--color-cyber-green)'}
                strokeWidth="4.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 shadow-glow-cyan"
                style={{
                  filter: mode === 'work' 
                    ? 'drop-shadow(0 0 6px var(--color-cyber-cyan))' 
                    : 'drop-shadow(0 0 6px var(--color-cyber-green))'
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center font-mono">
              <span className="text-4xl font-bold tracking-widest text-white leading-none mb-1">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                {mode === 'work' ? 'FOCUS TIME' : 'BREAK ACTIVE'}
              </span>
            </div>
          </div>
        ) : (
          /* LINEAR EQ SEGMENT METER */
          <div className="w-full max-w-sm flex flex-col items-center justify-center py-10 mb-6 space-y-4">
            <div className="font-mono text-4xl font-bold tracking-widest text-white">
              {formatTime(timeLeft)}
            </div>

            <div className="flex w-full items-center justify-between gap-1 p-1 border border-obsidian-light bg-obsidian-deep/50 rounded">
              {Array.from({ length: totalSegments }).map((_, idx) => {
                const filled = idx < filledSegments;
                const isWork = mode === 'work';

                let segmentBg = 'bg-obsidian-light/30 border-transparent';
                if (filled) {
                  segmentBg = isWork 
                    ? 'bg-cyber-cyan border-cyber-cyan shadow-[0_0_5px_#00F0FF]' 
                    : 'bg-cyber-green border-cyber-green shadow-[0_0_5px_#00FF66]';
                }

                return (
                  <div 
                    key={idx} 
                    className={`flex-1 h-8 rounded-sm border transition-all ${segmentBg}`}
                  />
                );
              })}
            </div>
            <div className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">
              Charging focus meter segments
            </div>
          </div>
        )}

        {/* Focus Task Name Input */}
        <div className="w-full max-w-xs font-mono text-[10px] space-y-1 mb-8">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Focus Task Description..."
            className="w-full text-center bg-transparent border-b border-cyber-cyan/20 focus:border-cyber-cyan text-white py-1 outline-none text-xs"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-6">
          <button
            onClick={handleReset}
            onMouseEnter={() => HudAudio.playHover()}
            className="p-3 border border-obsidian-light hover:border-cyber-cyan/45 text-gray-400 hover:text-cyber-cyan rounded-full transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handleStartPause}
            onMouseEnter={() => HudAudio.playHover()}
            className={`p-5 rounded-full text-obsidian-deep transition-all transform hover:scale-105 shadow-md cursor-pointer ${
              isActive 
                ? 'bg-cyber-pink hover:bg-cyber-pink/80 shadow-glow-purple' 
                : 'bg-cyber-cyan hover:bg-cyber-cyan/80 shadow-glow-cyan'
            }`}
          >
            {isActive ? <Pause size={24} className="stroke-[2.5px]" /> : <Play size={24} className="stroke-[2.5px] fill-current" />}
          </button>

          <button
            onClick={handleSkip}
            onMouseEnter={() => HudAudio.playHover()}
            className="p-3 border border-obsidian-light hover:border-cyber-cyan/45 text-gray-400 hover:text-cyber-cyan rounded-full transition-all cursor-pointer"
            title="Skip Interval"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* Settings & Sidebar Panel */}
      <div className="space-y-6">
        
        {/* Settings Drawer inside sidebar */}
        {showConfigDrawer ? (
          <div className="cyber-card p-5 rounded-lg border-cyber-cyan/35 space-y-4 font-mono text-[10px]">
            <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-2">
              <span className="text-xs text-cyber-cyan font-bold tracking-wider flex items-center gap-1">
                <Sliders size={12} /> Timer Parameters
              </span>
              <button 
                onClick={() => { HudAudio.playClick(); setShowConfigDrawer(false); }}
                className="text-[9px] text-gray-500 hover:text-white"
              >
                Close Settings
              </button>
            </div>

            {/* Custom durations */}
            {!isActive ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Focus Work: {customWork}m</span>
                    <span className="text-cyber-cyan">Range: 10-120m</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={customWork}
                    onChange={(e) => setCustomWork(parseInt(e.target.value))}
                    className="w-full accent-cyber-cyan"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Rest Break: {customBreak}m</span>
                    <span className="text-cyber-green">Range: 1-30m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={customBreak}
                    onChange={(e) => setCustomBreak(parseInt(e.target.value))}
                    className="w-full accent-cyber-green"
                  />
                </div>

                {/* Font Scaling */}
                <div className="space-y-1.5 pt-1.5 border-t border-obsidian-light">
                  <span className="text-gray-400 block font-bold">Font Size Scale</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => { HudAudio.playClick(); updateSettings({ fontSize: sz }); }}
                        className={`py-1 border text-[9px] rounded uppercase cursor-pointer ${
                          settings.fontSize === sz 
                            ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 font-bold' 
                            : 'border-obsidian-light text-gray-500 hover:border-cyber-cyan/30 hover:text-gray-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Futuristic Fonts Switcher */}
                <div className="space-y-1.5 pt-1.5 border-t border-obsidian-light">
                  <span className="text-gray-400 block font-bold">Futuristic Fonts</span>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { id: 'fira', label: 'Fira Code' },
                      { id: 'share-tech', label: 'Share Tech' },
                      { id: 'orbitron', label: 'Orbitron' },
                      { id: 'vt323', label: 'VT323' },
                      { id: 'space-mono', label: 'Space Mono' },
                      { id: 'jetbrains', label: 'JetBrains' }
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { HudAudio.playClick(); updateSettings({ fontFamily: f.id }); }}
                        className={`py-1 border text-[8px] rounded uppercase cursor-pointer ${
                          settings.fontFamily === f.id || (!settings.fontFamily && f.id === 'fira')
                            ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 font-bold' 
                            : 'border-obsidian-light text-gray-500 hover:border-cyber-cyan/30 hover:text-gray-300'
                        }`}
                        title={f.label}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocabulary selector */}
                <div className="space-y-1.5 pt-1.5 border-t border-obsidian-light">
                  <span className="text-gray-400 block font-bold">Vocabulary Glossary Mode</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['cyberpunk', 'academic', 'personal'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { HudAudio.playClick(); updateSettings({ vocabulary: v }); }}
                        className={`py-1 border text-[9px] rounded uppercase cursor-pointer ${
                          settings.vocabulary === v 
                            ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 font-bold' 
                            : 'border-obsidian-light text-gray-500 hover:border-cyber-cyan/30 hover:text-gray-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Master Volume */}
                <div className="space-y-1.5 pt-1.5 border-t border-obsidian-light">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Synthesizer Volume</span>
                    <span className="text-cyber-cyan">{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-cyber-cyan"
                  />
                </div>

                {/* Clock Ticking Toggles */}
                <div className="flex items-center justify-between pt-1 border-t border-obsidian-light">
                  <span className="text-gray-400 font-bold">Timer Clock Beep Ticks</span>
                  <input
                    type="checkbox"
                    checked={settings.timerTickSound}
                    onChange={(e) => { HudAudio.playClick(); updateSettings({ timerTickSound: e.target.checked }); }}
                    className="rounded border-cyber-cyan text-cyber-cyan focus:ring-cyber-cyan h-4 w-4"
                  />
                </div>

                {/* HUD Clock format */}
                <div className="space-y-1.5 pt-2 border-t border-obsidian-light">
                  <span className="text-gray-400 block font-bold">Clock Graphic layout</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { HudAudio.playClick(); updateSettings({ timerMode: 'circular' }); }}
                      className={`py-1.5 border rounded cursor-pointer ${
                        settings.timerMode === 'circular'
                          ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 font-bold'
                          : 'border-obsidian-light text-gray-500 hover:border-cyber-cyan/30 hover:text-gray-300'
                      }`}
                    >
                      CIRCULAR HUD
                    </button>
                    <button
                      type="button"
                      onClick={() => { HudAudio.playClick(); updateSettings({ timerMode: 'linear' }); }}
                      className={`py-1.5 border rounded cursor-pointer ${
                        settings.timerMode === 'linear'
                          ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 font-bold'
                          : 'border-obsidian-light text-gray-500 hover:border-cyber-cyan/30 hover:text-gray-300'
                      }`}
                    >
                      LINEAR EQ
                    </button>
                  </div>
                </div>

                {/* DATABASE BACKUP AND MAINTENANCE RELOCATION */}
                <div className="space-y-2 pt-2 border-t border-obsidian-light">
                  <button
                    type="button"
                    onClick={() => { HudAudio.playClick(); setMaintenanceOpen(!maintenanceOpen); }}
                    className="w-full py-1 bg-obsidian-light/30 border border-obsidian-light hover:border-cyber-cyan/40 text-gray-400 hover:text-white rounded flex items-center justify-center gap-1.5"
                  >
                    <Database size={10} /> {maintenanceOpen ? 'HIDE MAINTENANCE' : 'DATABASE MAINTENANCE'}
                  </button>

                  {maintenanceOpen && (
                    <div className="space-y-2 pt-2 bg-obsidian-deep/50 p-2 rounded border border-obsidian-light/50">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="flex-1 py-1 bg-cyber-cyan/10 border border-cyber-cyan/20 hover:border-cyber-cyan text-cyber-cyan rounded flex items-center justify-center gap-1"
                        >
                          <Clipboard size={10} /> Export JSON
                        </button>
                        <button
                          type="button"
                          onClick={handleImportBackup}
                          className="flex-1 py-1 bg-cyber-purple/10 border border-cyber-purple/20 hover:border-cyber-purple text-cyber-purple rounded flex items-center justify-center gap-1"
                        >
                          Restore State
                        </button>
                      </div>

                      <textarea
                        value={backupJson}
                        onChange={(e) => setBackupJson(e.target.value)}
                        placeholder="Paste backup state string to restore, or click Export JSON to generate config..."
                        rows={3}
                        className="w-full bg-obsidian-deep border border-cyber-cyan/15 rounded p-1 text-[8px] outline-none text-cyber-cyan"
                      />

                      <button
                        type="button"
                        onClick={() => { if (confirm("Restore factory defaults? This clears history logs.")) resetToDefault(); }}
                        className="w-full py-1 bg-cyber-pink/10 border border-cyber-pink/20 hover:border-cyber-pink text-cyber-pink rounded font-bold"
                      >
                        Reset Factory Database
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="cyber-card p-5 rounded-lg border-cyber-cyan/10 text-center py-12 font-mono text-[10px] text-gray-500">
                PAUSE THE TIMER SYSTEM TO ADJUST CONFIGURATION SCALARS.
              </div>
            )}

          </div>
        ) : (
          /* Recent Focus sessions history panel */
          <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 flex flex-col h-64 justify-between">
            <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-2">
              <span className="font-mono text-xs text-cyber-cyan font-bold tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Focus Session Logs
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
              {focusSessions.length === 0 ? (
                <div className="text-gray-600 italic py-8 text-center">No recent focus periods.</div>
              ) : (
                focusSessions.map((fs) => (
                  <div key={fs.id} className="p-2 border border-obsidian-light rounded bg-obsidian-deep/30 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold truncate max-w-[120px] block">{fs.task}</span>
                      <span className="text-[8px] text-gray-500 block">Date: {fs.date}</span>
                    </div>
                    <span className="text-cyber-cyan font-bold font-semibold flex-shrink-0 text-right">
                      +{fs.minutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Ambient sound synthesizer */}
        <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2">
            <h4 className="font-mono text-xs text-cyber-cyan font-bold tracking-wider uppercase">
              {getTranslation(settings.vocabulary, 'focusTitle')} Audio Core
            </h4>
            <Volume2 size={12} className="text-cyber-cyan animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <button
              onClick={() => { HudAudio.playClick(); HudAudio.stopNoise(); }}
              className="py-1.5 border border-obsidian-light text-gray-500 hover:border-cyber-cyan/40 hover:text-gray-300 rounded cursor-pointer"
            >
              STOP NOISE
            </button>
            <button
              onClick={() => { HudAudio.playClick(); HudAudio.startNoise('binaural'); }}
              className="py-1.5 border border-obsidian-light text-gray-500 hover:border-cyber-cyan/40 hover:text-gray-300 rounded cursor-pointer"
              title="Panned left/right theta focus wave loop"
            >
              THETA WAVE
            </button>
            <button
              onClick={() => { HudAudio.playClick(); HudAudio.startNoise('synthwave'); }}
              className="py-1.5 border border-obsidian-light text-gray-500 hover:border-cyber-cyan/40 hover:text-gray-300 rounded cursor-pointer"
            >
              SYNTHWAVE
            </button>
            <button
              onClick={() => { HudAudio.playClick(); HudAudio.startNoise('rain'); }}
              className="py-1.5 border border-obsidian-light text-gray-500 hover:border-cyber-cyan/40 hover:text-gray-300 rounded cursor-pointer"
            >
              CYBER-RAIN
            </button>
            <button
              onClick={() => { HudAudio.playClick(); HudAudio.startNoise('white'); }}
              className="py-1.5 border border-obsidian-light text-gray-500 hover:border-cyber-cyan/40 hover:text-gray-300 rounded cursor-pointer"
            >
              WHITE STATIC
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
