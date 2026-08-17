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
    'ReWriting Interactive CLI Terminal - Access Level: Operator',
    'Type /help for a list of available subroutines.',
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
    
    // Add command to terminal history
    setHistory(prev => [...prev, `operator@nexus:~$ ${cmd}`]);

    let output = '';

    switch (mainCommand) {
      case '/help':
        output = `
AVAILABLE HUD COMMANDS:
  /help                             Display this firmware manual
  /status                           Retrieve operator biome metrics
  /xp add <amount>                  Synthesize custom XP values
  /habit check <id_or_keyword>      Toggle daily sync state of a habit
  /habit list                       Print active daily habit registers
  /focus start <mins>               Jump to chamber and initialize focus
  /clear                            Flush diagnostics console cache
        `.trim();
        break;

      case '/status':
        output = `
OPERATOR DIAGNOSTICS:
  NAME:   ${state.profile.name}
  LEVEL:  ${state.profile.level}
  XP:     ${state.profile.xp} / ${state.profile.xpToNextLevel}
  STATUS: ${state.profile.status}
  HABITS: ${state.habits.length} configured
  GOALS:  ${state.goals.length} active directives
        `.trim();
        break;

      case '/xp':
        if (args[1] === 'add' && args[2]) {
          const amt = parseInt(args[2]);
          if (!isNaN(amt)) {
            gainXP(amt);
            output = `[SYS_OK] Synthesized +${amt} XP.`;
          } else {
            output = `[ERR] XP quantity must be an integer. Usage: /xp add <value>`;
          }
        } else {
          output = `[ERR] Invalid argument. Usage: /xp add <amount>`;
        }
        break;

      case '/habit':
        if (args[1] === 'list') {
          output = 'ACTIVE DAILY HABIT PROTOCOLS:\n' + state.habits.map((h, idx) => 
            `  [${h.id}] ${h.name} (Streak: ${h.streak}d, ${h.history.includes(new Date().toISOString().split('T')[0]) ? 'COMPLETED' : 'PENDING'})`
          ).join('\n');
        } else if (args[1] === 'check' && args[2]) {
          const query = args.slice(2).join(' ').toLowerCase();
          // Find by ID or Name contains
          const match = state.habits.find(h => 
            h.id.toLowerCase() === query || 
            h.name.toLowerCase().includes(query)
          );

          if (match) {
            toggleHabit(match.id);
            output = `[SYS_OK] Habit "${match.name}" synchronizing.`;
          } else {
            output = `[ERR] Habit matching "${query}" not found. Type /habit list to view registers.`;
          }
        } else {
          output = `[ERR] Unknown argument. Usage: /habit list  or  /habit check <name>`;
        }
        break;

      case '/focus':
        if (args[1] === 'start' && args[2]) {
          const mins = parseInt(args[2]);
          if (!isNaN(mins) && mins > 0) {
            setActiveTab('focus');
            // Save temporary query in localStorage so FocusChamber can read it on mount
            localStorage.setItem('nexus_trigger_focus_min', mins.toString());
            output = `[SYS_OK] Relocating to focus chamber for ${mins} minutes.`;
            writeLog(`TERMINAL TRIGGERS FOCUS SESSION: ${mins} mins`, 'info');
          } else {
            output = `[ERR] Focus duration must be positive integer. Usage: /focus start <mins>`;
          }
        } else {
          output = `[ERR] Invalid focus call. Usage: /focus start <minutes>`;
        }
        break;

      case '/clear':
        onClearDiagnostics();
        setHistory(['TERMINAL FLUSHED. Ready for new commands.', '']);
        setInput('');
        return;

      default:
        output = `[ERR] Terminal: Unknown command "${mainCommand}". Type /help to query firmware commands.`;
        break;
    }

    setHistory(prev => [...prev, ...output.split('\n'), '']);
    setInput('');
  };

  return (
    <div className="cyber-card p-4 rounded-lg flex flex-col h-60 border-cyber-purple/20 font-mono text-[10px] text-gray-300">
      {/* Header bar */}
      <div className="flex items-center space-x-2 border-b border-cyber-purple/15 pb-2 mb-2 text-cyber-purple font-bold tracking-wider">
        <Terminal size={14} className="animate-pulse" />
        <span>ReWriting Terminal Console</span>
      </div>

      {/* Terminal History */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 mb-2 bg-obsidian-deep/45 p-2 rounded border border-obsidian-light/30">
        {history.map((line, idx) => {
          let color = 'text-gray-400';
          if (line.startsWith('operator@nexus:~$')) color = 'text-cyber-cyan font-bold';
          else if (line.startsWith('[SYS_OK]')) color = 'text-cyber-green';
          else if (line.startsWith('[ERR]')) color = 'text-cyber-pink font-semibold';
          else if (line.includes('AVAILABLE') || line.includes('DIAGNOSTICS')) color = 'text-cyber-purple font-semibold';
          
          return (
            <div key={idx} className={`whitespace-pre-wrap ${color}`}>
              {line}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleCommand} className="flex items-center space-x-2 bg-obsidian-light/50 border border-cyber-purple/25 rounded px-2 py-1">
        <span className="text-cyber-cyan font-bold">nexus&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command... (e.g. /help)"
          className="flex-1 bg-transparent outline-none border-none text-cyber-cyan placeholder-cyber-purple/40 text-[10px] font-mono font-semibold"
        />
        <button type="submit" className="text-cyber-purple hover:text-cyber-cyan transition-colors">
          <CornerDownLeft size={12} />
        </button>
      </form>
    </div>
  );
}
