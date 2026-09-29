'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { NexusState } from '../hooks/useNexusState';

interface TerminalConsoleProps {
  state: NexusState;
  toggleHabit: (id: string) => void;
  gainXP: (amount: number, skillNodeId?: string) => void;
  writeLog: (msg: string, type: 'info' | 'success' | 'alert' | 'xp') => void;
  setActiveTab: (tab: string) => void;
  onClearDiagnostics: () => void;
}

export default function TerminalConsole({
  state,
  toggleHabit,
  gainXP,
  writeLog,
  setActiveTab,
  onClearDiagnostics
}: TerminalConsoleProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'ReWriting Core Terminal — Developer Shell',
    'Type /help for available commands.',
    ''
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    HudAudio.playClick();
    const cmd = input.trim();
    const args = cmd.split(' ');
    const mainCommand = args[0].toLowerCase();

    setHistory((prev) => [...prev, `$ ${cmd}`]);

    let output = '';

    switch (mainCommand) {
      case '/help':
        output = `Available Commands:
  /help                             Display command manual
  /status                           System & user profile status
  /xp add <amount>                  Add custom experience points
  /habit check <id_or_keyword>      Toggle daily status of a habit
  /habit list                       List active daily habits
  /focus start <mins>               Jump to focus timer and begin
  /clear                            Clear console window`.trim();
        break;

      case '/status':
        output = `System Status:
  User:     ${state.profile.name}
  Level:    ${state.profile.level} (${state.profile.xp} / ${state.profile.xpToNextLevel} XP)
  Status:   ${state.profile.status}
  Habits:   ${state.habits.length} configured
  Goals:    ${state.goals.length} active`.trim();
        break;

      case '/xp':
        if (args[1] === 'add' && args[2]) {
          const amt = parseInt(args[2]);
          if (!isNaN(amt)) {
            gainXP(amt);
            output = `✓ Granted +${amt} XP.`;
          } else {
            output = `Error: XP quantity must be an integer. Usage: /xp add <value>`;
          }
        } else {
          output = `Error: Invalid argument. Usage: /xp add <amount>`;
        }
        break;

      case '/habit':
        if (args[1] === 'list') {
          output =
            'Active Habits:\n' +
            state.habits
              .map(
                (h) =>
                  `  [${h.id}] ${h.name} (${h.streak}d streak, ${
                    h.history.includes(new Date().toISOString().split('T')[0])
                      ? 'Completed'
                      : 'Pending'
                  })`
              )
              .join('\n');
        } else if (args[1] === 'check' && args[2]) {
          const query = args.slice(2).join(' ').toLowerCase();
          const match = state.habits.find(
            (h) =>
              h.id.toLowerCase() === query ||
              h.name.toLowerCase().includes(query)
          );

          if (match) {
            toggleHabit(match.id);
            output = `✓ Habit "${match.name}" updated.`;
          } else {
            output = `Error: Habit matching "${query}" not found. Type /habit list to view habits.`;
          }
        } else {
          output = `Error: Unknown argument. Usage: /habit list  or  /habit check <name>`;
        }
        break;

      case '/focus':
        if (args[1] === 'start' && args[2]) {
          const mins = parseInt(args[2]);
          if (!isNaN(mins) && mins > 0) {
            setActiveTab('focus');
            localStorage.setItem('nexus_trigger_focus_min', mins.toString());
            output = `✓ Initiating focus session for ${mins} minutes.`;
            writeLog(`Focus session initiated: ${mins} mins`, 'info');
          } else {
            output = `Error: Focus duration must be positive integer. Usage: /focus start <mins>`;
          }
        } else {
          output = `Error: Invalid syntax. Usage: /focus start <minutes>`;
        }
        break;

      case '/clear':
        onClearDiagnostics();
        setHistory(['Terminal cleared. Ready for commands.', '']);
        setInput('');
        return;

      default:
        output = `Error: Unknown command "${mainCommand}". Type /help for available commands.`;
        break;
    }

    setHistory((prev) => [...prev, ...output.split('\n'), '']);
    setInput('');
  };

  return (
    <div className="p-4 flex flex-col h-64 bg-[#101318] border border-[#252B33] rounded-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#252B33]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#F1F3F5]">
          <Terminal size={14} className="text-[#22C7D9]" />
          <span>ReWriting Terminal</span>
        </div>
        <span className="font-mono text-[10px] text-[#68717D]">embedded shell</span>
      </div>

      {/* Terminal History */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs text-[#9AA2AD] leading-relaxed">
        {history.map((line, idx) => {
          let color = 'text-[#9AA2AD]';
          if (line.startsWith('$')) color = 'text-[#22C7D9] font-medium';
          else if (line.startsWith('✓')) color = 'text-[#10B981]';
          else if (line.startsWith('Error:')) color = 'text-[#EF4444]';
          else if (line.includes('Available Commands:') || line.includes('System Status:'))
            color = 'text-[#F1F3F5] font-medium';

          return (
            <div key={idx} className={`whitespace-pre-wrap ${color}`}>
              {line}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleCommand}
        className="flex items-center gap-2 pt-2 border-t border-[#252B33] mt-1 font-mono text-xs"
      >
        <span className="text-[#22C7D9] font-medium">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type command... (e.g. /help)"
          className="flex-1 bg-transparent outline-none border-none text-[#F1F3F5] placeholder-[#68717D] text-xs font-mono"
        />
        <button
          type="submit"
          className="text-[#68717D] hover:text-[#22C7D9] transition-colors p-1"
        >
          <CornerDownLeft size={13} />
        </button>
      </form>
    </div>
  );
}
