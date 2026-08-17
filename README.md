# 🌐 JavaCity: ReWriting & AI English Coach Classroom

JavaCity is a premium, gamified educational dashboard for mastering English grammar, writing registers, and conversational fluency. Powered by Next.js and the powerful **Mistral AI (`mistral-small-latest`)** LLM engine, it provides custom-tailored feedback loops and real-time syntax checking.

---

## 🚀 Features

### 1. 👩‍🏫 AI English Coach (Advanced Classroom)
A fully dynamic workspace containing nine advanced training modules that adapt instantly to user-defined topics:

*   **Grammar, Vocab & Idiom Core Quizzes**:
    *   *AI Synthesis*: Input any custom topic (e.g. *"Passive Voice"*, *"Aerospace Terms"*) to generate a custom 5-question multiple choice quiz deck.
    *   *🔄 Practice Similar Drill*: Instantly call the AI to generate a similar question to reinforce concepts.
    *   *✍️ Writing Sandbox*: Type a custom sentence applying the rule inside the feedback card to receive an inline syntax check.
*   **Teach Me a Topic**:
    *   Generates a 3-part structured curriculum (Concept Guide, Quiz, Writing Challenge) on any subject.
    *   *persistent Reference Sheet*: A split-column view displays the rules cheat sheet constantly on the left while you solve active quizzes on the right.
*   **Daily Essay Challenges**:
    *   *Standardized Slider Scorecard*: Evaluates essays based on **Coherence & Cohesion**, **Lexical Resource (Vocab)**, and **Grammatical Range**.
    *   *CEFR Grading*: Automatically outputs CEFR benchmark levels (A1, A2, B1, B2, C1, C2) alongside a natural rewrite of your text.
*   **Vocabulary Flashcards (3D-Flip)**:
    *   Decks generated in real-time matching study themes.
    *   *3D Rotation Animation*: Flip cards to reveal pronunciations, examples, and synonyms.
    *   *Test Me Sandbox*: Flip card into a sentence builder form to verify semantic and grammatical word usage.
*   **Free-Roam AI Roleplay (Gamified Sim)**:
    *   *Mood Temperaments*: Engage in conversation presets or custom roleplay topics with characters set to **Friendly**, **Neutral**, or **Stressed/Demanding** modes.
    *   *Live Satisfaction Bar*: A progress meter (0-100%) shifts based on the politeness of your inputs (e.g. modal auxiliary verbs) and spelling accuracy.
*   **Free Writing Practice**:
    *   *Tone Filters*: Choose between **Professional**, **Casual**, **Academic**, or **Creative** styles. Emily checks your spelling and rewrites the sentence to match that exact register.

### 2. ⚡ Focus Chamber (Gamification Hub)
*   **Pomodoro Timer**: Work intervals with integrated HUD audio warnings.
*   **XP Progress Engine**: Earn experience points for correct answers and completed lessons.
*   **Live Logger**: Dynamic terminal feed logging XP rewards, scenario status, and AI assessment alerts.

### 3. 🤖 Nexus AI
*   A responsive, human-like tutoring assistant proxy to ask general grammar questions, request translations, or practice general writing.

---

## 🛠️ Technology Stack
*   **Framework**: [Next.js](https://nextjs.org/) (App Router & Client/Server Node Modules)
*   **Styling**: Vanilla TailwindCSS & Custom 3D perspective transition utility tokens
*   **State Management**: React state hooks & custom Nexus State hooks
*   **Backend Node**: Mistral API Client proxy (`/api/chat`)
*   **Audio Core**: HTML5 Audio synthesizer context class

---

## ⚙️ Developer Setup

### 1. Prerequisites
Ensure you have Node.js (v18+) installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/AnkitRaj027/ReWriting.git
cd ReWriting
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (do not commit this to Git; `.gitignore` is pre-configured to keep it secure):
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the classroom dashboard.

### 6. Static Compilation Check
Verify the project compiles with no warnings or TypeScript errors:
```bash
npx tsc --noEmit
```
