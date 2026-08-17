'use client';

import React from 'react';
import { Terminal, Shield } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';

interface DiagnosticsPanelProps {
  logs: string[];
  onClear: () => void;
}

export default function DiagnosticsPanel({ logs, onClear }: DiagnosticsPanelProps) {
  return (
    <div className="cyber-card p-4 rounded-lg flex flex-col h-48 border-cyber-cyan/20">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-2">
        <div className="flex items-center space-x-2 font-mono text-xs text-cyber-cyan font-bold tracking-wider">
          <Terminal size={14} className="animate-pulse" />
          <span>Diagnostics Monitor</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { HudAudio.playClick(); onClear(); }}
            onMouseEnter={() => HudAudio.playHover()}
            className="text-[9px] font-mono text-cyber-pink/70 hover:text-cyber-pink px-2 py-0.5 border border-cyber-pink/20 hover:border-cyber-pink rounded transition-colors"
          >
            FLUSH_CACHE
          </button>
          <div className="flex items-center text-[9px] font-mono text-cyber-green/70">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green mr-1.5 animate-ping" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Scrolling Feed */}
      <div className="flex-1 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5 pr-2">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">No telemetry data recorded. Waiting for system inputs...</div>
        ) : (
          logs.map((log, index) => {
            // Apply highlighting depending on tags
            let textClass = 'text-gray-400';
            if (log.includes('[SYS_OK]')) textClass = 'text-cyber-green font-semibold';
            else if (log.includes('[ALERT]')) textClass = 'text-cyber-pink font-semibold';
            else if (log.includes('[SYS_XP]')) textClass = 'text-cyber-cyan font-semibold';
            
            return (
              <div 
                key={index} 
                className={`py-0.5 border-l-2 pl-2 border-transparent transition-all hover:bg-obsidian-light/40 hover:border-cyber-cyan/30 ${textClass}`}
              >
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
