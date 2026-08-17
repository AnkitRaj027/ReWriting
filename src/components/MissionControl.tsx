'use client';

import React, { useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Goal, HudSettings } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'directive' | 'milestone'>('directive');
  const [category, setCategory] = useState<'SKILLS' | 'FITNESS' | 'WELLBEING' | 'CAREER'>('SKILLS');
  const [subtasks, setSubtasks] = useState<string[]>(['', '', '']);
  const [deadline, setDeadline] = useState('');

  const vocab = settings.vocabulary;

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
    addGoal(title, type, category, subtasks, deadline);
    setTitle('');
    setSubtasks(['', '', '']);
    setDeadline('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* SMART GOAL BOARD */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-cyan/20 pb-2">
          <div>
            <h2 className="text-lg font-mono font-bold tracking-widest text-white flex items-center gap-2">
              <span className="text-cyber-cyan animate-pulse">■</span> 
              {getTranslation(vocab, 'goalsTitle')}
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {getTranslation(vocab, 'goalsSubtitle')}
            </p>
          </div>

          <button
            onClick={() => { HudAudio.playClick(); setShowAddForm(!showAddForm); }}
            onMouseEnter={() => HudAudio.playHover()}
            className="btn-cyber-cyan px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> {showAddForm ? 'Cancel Form' : 'Create New Target'}
          </button>
        </div>

        {/* Goal Form configuration */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="cyber-card p-5 rounded-lg border-cyber-cyan/35 max-w-xl mx-auto space-y-4 font-mono text-[10px]">
            <h3 className="text-xs text-cyber-cyan font-bold tracking-wider border-b border-cyber-cyan/15 pb-2">
              Create New Goal Checklist
            </h3>

            <div className="space-y-1.5">
              <label className="text-gray-400 block font-bold">Goal Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Finish Reading Chapter 5"
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-gray-400 block font-bold">Goal Duration Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
                >
                  <option value="directive">Short-term Goal</option>
                  <option value="milestone">Long-term Goal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 block font-bold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
                >
                  <option value="SKILLS">Skills</option>
                  <option value="FITNESS">Fitness</option>
                  <option value="WELLBEING">Wellbeing</option>
                  <option value="CAREER">Studies or Work</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 block font-bold">Goal Steps Checklist</label>
              <div className="space-y-2">
                {subtasks.map((text, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={text}
                    onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                    placeholder={`Step #${idx + 1}...`}
                    className="w-full bg-obsidian-deep border border-cyber-cyan/20 rounded px-3 py-1.5 text-cyber-cyan outline-none text-[10px]"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addSubtaskInput}
                className="text-[9px] text-cyber-cyan/70 hover:text-cyber-cyan flex items-center gap-1.5 pt-1 hover:underline"
              >
                + Add Subtask Row
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-400 block font-bold">Deadline Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="btn-cyber-cyan px-4 py-2 rounded text-xs"
              >
                Compile Target Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals Render Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length === 0 ? (
            <div className="cyber-card p-12 text-center text-gray-500 font-mono text-sm border-dashed col-span-3">
              No active goals configured. Click button to configure.
            </div>
          ) : (
            goals.map((goal) => (
              <div 
                key={goal.id} 
                className={`cyber-card p-5 rounded-lg border flex flex-col justify-between space-y-4 ${
                  goal.progress === 100 
                    ? 'border-cyber-green/35 bg-cyber-green/5 shadow-[0_0_12px_rgba(0,255,102,0.03)]' 
                    : goal.type === 'directive'
                    ? 'border-cyber-cyan/15'
                    : 'border-cyber-purple/15'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[9px] mb-2">
                    <span className={`px-2 py-0.5 rounded border font-bold ${
                      goal.type === 'directive' 
                        ? 'border-cyber-cyan/30 text-cyber-cyan bg-cyber-cyan/5' 
                        : 'border-cyber-purple/30 text-cyber-purple bg-cyber-purple/5'
                    }`}>
                      {goal.type === 'directive' ? 'Short Term' : 'Long Term'}: {goal.category}
                    </span>

                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      onMouseEnter={() => HudAudio.playHover()}
                      className="text-gray-500 hover:text-cyber-pink transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-wide mb-1 leading-snug">{goal.title}</h3>
                  <span className="font-mono text-[9px] text-gray-500 block font-semibold">Deadline: {goal.deadline}</span>
                </div>

                {/* Subtask checklist */}
                <div className="space-y-2 bg-obsidian-deep/40 p-3 rounded border border-obsidian-light/45">
                  <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block mb-2 border-b border-obsidian-light pb-1 font-bold">
                    Subtask Checklist
                  </span>
                  
                  {goal.subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => toggleGoalSubtask(goal.id, sub.id)}
                      onMouseEnter={() => HudAudio.playHover()}
                      className="w-full flex items-center text-left py-1 text-xs text-gray-300 hover:text-white space-x-2 transition-colors focus:outline-none cursor-pointer"
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                        sub.completed 
                          ? 'border-cyber-green bg-cyber-green/10 text-cyber-green' 
                          : 'border-gray-600'
                      }`}>
                        {sub.completed && <span className="w-1.5 h-1.5 bg-cyber-green rounded-full" />}
                      </div>
                      <span className={`text-[11px] leading-tight ${sub.completed ? 'line-through text-gray-500' : ''}`}>
                        {sub.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-[9px] text-gray-400">
                    <span>Progress Rate</span>
                    <span className={goal.progress === 100 ? 'text-cyber-green font-bold' : 'text-cyber-cyan'}>
                      {goal.progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-obsidian-deep border border-obsidian-light h-2.5 rounded p-0.5 overflow-hidden">
                    <div 
                      className={`h-full rounded transition-all duration-500 ${
                        goal.progress === 100 
                          ? 'bg-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.3)]' 
                          : 'bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
