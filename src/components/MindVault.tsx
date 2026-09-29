'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Pin,
  Search,
  BookOpen,
  Calendar
} from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { MoodEnergyLog, ReflectionLog, Note, HudSettings } from '../hooks/useNexusState';

interface MindVaultProps {
  moodLogs: MoodEnergyLog[];
  reflectionLogs: ReflectionLog[];
  notes: Note[];
  settings: HudSettings;
  saveReflection: (wins: string, errors: string, optimizations: string) => void;
  saveMoodEnergy: (mood: number, energy: number) => void;
  addNote: (title: string, content: string, tags: string, pinned?: boolean) => void;
  editNote: (id: string, title: string, content: string, tags: string, pinned?: boolean) => void;
  deleteNote: (id: string) => void;
}

export default function MindVault({
  moodLogs,
  reflectionLogs,
  notes,
  settings,
  saveReflection,
  saveMoodEnergy,
  addNote,
  editNote,
  deleteNote
}: MindVaultProps) {
  const [activeSection, setActiveSection] = useState<'notebook' | 'reflections' | 'energy'>('notebook');

  // Biometrics States
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ mood: number; energy: number } | null>(null);

  // Reflection States
  const [wins, setWins] = useState('');
  const [errors, setErrors] = useState('');
  const [optimizations, setOptimizations] = useState('');

  // Notebook States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [noteTitle, setNoteTitle] = useState(notes[0]?.title || '');
  const [noteContent, setNoteContent] = useState(notes[0]?.content || '');
  const [noteTags, setNoteTags] = useState(notes[0]?.tags || '');
  const [notePinned, setNotePinned] = useState(notes[0]?.pinned || false);

  // Rotating Prompt Sets
  const promptSets = [
    {
      wins: 'What went exceptionally well today?',
      errors: 'What caused friction or delay?',
      optimizations: 'How will you cultivate clarity tomorrow?'
    },
    {
      wins: 'What is your main win today?',
      errors: 'What distraction or blocker did you face?',
      optimizations: 'What small step will make tomorrow smoother?'
    },
    {
      wins: 'What are you proud of completing?',
      errors: 'Where did you feel depleted or off track?',
      optimizations: 'What is your priority for tomorrow?'
    }
  ];
  const activePromptSet = promptSets[new Date().getDate() % promptSets.length];

  // Save/Edit Reflection
  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wins.trim() && !errors.trim() && !optimizations.trim()) return;
    saveReflection(wins, errors, optimizations);
    setWins('');
    setErrors('');
    setOptimizations('');
  };

  const handleSaveBiometrics = () => {
    if (selectedMood === null || selectedEnergy === null) return;
    saveMoodEnergy(selectedMood, selectedEnergy);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (activeNoteId) {
      editNote(activeNoteId, noteTitle, noteContent, noteTags, notePinned);
    } else {
      addNote(noteTitle, noteContent, noteTags, notePinned);
    }
  };

  const handleCreateNewNote = () => {
    HudAudio.playClick();
    setActiveNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setNotePinned(false);
  };

  const selectNote = (note: Note) => {
    HudAudio.playClick();
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags);
    setNotePinned(note.pinned || false);
  };

  const handleDeleteNote = (id: string) => {
    HudAudio.playClick();
    deleteNote(id);
    if (activeNoteId === id) {
      handleCreateNewNote();
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQuadrantLabel = (m: number, e: number) => {
    if (m >= 6 && e >= 6) return 'High Focus & Flow';
    if (m >= 6 && e < 6) return 'Calm & Restorative';
    if (m < 6 && e >= 6) return 'High Stress or Tension';
    return 'Low Energy & Fatigue';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Subnavigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-3 border-b border-[#252B33]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#F1F3F5]">
            My Notebook & Journal
          </h2>
          <p className="text-xs text-[#9AA2AD] mt-0.5">
            Reflections, personal notes, and daily mental state calibration.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-[#101318] p-1 rounded-md border border-[#252B33] self-start sm:self-auto">
          <button
            onClick={() => setActiveSection('notebook')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSection === 'notebook'
                ? 'bg-[#15191F] text-[#F1F3F5] border border-[#252B33]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5]'
            }`}
          >
            Notebook
          </button>
          <button
            onClick={() => setActiveSection('reflections')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSection === 'reflections'
                ? 'bg-[#15191F] text-[#F1F3F5] border border-[#252B33]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5]'
            }`}
          >
            Daily Journal
          </button>
          <button
            onClick={() => setActiveSection('energy')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSection === 'energy'
                ? 'bg-[#15191F] text-[#F1F3F5] border border-[#252B33]'
                : 'text-[#9AA2AD] hover:text-[#F1F3F5]'
            }`}
          >
            Energy Grid
          </button>
        </div>
      </div>

      {/* 1. NOTEBOOK WORKSPACE */}
      {activeSection === 'notebook' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notes Sidebar */}
          <div className="app-card p-4 space-y-3 md:col-span-1 flex flex-col h-[520px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9AA2AD]">
                Notes ({notes.length})
              </span>
              <button
                onClick={handleCreateNewNote}
                className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>New</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#68717D]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes or tags..."
                className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#F1F3F5] outline-none"
              />
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#68717D]">
                  No matching notes found.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`w-full text-left p-3 rounded-md border transition-colors block ${
                      activeNoteId === note.id
                        ? 'bg-[#1A1F26] border-[#323B46] text-[#F1F3F5]'
                        : 'bg-[#101318] border-[#252B33] text-[#9AA2AD] hover:border-[#323B46] hover:text-[#F1F3F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-medium text-xs truncate">
                        {note.title || 'Untitled'}
                      </span>
                      {note.pinned && (
                        <Pin size={11} className="text-[#22C7D9] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#68717D] line-clamp-2">
                      {note.content}
                    </p>
                    {note.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.split(',').map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-[#15191F] text-[#9AA2AD]"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Note Editor Area */}
          <div className="app-card p-6 md:col-span-2 flex flex-col h-[520px]">
            <form onSubmit={handleSaveNote} className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#252B33] gap-3">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="bg-transparent text-base font-semibold text-[#F1F3F5] outline-none flex-1 placeholder-[#68717D]"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNotePinned(!notePinned)}
                    className={`p-1.5 rounded border transition-colors ${
                      notePinned
                        ? 'bg-[#22C7D9]/10 border-[#22C7D9]/30 text-[#22C7D9]'
                        : 'border-[#252B33] text-[#68717D] hover:text-[#F1F3F5]'
                    }`}
                    title={notePinned ? 'Pinned note' : 'Pin note'}
                  >
                    <Pin size={14} />
                  </button>

                  {activeNoteId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(activeNoteId)}
                      className="p-1.5 rounded border border-[#252B33] text-[#68717D] hover:text-[#EF4444] transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your thoughts, daily notes, or ideas here..."
                className="w-full flex-1 bg-transparent text-xs text-[#F1F3F5] outline-none resize-none leading-relaxed placeholder-[#68717D]"
              />

              <div className="pt-3 border-t border-[#252B33]">
                <input
                  type="text"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="Tags (comma separated: health, work, ideas)..."
                  className="w-full bg-[#101318] border border-[#252B33] rounded-md px-3 py-1.5 text-xs text-[#F1F3F5] outline-none"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DAILY JOURNAL & REFLECTIONS */}
      {activeSection === 'reflections' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reflection Form */}
          <form
            onSubmit={handleReflectionSubmit}
            className="app-card p-6 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between pb-3 border-b border-[#252B33] mb-4">
                <h3 className="text-base font-semibold text-[#F1F3F5]">
                  Daily Reflection
                </h3>
                <span className="text-[11px] text-[#10B981] font-medium">+100 XP</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#10B981] block">
                    1. Daily Wins & Highlights
                  </label>
                  <textarea
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    placeholder={activePromptSet.wins}
                    rows={3}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md p-2.5 text-xs text-[#F1F3F5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#F59E0B] block">
                    2. Obstacles & Friction
                  </label>
                  <textarea
                    value={errors}
                    onChange={(e) => setErrors(e.target.value)}
                    placeholder={activePromptSet.errors}
                    rows={3}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md p-2.5 text-xs text-[#F1F3F5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#22C7D9] block">
                    3. Focus for Tomorrow
                  </label>
                  <textarea
                    value={optimizations}
                    onChange={(e) => setOptimizations(e.target.value)}
                    placeholder={activePromptSet.optimizations}
                    rows={3}
                    className="w-full bg-[#101318] border border-[#252B33] focus:border-[#22C7D9] rounded-md p-2.5 text-xs text-[#F1F3F5] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#252B33] flex justify-end">
              <button type="submit" className="btn-primary text-xs">
                Save Reflection
              </button>
            </div>
          </form>

          {/* Previous Reflection Logs */}
          <div className="app-card p-6 flex flex-col justify-between">
            <div className="flex items-baseline justify-between pb-3 border-b border-[#252B33] mb-4">
              <h3 className="text-base font-semibold text-[#F1F3F5]">
                Past Entries
              </h3>
              <span className="text-xs text-[#68717D]">
                {reflectionLogs.length} entries
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[440px] pr-1">
              {reflectionLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#68717D]">
                  No past reflection entries yet. Record today's reflection on the left.
                </div>
              ) : (
                reflectionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-md bg-[#101318] border border-[#252B33] space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#22C7D9] font-medium text-[11px]">
                      <Calendar size={12} />
                      <span>{log.date}</span>
                    </div>

                    {log.wins && (
                      <div>
                        <span className="text-[#10B981] font-medium block text-[11px]">
                          Wins:
                        </span>
                        <p className="text-[#9AA2AD] mt-0.5">{log.wins}</p>
                      </div>
                    )}

                    {log.errors && (
                      <div>
                        <span className="text-[#F59E0B] font-medium block text-[11px]">
                          Friction:
                        </span>
                        <p className="text-[#9AA2AD] mt-0.5">{log.errors}</p>
                      </div>
                    )}

                    {log.optimizations && (
                      <div>
                        <span className="text-[#22C7D9] font-medium block text-[11px]">
                          Focus:
                        </span>
                        <p className="text-[#9AA2AD] mt-0.5">{log.optimizations}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ENERGY & MOOD GRID */}
      {activeSection === 'energy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="app-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#F1F3F5]">
                Energy & State Calibration
              </h3>
              <p className="text-xs text-[#9AA2AD] mt-0.5 mb-4">
                Record your mental vitality (X-axis) and emotional state (Y-axis).
              </p>

              {/* 10x10 Matrix */}
              <div className="max-w-xs mx-auto p-3 rounded-md bg-[#101318] border border-[#252B33]">
                <div className="grid grid-cols-10 gap-1 aspect-square">
                  {Array.from({ length: 100 }).map((_, idx) => {
                    const x = (idx % 10) + 1;
                    const y = 10 - Math.floor(idx / 10);

                    const isSelected = selectedEnergy === x && selectedMood === y;
                    const isHovered =
                      hoveredCell?.energy === x && hoveredCell?.mood === y;

                    let bg = 'bg-[#1A1F26] hover:bg-[#252B33]';
                    if (isSelected) {
                      bg = 'bg-[#22C7D9] ring-1 ring-[#F1F3F5]';
                    } else if (isHovered) {
                      bg = 'bg-[#22C7D9]/40';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          HudAudio.playClick();
                          setSelectedMood(y);
                          setSelectedEnergy(x);
                        }}
                        onMouseEnter={() => {
                          HudAudio.playHover();
                          setHoveredCell({ mood: y, energy: x });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-full h-full rounded-xs transition-colors cursor-pointer ${bg}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#252B33] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#68717D] block">Coordinates:</span>
                  <span className="font-medium text-[#F1F3F5]">
                    {selectedMood !== null && selectedEnergy !== null
                      ? `Energy: ${selectedEnergy} / 10 | Mood: ${selectedMood} / 10`
                      : 'None selected'}
                  </span>
                </div>
                <div>
                  <span className="text-[#68717D] block text-right">Zone:</span>
                  <span className="font-medium text-[#22C7D9]">
                    {selectedMood !== null && selectedEnergy !== null
                      ? getQuadrantLabel(selectedMood, selectedEnergy)
                      : 'Uncalibrated'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveBiometrics}
                disabled={selectedMood === null || selectedEnergy === null}
                className="w-full btn-primary text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Log Coordinates
              </button>
            </div>
          </div>

          {/* Past Biometrics Logs */}
          <div className="app-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#F1F3F5]">
                Recent Logs
              </h3>
              <p className="text-xs text-[#9AA2AD] mt-0.5 mb-4">
                State recordings and vitality markers
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-80 pr-1">
              {moodLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#68717D]">
                  No energy logs recorded yet.
                </div>
              ) : (
                moodLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-[#101318] border border-[#252B33] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-[#F1F3F5] block">
                        {getQuadrantLabel(log.mood, log.energy)}
                      </span>
                      <span className="text-[11px] text-[#68717D]">{log.date}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[#22C7D9] font-medium">
                        E: {log.energy}/10 • M: {log.mood}/10
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
