'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, Flame } from 'lucide-react';
import IconRenderer from './IconRenderer';
import { HudAudio } from '../utils/HudAudio';
import { Habit, HudSettings } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

interface HabitsViewProps {
  habits: Habit[];
  settings: HudSettings;
  toggleHabit: (id: string) => void;
  addHabit: (name: string, category: 'BODY' | 'MIND' | 'TECH', icon: string) => void;
  deleteHabit: (id: string) => void;
}

export default function HabitsView({ 
  habits, 
  settings, 
  toggleHabit, 
  addHabit, 
  deleteHabit 
}: HabitsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'BODY' | 'MIND' | 'TECH'>('MIND');
  const [icon, setIcon] = useState('Brain');

  const today = new Date().toISOString().split('T')[0];
  const vocab = settings.vocabulary;

  const handleToggle = (id: string) => {
    toggleHabit(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit(name, category, icon);
    setName('');
    setShowAddForm(false);
  };

  const getCategoryColor = (cat: Habit['category']) => {
    switch (cat) {
      case 'BODY': return 'text-cyber-green border-cyber-green/20 bg-cyber-green/5';
      case 'MIND': return 'text-cyber-cyan border-cyber-cyan/20 bg-cyber-cyan/5';
      case 'TECH': return 'text-cyber-purple border-cyber-purple/20 bg-cyber-purple/5';
      default: return 'text-gray-400 border-gray-400/20 bg-gray-400/5';
    }
  };

  const getCategoryLabel = (cat: Habit['category']) => {
    if (vocab === 'cyberpunk') {
      return cat === 'BODY' ? 'Body Vitals' : cat === 'TECH' ? 'Tech Skills' : 'Mind Logic';
    }
    if (vocab === 'academic') {
      return cat === 'BODY' ? 'HEALTH / SPORT' : cat === 'TECH' ? 'PRACTICAL / STUDY' : 'COGNITIVE / READING';
    }
    return cat === 'BODY' ? 'HEALTH / BODY' : cat === 'TECH' ? 'TASKS / WORK' : 'MIND / HABITS';
  };

  const getLast30Days = () => {
    const list = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const last30Days = getLast30Days();

  const iconOptions = [
    { name: 'Brain', label: 'Mind (Brain)' },
    { name: 'Code', label: 'Logic (Code)' },
    { name: 'Droplet', label: 'Vitals (Droplet)' },
    { name: 'Activity', label: 'Fitness (Activity)' },
    { name: 'BookOpen', label: 'Read (Book)' },
    { name: 'Flame', label: 'Stamina (Flame)' },
    { name: 'Shield', label: 'Security (Shield)' },
    { name: 'Compass', label: 'Goals (Compass)' },
    { name: 'Coffee', label: 'Rest (Coffee)' }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-cyan/20 pb-3">
        <div>
          <h2 className="text-xl font-mono font-bold tracking-widest text-white flex items-center gap-2">
            <span className="text-cyber-cyan animate-pulse">■</span> 
            {getTranslation(vocab, 'habitsTitle').toUpperCase()}
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {getTranslation(vocab, 'habitsSubtitle')}
          </p>
        </div>

        <button
          onClick={() => { HudAudio.playClick(); setShowAddForm(!showAddForm); }}
          onMouseEnter={() => HudAudio.playHover()}
          className="btn-cyber-cyan px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
        >
          <Plus size={14} /> {showAddForm ? 'CANCEL_PROTOCOL' : 'CREATE_NEW_HABIT'}
        </button>
      </div>

      {/* Add Habit Configuration Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="cyber-card p-5 rounded-lg border-cyber-cyan/35 max-w-xl mx-auto space-y-4 font-mono text-[10px]">
          <h3 className="text-xs text-cyber-cyan font-bold tracking-wider border-b border-cyber-cyan/15 pb-2">
            CONFIGURE_NEW_DAILY_HABIT
          </h3>

          <div className="space-y-1.5">
            <label className="text-gray-400 block font-bold">HABIT_NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solve 2 Coding Exercises"
              className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-gray-400 block font-bold">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
              >
                <option value="MIND">Mind - Cognitive</option>
                <option value="BODY">Body - Physical</option>
                <option value="TECH">Tech - Work</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-400 block font-bold">ICON_CORES</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
              >
                {iconOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>{opt.label.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              onMouseEnter={() => HudAudio.playHover()}
              className="btn-cyber-cyan px-4 py-2 rounded text-xs animate-pulse-glow"
            >
              LOG_HABIT_TO_DB
            </button>
          </div>
        </form>
      )}

      {/* Habits Grid */}
      <div className="space-y-6">
        {habits.length === 0 ? (
          <div className="cyber-card p-12 text-center text-gray-500 font-mono text-sm border-dashed">
            NO ACTIVE HABIT MODULES DETECTED.
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.history.includes(today);
            const checkinsLast30 = habit.history.filter(d => last30Days.includes(d)).length;
            const complianceRate = Math.round((checkinsLast30 / 30) * 100);

            return (
              <div 
                key={habit.id}
                className="cyber-card p-5 rounded-lg border-cyber-cyan/15 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start space-x-4 md:w-1/3">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    onMouseEnter={() => HudAudio.playHover()}
                    className={`w-12 h-12 rounded border flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday 
                        ? 'bg-cyber-cyan text-obsidian-deep border-cyber-cyan shadow-[0_0_12px_rgba(0,240,255,0.4)]' 
                        : 'border-cyber-cyan/30 hover:border-cyber-cyan hover:bg-cyber-cyan/5 text-cyber-cyan'
                    }`}
                  >
                    {isCompletedToday ? (
                      <Check size={22} className="stroke-[3.5px]" />
                    ) : (
                      <IconRenderer name={habit.icon} size={20} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white tracking-wide">{habit.name}</h4>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono ${getCategoryColor(habit.category)}`}>
                        {getCategoryLabel(habit.category)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-500">
                      <span className="flex items-center text-cyber-pink gap-0.5 font-bold">
                        <Flame size={10} /> {habit.streak}d streak
                      </span>
                      <span>•</span>
                      <span>Rate: <strong className="text-cyber-cyan font-bold">{complianceRate}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* 30-Day Check-in Heatmap Grid */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between font-mono text-[8px] text-gray-600">
                    <span>30 DAYS AGO</span>
                    <span>TODAY</span>
                  </div>

                  <div className="flex flex-wrap gap-1 bg-obsidian-deep/50 p-2 rounded border border-obsidian-light/40">
                    {last30Days.map((date) => {
                      const done = habit.history.includes(date);
                      const isToday = date === today;
                      
                      let bgClass = 'bg-obsidian-light border-obsidian-light/35';
                      if (done) {
                        bgClass = habit.category === 'TECH' 
                          ? 'bg-cyber-purple border-cyber-purple shadow-[0_0_5px_#7000FF]' 
                          : habit.category === 'BODY'
                          ? 'bg-cyber-green border-cyber-green shadow-[0_0_5px_#00FF66]'
                          : 'bg-cyber-cyan border-cyber-cyan shadow-[0_0_5px_#00F0FF]';
                      }

                      return (
                        <div 
                          key={date}
                          title={`${date}: ${done ? 'Completed' : 'Skipped'}`}
                          className={`w-3.5 h-3.5 rounded-sm border transition-all hover:scale-125 cursor-pointer ${bgClass} ${
                            isToday ? 'border-cyber-pink/60' : 'border-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Purge button */}
                <div className="flex items-center justify-end md:w-16">
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    onMouseEnter={() => HudAudio.playHover()}
                    className="p-2 border border-cyber-pink/20 hover:border-cyber-pink text-cyber-pink/60 hover:text-cyber-pink hover:bg-cyber-pink/5 rounded transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
