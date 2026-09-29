'use client';

import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, X } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Goal, HudSettings } from '../hooks/useNexusState';

interface MissionControlProps {
  goals: Goal[];
  settings: HudSettings;
  toggleGoalSubtask: (goalId: string, subtaskId: string) => void;
  addGoal: (
    title: string,
    type: 'directive' | 'milestone',
    category: 'SKILLS' | 'FITNESS' | 'WELLBEING' | 'CAREER',
    subtaskTexts: string[],
    deadline: string
  ) => void;
  deleteGoal: (id: string) => void;
}

export default function MissionControl({
  goals,
  settings,
  toggleGoalSubtask,
  addGoal,
  deleteGoal
}: MissionControlProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'directive' | 'milestone'>('directive');
  const [category, setCategory] = useState<'SKILLS' | 'FITNESS' | 'WELLBEING' | 'CAREER'>('SKILLS');
  const [subtasks, setSubtasks] = useState<string[]>(['', '', '']);
  const [deadline, setDeadline] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const handleSubtaskChange = (index: number, val: string) => {
    const updated = [...subtasks];
    updated[index] = val;
    setSubtasks(updated);
  };

  const addSubtaskInput = () => {
    setSubtasks([...subtasks, '']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal(title.trim(), type, category, subtasks, deadline);
    setTitle('');
    setSubtasks(['', '', '']);
    setDeadline('');
    setShowAddModal(false);
  };

  const filteredGoals =
    activeFilter === 'ALL'
      ? goals
      : goals.filter((g) => g.category === activeFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-3 border-b border-[#252B33]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#F1F3F5]">
            My Goals
          </h2>
          <p className="text-xs text-[#9AA2AD] mt-0.5">
            Key targets and milestones broken down into actionable steps.
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
          <span>New Target</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'SKILLS', 'CAREER', 'FITNESS', 'WELLBEING'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === cat
                ? 'bg-[#15191F] text-[#F1F3F5] border border-[#252B33]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
            }`}
          >
            {cat === 'ALL' ? 'All Targets' : cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Create Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/80 backdrop-blur-sm p-4">
          <div className="app-card p-6 max-w-lg w-full border-[#323B46] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#252B33]">
              <h3 className="text-sm font-semibold text-[#F1F3F5]">Create New Target</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#68717D] hover:text-[#F1F3F5] p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9AA2AD] block">Target Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master React Concurrency & System Design"
                  className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9AA2AD] block">Horizon</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  >
                    <option value="directive">Short-term Goal</option>
                    <option value="milestone">Long-term Milestone</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9AA2AD] block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                  >
                    <option value="SKILLS">Skills</option>
                    <option value="CAREER">Career / Studies</option>
                    <option value="FITNESS">Fitness</option>
                    <option value="WELLBEING">Wellbeing</option>
                  </select>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9AA2AD] block">Checklist Steps</label>
                <div className="space-y-2">
                  {subtasks.map((text, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={text}
                      onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                      placeholder={`Step ${idx + 1}...`}
                      className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-1.5 text-xs text-[#F1F3F5] outline-none"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSubtaskInput}
                  className="text-xs text-[#22C7D9] hover:underline pt-1 inline-block"
                >
                  + Add another step
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9AA2AD] block">Target Date</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md px-3 py-2 text-xs text-[#F1F3F5] outline-none"
                />
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
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGoals.length === 0 ? (
          <div className="app-card p-12 text-center text-xs text-[#68717D] col-span-full">
            No targets found. Click "New Target" to set up your objectives.
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isCompleted = goal.progress === 100;

            return (
              <div
                key={goal.id}
                className="app-card p-5 flex flex-col justify-between space-y-4 hover:border-[#323B46] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1A1F26] text-[#9AA2AD] border border-[#252B33]">
                        {goal.type === 'directive' ? 'Short Term' : 'Milestone'}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1A1F26] text-[#22C7D9] border border-[#252B33]">
                        {goal.category}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      onMouseEnter={() => HudAudio.playHover()}
                      className="p-1 text-[#68717D] hover:text-[#EF4444] transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F1F3F5] mb-1">
                    {goal.title}
                  </h3>

                  {goal.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-[#68717D]">
                      <Calendar size={11} />
                      <span>Due {goal.deadline}</span>
                    </div>
                  )}
                </div>

                {/* Subtask list */}
                <div className="space-y-1.5 py-2 border-t border-b border-[#252B33]">
                  {goal.subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => toggleGoalSubtask(goal.id, sub.id)}
                      onMouseEnter={() => HudAudio.playHover()}
                      className="w-full flex items-center gap-2 py-1 text-left text-xs text-[#9AA2AD] hover:text-[#F1F3F5] transition-colors"
                    >
                      {sub.completed ? (
                        <CheckCircle2 size={14} className="text-[#10B981] flex-shrink-0" />
                      ) : (
                        <Circle size={14} className="text-[#68717D] flex-shrink-0" />
                      )}
                      <span
                        className={`truncate text-xs ${
                          sub.completed ? 'line-through text-[#68717D]' : ''
                        }`}
                      >
                        {sub.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9AA2AD]">Progress</span>
                    <span
                      className={`font-medium ${
                        isCompleted ? 'text-[#10B981]' : 'text-[#F1F3F5]'
                      }`}
                    >
                      {goal.progress}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-[#1A1F26] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-[#10B981]' : 'bg-[#22C7D9]'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
