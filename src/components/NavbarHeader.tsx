'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Menu, X, User, Palette, Award, Check } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Profile, HudSettings } from '../hooks/useNexusState';
import { getTranslation } from '../utils/glossary';

interface NavbarHeaderProps {
  profile: Profile;
  settings: HudSettings;
  updateSettings: (newSettings: Partial<HudSettings>) => void;
  updateProfileName: (name: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function NavbarHeader({ 
  profile, 
  settings, 
  updateSettings, 
  updateProfileName,
  activeTab, 
  setActiveTab 
}: NavbarHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Name editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);

  useEffect(() => {
    setMuted(HudAudio.isMuted());

    const updateClock = () => {
      const now = new Date();
      const offsetMs = now.getTimezoneOffset() * 60 * 1000;
      const localTime = new Date(now.getTime() - offsetMs);
      const iso = localTime.toISOString().replace('T', ' ').substring(0, 19);
      setTimeStr(iso);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keep editor input in sync with external name updates (e.g. from setup modal)
  useEffect(() => {
    setEditedName(profile.name);
  }, [profile.name]);

  const handleMuteToggle = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    HudAudio.setMute(nextMute);
    if (!nextMute) {
      setTimeout(() => HudAudio.playClick(), 50);
    }
  };

  const themeCycle: ('cyan' | 'green' | 'crimson' | 'amber' | 'purple')[] = ['cyan', 'green', 'crimson', 'amber', 'purple'];
  
  const handleThemeToggle = () => {
    HudAudio.playClick();
    const currentIdx = themeCycle.indexOf(settings.theme);
    const nextIdx = (currentIdx + 1) % themeCycle.length;
    updateSettings({ theme: themeCycle[nextIdx] });
  };

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    updateProfileName(editedName.trim());
    setIsEditingName(false);
  };

  const vocab = settings.vocabulary;

  // Ranks based on total focus minutes
  const getFocusRank = (mins: number) => {
    if (mins < 60) return 'Deep Focus Novice';
    if (mins < 180) return 'Time Alchemist';
    if (mins < 360) return 'Focus Adept';
    if (mins < 600) return 'Productivity Sage';
    return 'Flow State Master';
  };

  const navItems = [
    { id: 'home', label: 'Dashboard' },
    { id: 'habits', label: getTranslation(vocab, 'habitsTitle') },
    { id: 'focus', label: getTranslation(vocab, 'focusTitle') },
    { id: 'skills', label: getTranslation(vocab, 'goalsTitle') },
    { id: 'vault', label: getTranslation(vocab, 'vaultTitle') },
    { id: 'english', label: 'English Coach' }
  ];

  const handleTabChange = (tabId: string) => {
    HudAudio.playClick();
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const getStatusColor = (status: Profile['status']) => {
    switch (status) {
      case 'OPTIMAL': return 'text-cyber-green border-cyber-green/30 bg-cyber-green/5';
      case 'OVERLOAD': return 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5';
      case 'RECOVERY': return 'text-purple-400 border-purple-500/30 bg-purple-500/5';
      case 'AGITATED': return 'text-cyber-pink border-cyber-pink/30 bg-cyber-pink/5';
      case 'STANDBY': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/5';
    }
  };

  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <header className="border-b border-cyber-cyan/20 bg-obsidian-dark/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded border-2 border-cyber-cyan flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.4)] bg-cyber-cyan/5">
            <span className="font-mono text-sm font-bold text-cyber-cyan animate-pulse">RW</span>
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple shadow-sm">
              ReWriting Core
            </h1>
            <p className="text-[9px] font-mono text-gray-500 tracking-wider">Personal Growth Monitor v3.0</p>
          </div>
        </div>

        {/* Dynamic Telemetry Info - timezone corrected */}
        <div className="hidden lg:flex items-center space-x-6 font-mono text-xs text-gray-400">
          <div>
            <span className="text-[10px] text-gray-600 block">System Time</span>
            <span className="text-cyber-cyan tracking-wider font-bold">{timeStr || 'Initializing clock...'}</span>
          </div>

          <div className="h-6 w-px bg-cyber-cyan/10" />

          {/* Click to Edit Username */}
          <div className="min-w-[100px]">
            <span className="text-[10px] text-gray-600 block">
              {getTranslation(vocab, 'profileLabel')} (Click to Edit)
            </span>
            {isEditingName ? (
              <form onSubmit={handleNameSave} className="flex items-center space-x-1 mt-0.5">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-obsidian-deep border border-cyber-cyan/40 rounded px-1.5 py-0.5 text-xs text-cyber-cyan font-mono focus:outline-none w-28"
                  autoFocus
                  onBlur={() => setTimeout(() => setIsEditingName(false), 200)}
                />
                <button type="submit" className="p-0.5 border border-cyber-green/30 text-cyber-green rounded hover:bg-cyber-green/10 cursor-pointer">
                  <Check size={10} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => { HudAudio.playClick(); setIsEditingName(true); }}
                className="text-gray-200 flex items-center gap-1.5 font-bold hover:text-cyber-cyan transition-colors text-left outline-none cursor-pointer"
                title="Click to edit name"
              >
                <User size={11} className="text-cyber-cyan" />
                {profile.name}
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-cyber-cyan/10" />

          <div>
            <span className="text-[10px] text-gray-600 block">
              {getTranslation(vocab, 'profileStatus')}
            </span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusColor(profile.status)}`}>
              Status: {profile.status}
            </span>
          </div>

          <div className="h-6 w-px bg-cyber-cyan/10" />

          {/* Gamified Focus Rank */}
          <div>
            <span className="text-[10px] text-gray-600 block">Rank Badges</span>
            <span className="text-cyber-purple flex items-center gap-1 font-bold">
              <Award size={11} className="text-cyber-purple" />
              {getFocusRank(profile.totalFocusMinutes || 0)}
            </span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="flex items-center space-x-4 flex-grow md:flex-grow-0 justify-end">
          <div className="w-36 sm:w-40 font-mono text-[10px] text-right">
            <div className="flex justify-between mb-1">
              <span className="text-cyber-purple font-bold">Lvl {profile.level}</span>
              <span className="text-gray-400 font-bold">{profile.xp}/{profile.xpToNextLevel} XP</span>
            </div>
            <div className="w-full bg-obsidian-deep border border-cyber-cyan/20 h-2 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-cyber-cyan to-cyber-purple h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Theme Loop Switcher Button */}
          <button
            onClick={handleThemeToggle}
            onMouseEnter={() => HudAudio.playHover()}
            className="p-2 border border-cyber-cyan/20 hover:border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 rounded cursor-pointer transition-colors"
            title="Cycle HUD Themes"
          >
            <Palette size={15} />
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={handleMuteToggle}
            onMouseEnter={() => HudAudio.playHover()}
            className={`p-2 rounded border transition-colors cursor-pointer ${
              muted 
                ? 'border-cyber-pink/20 hover:border-cyber-pink text-cyber-pink hover:bg-cyber-pink/10' 
                : 'border-cyber-cyan/20 hover:border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10'
            }`}
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => { HudAudio.playClick(); setMobileMenuOpen(!mobileMenuOpen); }}
            onMouseEnter={() => HudAudio.playHover()}
            className="p-2 border border-cyber-cyan/20 hover:border-cyber-cyan text-cyber-cyan rounded lg:hidden hover:bg-cyber-cyan/10 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="hidden lg:block border-t border-cyber-cyan/10 bg-obsidian-deep/60">
        <div className="max-w-[1500px] mx-auto px-4 flex space-x-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              onMouseEnter={() => HudAudio.playHover()}
              className={`py-3 px-4 font-mono text-xs tracking-wider transition-all relative outline-none border-b-2 cursor-pointer ${
                activeTab === item.id 
                  ? 'text-cyber-cyan border-cyber-cyan bg-cyber-cyan/5 font-bold shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]' 
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-cyber-cyan/40 hover:bg-obsidian-light/35'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <span className="absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-cyber-cyan shadow-[0_0_8px_#00F0FF]" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile nav items */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-cyber-cyan/20 bg-obsidian-dark py-2 px-4 space-y-1 font-mono text-xs">
          <div className="flex justify-between items-center py-2 px-2 border-b border-cyber-cyan/10 text-gray-500 text-[10px]">
            <span>Rank: {getFocusRank(profile.totalFocusMinutes || 0)}</span>
            <span>{timeStr.split(' ')[1]}</span>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              onMouseEnter={() => HudAudio.playHover()}
              className={`w-full text-left py-2.5 px-3 rounded tracking-wider block transition-colors cursor-pointer ${
                activeTab === item.id 
                  ? 'text-cyber-cyan bg-cyber-cyan/10 font-bold border-l-2 border-cyber-cyan' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-obsidian-light/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
