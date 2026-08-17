'use client';

import React, { useState, useEffect } from 'react';
import { useNexusState } from '../hooks/useNexusState';
import NavbarHeader from '../components/NavbarHeader';
import CommandCenter from '../components/CommandCenter';
import HabitsView from '../components/HabitsView';
import FocusChamber from '../components/FocusChamber';
import MissionControl from '../components/MissionControl';
import MindVault from '../components/MindVault';
import EnglishCoach from '../components/EnglishCoach';
import AIAssistant from '../components/AIAssistant';
import { HudAudio } from '../utils/HudAudio';

export default function Home() {
  const {
    isHydrated,
    state,
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
    clearDiagnostics,
    updateSettings,
    updateProfileName
  } = useNexusState();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [showWelcomeSetup, setShowWelcomeSetup] = useState(false);
  const [setupName, setSetupName] = useState('');

  // Initial Onboarding Welcome Prompt
  useEffect(() => {
    if (isHydrated && (state.profile.name === "HACKER OPERATOR" || state.profile.name === "NEW USER")) {
      setShowWelcomeSetup(true);
    }
  }, [isHydrated, state.profile.name]);

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) return;
    updateProfileName(setupName.trim());
    setShowWelcomeSetup(false);
    HudAudio.playSuccess();
  };

  // Theme definitions (updated cyan purple to high contrast electric violet)
  const themeVariables: Record<string, Record<string, string>> = {
    cyan: {
      '--color-cyber-cyan': '#00F0FF',
      '--color-cyber-purple': '#BF40FF',
      '--shadow-glow-cyan': '0 0 10px rgba(0, 240, 255, 0.4)',
      '--shadow-glow-purple': '0 0 10px rgba(191, 64, 255, 0.4)'
    },
    green: {
      '--color-cyber-cyan': '#00FF66',
      '--color-cyber-purple': '#009933',
      '--shadow-glow-cyan': '0 0 10px rgba(0, 255, 102, 0.4)',
      '--shadow-glow-purple': '0 0 10px rgba(0, 153, 51, 0.4)'
    },
    crimson: {
      '--color-cyber-cyan': '#FF0055',
      '--color-cyber-purple': '#990022',
      '--shadow-glow-cyan': '0 0 10px rgba(255, 0, 85, 0.4)',
      '--shadow-glow-purple': '0 0 10px rgba(153, 0, 34, 0.4)'
    },
    amber: {
      '--color-cyber-cyan': '#FFB000',
      '--color-cyber-purple': '#AA5500',
      '--shadow-glow-cyan': '0 0 10px rgba(255, 176, 0, 0.4)',
      '--shadow-glow-purple': '0 0 10px rgba(170, 85, 0, 0.4)'
    },
    purple: {
      '--color-cyber-cyan': '#a855f7',
      '--color-cyber-purple': '#ec4899',
      '--shadow-glow-cyan': '0 0 10px rgba(168, 85, 247, 0.4)',
      '--shadow-glow-purple': '0 0 10px rgba(236, 72, 153, 0.4)'
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06090e] font-mono text-xs text-cyber-cyan tracking-widest space-y-4">
        <div className="crt-overlay" />
        <div className="crt-scanline animate-scanline" />
        <div className="w-12 h-12 border-2 border-t-transparent border-cyber-cyan rounded-full animate-spin shadow-[0_0_10px_rgba(0,240,255,0.4)]" />
        <div className="animate-pulse">Loading ReWriting core status...</div>
      </div>
    );
  }

  const activeThemeVars = themeVariables[state.settings.theme] || themeVariables.cyan;

  const getFontSize = () => {
    switch (state.settings.fontSize) {
      case 'sm': return '0.95rem';
      case 'lg': return '1.22rem';
      default: return '1.08rem';
    }
  };

  const getFontFamilyVariables = () => {
    switch (state.settings.fontFamily) {
      case 'share-tech':
        return {
          '--font-sans': "'Share Tech Mono', monospace",
          '--font-mono': "'Share Tech Mono', monospace"
        };
      case 'orbitron':
        return {
          '--font-sans': "'Orbitron', sans-serif",
          '--font-mono': "'Fira Code', monospace"
        };
      case 'vt323':
        return {
          '--font-sans': "'VT323', monospace",
          '--font-mono': "'VT323', monospace"
        };
      case 'space-mono':
        return {
          '--font-sans': "'Space Mono', monospace",
          '--font-mono': "'Space Mono', monospace"
        };
      case 'jetbrains':
        return {
          '--font-sans': "'JetBrains Mono', monospace",
          '--font-mono': "'JetBrains Mono', monospace"
        };
      default:
        return {
          '--font-sans': "'Plus Jakarta Sans', sans-serif",
          '--font-mono': "'Fira Code', monospace"
        };
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <CommandCenter
            state={state}
            toggleHabit={toggleHabit}
            gainXP={(amt) => gainXP(amt)}
            writeLog={writeLog}
            clearDiagnostics={clearDiagnostics}
            setActiveTab={setActiveTab}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={state.habits}
            settings={state.settings}
            toggleHabit={toggleHabit}
            addHabit={addHabit}
            deleteHabit={deleteHabit}
          />
        );
      case 'focus':
        return (
          <FocusChamber
            settings={state.settings}
            focusSessions={state.focusSessions}
            updateSettings={updateSettings}
            logFocusSession={logFocusSession}
            writeLog={writeLog}
            exportState={exportState}
            importState={importState}
            resetToDefault={resetToDefault}
          />
        );
      case 'skills': // Goals checklist view
        return (
          <MissionControl
            goals={state.goals}
            settings={state.settings}
            toggleGoalSubtask={toggleGoalSubtask}
            addGoal={addGoal}
            deleteGoal={deleteGoal}
          />
        );
      case 'vault':
        return (
          <MindVault
            moodLogs={state.moodLogs}
            reflectionLogs={state.reflectionLogs}
            notes={state.notes}
            settings={state.settings}
            saveReflection={saveReflection}
            saveMoodEnergy={saveMoodEnergy}
            addNote={addNote}
            editNote={editNote}
            deleteNote={deleteNote}
          />
        );
      case 'english':
        return (
          <EnglishCoach
            gainXP={gainXP}
            writeLog={writeLog}
          />
        );
      case 'assistant':
        return (
          <AIAssistant
            state={state}
            gainXP={gainXP}
            writeLog={writeLog}
          />
        );
      default:
        return (
          <div className="text-center font-mono text-xs text-cyber-pink py-12">
            Error: viewport routing fault.
          </div>
        );
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#06090e] bg-grid-move relative transition-all duration-300"
      style={{
        ...activeThemeVars as React.CSSProperties,
        ...getFontFamilyVariables() as React.CSSProperties,
        fontFamily: 'var(--font-sans)',
        fontSize: getFontSize()
      }}
    >
      <div className="crt-overlay" />
      <div className="crt-scanline animate-scanline" />

      {/* Header with theme toggler */}
      <NavbarHeader 
        profile={state.profile} 
        settings={state.settings}
        updateSettings={updateSettings}
        updateProfileName={updateProfileName}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-grow max-w-[1500px] mx-auto px-4 md:px-6 py-4 md:py-6 w-full flex flex-col justify-start">
        {renderActiveView()}
      </main>

      {/* Welcome Onboarding Setup Modal Overlay */}
      {showWelcomeSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian-deep/95 backdrop-blur-md">
          <div className="cyber-card p-8 rounded-lg border-2 border-cyber-cyan shadow-glow-cyan max-w-md w-full mx-4 space-y-6 font-mono text-[11px] text-gray-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded border-2 border-cyber-cyan flex items-center justify-center mx-auto shadow-glow-cyan bg-cyber-cyan/5">
                <span className="text-xl animate-pulse text-cyber-cyan">RW</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-widest uppercase">Welcome to ReWriting</h2>
              <p className="text-gray-500">Configure your personal growth tracker profile name.</p>
            </div>

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-cyber-cyan block font-bold">PLEASE ENTER YOUR NAME</label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Operator Name"
                  className="w-full bg-obsidian-deep border border-cyber-cyan/35 rounded px-3 py-2 text-cyber-cyan text-xs outline-none focus:border-cyber-cyan font-bold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyber-cyan hover:bg-cyber-cyan/80 text-obsidian-deep font-bold rounded cursor-pointer transition-colors"
              >
                LOG INTO SYSTEM
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-4 border-t border-cyber-cyan/10 bg-obsidian-deep/50 text-center font-mono text-[8px] text-gray-600 tracking-widest uppercase">
        ReWriting Core - Synchronized and Operational
      </footer>
    </div>
  );
}
