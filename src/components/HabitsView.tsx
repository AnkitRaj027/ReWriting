'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, Flame, X } from 'lucide-react';
import IconRenderer from './IconRenderer';
import { HudAudio } from '../utils/HudAudio';
import { Habit, HudSettings } from '../hooks/useNexusState';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'BODY' | 'MIND' | 'TECH'>('MIND');
  const [icon, setIcon] = useState('Brain');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit(name.trim(), category, icon);
    setName('');
    setShowAddModal(false);
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
    { name: 'Brain', label: 'Mind' },
    { name: 'Code', label: 'Coding' },
    { name: 'Droplet', label: 'Hydration' },
    { name: 'Activity', label: 'Fitness' },
    { name: 'BookOpen', label: 'Reading' },
    { name: 'Flame', label: 'Discipline' },
    { name: 'Shield', label: 'Wellness' },
    { name: 'Compass', label: 'Focus' },
    { name: 'Coffee', label: 'Break' }
  ];

  const getCategoryBadge = (cat: Habit['category']) => {
    switch (cat) {
      case 'BODY':
        return 'text-[#22C7D9] bg-[#22C7D9]/10 border-[#22C7D9]/25';
      case 'MIND':
        return 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/25';
      case 'TECH':
        return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25';
      default:
        return 'text-[#9AA2AD] bg-[#1A1F26] border-[#252B33]';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-3 border-b border-[#252B33]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#F1F3F5]">
            My Habits
          </h2>
          <p className="text-xs text-[#9AA2AD] mt-0.5">
            Daily consistency and rituals tracked across 30-day rhythms.
          </p>
        </div>

        <button
          onClick={() => {
            HudAudio.playClick();
            setShowAddModal(true);
          }}
          className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>New Habit</span>
        </button>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/80 backdrop-blur-sm p-4">
          <div className="app-card p-6 max-w-md w-full border-[#323B46] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#252B33]">
              <h3 className="text-sm font-semibold text-[#F1F3F5]">Create New Habit</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#68717D] hover:text-[#F1F3F5] p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9AA2AD] block">Habit Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning walk, Read 20 pages, Hydrate"
                  className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9AA2AD] block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  >
                    <option value="MIND">Mind (Cognitive)</option>
                    <option value="BODY">Body (Physical)</option>
                    <option value="TECH">Tech (Career)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9AA2AD] block">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#252B33]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="app-card p-12 text-center text-xs text-[#68717D]">
            No habits configured yet. Click "New Habit" above to add your first daily ritual.
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.history.includes(today);
            const checkinsLast30 = habit.history.filter((d) => last30Days.includes(d)).length;
            const complianceRate = Math.round((checkinsLast30 / 30) * 100);

            return (
              <div
                key={habit.id}
                className="app-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Checkbox & Habit info */}
                <div className="flex items-center gap-3.5 md:w-1/3 min-w-0">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    onMouseEnter={() => HudAudio.playHover()}
                    className={`w-8 h-8 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      isCompletedToday
                        ? 'bg-[#10B981] border-[#10B981] text-[#0B0D10]'
                        : 'bg-[#101318] border-[#252B33] text-[#9AA2AD] hover:border-[#323B46] hover:text-[#F1F3F5]'
                    }`}
                  >
                    {isCompletedToday ? (
                      <Check size={16} className="stroke-[3px]" />
                    ) : (
                      <IconRenderer name={habit.icon} size={15} />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-medium truncate ${
                          isCompletedToday ? 'text-[#68717D] line-through' : 'text-[#F1F3F5]'
                        }`}
                      >
                        {habit.name}
                      </h4>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getCategoryBadge(
                          habit.category
                        )}`}
                      >
                        {habit.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#68717D] mt-0.5">
                      <span className="flex items-center gap-0.5 text-[#F59E0B] font-medium">
                        <Flame size={11} />
                        {habit.streak}d streak
                      </span>
                      <span>•</span>
                      <span>
                        Rate:{' '}
                        <strong className="text-[#F1F3F5] font-medium">
                          {complianceRate}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 30-Day Check-in Heatmap Grid */}
                <div className="flex-1 space-y-1 max-w-sm">
                  <div className="flex justify-between text-[10px] text-[#68717D]">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>

                  <div className="flex gap-1 p-1 rounded-md bg-[#101318] border border-[#252B33]">
                    {last30Days.map((date) => {
                      const done = habit.history.includes(date);
                      const isToday = date === today;

                      return (
                        <div
                          key={date}
                          title={`${date}: ${done ? 'Completed' : 'Missed'}`}
                          className={`flex-1 h-3.5 rounded-xs transition-colors cursor-pointer ${
                            done ? 'bg-[#10B981]' : 'bg-[#1A1F26] hover:bg-[#252B33]'
                          } ${isToday ? 'ring-1 ring-[#F1F3F5]' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Delete button */}
                <div className="flex items-center justify-end md:w-12">
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    onMouseEnter={() => HudAudio.playHover()}
                    className="p-1.5 rounded text-[#68717D] hover:text-[#EF4444] hover:bg-[#1A1F26] transition-colors"
                    title="Delete habit"
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
