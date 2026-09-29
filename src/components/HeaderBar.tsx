'use client';

import React from 'react';
import { Menu, Calendar, Timer, Leaf } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Profile, HudSettings } from '../hooks/useNexusState';

interface HeaderBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile;
  settings: HudSettings;
  setIsMobileOpen: (open: boolean) => void;
}

export default function HeaderBar({
  activeTab,
  setActiveTab,
  profile,
  settings,
  setIsMobileOpen
}: HeaderBarProps) {
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const getPageInfo = () => {
    switch (activeTab) {
      case 'home':
        return { title: 'Dashboard', subtitle: "Here's how your day is going." };
      case 'habits':
        return { title: 'My Habits', subtitle: 'Daily consistency and rituals.' };
      case 'focus':
        return { title: 'My Timer', subtitle: 'Calm, focused deep work.' };
      case 'skills':
        return { title: 'My Goals', subtitle: 'Objectives, milestones, and targets.' };
      case 'vault':
        return { title: 'My Notebook & Journal', subtitle: 'Reflections, notes, and personal thoughts.' };
      case 'english':
        return { title: 'English Coach', subtitle: 'Interactive practice, grammar drills, and vocabulary.' };
      case 'assistant':
        return { title: 'Rewire AI', subtitle: 'Personal intelligence partner for growth.' };
      default:
        return { title: 'Overview', subtitle: 'ReWriting Core System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-[#0B0D10]/90 backdrop-blur-md border-b border-[#252B33]">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger button */}
        <button
          onClick={() => {
            HudAudio.playClick();
            setIsMobileOpen(true);
          }}
          className="p-1.5 rounded-md text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#1A1F26] md:hidden"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-base font-semibold text-[#F1F3F5] tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-[#9AA2AD] hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Launch Focus button if not on focus tab */}
        {activeTab !== 'focus' && (
          <button
            onClick={() => {
              HudAudio.playClick();
              setActiveTab('focus');
            }}
            onMouseEnter={() => HudAudio.playHover()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#22C7D9] bg-[#22C7D9]/10 hover:bg-[#22C7D9]/15 border border-[#22C7D9]/25 rounded-md transition-colors"
          >
            <Timer size={13} />
            <span>Start Timer</span>
          </button>
        )}

        {/* Date Stamp */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9AA2AD] bg-[#15191F] border border-[#252B33] rounded-md">
          <Calendar size={13} className="text-[#68717D]" />
          <span>{formattedDate}</span>
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9AA2AD] bg-[#15191F] border border-[#252B33] rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Optimal</span>
        </div>
      </div>
    </header>
  );
}
