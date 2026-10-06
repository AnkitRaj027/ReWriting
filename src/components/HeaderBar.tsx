'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Calendar,
  Timer,
  Cloud,
  CloudRain,
  CloudOff,
  HardDrive,
  LogOut,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';
import { Profile, HudSettings, CloudSyncStatus } from '../hooks/useNexusState';
import { useAuth } from '../context/AuthContext';

interface HeaderBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile;
  settings: HudSettings;
  setIsMobileOpen: (open: boolean) => void;
  updateSettings?: (newSettings: Partial<HudSettings>) => void;
  syncStatus?: CloudSyncStatus;
  lastSyncedAt?: Date | null;
  manualCloudSync?: () => Promise<void>;
}

export default function HeaderBar({
  activeTab,
  setActiveTab,
  profile,
  settings,
  setIsMobileOpen,
  syncStatus = 'guest',
  lastSyncedAt,
  manualCloudSync
}: HeaderBarProps) {
  const { user, loading, isConfigured, authError, signInWithGoogle, signOutUser, clearAuthError } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      default:
        return { title: 'Overview', subtitle: 'ReWriting Core System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  const handleGoogleClick = async () => {
    HudAudio.playClick();
    if (!isConfigured) {
      setShowConfigModal(true);
      return;
    }
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      HudAudio.playSuccess();
    } catch {
      HudAudio.playAlert();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    HudAudio.playClick();
    await signOutUser();
    setDropdownOpen(false);
  };

  const handleManualSync = async () => {
    if (manualCloudSync) {
      await manualCloudSync();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-[#0B0D10]/90 backdrop-blur-md border-b border-[#252B33]">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger button */}
          <button
            onClick={() => {
              HudAudio.playClick();
              setIsMobileOpen(true);
            }}
            className="p-1.5 rounded-md text-[#9AA2AD] hover:text-[#F1F3F5] hover:bg-[#1A1F26] md:hidden"
            title="Open Menu"
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

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Launch Focus button if not on focus tab */}
          {activeTab !== 'focus' && (
            <button
              onClick={() => {
                HudAudio.playClick();
                setActiveTab('focus');
              }}
              onMouseEnter={() => HudAudio.playHover()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#22C7D9] bg-[#22C7D9]/10 hover:bg-[#22C7D9]/15 border border-[#22C7D9]/25 rounded-md transition-colors"
            >
              <Timer size={13} />
              <span>Start Timer</span>
            </button>
          )}

          {/* Date Stamp */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9AA2AD] bg-[#15191F] border border-[#252B33] rounded-md">
            <Calendar size={13} className="text-[#68717D]" />
            <span>{formattedDate}</span>
          </div>

          {/* Authentication & Cloud Sync Section */}
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#68717D] bg-[#15191F] border border-[#252B33] rounded-md">
              <RefreshCw size={13} className="animate-spin text-[#22C7D9]" />
              <span className="hidden sm:inline">Checking session...</span>
            </div>
          ) : user ? (
            /* Signed In User State */
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-1.5">
                {/* Real-time Cloud Sync Indicator */}
                <button
                  onClick={handleManualSync}
                  title={lastSyncedAt ? `Last cloud sync: ${lastSyncedAt.toLocaleTimeString()}` : 'Sync with cloud'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors bg-[#15191F] hover:bg-[#1A1F26] border-[#252B33]"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-[#22C7D9]" />
                      <span className="text-[#22C7D9] hidden sm:inline text-[11px] font-medium">Syncing...</span>
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <CloudOff size={13} className="text-[#EF4444]" />
                      <span className="text-[#EF4444] hidden sm:inline text-[11px] font-medium">Sync issue</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={13} className="text-[#10B981]" />
                      <span className="text-[#10B981] hidden sm:inline text-[11px] font-medium">Cloud Synced</span>
                    </>
                  )}
                </button>

                {/* Profile Pill & Dropdown Toggle */}
                <button
                  onClick={() => {
                    HudAudio.playClick();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 text-xs text-[#F1F3F5] bg-[#15191F] hover:bg-[#1A1F26] border border-[#252B33] rounded-md transition-colors"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User Avatar'}
                      className="w-5 h-5 rounded-full object-cover border border-[#22C7D9]/40"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#22C7D9]/20 text-[#22C7D9] flex items-center justify-center font-bold text-[10px]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium max-w-[100px] truncate text-left">
                    {user.displayName || 'Google User'}
                  </span>
                  <ChevronDown size={13} className="text-[#68717D]" />
                </button>
              </div>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 p-3 bg-[#12151B] border border-[#2E3642] rounded-lg shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#252B33]">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border border-[#22C7D9]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#22C7D9]/20 text-[#22C7D9] flex items-center justify-center font-bold text-sm">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#F1F3F5] truncate">
                        {user.displayName || 'Google Account'}
                      </p>
                      <p className="text-[11px] text-[#9AA2AD] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#9AA2AD] px-1">
                      <span>Cloud Sync</span>
                      <span className="text-[#10B981] font-medium flex items-center gap-1">
                        <ShieldCheck size={12} /> Active
                      </span>
                    </div>
                    {lastSyncedAt && (
                      <div className="text-[10px] text-[#68717D] px-1">
                        Last saved: {lastSyncedAt.toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#252B33] space-y-1.5">
                    <button
                      onClick={handleManualSync}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-[#22C7D9] bg-[#22C7D9]/10 hover:bg-[#22C7D9]/20 border border-[#22C7D9]/30 rounded-md transition-colors"
                    >
                      <RefreshCw size={12} />
                      <span>Sync Data Now</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors"
                    >
                      <LogOut size={12} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest / Signed Out State */
            <div className="flex items-center gap-2">
              {/* Local Storage Status indicator */}
              <div
                title="All your habits, goals, and notes are saved in your browser's Local Storage."
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#9AA2AD] bg-[#15191F] border border-[#252B33] rounded-md"
              >
                <HardDrive size={13} className="text-[#22C7D9]" />
                <span className="text-[11px]">Saved Locally</span>
              </div>

              {/* Google Sign-in Button */}
              <button
                onClick={handleGoogleClick}
                disabled={isSigningIn}
                onMouseEnter={() => HudAudio.playHover()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#F1F3F5] bg-[#15191F] hover:bg-[#1C222B] border border-[#2E3642] hover:border-[#22C7D9]/50 rounded-md shadow-xs transition-all duration-150"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Error Toast if present */}
      {authError && (
        <div className="bg-[#EF4444]/15 border-b border-[#EF4444]/30 px-6 py-2 flex items-center justify-between text-xs text-[#FCA5A5] animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-[#EF4444] shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={clearAuthError}
            className="p-1 text-[#FCA5A5] hover:text-[#FFFFFF]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Firebase Configuration Info Modal (When keys are not yet configured in .env) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="app-card p-6 max-w-md w-full border-[#323B46] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#22C7D9]">
                <ShieldCheck size={20} />
                <h3 className="text-sm font-semibold text-[#F1F3F5]">Google Cloud Sync Setup</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#9AA2AD] hover:text-[#F1F3F5] p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#9AA2AD] leading-relaxed">
              Google Cloud Sync allows you to synchronize your habits, daily goals, focus sessions, and journal reflections across any browser and device.
            </p>

            <div className="p-3 rounded-md bg-[#101318] border border-[#252B33] text-xs space-y-2 text-[#CBD5E1]">
              <div className="font-medium text-[#22C7D9]">Guest Access is Active:</div>
              <p className="text-[11px] text-[#9AA2AD]">
                Sign-in is completely optional! All your data is already auto-saved securely in your local browser storage.
              </p>
              <div className="font-medium text-[#22C7D9] pt-1">To enable Google Multi-Device Sync:</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#9AA2AD]">
                <li>Create a free project at <span className="text-[#22C7D9]">console.firebase.google.com</span></li>
                <li>Enable <span className="text-[#F1F3F5]">Authentication (Google)</span> &amp; <span className="text-[#F1F3F5]">Firestore Database</span></li>
                <li>Add your Firebase configuration keys to the <code className="bg-[#1A1F26] px-1 py-0.5 rounded text-[#22C7D9]">.env</code> file</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
