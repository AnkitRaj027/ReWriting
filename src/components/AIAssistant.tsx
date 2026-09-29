'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Bot,
  User,
  Trash2
} from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { NexusState } from '../hooks/useNexusState';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AIAssistantProps {
  state: NexusState;
  gainXP: (amount: number) => void;
  writeLog: (msg: string, type: 'info' | 'success' | 'alert' | 'xp') => void;
}

export default function AIAssistant({ state, gainXP, writeLog }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_init',
      sender: 'ai',
      text: `Hello, ${state.profile.name}. I am your personal thinking partner and copilot.\n\nI can analyze your productivity trends (Level ${state.profile.level}, ${state.habits.length} habits, ${state.goals.length} active directives), review writing, or help you structure your next deep focus block.\n\nWhat would you like to reflect on or work on today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const presetDirectives = [
    {
      label: 'Optimize Daily Routine',
      prompt:
        'Review my daily habits and give me 3 specific scientific optimization tips to increase my streak completions: ' +
        state.habits.map((h) => `${h.name} (${h.streak}d streak)`).join(', ')
    },
    {
      label: 'Plan Focus Schedule',
      prompt:
        'Help me structure a high-efficiency Pomodoro focus plan for today for: ' +
        (state.notes.find((n) => n.pinned)?.title || 'my daily priorities')
    },
    {
      label: 'Writing Style Review',
      prompt:
        'Act as an English coach and review the clarity, grammar, and vocabulary of this paragraph: '
    },
    {
      label: 'Productivity Pace Assessment',
      prompt: `Analyze my progress: Level ${state.profile.level}, ${state.profile.totalFocusMinutes || 0} focus minutes logged. Give me a concise assessment of my rhythm and recovery.`
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    HudAudio.playClick();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: time
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setApiKeyError(null);

    const systemPrompt = {
      role: 'system' as const,
      content: `You are Rewire AI, an articulate, supportive, and sophisticated personal growth and productivity assistant. 
Maintain a calm, thoughtful, grounded, and professional tone.
Structure your answers clearly with markdown formatting, bullet points, and concise explanations.
Answer questions accurately across personal development, software engineering, English language learning, and habit building.`
    };

    const history = [
      systemPrompt,
      ...messages.concat(userMsg).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }))
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const aiReply: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiReply]);
      HudAudio.playSuccess();
      gainXP(20);
      writeLog('Rewire AI: generated analysis response (+20 XP)', 'success');
    } catch (err: any) {
      console.error(err);
      setApiKeyError(err.message || 'Error communicating with AI service.');
      HudAudio.playAlert();
      writeLog(`AI assistant error: ${err.message}`, 'alert');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    HudAudio.playClick();
    setMessages([
      {
        id: `m_init_${Date.now()}`,
        sender: 'ai',
        text: 'Chat history cleared. Ready for your next inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setApiKeyError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start max-w-5xl mx-auto">
      {/* Context & Quick Prompts Sidebar */}
      <div className="app-card p-5 space-y-5 lg:col-span-1">
        <div>
          <h3 className="text-xs font-medium text-[#9AA2AD] mb-3">
            System Context
          </h3>
          <div className="space-y-2 text-xs text-[#9AA2AD]">
            <div className="flex justify-between">
              <span className="text-[#68717D]">User</span>
              <span className="font-medium text-[#F1F3F5]">{state.profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#68717D]">Level</span>
              <span className="font-medium text-[#F1F3F5]">Level {state.profile.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#68717D]">Habits</span>
              <span className="font-medium text-[#F1F3F5]">{state.habits.length} configured</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#68717D]">Goals</span>
              <span className="font-medium text-[#F1F3F5]">{state.goals.length} active</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#252B33] space-y-2.5">
          <span className="text-xs font-medium text-[#9AA2AD] block">
            Suggested Prompts
          </span>
          <div className="space-y-1.5">
            {presetDirectives.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (p.label === 'Writing Style Review') {
                    setInput(p.prompt);
                    HudAudio.playClick();
                  } else {
                    handleSend(p.prompt);
                  }
                }}
                className="w-full text-left p-2 rounded-md bg-[#101318] hover:bg-[#1A1F26] border border-[#252B33] hover:border-[#323B46] text-xs text-[#9AA2AD] hover:text-[#F1F3F5] transition-colors truncate block"
                title={p.prompt}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#252B33]">
          <button
            onClick={handleClear}
            className="w-full py-1.5 text-xs text-[#68717D] hover:text-[#EF4444] transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Clear conversation</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="app-card p-6 lg:col-span-3 flex flex-col h-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#252B33] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F1F3F5]">Rewire AI</h3>
              <p className="text-[11px] text-[#68717D]">Personal intelligence partner</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Ready</span>
          </div>
        </div>

        {/* API key banner */}
        {apiKeyError && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-md text-xs text-[#EF4444] flex items-start gap-2">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
            <div className="space-y-0.5">
              <span className="font-semibold block">AI Service Notice</span>
              <p>{apiKeyError}</p>
              <p className="text-[11px] text-[#9AA2AD] mt-1">
                Configure your key in <code className="text-[#F1F3F5]">.env</code> as{' '}
                <code className="text-[#22C7D9]">MISTRAL_API_KEY=...</code>
              </p>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#1A1F26] border border-[#252B33] flex items-center justify-center text-[#8B5CF6] flex-shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}

                <div className={`space-y-1 max-w-[80%] ${isUser ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#1A1F26] text-[#F1F3F5] border border-[#323B46]'
                        : 'bg-[#101318] text-[#F1F3F5] border border-[#252B33]'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-[#68717D] block px-1">
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#1A1F26] border border-[#252B33] flex items-center justify-center text-[#9AA2AD] flex-shrink-0 mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1A1F26] border border-[#252B33] flex items-center justify-center text-[#8B5CF6] flex-shrink-0 mt-0.5">
                <Bot size={14} />
              </div>
              <div className="p-3 rounded-lg bg-[#101318] border border-[#252B33] text-xs text-[#9AA2AD] flex items-center gap-2">
                <RefreshCw size={13} className="animate-spin text-[#22C7D9]" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2 p-1.5 rounded-md bg-[#101318] border border-[#252B33] focus-within:border-[#22C7D9] transition-colors"
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? 'Processing...' : 'Ask Rewire AI anything or request guidance...'}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-[#F1F3F5] placeholder-[#68717D] outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
