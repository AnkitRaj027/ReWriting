// Simplified Vocabulary Glossary translation database
export interface GlossaryTerms {
  profileLabel: string;
  profileStatus: string;
  habitsTitle: string;
  habitsSubtitle: string;
  focusTitle: string;
  focusSubtitle: string;
  goalsTitle: string;
  goalsSubtitle: string;
  vaultTitle: string;
  vaultSubtitle: string;
  analyticsTitle: string;
  analyticsSubtitle: string;
  diagnosticsTitle: string;
  diagnosticsSubtitle: string;
  terminalTitle: string;
  defragButton: string;
}

export type VocabularyMode = 'cyberpunk' | 'academic' | 'personal';

export const GLOSSARY: Record<VocabularyMode, GlossaryTerms> = {
  cyberpunk: {
    profileLabel: 'Hacker ID',
    profileStatus: 'System State',
    habitsTitle: 'Hack Routines',
    habitsSubtitle: 'Check daily compliance schedules.',
    focusTitle: 'Focus Chamber',
    focusSubtitle: 'Concentration countdown.',
    goalsTitle: 'Goal Directives',
    goalsSubtitle: 'Manage targets and checklist items.',
    vaultTitle: 'Mind Vault',
    vaultSubtitle: 'Journal logs, notes, and mood grid.',
    analyticsTitle: 'Performance Telemetry',
    analyticsSubtitle: 'Analyze habit consistency and focus hours.',
    diagnosticsTitle: 'System Logs',
    diagnosticsSubtitle: 'Rolling monitor feed of events.',
    terminalTitle: 'Command Shell',
    defragButton: 'Defragment Core'
  },
  academic: {
    profileLabel: 'Student Profile',
    profileStatus: 'Study Status',
    habitsTitle: 'Study Habits',
    habitsSubtitle: 'Track daily reading and class preparation.',
    focusTitle: 'Study Timer',
    focusSubtitle: 'Pomodoro countdown for school work.',
    goalsTitle: 'Projects & Exams',
    goalsSubtitle: 'Track study assignments and checkmarks.',
    vaultTitle: 'Study Journal',
    vaultSubtitle: 'Write reflection entries and notes.',
    analyticsTitle: 'Study Stats',
    analyticsSubtitle: 'Weekly progress and academic charts.',
    diagnosticsTitle: 'Event Feed',
    diagnosticsSubtitle: 'Activity list of achievements.',
    terminalTitle: 'Study Console',
    defragButton: 'Reset Study Data'
  },
  personal: {
    profileLabel: 'My Profile',
    profileStatus: 'My Status',
    habitsTitle: 'My Habits',
    habitsSubtitle: 'Check off daily habits to stay consistent.',
    focusTitle: 'My Timer',
    focusSubtitle: 'Concentrate on your tasks without distractions.',
    goalsTitle: 'My Goals',
    goalsSubtitle: 'Manage short term and long term targets.',
    vaultTitle: 'My Notebook & Journal',
    vaultSubtitle: 'Write reflections, store notes, and log energy.',
    analyticsTitle: 'My Statistics',
    analyticsSubtitle: 'Review focus logs and check-in rates.',
    diagnosticsTitle: 'Activity Logs',
    diagnosticsSubtitle: 'History log of daily events.',
    terminalTitle: 'Quick Console',
    defragButton: 'Reset Database'
  }
};

export function getTranslation(mode: VocabularyMode, key: keyof GlossaryTerms): string {
  const currentVocabulary = GLOSSARY[mode] || GLOSSARY.personal;
  return currentVocabulary[key];
}
