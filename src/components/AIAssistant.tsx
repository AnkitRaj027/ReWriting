'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, RefreshCw, AlertTriangle, Cpu, CornerDownLeft, Terminal } from 'lucide-react';
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
      text: `🤖 **REWIRE AI COGNITIVE CORE ONLINE**\n\nGreetings, Operator **${state.profile.name}**. I am your personal growth LLM helper. I have access to your telemetry (Level: ${state.profile.level}, Habits: ${state.habits.length} active, Directives: ${state.goals.length} active).\n\nHow can I optimize your routines or review your learning modules today?`,
      timestamp: new Date().toLocaleTimeString().substring(0, 5)
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
      label: "Optimize Habits",
      prompt: "Review my habits and give me 3 specific scientific optimization tips to increase my streak completions. Here is my list: " + 
        state.habits.map(h => `${h.name} (Streak: ${h.streak}d)`).join(", ")
    },
    {
      label: "Synthesize Focus Plan",
      prompt: "I need to configure a high-efficiency focus schedule for today. Help me plan Pomodoro blocks for: " + 
        (state.notes.find(n => n.pinned)?.title || "my daily tasks")
    },
    {
      label: "Writing Review",
      prompt: "Act as an English coach and review the grammar, vocabulary richness, and overall style of this paragraph: "
    },
    {
      label: "Status Analysis",
      prompt: `Analyze my current status: Level ${state.profile.level}, total focus minutes ${state.profile.totalFocusMinutes || 0}, mood score average. Give me a brief hacker-style report on cognitive load.`
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    HudAudio.playClick();
    const time = new Date().toLocaleTimeString().substring(0, 5);
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: time
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setApiKeyError(null);

    // Formulate message history for the model, prepending a system prompt for structured formatting
    const systemPrompt = {
      role: 'system' as const,
      content: `You are the Rewire AI Core, a helpful, friendly, and highly intelligent AI companion. 
Maintain a conversational, natural, and human-like tone, being supportive and engaging.
Keep your responses well-structured, clear, and easy to read. Always use markdown styling like headers, bold text, and bullet points where helpful.
You can answer any normal queries, general knowledge questions, coding prompts, and productivity discussions. Do not limit yourself to the web page state or growth metrics, but feel free to reference them if relevant to the operator's query.`
    };

    const history = [systemPrompt, ...messages.concat(userMsg).map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }))];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI answer');
      }

      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.content,
        timestamp: new Date().toLocaleTimeString().substring(0, 5)
      }]);

      HudAudio.playSuccess();
      gainXP(20);
      writeLog("AI Assistant: Synthesis response generated. +20 XP.", "success");

    } catch (err: any) {
      console.error(err);
      setApiKeyError(err.message || 'Server error communicating with AI core.');
      HudAudio.playAlert();
      writeLog(`AI assistant interface error: ${err.message}`, 'alert');
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
        text: `Rewire AI database registers flushed. Cognitive core ready for new prompts.`,
        timestamp: new Date().toLocaleTimeString().substring(0, 5)
      }
    ]);
    setApiKeyError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* Side Control panel */}
      <div className="cyber-card p-5 rounded-lg border-cyber-purple/20 space-y-4 lg:col-span-1">
        <div className="flex items-center space-x-2 border-b border-cyber-purple/15 pb-2 text-cyber-purple font-bold tracking-wider font-mono text-xs">
          <Cpu size={14} className="animate-pulse" />
          <span>Core Telemetry</span>
        </div>
        
        <div className="space-y-3 font-mono text-[10px] text-gray-400">
          <div>
            <span className="text-gray-600 block">Operator Biome</span>
            <span className="text-white font-bold">{state.profile.name} (Lvl {state.profile.level})</span>
          </div>
          <div>
            <span className="text-gray-600 block">Habit Synchronization</span>
            <span className="text-cyber-cyan font-bold">{state.habits.filter(h => h.history.includes(new Date().toISOString().split('T')[0])).length} / {state.habits.length} Synced today</span>
          </div>
          <div>
            <span className="text-gray-600 block">Active Directives</span>
            <span className="text-cyber-green font-bold">{state.goals.length} Goals Registered</span>
          </div>
          <div>
            <span className="text-gray-600 block">LLM Engine</span>
            <span className="text-cyber-purple font-bold">Mistral API Node</span>
          </div>
        </div>

        <div className="border-t border-obsidian-light pt-3 space-y-2">
          <span className="font-mono text-[9px] text-gray-500 block uppercase font-bold tracking-widest">Preset Prompts</span>
          <div className="space-y-1.5">
            {presetDirectives.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (p.label === "Writing Review") {
                    setInput(p.prompt);
                    HudAudio.playClick();
                  } else {
                    handleSend(p.prompt);
                  }
                }}
                className="w-full text-left p-2 bg-obsidian-light/35 hover:bg-cyber-purple/10 border border-obsidian-light hover:border-cyber-purple/40 rounded font-mono text-[9px] text-gray-300 hover:text-cyber-purple transition-all duration-150 cursor-pointer truncate block"
                title={p.prompt}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleClear}
          className="w-full py-1.5 border border-cyber-pink/20 hover:border-cyber-pink bg-cyber-pink/5 hover:bg-cyber-pink/15 text-cyber-pink font-mono text-[9px] rounded uppercase font-bold tracking-widest cursor-pointer transition-colors"
        >
          Flush Chat Log
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 lg:col-span-3 flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-4">
          <div className="flex items-center space-x-2 font-mono text-xs text-cyber-cyan font-bold tracking-wider">
            <Bot size={15} className="animate-bounce" />
            <span>REWIRE AI OPERATOR TERMINAL</span>
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-[9px]">
            <span className="h-2 w-2 rounded-full bg-cyber-green animate-ping" />
            <span className="text-gray-500 uppercase">SYS_LIVE</span>
          </div>
        </div>

        {/* API Key Missing Alert */}
        {apiKeyError && (
          <div className="mb-4 p-3 bg-cyber-pink/10 border border-cyber-pink/35 text-cyber-pink rounded font-mono text-[10px] flex items-start gap-2 animate-pulse">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
            <div className="space-y-1">
              <span className="font-bold uppercase block">AI CORE INOPERABLE</span>
              <p>{apiKeyError}</p>
              <p className="text-gray-500 mt-1">To fix this, edit the `.env` or `.env.local` file in your project directory and set: <br /><code className="text-white font-bold select-all bg-black/45 px-1 py-0.5 rounded">MISTRAL_API_KEY=your_real_mistral_key</code></p>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 bg-obsidian-deep/50 p-3 rounded border border-obsidian-light/35 scrollbar-thin">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div 
                key={m.id} 
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-1 font-mono text-[8px] text-gray-500">
                  <span>{isUser ? 'OPERATOR' : 'NEXUS_AI'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                
                <div 
                  className={`max-w-[85%] rounded px-3 py-2 text-xs font-mono border transition-all whitespace-pre-wrap leading-relaxed ${
                    isUser 
                      ? 'bg-gradient-to-br from-cyber-cyan/15 to-cyber-cyan/5 border-cyber-cyan/35 text-cyber-cyan shadow-glow-cyan/5' 
                      : 'bg-obsidian-light/60 border-obsidian-light/80 text-gray-200 shadow-[inset_0_0_12px_rgba(255,255,255,0.01)]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex flex-col items-start space-y-1 animate-pulse">
              <div className="flex items-center space-x-1 font-mono text-[8px] text-gray-500">
                <span>NEXUS_AI</span>
                <span>•</span>
                <span>Synthesizing...</span>
              </div>
              <div className="bg-obsidian-light/40 border border-cyber-purple/20 rounded px-3 py-2 text-xs font-mono text-cyber-purple flex items-center space-x-2">
                <RefreshCw size={12} className="animate-spin" />
                <span>Accessing API node...</span>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* Interactive Prompt Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center space-x-2 bg-obsidian-light/50 border border-cyber-cyan/25 rounded px-2.5 py-1.5 focus-within:border-cyber-cyan/50 transition-colors">
          <Terminal size={14} className="text-cyber-cyan" />
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "System processing..." : "Query AI Core... (e.g. Optimize my daily habits)"}
            className="flex-grow bg-transparent outline-none border-none text-cyber-cyan placeholder-cyber-cyan/35 text-xs font-mono font-semibold"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className={`p-1 rounded cursor-pointer transition-colors ${
              input.trim() && !loading ? 'text-cyber-cyan hover:bg-cyber-cyan/15' : 'text-gray-600'
            }`}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

    </div>
  );
}
