'use client';

import React from 'react';
import { Flame, CheckSquare, ArrowUpRight } from 'lucide-react';
import IconRenderer from './IconRenderer';
import TerminalConsole from './TerminalConsole';
import { HudAudio } from '../utils/HudAudio';
import { NexusState } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

interface CommandCenterProps {
  state: NexusState;
  toggleHabit: (id: string) => void;
  gainXP: (amount: number) => void;
  writeLog: (msg: string, type: 'info' | 'success' | 'alert' | 'xp') => void;
  clearDiagnostics: () => void;
  setActiveTab: (tab: string) => void;
}

export default function CommandCenter({
  state,
  toggleHabit,
  gainXP,
  writeLog,
  clearDiagnostics,
  setActiveTab
}: CommandCenterProps) {
  const today = new Date().toISOString().split('T')[0];
  const vocab = state.settings.vocabulary;

  // Calculate habit completions for today
  const totalHabits = state.habits.length;
  const completedHabits = state.habits.filter(h => h.history.includes(today)).length;
  const habitPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Active goals list (take first 3)
  const activeGoals = state.goals.slice(0, 3);

  // Find pinned note
  const pinnedNote = state.notes.find(n => n.pinned);

  const handleHabitToggle = (id: string) => {
    toggleHabit(id);
  };

  return (
    <div className="space-y-6">
      {/* Overview Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Sync Card */}
        <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-cyber-cyan tracking-wider font-bold">
                {getTranslation(vocab, 'habitsTitle')} Status
              </span>
              <span className="font-mono text-[10px] text-gray-500">Completed: {habitPercent}%</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              {vocab === 'cyberpunk' ? 'Synchronization' : 'Daily Progress'}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {getTranslation(vocab, 'habitsSubtitle')}
            </p>
          </div>

          <div className="space-y-3">
            {/* Sync Progress Bar */}
            <div className="w-full bg-obsidian-deep border border-cyber-cyan/15 h-4 rounded p-0.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyber-cyan to-cyber-purple h-full rounded transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center justify-end px-1"
                style={{ width: `${habitPercent}%` }}
              >
                {habitPercent > 15 && (
                  <span className="text-[8px] font-mono font-bold text-obsidian-deep">{habitPercent}%</span>
                )}
              </div>
            </div>

            <div className="flex justify-between font-mono text-[10px] text-gray-500 pt-1">
              <span>Total Habits: {totalHabits}</span>
              <span>Completed Today: {completedHabits}</span>
            </div>
          </div>
        </div>

        {/* Daily Habits Quick Checklist */}
        <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 border-b border-cyber-cyan/10 pb-2">
            <span className="font-mono text-xs text-cyber-cyan tracking-wider font-bold">
              {getTranslation(vocab, 'habitsTitle')} Checklist
            </span>
            <button 
              onClick={() => { HudAudio.playClick(); setActiveTab('habits'); }}
              onMouseEnter={() => HudAudio.playHover()}
              className="text-[10px] font-mono text-cyber-cyan/70 hover:text-cyber-cyan flex items-center gap-0.5 cursor-pointer"
            >
              Open Habits Tab <ArrowUpRight size={10} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.habits.length === 0 ? (
              <div className="col-span-2 py-6 text-center text-xs text-gray-500 font-mono">
                No habits configured. Go to habits tab to configure.
              </div>
            ) : (
              state.habits.map((habit) => {
                const isCompletedToday = habit.history.includes(today);
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-2.5 rounded border transition-colors ${
                      isCompletedToday 
                        ? 'bg-cyber-cyan/5 border-cyber-cyan/30 text-cyber-cyan' 
                        : 'bg-obsidian-light/30 border-obsidian-light/50 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded ${
                        isCompletedToday ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'bg-obsidian-deep text-gray-500'
                      }`}>
                        <IconRenderer name={habit.icon} size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-wide">{habit.name}</p>
                        <div className="flex items-center text-[9px] text-gray-500 space-x-2">
                          <span>{habit.category}</span>
                          <span className="text-cyber-purple flex items-center gap-0.5">
                            <Flame size={8} /> {habit.streak}d streak
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleHabitToggle(habit.id)}
                      onMouseEnter={() => HudAudio.playHover()}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        isCompletedToday 
                          ? 'border-cyber-cyan bg-cyber-cyan text-obsidian-deep' 
                          : 'border-cyber-cyan/40 hover:border-cyber-cyan hover:bg-cyber-cyan/10 text-transparent'
                      }`}
                    >
                      <CheckSquare size={12} className={isCompletedToday ? 'stroke-[3px]' : ''} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Goals, Pinned Note & Shortcuts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Goals Matrix Card */}
        <div className={`cyber-card p-5 rounded-lg border-cyber-purple/20 space-y-3 ${
          pinnedNote ? 'lg:col-span-1' : 'lg:col-span-2'
        }`}>
          <div className="flex items-center justify-between border-b border-cyber-purple/10 pb-2">
            <span className="font-mono text-xs text-cyber-purple tracking-wider font-bold">
              {getTranslation(vocab, 'goalsTitle')} Checklist
            </span>
            <button 
              onClick={() => { HudAudio.playClick(); setActiveTab('skills'); }}
              onMouseEnter={() => HudAudio.playHover()}
              className="text-[10px] font-mono text-cyber-purple/70 hover:text-cyber-purple flex items-center gap-0.5 cursor-pointer"
            >
              Open Goals <ArrowUpRight size={10} />
            </button>
          </div>

          <div className="space-y-2">
            {activeGoals.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-mono">
                No goals active.
              </div>
            ) : (
              activeGoals.slice(0, pinnedNote ? 2 : 3).map((goal) => (
                <div key={goal.id} className="bg-obsidian-light/20 p-2 rounded border border-obsidian-light/60 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] font-mono px-1 rounded font-bold border ${
                        goal.type === 'directive' ? 'border-cyber-cyan/30 text-cyber-cyan bg-cyber-cyan/5' : 'border-cyber-purple/30 text-cyber-purple bg-cyber-purple/5'
                      }`}>
                        {goal.type === 'directive' ? 'ST' : 'LT'}
                      </span>
                      <span className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">{goal.title}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-xs text-cyber-cyan font-bold">{goal.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pinned Note widget */}
        {pinnedNote && (
          <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 flex flex-col justify-between bg-cyber-cyan/5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-cyber-cyan font-bold tracking-wider">Pinned Memo</span>
                <span className="text-[8px] font-mono text-gray-500">{pinnedNote.updatedAt}</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{pinnedNote.title}</h4>
              <p className="text-[10px] text-gray-300 line-clamp-3 whitespace-pre-wrap">{pinnedNote.content}</p>
            </div>
            {pinnedNote.tags && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-cyber-cyan/10">
                {pinnedNote.tags.split(',').map(tag => (
                  <span key={tag} className="bg-obsidian-deep px-1 py-0.5 rounded text-[7px] text-cyber-purple font-semibold border border-cyber-purple/10">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shortcuts / Quick Action Timer card */}
        <div className="cyber-card p-5 rounded-lg border-cyber-purple/20 flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-xs text-cyber-purple font-bold uppercase tracking-wider mb-2">Timer Shortcut</h4>
            <p className="text-xs text-gray-400">Launch focus block sessions instantly.</p>
          </div>
          <button 
            onClick={() => { HudAudio.playClick(); setActiveTab('focus'); }}
            onMouseEnter={() => HudAudio.playHover()}
            className="w-full py-2 btn-cyber-cyan flex items-center justify-center gap-1 rounded text-xs cursor-pointer"
          >
            Start Focus Session
          </button>
        </div>
      </div>

      {/* Rolling System Diagnostics Monitor & Terminal Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Diagnostics Panel */}
        <div className="cyber-card p-4 rounded-lg flex flex-col h-48 border-cyber-cyan/20">
          <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-2">
            <div className="flex items-center space-x-2 font-mono text-xs text-cyber-cyan font-bold tracking-wider">
              <span>{getTranslation(vocab, 'diagnosticsTitle')} Output</span>
            </div>
            <button 
              onClick={() => { HudAudio.playClick(); clearDiagnostics(); }}
              className="text-[9px] font-mono text-cyber-pink/70 hover:text-cyber-pink px-2 py-0.5 border border-cyber-pink/20 hover:border-cyber-pink rounded transition-colors cursor-pointer"
            >
              Clear Log
            </button>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5 pr-2">
            {state.diagnostics.length === 0 ? (
              <div className="text-gray-600 italic">No activity logs recorded. Awaiting inputs...</div>
            ) : (
              state.diagnostics.map((log, index) => {
                let textClass = 'text-gray-400';
                if (log.includes('[OK]')) textClass = 'text-cyber-green font-semibold';
                else if (log.includes('[ALERT]')) textClass = 'text-cyber-pink font-semibold';
                else if (log.includes('[XP]')) textClass = 'text-cyber-cyan font-semibold';
                
                return (
                  <div key={index} className={`py-0.5 border-l-2 pl-2 border-transparent transition-all hover:bg-obsidian-light/40 ${textClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <TerminalConsole 
          state={state} 
          toggleHabit={toggleHabit} 
          gainXP={gainXP} 
          writeLog={writeLog} 
          setActiveTab={setActiveTab}
          onClearDiagnostics={clearDiagnostics}
        />
      </div>
    </div>
  );
}
