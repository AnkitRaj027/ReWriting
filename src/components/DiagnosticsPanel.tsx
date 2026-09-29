'use client';

import React from 'react';
import { Terminal } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';

interface DiagnosticsPanelProps {
  logs: string[];
  onClear: () => void;
}

export default function DiagnosticsPanel({ logs, onClear }: DiagnosticsPanelProps) {
  return (
    <div className="p-4 flex flex-col h-48 bg-[#101318] border border-[#252B33] rounded-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#252B33] pb-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#F1F3F5]">
          <Terminal size={14} className="text-[#22C7D9]" />
          <span>System Diagnostics</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              HudAudio.playClick();
              onClear();
            }}
            onMouseEnter={() => HudAudio.playHover()}
            className="text-xs text-[#68717D] hover:text-[#EF4444] transition-colors"
          >
            Clear Log
          </button>
          <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Scrolling Feed */}
      <div className="flex-1 overflow-y-auto font-mono text-xs text-[#9AA2AD] space-y-1 pr-1">
        {logs.length === 0 ? (
          <div className="text-[#68717D] italic py-4">No diagnostic events recorded.</div>
        ) : (
          logs.map((log, index) => {
            let textClass = 'text-[#9AA2AD]';
            if (log.includes('[OK]') || log.includes('[SYS_OK]')) textClass = 'text-[#10B981]';
            else if (log.includes('[ALERT]') || log.includes('[ERR]')) textClass = 'text-[#EF4444]';
            else if (log.includes('[XP]') || log.includes('[SYS_XP]')) textClass = 'text-[#22C7D9]';

            return (
              <div key={index} className={`py-0.5 leading-relaxed ${textClass}`}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
