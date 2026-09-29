'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  Activity,
  Target,
  GraduationCap,
  BookOpen,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Palette,
  Check,
  X,
  Leaf
} from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Profile, HudSettings } from '../hooks/useNexusState';

interface SidebarProps {
  profile: Profile;
  settings: HudSettings;
  updateSettings: (newSettings: Partial<HudSettings>) => void;
  updateProfileName: (name: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({
  profile,
  settings,
  updateSettings,
  updateProfileName,
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen
}: SidebarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [muted, setMuted] = useState(HudAudio.isMuted());

  const handleMuteToggle = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    HudAudio.setMute(nextMute);
    if (!nextMute) {
      setTimeout(() => HudAudio.playClick(), 50);
    }
  };

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    updateProfileName(editedName.trim());
    setIsEditingName(false);
  };

  const handleNavClick = (tabId: string) => {
    HudAudio.playClick();
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  const navGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'habits', label: 'My Habits', icon: Activity },
        { id: 'focus', label: 'My Timer', icon: Timer },
        { id: 'skills', label: 'My Goals', icon: Target }
      ]
    },
    {
      group: 'GROWTH & MIND',
      items: [
        { id: 'vault', label: 'My Notebook & Journal', icon: BookOpen },
        { id: 'english', label: 'English Coach', icon: GraduationCap },
        { id: 'assistant', label: 'Rewire AI', icon: Sparkles }
      ]
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#101318] border-r border-[#252B33] transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#252B33]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#15191F] border border-[#252B33] flex items-center justify-center text-[#22C7D9] font-semibold text-xs tracking-tight">
            RW
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-[#F1F3F5]">
              ReWriting
            </span>
            <span className="text-[10px] font-medium text-[#9AA2AD] px-1.5 py-0.5 bg-[#15191F] rounded border border-[#252B33]">
              Core
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded text-[#9AA2AD] hover:text-[#F1F3F5] md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-medium tracking-wider text-[#68717D]">
              {group.group}
            </div>
            {group.items.map((item) => {
              const actualTab = item.id;
              const isActive = activeTab === actualTab;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(actualTab)}
                  onMouseEnter={() => HudAudio.playHover()}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors text-left relative ${
                    isActive
                      ? 'bg-[#15191F] text-[#F1F3F5]'
                      : 'text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#15191F]/50'
                  }`}
                >
                  {/* Subtle active left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#22C7D9] rounded-r" />
                  )}
                  <Icon
                    size={16}
                    className={isActive ? 'text-[#22C7D9]' : 'text-[#68717D]'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile & Footer */}
      <div className="p-3 border-t border-[#252B33] space-y-3 bg-[#101318]">
        {/* User Profile Card */}
        <div className="p-2.5 rounded-lg bg-[#15191F] border border-[#252B33]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#1A1F26] border border-[#252B33] flex items-center justify-center text-[11px] text-[#9AA2AD] flex-shrink-0">
                <User size={12} />
              </div>
              <div className="min-w-0">
                {isEditingName ? (
                  <form onSubmit={handleNameSave} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-[#101318] border border-[#22C7D9]/50 rounded px-1.5 py-0.5 text-xs text-[#F1F3F5] w-24 outline-none"
                      autoFocus
                      onBlur={() => setTimeout(() => setIsEditingName(false), 200)}
                    />
                    <button
                      type="submit"
                      className="text-[#22C7D9] hover:text-[#22C7D9]/80"
                    >
                      <Check size={12} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      HudAudio.playClick();
                      setIsEditingName(true);
                    }}
                    className="text-xs font-medium text-[#F1F3F5] hover:text-[#22C7D9] truncate max-w-[120px] text-left block transition-colors"
                    title="Click to rename"
                  >
                    {profile.name}
                  </button>
                )}
                <div className="text-[10px] text-[#68717D]">Level {profile.level}</div>
              </div>
            </div>

            {/* Quick sound toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleMuteToggle}
                onMouseEnter={() => HudAudio.playHover()}
                className="p-1 rounded text-[#68717D] hover:text-[#F1F3F5] hover:bg-[#1A1F26] transition-colors"
                title={muted ? 'Unmute sounds' : 'Mute sounds'}
              >
                {muted ? <VolumeX size={13} className="text-[#EF4444]" /> : <Volume2 size={13} />}
              </button>
            </div>
          </div>

          {/* XP Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#68717D]">
              <span>Growth</span>
              <span>
                {profile.xp} / {profile.xpToNextLevel} XP
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1F26] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22C7D9] rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#68717D]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Optimal</span>
          </div>
          <span className="text-[10px] text-[#68717D]">v3.2</span>
        </div>
      </div>
    </aside>
  );
}
