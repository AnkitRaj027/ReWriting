'use client';

import React, { useState } from 'react';
import { Award, AlertTriangle, RefreshCw, Calendar, Search, FileText, Plus, Trash2, Save, Pin } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { MoodEnergyLog, ReflectionLog, Note, HudSettings } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

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

  const vocab = settings.vocabulary;

  // Rotating Prompt Sets
  const promptSets = [
    { wins: "What went exceptionally well today?", errors: "What caused friction or delay?", optimizations: "How will you prevent this delay tomorrow?" },
    { wins: "What is your main win today?", errors: "What distraction or blocker did you face?", optimizations: "What single change makes tomorrow better?" },
    { wins: "What are you proud of completing?", errors: "Where did you lose focus or waste time?", optimizations: "What is your key priority for tomorrow?" }
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

  // Notebook Notes actions
  const selectNote = (note: Note) => {
    HudAudio.playClick();
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags);
    setNotePinned(note.pinned);
  };

  const handleCreateNewNote = () => {
    HudAudio.playClick();
    setActiveNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setNotePinned(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    if (activeNoteId) {
      editNote(activeNoteId, noteTitle, noteContent, noteTags, notePinned);
    } else {
      addNote(noteTitle, noteContent, noteTags, notePinned);
      // Wait for state recalculation, then set focus
      setActiveNoteId(`n_${Date.now()}`); // temp lock
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    const remainder = notes.filter(n => n.id !== id);
    if (remainder.length > 0) {
      selectNote(remainder[0]);
    } else {
      handleCreateNewNote();
    }
  };

  // Filters notes based on query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQuadrantLabel = (m: number, e: number) => {
    if (m >= 6 && e >= 6) return 'High Focus (Excited & Focused)';
    if (m >= 6 && e < 6) return 'Relaxed Calm (Peaceful & Calm)';
    if (m < 6 && e >= 6) return 'Friction State (Anxious & Stressed)';
    return 'Standby State (Fatigued & Sleepy)';
  };

  const getQuadrantColor = (m: number, e: number) => {
    if (m >= 6 && e >= 6) return 'text-cyber-green';
    if (m >= 6 && e < 6) return 'text-cyber-cyan';
    if (m < 6 && e >= 6) return 'text-cyber-pink';
    return 'text-yellow-500';
  };

  const getWinsLabel = () => {
    if (vocab === 'cyberpunk') return '1. Success Vectors (System Wins)';
    if (vocab === 'academic') return '1. What I accomplished today';
    return '1. Daily Wins & Successes';
  };

  const getErrorsLabel = () => {
    if (vocab === 'cyberpunk') return '2. Frictions Detected (System Errors)';
    if (vocab === 'academic') return '2. Obstacles faced';
    return '2. Mistakes & Friction faced';
  };

  const getOptimizationsLabel = () => {
    if (vocab === 'cyberpunk') return '3. Structural Optimizations (Upgrades)';
    if (vocab === 'academic') return '3. Lessons learned for tomorrow';
    return '3. Things to improve tomorrow';
  };

  return (
    <div className="space-y-6">
      
      {/* View Title */}
      <div className="border-b border-cyber-cyan/20 pb-3">
        <h2 className="text-xl font-mono font-bold tracking-widest text-white flex items-center gap-2">
          <span className="text-cyber-cyan animate-pulse">■</span> 
          {getTranslation(vocab, 'vaultTitle')}
        </h2>
        <p className="text-xs text-gray-500 font-mono mt-1">
          {getTranslation(vocab, 'vaultSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mood & Energy Quadrant Selector */}
        <div className="cyber-card p-5 rounded-lg border-cyber-cyan/15 flex flex-col justify-between space-y-4">
          <div>
            <span className="font-mono text-xs text-cyber-cyan tracking-wider font-bold block mb-1">
              Energy Plane Grid
            </span>
            <p className="text-[10px] text-gray-500 font-mono mb-4">
              Log your state on the grid (Mood is vertical axis, Energy is horizontal axis).
            </p>

            <div className="relative border border-cyber-cyan/15 p-2 rounded bg-obsidian-deep/50 max-w-xs mx-auto">
              <div className="grid grid-cols-10 gap-0.5 aspect-square">
                {Array.from({ length: 100 }).map((_, idx) => {
                  const x = (idx % 10) + 1;
                  const y = 10 - Math.floor(idx / 10);
                  
                  const isSelected = selectedEnergy === x && selectedMood === y;
                  const isHovered = hoveredCell?.energy === x && hoveredCell?.mood === y;

                  let cellBg = 'bg-obsidian-light/20 hover:bg-cyber-cyan/10';
                  if (isSelected) {
                    cellBg = 'bg-cyber-cyan border border-white shadow-[0_0_8px_#00F0FF]';
                  } else if (isHovered) {
                    cellBg = 'bg-cyber-cyan/20 border border-cyber-cyan/35';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { HudAudio.playClick(); setSelectedMood(y); setSelectedEnergy(x); }}
                      onMouseEnter={() => { HudAudio.playHover(); setHoveredCell({ mood: y, energy: x }); }}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-full h-full rounded-sm border border-transparent transition-all outline-none cursor-pointer ${cellBg}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-cyber-cyan/10 space-y-3 font-mono">
            <div className="flex justify-between items-center text-[10px]">
              <div>
                <span className="text-gray-500 block">Selected:</span>
                {selectedMood !== null && selectedEnergy !== null ? (
                  <span className="text-white font-bold">
                    Energy: <strong className="text-cyber-cyan">{selectedEnergy}</strong> | 
                    Mood: <strong className="text-cyber-purple">{selectedMood}</strong>
                  </span>
                ) : (
                  <span className="text-gray-600">Select a grid cell...</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block text-right">State:</span>
                {selectedMood !== null && selectedEnergy !== null ? (
                  <span className={`font-bold ${getQuadrantColor(selectedMood, selectedEnergy)}`}>
                    {getQuadrantLabel(selectedMood, selectedEnergy).split(' (')[0]}
                  </span>
                ) : (
                  <span className="text-gray-600 text-right block">None selected</span>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveBiometrics}
              disabled={selectedMood === null || selectedEnergy === null}
              onMouseEnter={() => HudAudio.playHover()}
              className="w-full py-1.5 rounded text-[10px] btn-cyber-cyan disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Save Mood and Energy Coordinates
            </button>
          </div>
        </div>

        {/* Reflection Compiler Form (Rotated Daily Prompts) */}
        <form onSubmit={handleReflectionSubmit} className="cyber-card p-5 rounded-lg border-cyber-cyan/15 space-y-4 font-mono text-[10px]">
          <span className="text-xs text-cyber-cyan font-bold tracking-wider block border-b border-cyber-cyan/15 pb-2">
            Daily Journal Writeback
          </span>

          <div className="space-y-1.5">
            <label className="text-cyber-green font-bold flex items-center gap-1.5 uppercase">
              <Award size={12} /> {getWinsLabel()}
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder={activePromptSet.wins}
              rows={2}
              className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-cyber-pink font-bold flex items-center gap-1.5 uppercase">
              <AlertTriangle size={12} /> {getErrorsLabel()}
            </label>
            <textarea
              value={errors}
              onChange={(e) => setErrors(e.target.value)}
              placeholder={activePromptSet.errors}
              rows={2}
              className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-cyber-purple font-bold flex items-center gap-1.5 uppercase">
              <RefreshCw size={12} /> {getOptimizationsLabel()}
            </label>
            <textarea
              value={optimizations}
              onChange={(e) => setOptimizations(e.target.value)}
              placeholder={activePromptSet.optimizations}
              rows={2}
              className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              onMouseEnter={() => HudAudio.playHover()}
              className="btn-cyber-cyan px-4 py-2 rounded text-xs cursor-pointer"
            >
              Write Reflection Log (+100 XP)
            </button>
          </div>
        </form>

      </div>

      {/* NOTEBOOK WORKSPACE MODULE */}
      <section className="cyber-card p-5 rounded-lg border-cyber-cyan/15 space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2">
          <span className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
            <FileText size={14} className="text-cyber-cyan" /> My Notebook Workspace
          </span>
          <button
            onClick={handleCreateNewNote}
            className="btn-cyber-cyan px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
          >
            <Plus size={11} /> Create New Note
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notes Sidebar List */}
          <div className="md:col-span-1 space-y-3">
            {/* Search query input */}
            <div className="flex items-center space-x-2 bg-obsidian-deep border border-cyber-cyan/20 rounded px-2.5 py-1.5">
              <Search size={12} className="text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes or tags..."
                className="w-full bg-transparent outline-none border-none text-cyber-cyan placeholder-gray-600 text-[10px] font-mono"
              />
            </div>

            {/* Note items scroll pane */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-gray-500 font-mono">
                  No notes match criteria.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`w-full text-left p-3 rounded border font-mono text-[10px] block transition-all relative cursor-pointer ${
                      activeNoteId === note.id
                        ? 'border-cyber-cyan bg-cyber-cyan/5 text-cyber-cyan font-bold'
                        : 'border-obsidian-light hover:border-cyber-cyan/30 hover:bg-obsidian-light/30 text-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white truncate max-w-[100px] flex items-center gap-1">
                        {note.pinned && <Pin size={8} className="text-cyber-cyan" />}
                        {note.title}
                      </span>
                      <span className="text-[8px] text-gray-500">{note.updatedAt}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 truncate mb-1.5">{note.content}</p>
                    {note.tags && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.split(',').map(tag => (
                          <span key={tag} className="bg-obsidian-deep px-1.5 py-0.5 rounded text-[8px] text-cyber-purple font-semibold border border-cyber-purple/10">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Active Note Workspace Editor */}
          <form onSubmit={handleSaveNote} className="md:col-span-2 space-y-4 border border-cyber-cyan/10 bg-obsidian-deep/30 p-4 rounded-lg flex flex-col justify-between min-h-[320px]">
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex flex-wrap gap-4">
                {/* Note title */}
                <div className="flex-1 space-y-1">
                  <label className="text-gray-500 block font-bold">NOTE_TITLE</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Daily Schedule Goals"
                    className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-2.5 py-1.5 text-cyber-cyan text-[11px] outline-none"
                  />
                </div>
                {/* Note tags */}
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-gray-500 block font-bold">TAGS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="e.g. notes, logs"
                    className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-2.5 py-1.5 text-cyber-cyan text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Pin note checkbox option */}
              <div className="flex items-center space-x-2 py-1 bg-cyber-cyan/5 border border-cyber-cyan/10 rounded px-2.5">
                <input
                  type="checkbox"
                  id="pinNoteCheckbox"
                  checked={notePinned}
                  onChange={(e) => { HudAudio.playClick(); setNotePinned(e.target.checked); }}
                  className="rounded border-cyber-cyan text-cyber-cyan focus:ring-cyber-cyan h-3.5 w-3.5"
                />
                <label htmlFor="pinNoteCheckbox" className="text-[10px] text-gray-300 font-bold flex items-center gap-1 cursor-pointer select-none">
                  <Pin size={10} className="text-cyber-cyan" /> Pin this Note to CommandCenter Dashboard Home
                </label>
              </div>

              {/* Note Content */}
              <div className="space-y-1">
                <label className="text-gray-500 block font-bold">NOTE_CONTENT</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Start writing text or logs..."
                  rows={8}
                  className="w-full bg-obsidian-deep border border-cyber-cyan/25 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan text-xs outline-none"
                />
              </div>
            </div>

            {/* Note Editor Operations */}
            <div className="pt-3 border-t border-cyber-cyan/10 flex justify-between items-center font-mono text-[10px]">
              <div>
                {activeNoteId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(activeNoteId)}
                    onMouseEnter={() => HudAudio.playHover()}
                    className="px-3 py-1.5 border border-cyber-pink/40 hover:border-cyber-pink hover:bg-cyber-pink/5 text-cyber-pink rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Purge Note
                  </button>
                ) : (
                  <span className="text-gray-600 italic">Editing New Note draft...</span>
                )}
              </div>

              <button
                type="submit"
                onMouseEnter={() => HudAudio.playHover()}
                className="btn-cyber-cyan px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer"
              >
                <Save size={12} /> Save Note
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Daily Reflections Lookup list */}
      <section className="space-y-4">
        <div className="border-b border-cyber-cyan/15 pb-2">
          <h3 className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
            <Calendar size={14} className="text-cyber-cyan" /> Reflection Journal History
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reflectionLogs.length === 0 ? (
            <div className="cyber-card p-6 text-center text-xs text-gray-600 font-mono col-span-2">
              No historical reflection entries found.
            </div>
          ) : (
            reflectionLogs.map((log) => (
              <div key={log.date} className="cyber-card p-4 rounded-lg border-obsidian-light/60 space-y-3 font-mono text-[10px]">
                <div className="flex justify-between items-center border-b border-obsidian-light pb-1 text-gray-500">
                  <span className="font-bold flex items-center gap-1">
                    <Calendar size={11} className="text-cyber-cyan" /> {log.date}
                  </span>
                  <span>Log Entry</span>
                </div>

                <div className="space-y-2">
                  {log.wins && (
                    <div>
                      <span className="text-cyber-green block font-bold uppercase text-[9px]">Wins:</span>
                      <p className="text-[11px] text-gray-300 pl-2 border-l border-cyber-green/30 mt-0.5">{log.wins}</p>
                    </div>
                  )}
                  {log.errors && (
                    <div>
                      <span className="text-cyber-pink block font-bold uppercase text-[9px]">Difficulties:</span>
                      <p className="text-[11px] text-gray-300 pl-2 border-l border-cyber-pink/30 mt-0.5">{log.errors}</p>
                    </div>
                  )}
                  {log.optimizations && (
                    <div>
                      <span className="text-cyber-purple block font-bold uppercase text-[9px]">Lessons:</span>
                      <p className="text-[11px] text-gray-300 pl-2 border-l border-cyber-purple/30 mt-0.5">{log.optimizations}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
