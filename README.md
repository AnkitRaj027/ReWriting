# 🪐 JavaCity: Cybernetic Study Hub & AI English Coach

JavaCity is an immersive, cyber-aesthetic study station and AI English learning classroom built with **Next.js (App Router)**, **TailwindCSS**, and the **Mistral AI (`mistral-small-latest`)** LLM. It aggregates task management, progress journals, pomodoro tracking, and gamified AI language teaching into a unified retro-futuristic console.

---

## 🗺️ Application Architecture

### 1. 🎛️ Dashboard Core Components (`src/components/`)
*   **`MissionControl.tsx` (Landing Control)**: The main overview deck displaying real-time statistics (XP levels, study streak counts, productivity scores), project goals, quick links, and active tasks.
*   **`EnglishCoach.tsx` (AI Language Classroom)**: Upgraded advanced learning tracks containing custom curriculum synthesizers, CEFR grading metrics, tone filter rewrites, 3D flip vocab cards, and in-character roleplay simulations with live satisfaction meters.
*   **`FocusChamber.tsx` (Ambient Timer Core)**: Integrates customizable Pomodoro blocks, dynamic work-break loops, and system log console outputs.
*   **`CommandCenter.tsx` (Academic Planner)**: Interactive project and exam scheduler allowing you to track due dates, milestones, and task checklists.
*   **`MindVault.tsx` (Study Journals)**: Markdown-ready journal editor for daily logs, review sheets, and personal thought archives.
*   **`HabitsView.tsx` (Habituation Tracker)**: Grid visualization tracker for completing daily recurring habits (e.g. Code practice, Gym, Reading) with automatic streak tallies.
*   **`AIAssistant.tsx` (Rewire AI Chatbot)**: Conversational companion tutor powered by Mistral AI, ready to assist with programming questions, text translation, or writing critiques.
*   **`DiagnosticsPanel.tsx` (Diagnostics Board)**: Monitor active workspace indicators, API node latency, memory indicators, and simulated database status.
*   **`TerminalConsole.tsx` (Console logs)**: Custom logger printing real-time event updates, XP yields, timer notifications, and error warnings.

### 2. ⚡ Global State System (`src/hooks/`)
*   **`useNexusState.ts`**: Unified local-storage synchronized hook. It coordinates:
    *   Experience points (XP) calculations and user leveling formulas.
    *   Persistent lists for projects, exams, journals, habits, and console log archives.
    *   Activity logs mapping focus session metrics.

### 3. 🔊 System Utilities (`src/utils/`)
*   **`HudAudio.ts`**: Web Audio API player. Generates synthesizer sound alerts on-the-fly (with no static audio assets required) for:
    *   Dashboard navigation clicks
    *   Successful challenge bells
    *   Warning alerts/buzzers
    *   Startup engine animations
*   **`glossary.ts`**: Predefined static structures mapping core lists for study terms and descriptions.

---

## 🛠️ Technology Stack
*   **Framework**: [Next.js](https://nextjs.org/) (React, App Router)
*   **Styling**: Vanilla TailwindCSS & 3D rotation transition stylesheets
*   **Backend Node**: Next.js route handlers mapping to `/api/chat`
*   **AI Engine**: Mistral API Client Client (`mistral-small-latest`)
*   **Icons**: Lucide React
*   **Audio Core**: Synthesized HTML5 Web Audio Context API

---

## ⚙️ Developer Setup

### 1. Clone the Project
```bash
git clone https://github.com/AnkitRaj027/ReWriting.git
cd ReWriting
```

### 2. Configure Local Secrets
Create a `.env` file in the root directory (Git ignore rules are pre-configured to keep this private):
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 3. Install NPM Node Dependencies
```bash
npm install
```

### 4. Boot Dev Environment Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to load the console.

### 5. Static Validation Check
Compile and check the project for TypeScript type conflicts:
```bash
npx tsc --noEmit
```
