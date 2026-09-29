'use client';

import React, { useState, useEffect } from 'react';
import { useNexusState } from '../hooks/useNexusState';
import Sidebar from '../components/Sidebar';
import HeaderBar from '../components/HeaderBar';
import CommandCenter from '../components/CommandCenter';
import HabitsView from '../components/HabitsView';
import FocusChamber from '../components/FocusChamber';
import MissionControl from '../components/MissionControl';
import MindVault from '../components/MindVault';
import EnglishCoach from '../components/EnglishCoach';
import AIAssistant from '../components/AIAssistant';
import { HudAudio } from '../utils/HudAudio';
import { X, User } from 'lucide-react';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Initial Onboarding Welcome Prompt
  useEffect(() => {
    if (
      isHydrated &&
      (state.profile.name === 'HACKER OPERATOR' || state.profile.name === 'NEW USER')
    ) {
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0D10] text-xs text-[#9AA2AD] space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-[#252B33] border-t-[#22C7D9] rounded-full animate-spin" />
        <div className="font-medium text-[#68717D]">Loading ReWriting Core...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0B0D10] text-[#F1F3F5]">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Application Sidebar */}
      <Sidebar
        profile={state.profile}
        settings={state.settings}
        updateSettings={updateSettings}
        updateProfileName={updateProfileName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <HeaderBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={state.profile}
          settings={state.settings}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <CommandCenter
              state={state}
              toggleHabit={toggleHabit}
              gainXP={(amt) => gainXP(amt)}
              writeLog={writeLog}
              clearDiagnostics={clearDiagnostics}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsView
              habits={state.habits}
              settings={state.settings}
              toggleHabit={toggleHabit}
              addHabit={addHabit}
              deleteHabit={deleteHabit}
            />
          )}

          {activeTab === 'focus' && (
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
          )}

          {activeTab === 'skills' && (
            <MissionControl
              goals={state.goals}
              settings={state.settings}
              toggleGoalSubtask={toggleGoalSubtask}
              addGoal={addGoal}
              deleteGoal={deleteGoal}
            />
          )}

          {activeTab === 'vault' && (
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
          )}

          {activeTab === 'english' && (
            <EnglishCoach gainXP={gainXP} writeLog={writeLog} />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant state={state} gainXP={gainXP} writeLog={writeLog} />
          )}
        </main>
      </div>

      {/* Welcome Setup Modal */}
      {showWelcomeSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="app-card p-6 max-w-sm w-full border-[#323B46] space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-lg bg-[#1A1F26] border border-[#252B33] flex items-center justify-center mx-auto text-[#22C7D9] font-semibold text-sm">
                RW
              </div>
              <h2 className="text-base font-semibold text-[#F1F3F5]">
                Welcome to ReWriting Core
              </h2>
              <p className="text-xs text-[#9AA2AD]">
                Set your name to personalize your workspace.
              </p>
            </div>

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9AA2AD] block">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Ankit"
                  className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  autoFocus
                />
              </div>

              <button type="submit" className="w-full btn-primary text-xs py-2">
                Continue to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
