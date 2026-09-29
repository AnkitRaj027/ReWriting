'use client';

import React from 'react';
import {
  Timer,
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Play,
  Clock,
  Sparkles,
  Activity,
  Target
} from 'lucide-react';
import TerminalConsole from './TerminalConsole';
import { HudAudio } from '../utils/HudAudio';
import { NexusState } from '../hooks/useNexusState';

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

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  // Habit metrics
  const totalHabits = state.habits.length;
  const completedHabits = state.habits.filter((h) => h.history.includes(today)).length;
  const habitPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Streak metrics
  const maxStreak = state.habits.reduce((max, h) => Math.max(max, h.streak), 0);

  // Focus metrics
  const totalMins = state.profile.totalFocusMinutes || 0;
  const focusHours = Math.floor(totalMins / 60);
  const focusRemainingMins = totalMins % 60;
  const focusFormatted = `${focusHours}h ${focusRemainingMins.toString().padStart(2, '0')}m`;
  const sessionCount = state.focusSessions.length;

  // Active goals list (first 3)
  const activeGoals = state.goals.slice(0, 3);

  // Pinned memo
  const pinnedNote = state.notes.find((n) => n.pinned);

  // Parse diagnostics into a natural timeline
  const activityLogs = state.diagnostics.slice(0, 6).map((log, idx) => {
    const timeMatch = log.match(/\[(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]/);
    const time = timeMatch ? timeMatch[1] : '';
    const cleanText = log.replace(/\[.*?\]\s*/g, '').trim();

    return { id: idx, time, text: cleanText };
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header with natural human greeting & story context */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F1F3F5]">
            {greeting}, {state.profile.name}.
          </h2>
          <p className="text-sm text-[#9AA2AD] mt-1">
            Here's how your day is going.
          </p>
        </div>
      </div>

      {/* 2. Natural Today Overview (Open layout, not 4 giant boxed cards) */}
      <div className="py-4 px-5 rounded-lg bg-[#101318] border border-[#252B33]">
        <div className="text-[11px] font-medium tracking-wider text-[#68717D] mb-3">
          TODAY
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="text-xs text-[#9AA2AD]">Focus</div>
            <div className="text-xl sm:text-2xl font-semibold text-[#F1F3F5] tracking-tight mt-0.5">
              {focusFormatted}
            </div>
            <div className="text-[11px] text-[#68717D] mt-0.5">deep work logged</div>
          </div>

          <div>
            <div className="text-xs text-[#9AA2AD]">Habits</div>
            <div className="text-xl sm:text-2xl font-semibold text-[#F1F3F5] tracking-tight mt-0.5">
              {completedHabits} <span className="text-[#68717D] font-normal text-base">/ {totalHabits}</span>
            </div>
            <div className="text-[11px] text-[#68717D] mt-0.5">{habitPercent}% completed</div>
          </div>

          <div>
            <div className="text-xs text-[#9AA2AD]">Goals</div>
            <div className="text-xl sm:text-2xl font-semibold text-[#F1F3F5] tracking-tight mt-0.5">
              {activeGoals.length} <span className="text-[#68717D] font-normal text-base">active</span>
            </div>
            <div className="text-[11px] text-[#68717D] mt-0.5">in progress</div>
          </div>

          <div>
            <div className="text-xs text-[#9AA2AD]">XP</div>
            <div className="text-xl sm:text-2xl font-semibold text-[#22C7D9] tracking-tight mt-0.5">
              +{state.profile.xp.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#68717D] mt-0.5">Level {state.profile.level}</div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Today's Progress (Open & Human) + Quiet Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Progress & Habits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="app-card p-5">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-[#F1F3F5]">
                  Today's progress
                </h3>
                <p className="text-xs text-[#9AA2AD] mt-0.5">
                  You're making steady progress today.
                </p>
              </div>
              <button
                onClick={() => {
                  HudAudio.playClick();
                  setActiveTab('habits');
                }}
                className="text-xs font-medium text-[#22C7D9] hover:underline flex items-center gap-1 transition-colors"
              >
                <span>View all habits</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Overall progress bar */}
            <div className="my-4">
              <div className="flex items-center justify-between text-xs text-[#9AA2AD] mb-1.5">
                <span>Daily completion</span>
                <span className="font-medium text-[#F1F3F5]">{habitPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1A1F26] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22C7D9] rounded-full transition-all duration-300"
                  style={{ width: `${habitPercent}%` }}
                />
              </div>
            </div>

            {/* Habit checklist */}
            <div className="space-y-2 mt-4 pt-4 border-t border-[#252B33]">
              {state.habits.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#68717D]">
                  No daily habits configured yet.
                </div>
              ) : (
                state.habits.map((habit) => {
                  const isCompleted = habit.history.includes(today);

                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-[#1A1F26]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          onMouseEnter={() => HudAudio.playHover()}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                            isCompleted
                              ? 'bg-[#10B981] text-[#0B0D10]'
                              : 'border border-[#323B46] hover:border-[#22C7D9] text-transparent'
                          }`}
                        >
                          <CheckCircle2
                            size={12}
                            className={isCompleted ? 'stroke-[2.5px]' : ''}
                          />
                        </button>

                        <div className="min-w-0">
                          <span
                            className={`text-xs font-medium truncate ${
                              isCompleted ? 'text-[#68717D] line-through' : 'text-[#F1F3F5]'
                            }`}
                          >
                            {habit.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="text-[11px] text-[#68717D]">
                          {habit.streak}d streak
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isCompleted
                              ? 'text-[#10B981] bg-[#10B981]/10'
                              : 'text-[#9AA2AD] bg-[#1A1F26]'
                          }`}
                        >
                          {isCompleted ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Goals Section */}
          <div className="app-card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#F1F3F5]">
                  Active Goals
                </h3>
                <p className="text-xs text-[#9AA2AD] mt-0.5">
                  Directives and milestones scheduled for this cycle.
                </p>
              </div>
              <button
                onClick={() => {
                  HudAudio.playClick();
                  setActiveTab('skills');
                }}
                className="text-xs font-medium text-[#22C7D9] hover:underline flex items-center gap-1 transition-colors"
              >
                <span>View all goals</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {activeGoals.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#68717D]">
                  No active goals registered.
                </div>
              ) : (
                activeGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-3 rounded-md bg-[#101318] border border-[#252B33] flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1A1F26] text-[#9AA2AD]">
                          {goal.category}
                        </span>
                        <span className="text-xs font-medium text-[#F1F3F5] truncate">
                          {goal.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#68717D] mt-1">
                        {goal.subtasks.filter((s) => s.completed).length} of{' '}
                        {goal.subtasks.length} subtasks completed
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 w-full bg-[#1A1F26] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#22C7D9] rounded-full"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#9AA2AD] w-8 text-right">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quiet Focus Timer & Pinned Memo */}
        <div className="space-y-6">
          {/* Calm Focus Session */}
          <div className="app-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#9AA2AD]">
                  Focus Session
                </span>
                <span className="text-[11px] text-[#10B981] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Ready
                </span>
              </div>

              {/* Calm, readable time display */}
              <div className="text-center py-6 my-2 rounded-md bg-[#101318] border border-[#252B33]">
                <div className="font-mono text-3xl font-semibold text-[#F1F3F5] tracking-wider">
                  00:25:00
                </div>
                <div className="text-xs text-[#9AA2AD] mt-1.5">
                  Deep Work Block
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => {
                    HudAudio.playClick();
                    setActiveTab('focus');
                  }}
                  className="btn-primary text-xs py-2 w-full flex items-center justify-center gap-1.5"
                >
                  <Play size={13} className="fill-current" />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => {
                    HudAudio.playClick();
                    setActiveTab('focus');
                  }}
                  className="btn-secondary text-xs py-2 w-full"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Quiet Stats below */}
            <div className="pt-4 mt-6 border-t border-[#252B33] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#9AA2AD]">
                <span>Today</span>
                <span className="font-medium text-[#F1F3F5]">{focusFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[#9AA2AD]">
                <span>Sessions</span>
                <span className="font-medium text-[#F1F3F5]">{sessionCount}</span>
              </div>
              <div className="flex items-center justify-between text-[#9AA2AD]">
                <span>Streak</span>
                <span className="font-medium text-[#F1F3F5]">{maxStreak} days</span>
              </div>
            </div>
          </div>

          {/* Pinned Note */}
          {pinnedNote && (
            <div className="app-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#9AA2AD]">
                  Pinned Note
                </span>
                <span className="text-[10px] text-[#68717D]">{pinnedNote.updatedAt}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#F1F3F5] mb-1.5">
                {pinnedNote.title}
              </h4>
              <p className="text-xs text-[#9AA2AD] line-clamp-4 whitespace-pre-wrap leading-relaxed">
                {pinnedNote.content}
              </p>
              <div className="pt-3 mt-3 border-t border-[#252B33] flex items-center justify-between">
                <button
                  onClick={() => {
                    HudAudio.playClick();
                    setActiveTab('vault');
                  }}
                  className="text-xs text-[#22C7D9] hover:underline"
                >
                  Open notebook →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Timeline of Recent Activity & Dedicated Isolated Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Natural Activity Timeline */}
        <div className="app-card p-5 flex flex-col justify-between">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#252B33] mb-3">
            <div>
              <h3 className="text-base font-semibold text-[#F1F3F5]">
                Recent Activity
              </h3>
              <p className="text-xs text-[#9AA2AD] mt-0.5">
                Timeline of completions and updates.
              </p>
            </div>
            <button
              onClick={() => {
                HudAudio.playClick();
                clearDiagnostics();
              }}
              className="text-xs text-[#68717D] hover:text-[#EF4444] transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-60 pr-1">
            {activityLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#68717D]">
                No recent activity logged yet today.
              </div>
            ) : (
              activityLogs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 text-xs py-1"
                >
                  <span className="text-[11px] text-[#68717D] pt-0.5 flex-shrink-0 w-14 font-mono">
                    {item.time || 'Today'}
                  </span>

                  <div className="w-1.5 h-1.5 rounded-full bg-[#252B33] mt-1.5 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-[#F1F3F5] truncate">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dedicated Isolated Developer Terminal */}
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
