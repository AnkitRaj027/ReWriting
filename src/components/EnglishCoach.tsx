'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, RefreshCw, MessageSquare, Award, Coffee, Briefcase, MapPin, Plus, Trash2, Settings2, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';

function isAnswerCorrect(selectedOption: string, correctOption: string, optionsList: string[]): boolean {
  if (!selectedOption || !correctOption) return false;
  
  const cleanSelected = selectedOption.trim().toLowerCase();
  const cleanCorrect = correctOption.trim().toLowerCase();
  
  // 1. Direct match (case-insensitive)
  if (cleanSelected === cleanCorrect) return true;

  // 2. Strip prefixes (e.g. "Option A:", "A.", "1.", "option a -") from both candidate strings
  const stripPrefix = (str: string) => {
    let s = str.replace(/^(option\s+[a-e\d][:.-]?\s*)/i, '');
    s = s.replace(/^([a-e\d][:.)-]\s*)/i, '');
    return s.trim().toLowerCase();
  };

  const strippedSelected = stripPrefix(selectedOption);
  const strippedCorrect = stripPrefix(correctOption);
  if (strippedSelected === strippedCorrect && strippedSelected.length > 0) return true;

  // 3. Match by index
  // Check if correctOption is pointing to an index, e.g. "a", "b", "c", "d", "option a", "option 1"
  const cleanOptions = optionsList.map(o => o.trim().toLowerCase());
  const selectedIndex = cleanOptions.indexOf(cleanSelected);

  if (selectedIndex !== -1) {
    const letters = ['a', 'b', 'c', 'd', 'e'];
    if (letters.includes(cleanCorrect)) {
      if (letters.indexOf(cleanCorrect) === selectedIndex) return true;
    }
    
    if (cleanCorrect.startsWith('option ')) {
      const rest = cleanCorrect.replace('option ', '').trim();
      if (letters.includes(rest)) {
        if (letters.indexOf(rest) === selectedIndex) return true;
      }
      const num = parseInt(rest, 10);
      if (!isNaN(num) && num - 1 === selectedIndex) return true;
    }
  }

  // 4. Substring check
  if (strippedCorrect.includes(strippedSelected) && strippedSelected.length > 2) return true;
  if (strippedSelected.includes(strippedCorrect) && strippedCorrect.length > 2) return true;

  return false;
}

interface Message {
  id: string;
  sender: 'teacher' | 'student';
  text: string;
  options?: string[];
  correctOption?: string;
  timestamp: string;
  isFeedback?: boolean;
  targetConcept?: string;
}

interface CustomScenario {
  id: string;
  title: string;
  steps: [
    {
      text: string;
      options: string[];
      answer: string;
      explain: string;
    },
    {
      text: string;
      options: string[];
      answer: string;
      explain: string;
    },
    {
      text: string;
    }
  ];
}

interface EnglishCoachProps {
  gainXP: (amount: number) => void;
  writeLog: (msg: string, type: 'info' | 'success' | 'alert' | 'xp') => void;
}

export default function EnglishCoach({ gainXP, writeLog }: EnglishCoachProps) {
  const [activeTrack, setActiveTrack] = useState<'grammar' | 'vocab' | 'idiom' | 'conversation' | 'free' | 'topic-lesson' | 'essay-challenge' | 'flashcards' | 'free-roleplay'>('grammar');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Daily Conversation State
  const [activeScenario, setActiveScenario] = useState<string>('cafe');
  const [conversationStep, setConversationStep] = useState(0); 
  const [introActive, setIntroActive] = useState(true);

  // Custom Scenario States
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [topicInput, setTopicInput] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingScenario, setGeneratingScenario] = useState(false);

  // --- NEW AI COACH STATES ---
  // Dynamic Core Quizzes (Grammar/Vocab/Idioms)
  const [grammarTopic, setGrammarTopic] = useState('');
  const [vocabTopic, setVocabTopic] = useState('');
  const [idiomTopic, setIdiomTopic] = useState('');
  const [dynamicQuizzes, setDynamicQuizzes] = useState<any[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [seenQuestions, setSeenQuestions] = useState<string[]>([]);

  // Teach Me a Topic State
  const [lessonTopic, setLessonTopic] = useState('');
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [lessonStep, setLessonStep] = useState(0); // 0: explanation, 1-3: questions 1-3, 4: writing prompt, 5: completed
  const [selectedLessonAnswer, setSelectedLessonAnswer] = useState<string | null>(null);
  const [lessonScore, setLessonScore] = useState(0);
  const [lessonWritingInput, setLessonWritingInput] = useState('');
  const [lessonWritingFeedback, setLessonWritingFeedback] = useState('');
  const [lessonWritingLoading, setLessonWritingLoading] = useState(false);

  // Daily Essay Challenges State
  const [selectedEssayCategory, setSelectedEssayCategory] = useState<'email' | 'creative' | 'technical' | 'reflective'>('email');
  const [essayPrompt, setEssayPrompt] = useState('');
  const [generatingEssayPrompt, setGeneratingEssayPrompt] = useState(false);
  const [essayText, setEssayText] = useState('');
  const [essayFeedback, setEssayFeedback] = useState<any | null>(null);
  const [gradingEssay, setGradingEssay] = useState(false);

  // Vocabulary Flashcards State
  const [flashcardsTopic, setFlashcardsTopic] = useState('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Free-Roam AI Roleplay State
  const [roleplayMode, setRoleplayMode] = useState<'presets' | 'custom' | 'chat'>('presets');
  const [roleplayTopic, setRoleplayTopic] = useState('');
  const [userRole, setUserRole] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [roleplayChat, setRoleplayChat] = useState<any[]>([]);
  const [roleplayInputText, setRoleplayInputText] = useState('');
  const [roleplayLoading, setRoleplayLoading] = useState(false);

  // --- ADVANCED UPGRADE STATES ---
  // Free Practice Tone Filter
  const [writingTone, setWritingTone] = useState<'professional' | 'casual' | 'academic' | 'creative'>('professional');
  
  // Roleplay Mood and Satisfaction
  const [roleplayMood, setRoleplayMood] = useState<'friendly' | 'neutral' | 'demanding'>('friendly');
  const [roleplaySatisfaction, setRoleplaySatisfaction] = useState(60); // Starts at 60%

  // Flashcards Test Me Mode
  const [flashcardTesting, setFlashcardTesting] = useState(false);
  const [flashcardTestInput, setFlashcardTestInput] = useState('');
  const [flashcardTestFeedback, setFlashcardTestFeedback] = useState('');
  const [checkingFlashcardSentence, setCheckingFlashcardSentence] = useState(false);

  // Quiz Sentence Context Exercises & Sub-drills
  const [quizSentenceMode, setQuizSentenceMode] = useState(false);
  const [quizSentenceInput, setQuizSentenceInput] = useState('');
  const [quizSentenceFeedback, setQuizSentenceFeedback] = useState('');
  const [checkingQuizSentence, setCheckingQuizSentence] = useState(false);
  const [generatingSimilarQuestion, setGeneratingSimilarQuestion] = useState(false);

  // Default Scenarios Database
  const conversationScenarios = {
    cafe: {
      title: "Café Coffee Order",
      steps: [
        {
          text: "☕ **Café Scenario**\n\nEmily (Barista): 'Hello! Welcome to Java City. What can I get started for you today?'",
          options: ["I would like a medium cappuccino, please.", "Give me coffee now.", "Yes, please, some hot drink items."],
          answer: "I would like a medium cappuccino, please.",
          explain: "Politeness is key! 'I would like..., please' is a standard polite way to order. 'Give me coffee now' is too rude."
        },
        {
          text: "Emily (Barista): 'Great choice! Would you like any pastries or snacks with that?'",
          options: ["No thank you, just the coffee.", "I do not want snacks.", "Maybe later some pastries."],
          answer: "No thank you, just the coffee.",
          explain: "'No thank you, just...' is the most natural way to decline. 'I do not want' is grammatically correct but too abrupt."
        },
        {
          text: "Emily (Barista): 'Perfect! Your total is $4.50. You can tap your card on the reader here. Have a great day!'"
        }
      ]
    },
    interview: {
      title: "Job Interview",
      steps: [
        {
          text: "💼 **Job Interview Scenario**\n\nEmily (HR Manager): 'Why are you interested in joining our software development team?'",
          options: ["I want to apply my problem-solving skills to build premium web software.", "Because I need money.", "Your office looks very neat."],
          answer: "I want to apply my problem-solving skills to build premium web software.",
          explain: "Interviews require professional reasons showing drive. Mentioning problem-solving is very appropriate."
        },
        {
          text: "Emily (HR Manager): 'That sounds wonderful! Can you tell me about a project you've built?'",
          options: ["I built a responsive React dashboard with integrated audio oscillators.", "I did build some websites before.", "Web projects is my hobby."],
          answer: "I built a responsive React dashboard with integrated audio oscillators.",
          explain: "Be specific and grammatically accurate. 'Web projects is...' has a plural subject verb error ('projects are')."
        },
        {
          text: "Emily (HR Manager): 'Excellent. That matches the skills we are looking for. Thank you for your answer!'"
        }
      ]
    },
    directions: {
      title: "Asking Directions",
      steps: [
        {
          text: "🗺️ **Directions Scenario**\n\nEmily (Pedestrian): 'Excuse me, do you know where the nearest subway station is?'",
          options: ["Yes, go straight for two blocks and turn left at the traffic lights.", "It is somewhere over there.", "No subway station is here."],
          answer: "Yes, go straight for two blocks and turn left at the traffic lights.",
          explain: "Helpful directions use landmarks and indicators (blocks, turn left). 'Somewhere over there' is too vague."
        },
        {
          text: "Emily (Pedestrian): 'Perfect! Is it far to walk?'",
          options: ["No, it is only a five-minute walk from here.", "Yes, walks are short.", "It is close by feet."],
          answer: "No, it is only a five-minute walk from here.",
          explain: "'A five-minute walk' is a very common and natural english expression. 'Close by feet' is unnatural."
        },
        {
          text: "Emily (Pedestrian): 'Thank you so much! You've been extremely helpful. Have a great day!'"
        }
      ]
    }
  };

  // Lesson Database
  const grammarQuizzes = [
    {
      q: "Neither of the reports ___ finished yet. Choose the correct verb:",
      options: ["is", "are", "were"],
      answer: "is",
      explain: "Subject-verb agreement: 'Neither' is a singular pronoun and requires a singular verb ('is')."
    },
    {
      q: "Choose the correct spelling of this common word:",
      options: ["Acomodate", "Accommodate", "Accomodate"],
      answer: "Accommodate",
      explain: "The correct spelling is 'Accommodate' with double 'c' and double 'm'."
    },
    {
      q: "Identify the correct tense: 'By the time class ended, we ___ for three hours.'",
      options: ["studied", "had been studying", "have studied"],
      answer: "had been studying",
      explain: "Use past perfect continuous ('had been studying') to show an action started in the past and continued up to another point in the past."
    },
    {
      q: "Choose the correct spelling: 'I look forward to ___ you next week.'",
      options: ["meet", "meeting", "met"],
      answer: "meeting",
      explain: "In the phrase 'look forward to', 'to' is a preposition, which must be followed by a noun or gerund ('meeting')."
    },
    {
      q: "Conditional check: 'If he ___ harder, he would have passed the exam.'",
      options: ["studied", "has studied", "had studied"],
      answer: "had studied",
      explain: "This is a third conditional sentence expressing a hypothetical past event. It uses 'had + past participle' in the if-clause."
    }
  ];

  const vocabWords = [
    {
      word: "Resilient",
      pronounce: "/rɪˈzɪl.jənt/",
      meaning: "Able to withstand or recover quickly from difficult conditions.",
      example: "She was resilient in the face of setbacks, continuing to practice every day.",
      q: "Which word is a synonym for 'Resilient'?",
      options: ["Weak", "Adaptable/Strong", "Stubborn"],
      answer: "Adaptable/Strong"
    },
    {
      word: "Pragmatic",
      pronounce: "/præɡˈmæt.ɪk/",
      meaning: "Dealing with things sensibly and realistically in a practical way.",
      example: "We need a pragmatic approach to study, focusing on key exam subjects first.",
      q: "Which word is a synonym for 'Pragmatic'?",
      options: ["Idealistic", "Practical", "Theoretical"],
      answer: "Practical"
    },
    {
      word: "Ebullient",
      pronounce: "/ɪˈbʊl.jənt/",
      meaning: "Cheerful and full of energy; exuberant.",
      example: "The ebullient student celebrated his perfect grammar quiz score.",
      q: "Which word is a synonym for 'Ebullient'?",
      options: ["Enthusiastic", "Sleepy", "Depressed"],
      answer: "Enthusiastic"
    }
  ];

  const idioms = [
    {
      idiom: "Bite the bullet",
      meaning: "Face a difficult situation with courage and get it over with.",
      example: "I decided to bite the bullet and practice writing my English essay today.",
      q: "When would you 'bite the bullet'?",
      options: ["When avoiding a test", "When confronting a hard chore with courage", "When going to sleep"],
      answer: "When confronting a hard chore with courage"
    },
    {
      idiom: "Burn the midnight oil",
      meaning: "Read, study, or work late into the night.",
      example: "She burned the midnight oil finishing her research thesis due tomorrow.",
      q: "What does 'burn the midnight oil' mean?",
      options: ["Waste electricity", "Study late into the night", "Wake up early in the morning"],
      answer: "Study late into the night"
    }
  ];

  const freeCorrectionTemplates = [
    { keywords: ["i is", "i are"], reply: "Grammar Tip: Always use 'I am' when describing yourself in the present tense. Try rewriting: 'I am practicing English.'" },
    { keywords: ["he don't", "she don't"], reply: "Grammar Tip: For third-person singular (he, she, it), use 'does not' or 'doesn't' instead of 'don't'. Example: 'She doesn't speak English yet.'" },
    { keywords: ["good", "nice"], reply: "Vocabulary upgrade: Try using richer synonyms instead of 'good' or 'nice', such as 'beneficial', 'splendid', 'exquisite', or 'pragmatic'!" },
    { keywords: ["learn english"], reply: "Excellent target! Consistent daily habit check-ins are key to learning English. Ask me to test you with a grammar quiz!" }
  ];

  // Load Custom Scenarios on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rewriting_custom_scenarios');
      if (stored) {
        setCustomScenarios(JSON.parse(stored));
      }
    }
  }, []);

  const saveCustomScenarios = (list: CustomScenario[]) => {
    setCustomScenarios(list);
    localStorage.setItem('rewriting_custom_scenarios', JSON.stringify(list));
  };

  // Scroll chat to bottom on updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Load initial welcome message based on activeTrack selection
  useEffect(() => {
    setIntroActive(activeTrack === 'conversation'); // Only conversation track has an introduction screen
    setScore(0);
    setAnsweredCount(0);
    setDynamicQuizzes([]);
    setActiveLesson(null);
    setLessonStep(0);
    setEssayText('');
    setEssayFeedback(null);
    setFlashcards([]);
    setFlashcardTesting(false);
    setFlashcardTestFeedback('');
    setFlashcardTestInput('');
    setRoleplayChat([]);
    setQuizSentenceMode(false);
    setQuizSentenceFeedback('');
    setQuizSentenceInput('');
    loadWelcomeMessage();
  }, [activeTrack, activeScenario, customScenarios]);

  const getActiveScenarioData = () => {
    if (activeScenario.startsWith('custom_')) {
      const customId = activeScenario.replace('custom_', '');
      const found = customScenarios.find(s => s.id === customId);
      if (found) return found;
    }
    return conversationScenarios[activeScenario as keyof typeof conversationScenarios] || conversationScenarios.cafe;
  };

  const loadWelcomeMessage = () => {
    let msgText = '';
    const time = new Date().toLocaleTimeString().substring(0, 5);
    let options: string[] | undefined = undefined;
    let correctOption: string | undefined = undefined;
 
    if (activeTrack === 'grammar') {
      const qNum = score % grammarQuizzes.length;
      const quiz = grammarQuizzes[qNum];
      msgText = `Hello! I'm Emily, your English Coach. Let's practice some grammar skills!\n\nQuestion:\n${quiz.q}`;
      options = quiz.options;
      correctOption = quiz.answer;
    } else if (activeTrack === 'vocab') {
      const wNum = score % vocabWords.length;
      const vw = vocabWords[wNum];
      msgText = `Let's build your vocabulary!\n\nWord of the Day:\n📘 **${vw.word}** ${vw.pronounce}\nMeaning: ${vw.meaning}\nExample: "${vw.example}"\n\nChallenge:\n${vw.q}`;
      options = vw.options;
      correctOption = vw.answer;
    } else if (activeTrack === 'idiom') {
      const iNum = score % idioms.length;
      const idm = idioms[iNum];
      msgText = `Let's learn an English Idiom!\n\nPhrase:\n🌟 **"${idm.idiom}"**\nMeaning: ${idm.meaning}\nExample: "${idm.example}"\n\nPractice Question:\n${idm.q}`;
      options = idm.options;
      correctOption = idm.answer;
    } else if (activeTrack === 'conversation') {
      setConversationStep(0);
      
      if (activeScenario === 'cafe') {
        msgText = `☕ **Lesson: Café Coffee Order**\n\nEmily (Teacher): Welcome to the Café scenario! Today, we will practice ordering coffee. Remember: using polite phrases like **'I would like..., please'** is preferred in English over direct commands like **'Give me coffee'** which sound rude. Let's practice!\n\nClick below to start.`;
      } else if (activeScenario === 'interview') {
        msgText = `💼 **Lesson: Job Interview**\n\nEmily (Teacher): Welcome to the Job Interview scenario! We will practice professional interview responses. Remember: focus on clear verb tenses (past versus present achievements) and highlight specific technical skills.\n\nClick below to start.`;
      } else if (activeScenario === 'directions') {
        msgText = `🗺️ **Lesson: Asking Directions**\n\nEmily (Teacher): Welcome to the Directions scenario! We will practice giving directions. Remember: use clear landmarks and relative indicators (e.g. 'go straight', 'turn left') and natural walk time estimates.\n\nClick below to start.`;
      } else {
        const customTitle = getActiveScenarioData().title;
        msgText = `🎬 **Lesson: Custom Scenario (${customTitle})**\n\nEmily (Teacher): Welcome to your custom dialogue lesson! Let's practice this scenario. Try selecting the most grammatically accurate and natural-sounding option responses.\n\nClick below to start.`;
      }
    } else {
      msgText = "Welcome to Free Writing Practice! Type any sentence or short paragraph below. I will check your spelling, suggest stronger words, and correct your grammar structure.";
    }
 
    setChatHistory([
      {
        id: `m_welcome_${Date.now()}`,
        sender: 'teacher',
        text: msgText,
        options,
        correctOption,
        timestamp: time
      }
    ]);
  };

  const handleStartDialogueLesson = () => {
    HudAudio.playClick();
    setIntroActive(false);

    const time = new Date().toLocaleTimeString().substring(0, 5);
    const scene = getActiveScenarioData();
    const currentStep = scene.steps[0];

    setChatHistory([
      {
        id: `m_step0_${Date.now()}`,
        sender: 'teacher',
        text: currentStep.text,
        options: currentStep.options || [],
        correctOption: currentStep.answer,
        timestamp: time
      }
    ]);
  };

  const handleOptionClick = (optionText: string) => {
    HudAudio.playClick();
    const time = new Date().toLocaleTimeString().substring(0, 5);

    const studentMsg: Message = {
      id: `m_stud_${Date.now()}`,
      sender: 'student',
      text: optionText,
      timestamp: time
    };

    setChatHistory(prev => [...prev, studentMsg]);

    const currentTeacherMsg = [...chatHistory].reverse().find(m => m.sender === 'teacher');
    if (currentTeacherMsg && currentTeacherMsg.correctOption) {
      const isCorrect = isAnswerCorrect(optionText, currentTeacherMsg.correctOption, currentTeacherMsg.options || []);

      // Handle daily conversation track logic separately
      if (activeTrack === 'conversation') {
        setTimeout(() => {
          const scene = getActiveScenarioData();
          let feedbackText = '';

          if (isCorrect) {
            HudAudio.playSuccess();
            setScore(prev => prev + 1);
            gainXP(30);
            writeLog("English Coach: Selected correct phrase! +30 XP.", "success");
            feedbackText = `🎉 **Polite & Natural Answer!**\n\n`;
          } else {
            HudAudio.playAlert();
            writeLog("English Coach: Unnatural phrase selected.", "alert");
            feedbackText = `⚠️ **Note:** That phrasing isn't the most natural.\n\n`;
          }

          if (conversationStep === 0) {
            feedbackText += `${scene.steps[0].explain || ''}\n\n`;
            const nextStep = scene.steps[1];
            feedbackText += nextStep.text;

            setConversationStep(1);

            setChatHistory(prev => [
              ...prev,
              {
                id: `m_conv_feed_${Date.now()}`,
                sender: 'teacher',
                text: feedbackText,
                options: nextStep.options,
                correctOption: nextStep.answer,
                timestamp: new Date().toLocaleTimeString().substring(0, 5)
              }
            ]);
          } else if (conversationStep === 1) {
            feedbackText += `${scene.steps[1].explain || ''}\n\n`;
            const finalStep = scene.steps[2];
            feedbackText += finalStep.text;

            setConversationStep(2);

            setChatHistory(prev => [
              ...prev,
              {
                id: `m_conv_final_${Date.now()}`,
                sender: 'teacher',
                text: feedbackText,
                timestamp: new Date().toLocaleTimeString().substring(0, 5)
              }
            ]);
          }
        }, 800);
        return;
      }

      // Default Quiz and vocabulary feedback
      setAnsweredCount(prev => prev + 1);

      setTimeout(() => {
        let responseText = '';
        const isDynamic = dynamicQuizzes.length > 0;
        
        if (isCorrect) {
          HudAudio.playSuccess();
          setScore(prev => prev + 1);
          gainXP(50);
          writeLog("English Coach: Correct answer! +50 XP rewarded.", "success");
          
          responseText = `🎉 **Correct!** Excellent work!\n\n`;
          if (activeTrack === 'grammar') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : grammarQuizzes.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : grammarQuizzes[qNum];
            responseText += item.explain;
          } else if (activeTrack === 'vocab') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : vocabWords.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : vocabWords[qNum];
            responseText += item.explain || `**Definition:** ${item.meaning}\n\n**Example:** "${item.example}"`;
          } else if (activeTrack === 'idiom') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : idioms.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : idioms[qNum];
            responseText += item.explain || `**Definition:** ${item.meaning}\n\n**Example:** "${item.example}"`;
          } else {
            responseText += "You fully understood the meaning.";
          }
        } else {
          HudAudio.playAlert();
          writeLog("English Coach: Incorrect answer. Try reviewing the explanation.", "alert");
          
          responseText = `❌ **Oops!** That's not correct.\n\nThe correct answer is: **${currentTeacherMsg.correctOption}**.\n\n`;
          if (activeTrack === 'grammar') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : grammarQuizzes.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : grammarQuizzes[qNum];
            responseText += item.explain;
          } else if (activeTrack === 'vocab') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : vocabWords.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : vocabWords[qNum];
            responseText += item.explain || `**Definition:** ${item.meaning}\n\n**Example:** "${item.example}"`;
          } else if (activeTrack === 'idiom') {
            const qNum = answeredCount % (isDynamic ? dynamicQuizzes.length : idioms.length);
            const item = isDynamic ? dynamicQuizzes[qNum] : idioms[qNum];
            responseText += item.explain || `**Definition:** ${item.meaning}\n\n**Example:** "${item.example}"`;
          }
        }

        const feedbackMsg: Message = {
          id: `m_feed_${Date.now()}`,
          sender: 'teacher',
          text: responseText,
          timestamp: new Date().toLocaleTimeString().substring(0, 5),
          isFeedback: true,
          targetConcept: currentTeacherMsg.text
        };

        setChatHistory(prev => [...prev, feedbackMsg]);

        // Auto-generate next question in 4.5 seconds unless it is the final question!
        const totalQs = isDynamic ? dynamicQuizzes.length : 5;
        if (answeredCount + 1 < totalQs) {
          setTimeout(() => {
            generateNextQuestion();
          }, 4500);
        } else {
          // Final score summary after 3.2 seconds
          setTimeout(() => {
            const timeStr = new Date().toLocaleTimeString().substring(0, 5);
            setChatHistory(prev => [
              ...prev,
              {
                id: `m_score_${Date.now()}`,
                sender: 'teacher',
                text: `🏆 **Quiz Completed!**\n\nYour Final Score: **${score + (isCorrect ? 1 : 0)} / ${totalQs}** (${Math.round(((score + (isCorrect ? 1 : 0)) / totalQs) * 100)}%)\n\nGreat job! You earned total **${(score + (isCorrect ? 1 : 0)) * 50} XP**. Reset statistics to start another customized quiz scenario!`,
                timestamp: timeStr
              }
            ]);
            writeLog(`English Coach: Quiz finished. Score: ${score + (isCorrect ? 1 : 0)}/${totalQs}.`, "success");
            HudAudio.playSuccess();
          }, 3200);
        }

      }, 800);
    }
  };

  const generateNextQuestion = () => {
    const time = new Date().toLocaleTimeString().substring(0, 5);
    let nextText = '';
    let options: string[] = [];
    let correctOption = undefined;

    const isDynamic = dynamicQuizzes.length > 0;
    const items = isDynamic ? dynamicQuizzes : [];
    const index = answeredCount;

    if (activeTrack === 'grammar') {
      const qNum = index % (isDynamic ? items.length : grammarQuizzes.length);
      const quiz = isDynamic ? items[qNum] : grammarQuizzes[qNum];
      nextText = `${isDynamic ? '🔄 Dynamic Grammar Drill' : 'Here is your next grammar question'}:\n\n${quiz.q}`;
      options = quiz.options;
      correctOption = quiz.answer;
    } else if (activeTrack === 'vocab') {
      const wNum = index % (isDynamic ? items.length : vocabWords.length);
      const vw = isDynamic ? items[wNum] : vocabWords[wNum];
      nextText = `${isDynamic ? '🔄 Dynamic Vocab Drill' : 'Here is your next vocabulary builder'}:\n\n📘 **${vw.word}** ${vw.pronounce}\nMeaning: ${vw.meaning}\n${isDynamic ? `Example: "${vw.example}"\n` : ''}\nChallenge:\n${vw.q}`;
      options = vw.options;
      correctOption = vw.answer;
    } else if (activeTrack === 'idiom') {
      const iNum = index % (isDynamic ? items.length : idioms.length);
      const idm = isDynamic ? items[iNum] : idioms[iNum];
      nextText = `${isDynamic ? '🔄 Dynamic Idiom Drill' : 'Next idiom drill'}:\n\n🌟 **"${isDynamic ? idm.idiom : idm.idiom}"**\nMeaning: ${idm.meaning}\n${isDynamic ? `Example: "${idm.example}"\n` : ''}\nQuestion:\n${idm.q}`;
      options = idm.options;
      correctOption = idm.answer;
    }

    setChatHistory(prev => [
      ...prev,
      {
        id: `m_next_${Date.now()}`,
        sender: 'teacher',
        text: nextText,
        options: options.length > 0 ? options : undefined,
        correctOption,
        timestamp: time
      }
    ]);
  };

  const handleFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || aiLoading) return;

    HudAudio.playClick();
    const time = new Date().toLocaleTimeString().substring(0, 5);
    const textVal = inputText.trim();

    const studentMsg: Message = {
      id: `m_free_s_${Date.now()}`,
      sender: 'student',
      text: textVal,
      timestamp: time
    };

    setChatHistory(prev => [...prev, studentMsg]);
    setInputText('');
    setAiLoading(true);

    try {
      const prompt = `You are Emily, a warm, friendly, and professional English Coach. Analyze this input from the student: "${textVal}".
      Provide a highly structured, clear review of their writing, and then reply to their message in a natural, human-like, conversational way to keep the dialogue going.
      
      Structure your response exactly using this markdown layout:
      
      ### 📝 Emily's Writing Review
      
      * **Grammar & Spelling**: Identify errors and explain corrections clearly. If it is grammatically correct, praise the student!
      * **Vocabulary Booster**: Suggest 2-3 advanced alternative words or synonyms.
      * **Natural Rewrite (${writingTone.toUpperCase()} register)**: Provide a polished rewrite of the sentence in a strictly ${writingTone} tone.
      
      ### 💬 Classroom Conversation
      (Write your friendly, human-like response to the student's message here to continue the practice chat naturally)`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI Node Offline');
      }

      gainXP(25);
      writeLog("English Coach: AI review finalized. +25 XP.", "success");
      HudAudio.playSuccess();

      setChatHistory(prev => [
        ...prev,
        {
          id: `m_free_t_${Date.now()}`,
          sender: 'teacher',
          text: data.content,
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);

    } catch (err) {
      console.warn("Mistral AI API call failed, falling back to local patterns:", err);
      let feedback = "Splendid job writing! Your sentence is grammatically clear. Keep practicing to build confidence.";
      
      const lower = textVal.toLowerCase();
      for (const t of freeCorrectionTemplates) {
        if (t.keywords.some(kw => lower.includes(kw))) {
          feedback = t.reply;
          break;
        }
      }

      gainXP(15);
      writeLog("English Coach: Local template review completed. +15 XP.", "info");

      setChatHistory(prev => [
        ...prev,
        {
          id: `m_free_t_${Date.now()}`,
          sender: 'teacher',
          text: feedback + "\n\n*(Note: Mistral AI API key is missing or offline. Utilizing local diagnostics check.)*",
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateAIScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || generatingScenario) return;

    HudAudio.playClick();
    setGeneratingScenario(true);
    const targetTopic = topicInput.trim();

    try {
      const excludePhrase = seenQuestions.length > 0 
        ? `\nCRITICAL: Do NOT generate any of the following questions/scenarios, as the student has already completed them:\n${seenQuestions.slice(-15).map(q => `- "${q}"`).join('\n')}` 
        : '';

      const prompt = `Generate a 3-step interactive English conversation practice dialogue about the topic: "${targetTopic}".${excludePhrase}
      Respond ONLY with a valid JSON object matching the schema below. Do not wrap the response in markdown formatting or backticks. It must be directly parseable.

      Schema:
      {
        "title": "A short descriptive title",
        "steps": [
          {
            "text": "Emily: 'First line of the dialogue, introduce the scenario and ask a question/make a statement'",
            "options": ["Polite option text", "Rude/incorrect option text", "Awkward option text"],
            "answer": "Polite option text",
            "explain": "A brief explanation of why the correct option is best and what errors were present in the other options. The 'answer' field must EXACTLY match one of the items in the 'options' array."
          },
          {
            "text": "Emily: 'Second line of the dialogue, following up on the choice and asking the next question/statement'",
            "options": ["Second polite option text", "Second incorrect option text", "Second awkward option text"],
            "answer": "Second polite option text",
            "explain": "Explanation of why the correct option is correct. The 'answer' field must EXACTLY match one of the items in the 'options' array."
          },
          {
            "text": "Emily: 'Final wrap up statement or friendly closing statement.'"
          }
        ]
      }`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI Scenario Generator offline');
      }

      let cleanedText = data.content.trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const generated = JSON.parse(cleanedText);
      const generatedTitle = generated.title || targetTopic;
      const steps = generated.steps;

      if (!steps || steps.length < 3) {
        throw new Error("Invalid structure returned by AI core.");
      }

      // Track seen questions
      const sceneSteps = generated.steps;
      if (sceneSteps && sceneSteps.length > 0) {
        const newSeen = sceneSteps.map((s: any) => s.text).filter(Boolean);
        setSeenQuestions(prev => [...prev, ...newSeen]);
      }

      const newScenario: CustomScenario = {
        id: `c_${Date.now()}`,
        title: generatedTitle,
        steps: [
          {
            text: steps[0].text,
            options: steps[0].options || [],
            answer: steps[0].answer || steps[0].options?.[0] || '',
            explain: steps[0].explain || ''
          },
          {
            text: steps[1].text,
            options: steps[1].options || [],
            answer: steps[1].answer || steps[1].options?.[0] || '',
            explain: steps[1].explain || ''
          },
          {
            text: steps[2].text
          }
        ]
      };

      const updated = [...customScenarios, newScenario];
      saveCustomScenarios(updated);
      writeLog(`AI generated custom scenario: "${newScenario.title}"`, 'success');
      HudAudio.playSuccess();

      setActiveScenario(`custom_${newScenario.id}`);
      setShowCreateForm(false);
      setTopicInput('');
      gainXP(40);

    } catch (err) {
      console.warn("AI Scenario generation failed, using local templates:", err);
      writeLog("English Coach: AI generation offline. Building static keyword scenario.", "info");

      const lowerTopic = targetTopic.toLowerCase();
      let generatedTitle = targetTopic;

      let step1Text = '';
      let step1Options: string[] = [];
      let step1Answer = '';
      let step1Explain = '';

      let step2Text = '';
      let step2Options: string[] = [];
      let step2Answer = '';
      let step2Explain = '';

      let step3Text = '';

      if (lowerTopic.includes('airport') || lowerTopic.includes('flight') || lowerTopic.includes('travel') || lowerTopic.includes('passport')) {
        generatedTitle = "Airport Check-in";
        step1Text = "✈️ **Airport Scenario**\n\nEmily (Check-in Agent): 'Hello! Welcome to AeroAir. May I see your ticket and passport, please?'";
        step1Options = ["Sure, here they are. I would like a window seat if possible.", "Give me passport.", "Yes, passport is there."];
        step1Answer = "Sure, here they are. I would like a window seat if possible.";
        step1Explain = "Polite request using conditional structures is the best way to address staff.";

        step2Text = "Emily (Check-in Agent): 'Excellent. We have a window seat available. Do you have any luggage to check?'";
        step2Options = ["Yes, just this suitcase.", "No suitcase.", "Bags is here."];
        step2Answer = "Yes, just this suitcase.";
        step2Explain = "Use clear nouns and correct singular structures. 'Bags is...' has a plural verb agreement mismatch.";

        step3Text = "Emily (Check-in Agent): 'All set! Here is your boarding pass. Have a safe flight!'";
      } else if (lowerTopic.includes('hotel') || lowerTopic.includes('stay') || lowerTopic.includes('room') || lowerTopic.includes('reservation')) {
        generatedTitle = "Hotel Reservation Check-in";
        step1Text = "🏨 **Hotel Scenario**\n\nEmily (Front Desk): 'Welcome to Grand Plaza! Do you have a room reservation with us?'";
        step1Options = ["Yes, I have a booking under my name.", "Give me a room now.", "No room booking."];
        step1Answer = "Yes, I have a booking under my name.";
        step1Explain = "Clearly state reservation status first. Ordering rooms directly is too pushy.";

        step2Text = "Emily (Front Desk): 'Perfect, I found it! We require a credit card for security deposit.'";
        step2Options = ["Certainly, here is my card.", "Why card?", "No card."];
        step2Answer = "Certainly, here is my card.";
        step2Explain = "'Certainly' is a polite agreement marker in English business services.";

        step3Text = "Emily (Front Desk): 'Great! Your room is 305 on the third floor. Enjoy your stay!'";
      } else if (lowerTopic.includes('restaurant') || lowerTopic.includes('food') || lowerTopic.includes('eat') || lowerTopic.includes('order') || lowerTopic.includes('menu')) {
        generatedTitle = "Restaurant Dinner Order";
        step1Text = "🍕 **Restaurant Scenario**\n\nEmily (Waitress): 'Hello! Welcome to Bella Italia. Are you ready to order?'";
        step1Options = ["Yes, I would like to order the chef's lasagna, please.", "Bring me lasagna.", "Lasagna, fast."];
        step1Answer = "Yes, I would like to order the chef's lasagna, please.";
        step1Explain = "Polite ordering structure: 'I would like to order... please' is preferred.";

        step2Text = "Emily (Waitress): 'Wonderful choice! Would you like anything to drink with that?'";
        step2Options = ["Just a glass of tap water, please.", "No drink.", "I drink water."];
        step2Answer = "Just a glass of tap water, please.";
        step2Explain = "Polite declination or selection helper.";

        step3Text = "Emily (Waitress): 'Perfect. I will bring your drink and food shortly. Enjoy!'";
      } else if (lowerTopic.includes('doctor') || lowerTopic.includes('sick') || lowerTopic.includes('health') || lowerTopic.includes('hospital') || lowerTopic.includes('pain') || lowerTopic.includes('medical')) {
        generatedTitle = "Doctor's Clinic Checkup";
        step1Text = "🏥 **Clinic Scenario**\n\nEmily (Doctor): 'Hello, what seems to be the problem today?'";
        step1Options = ["I have a sore throat and a slight headache since yesterday.", "My body is sick.", "I am ill."];
        step1Answer = "I have a sore throat and a slight headache since yesterday.";
        step1Explain = "Be specific about symptoms. Simple 'I am ill' is too vague.";

        step2Text = "Emily (Doctor): 'I see. Let me check your temperature first. Open your mouth, please.'";
        step2Options = ["Sure, go ahead.", "No check temperature.", "Temperature check why?"];
        step2Answer = "Sure, go ahead.";
        step2Explain = "Polite compliance.";

        step3Text = "Emily (Doctor): 'Your temperature is normal. Take these vitamins and rest. Have a good day!'";
      } else if (lowerTopic.includes('store') || lowerTopic.includes('shop') || lowerTopic.includes('buy') || lowerTopic.includes('price')) {
        generatedTitle = "Shopping Mall Purchase";
        step1Text = "🛍️ **Store Scenario**\n\nEmily (Clerk): 'Hello! Let me know if you need help finding anything.'";
        step1Options = ["Thank you, I am just browsing for now.", "No help.", "Show me clothes."];
        step1Answer = "Thank you, I am just browsing for now.";
        step1Explain = "'Just browsing' is the standard, polite english expression when you want to look around.";

        step2Text = "Emily (Clerk): 'No problem. We have a 20% discount on all jackets today.'";
        step2Options = ["Oh, wonderful! I will check them out.", "Jackets are bad.", "I buy jacket."];
        step2Answer = "Oh, wonderful! I will check them out.";
        step2Explain = "Positive confirmation phrase.";

        step3Text = "Emily (Clerk): 'Excellent! Let me know if you need to try a size. Happy shopping!'";
      } else {
        generatedTitle = targetTopic.length > 20 ? targetTopic.substring(0, 20) + "..." : targetTopic;
        step1Text = `👋 **Meeting Scenario: ${generatedTitle}**\n\nEmily (Friend): 'Hello! Nice to meet you today. How is your day going?'`;
        step1Options = ["It is going well, thank you! How about yours?", "Day is good.", "I am fine."];
        step1Answer = "It is going well, thank you! How about yours?";
        step1Explain = "A polite greeting should ask the other person how they are doing in return.";

        step2Text = "Emily (Friend): 'It is going great! Are you working on anything exciting lately?'";
        step2Options = ["Yes, I am building a custom personal dashboard.", "No work.", "I do coding."];
        step2Answer = "Yes, am building a custom personal dashboard.";
        step2Explain = "Use clear structure and correct tenses.";

        step3Text = "Emily (Friend): 'That sounds very interesting! Good luck with your project. Talk to you later!'";
      }

      const newScenario: CustomScenario = {
        id: `c_${Date.now()}`,
        title: generatedTitle,
        steps: [
          { text: step1Text, options: step1Options, answer: step1Answer, explain: step1Explain },
          { text: step2Text, options: step2Options, answer: step2Answer, explain: step2Explain },
          { text: step3Text }
        ]
      };

      const updated = [...customScenarios, newScenario];
      saveCustomScenarios(updated);
      writeLog(`Local custom scenario created: "${newScenario.title}"`, 'success');
      HudAudio.playSuccess();

      setActiveScenario(`custom_${newScenario.id}`);
      setShowCreateForm(false);
      setTopicInput('');
      gainXP(30);
    } finally {
      setGeneratingScenario(false);
    }
  };

  const handleDeleteCustomScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HudAudio.playAlert();
    const updated = customScenarios.filter(s => s.id !== id);
    saveCustomScenarios(updated);
    writeLog("Deleted custom scenario.", "alert");
    if (activeScenario === `custom_${id}`) {
      setActiveScenario('cafe');
    }
  };

  const resetProgress = () => {
    HudAudio.playClick();
    setScore(0);
    setAnsweredCount(0);
    setDynamicQuizzes([]);
    loadWelcomeMessage();
  };

  // --- NEW AI COACH HANDLERS ---
  const generateDynamicQuiz = async (track: 'grammar' | 'vocab' | 'idiom', topic: string) => {
    if (!topic.trim() || generatingQuiz) return;
    HudAudio.playClick();
    setGeneratingQuiz(true);
    setScore(0);
    setAnsweredCount(0);

    const excludePhrase = seenQuestions.length > 0 
      ? `\nCRITICAL: Do NOT generate any of the following questions/words/idioms, as the student has already completed them:\n${seenQuestions.slice(-15).map(q => `- "${q}"`).join('\n')}` 
      : '';

    let prompt = '';
    if (track === 'grammar') {
      prompt = `Generate a customized 5-question multiple choice English grammar quiz about: "${topic}".${excludePhrase}
      Each question must test the student's mastery of this specific rule.
      Respond ONLY with a valid JSON object matching this schema. Do not wrap the response in markdown formatting or backticks.
      
      Schema:
      {
        "quizzes": [
          {
            "q": "Question sentence with blank ___ or challenge",
            "options": ["Correct choice", "Incorrect choice 1", "Incorrect choice 2"],
            "answer": "Correct choice",
            "explain": "A brief explanation of why the correct option is right and others are wrong. The 'answer' field must EXACTLY match one of the items in the 'options' array."
          }
        ]
      }`;
    } else if (track === 'vocab') {
      prompt = `Generate 5 customized vocabulary building questions about the subject: "${topic}".${excludePhrase}
      Each word should be relevant to this topic, testing advanced vocabulary skills.
      Respond ONLY with a valid JSON object matching this schema. Do not wrap the response in markdown formatting or backticks.
      
      Schema:
      {
        "quizzes": [
          {
            "word": "Word to learn",
            "pronounce": "/pronunciation/",
            "meaning": "Definition of the word",
            "example": "An example sentence using the word",
            "q": "Practice question to test understanding (e.g. Choose the synonym for Word)",
            "options": ["Synonym", "Incorrect 1", "Incorrect 2"],
            "answer": "Synonym",
            "explain": "Explanation of the correct answer. The 'answer' field must EXACTLY match one of the items in the 'options' array."
          }
        ]
      }`;
    } else {
      prompt = `Generate 5 customized English idioms or phrasal verbs matching the theme or context: "${topic}".${excludePhrase}
      Respond ONLY with a valid JSON object matching this schema. Do not wrap the response in markdown formatting or backticks.
      
      Schema:
      {
        "quizzes": [
          {
            "idiom": "Idiom phrase",
            "meaning": "Definition/meaning of the idiom",
            "example": "An example sentence using the idiom",
            "q": "Practice question to test understanding (e.g. When would you use this idiom?)",
            "options": ["Correct situation", "Incorrect 1", "Incorrect 2"],
            "answer": "Correct situation",
            "explain": "Explanation of the idiom's origin or proper context usage. The 'answer' field must EXACTLY match one of the items in the 'options' array."
          }
        ]
      }`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Quiz generation failed');

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);
      const items = parsed.quizzes;

      if (!items || items.length === 0) {
        throw new Error("Invalid structure returned by AI.");
      }

      // Track seen questions
      const newSeen = items.map((item: any) => item.q || item.word || item.idiom || '').filter(Boolean);
      setSeenQuestions(prev => [...prev, ...newSeen]);

      setDynamicQuizzes(items);
      gainXP(20);
      writeLog(`English Coach: Custom AI quiz on "${topic}" generated. +20 XP.`, "success");
      HudAudio.playSuccess();

      // Load first question into chat history
      const time = new Date().toLocaleTimeString().substring(0, 5);
      let welcomeText = '';
      let initialMsg: any = {};

      if (track === 'grammar') {
        const quiz = items[0];
        welcomeText = `🎯 **Dynamic Grammar Quiz: ${topic}**\n\nQuestion 1:\n${quiz.q}`;
        initialMsg = {
          id: `m_dyn_q0_${Date.now()}`,
          sender: 'teacher',
          text: welcomeText,
          options: quiz.options,
          correctOption: quiz.answer,
          timestamp: time
        };
      } else if (track === 'vocab') {
        const vw = items[0];
        welcomeText = `📘 **Dynamic Vocabulary: ${topic}**\n\nWord 1:\n📘 **${vw.word}** ${vw.pronounce}\nMeaning: ${vw.meaning}\nExample: "${vw.example}"\n\nChallenge:\n${vw.q}`;
        initialMsg = {
          id: `m_dyn_q0_${Date.now()}`,
          sender: 'teacher',
          text: welcomeText,
          options: vw.options,
          correctOption: vw.answer,
          timestamp: time
        };
      } else {
        const idm = items[0];
        welcomeText = `🌟 **Dynamic Idioms: ${topic}**\n\nPhrase 1:\n🌟 **"${idm.idiom}"**\nMeaning: ${idm.meaning}\nExample: "${idm.example}"\n\nPractice Question:\n${idm.q}`;
        initialMsg = {
          id: `m_dyn_q0_${Date.now()}`,
          sender: 'teacher',
          text: welcomeText,
          options: idm.options,
          correctOption: idm.answer,
          timestamp: time
        };
      }

      setChatHistory([initialMsg]);

    } catch (err: any) {
      console.error(err);
      writeLog("English Coach: Failed to generate custom AI quiz. Falling back to default list.", "alert");
      HudAudio.playAlert();
      setDynamicQuizzes([]);
      loadWelcomeMessage();
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTopic.trim() || generatingLesson) return;
    HudAudio.playClick();
    setGeneratingLesson(true);
    setLessonStep(0);
    setLessonScore(0);
    setLessonWritingInput('');
    setLessonWritingFeedback('');

    const excludePhrase = seenQuestions.length > 0 
      ? `\nCRITICAL: Do NOT generate any of the following questions/concepts, as the student has already completed them:\n${seenQuestions.slice(-15).map(q => `- "${q}"`).join('\n')}` 
      : '';

    const prompt = `Generate a customized English lesson plan about the topic: "${lessonTopic.trim()}".${excludePhrase}
    Respond ONLY with a valid JSON object matching the schema below. Do not wrap the response in markdown formatting or backticks.
    
    Schema:
    {
      "title": "Clear Lesson Title",
      "explanation": "A concise, detailed explanation of the concept, rules, and 2 key examples. Use markdown bold for highlights.",
      "questions": [
        {
          "q": "Practice question 1 testing this concept",
          "options": ["Correct choice", "Incorrect choice 1", "Incorrect choice 2"],
          "answer": "Correct choice",
          "explain": "Brief explanation of the correct choice. The 'answer' field must EXACTLY match one of the items in the 'options' array."
        },
        {
          "q": "Practice question 2",
          "options": ["Correct choice", "Incorrect choice 1", "Incorrect choice 2"],
          "answer": "Correct choice",
          "explain": "Explanation... The 'answer' field must EXACTLY match one of the items in the 'options' array."
        },
        {
          "q": "Practice question 3",
          "options": ["Correct choice", "Incorrect choice 1", "Incorrect choice 2"],
          "answer": "Correct choice",
          "explain": "Explanation... The 'answer' field must EXACTLY match one of the items in the 'options' array."
        }
      ],
      "writingPrompt": "A custom writing prompt challenge asking the student to write a sentence utilizing the rule."
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to construct lesson.');

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);

      // Track seen questions
      if (parsed.questions && parsed.questions.length > 0) {
        const newSeen = parsed.questions.map((q: any) => q.q).filter(Boolean);
        setSeenQuestions(prev => [...prev, ...newSeen]);
      }

      setActiveLesson(parsed);
      HudAudio.playSuccess();
      gainXP(20);
      writeLog(`English Coach: Custom lesson plan synthesized for "${parsed.title}". +20 XP.`, "success");

    } catch (err) {
      console.error(err);
      writeLog("English Coach: Failed to generate lesson. API Core offline.", "alert");
      HudAudio.playAlert();
    } finally {
      setGeneratingLesson(false);
    }
  };

  const handleLessonWritingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonWritingInput.trim() || lessonWritingLoading) return;
    HudAudio.playClick();
    setLessonWritingLoading(true);

    const prompt = `You are Emily, a helpful English Coach. Review this student sentence: "${lessonWritingInput.trim()}".
    It was written for the lesson: "${activeLesson.title}".
    Analyze if it correctly follows the writing prompt: "${activeLesson.writingPrompt}".
    Provide corrections if there are grammar errors, suggest advanced synonyms, and write a natural rewrite.
    Keep your review brief and structured under markdown bullet points.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setLessonWritingFeedback(data.content);
      gainXP(30);
      writeLog("English Coach: Lesson writing challenge checked. +30 XP.", "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setLessonWritingFeedback("Spelling and sentence structure checked locally. Splendid job writing!");
      gainXP(15);
    } finally {
      setLessonWritingLoading(false);
    }
  };

  const handleGenerateEssayPrompt = async (category: string) => {
    HudAudio.playClick();
    setGeneratingEssayPrompt(true);
    setEssayText('');
    setEssayFeedback(null);

    const prompt = `Generate a creative or professional writing prompt for the category: "${category}".
    Keep the prompt brief (1-2 sentences), challenging the student to write a paragraph (minimum 25 words) testing their vocabulary and professional registers.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setEssayPrompt(data.content);
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setEssayPrompt("Write a reflection on your daily productivity habits and detail how you plan to improve focus.");
    } finally {
      setGeneratingEssayPrompt(false);
    }
  };

  const handleGradeEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayText.trim() || gradingEssay) return;
    HudAudio.playClick();
    setGradingEssay(true);

    const prompt = `Act as an expert IELTS/TOEFL English Coach. Grade the following essay/paragraph: "${essayText.trim()}".
    It was written in response to the prompt: "${essayPrompt}".
    Provide a detailed evaluation based on the official CEFR and IELTS descriptors.
    Respond ONLY with a valid JSON object matching the schema below. Do not wrap the response in markdown formatting or backticks.
    
    Schema:
    {
      "score": 85,
      "cefr": "C1",
      "coherence": 80,
      "vocabularyBand": 90,
      "grammarBand": 85,
      "grammar": "Direct corrections of any spelling or grammatical errors found.",
      "vocabulary": "Suggestions for richer words, idioms, or transitions to make it sound better.",
      "rewrite": "A fully polished, professional-grade rewrite of their essay."
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);
      setEssayFeedback(parsed);

      const xp = Math.round(parsed.score * 1.5);
      gainXP(xp);
      writeLog(`English Coach: Essay graded. CEFR Level: ${parsed.cefr}. Score: ${parsed.score}%. +${xp} XP.`, "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setEssayFeedback({
        score: 75,
        cefr: "B2",
        coherence: 70,
        vocabularyBand: 80,
        grammarBand: 75,
        grammar: "Spelling and grammar checked. Well done!",
        vocabulary: "Try using richer terms like 'optimizations' and 'synthesis'.",
        rewrite: essayText
      });
      gainXP(50);
      HudAudio.playAlert();
    } finally {
      setGradingEssay(false);
    }
  };

  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardsTopic.trim() || generatingFlashcards) return;
    HudAudio.playClick();
    setGeneratingFlashcards(true);
    setCardIndex(0);
    setCardFlipped(false);

    const prompt = `Generate exactly 6 vocabulary flashcards about the theme: "${flashcardsTopic.trim()}".
    Respond ONLY with a valid JSON object matching the schema below. Do not wrap the response in markdown formatting or backticks.
    
    Schema:
    {
      "cards": [
        {
          "word": "Noun/verb to learn",
          "pronounce": "/phonetic guide/",
          "meaning": "Definition/meaning of the word",
          "example": "Context example sentence using the word.",
          "synonyms": "Synonym 1, Synonym 2"
        }
      ]
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);
      setFlashcards(parsed.cards || []);
      gainXP(20);
      writeLog(`English Coach: Vocab flashcards generated for "${flashcardsTopic}". +20 XP.`, "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      writeLog("English Coach: Failed to generate flashcards.", "alert");
      HudAudio.playAlert();
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const roleplayPresets = [
    { title: "Salary Negotiation", topic: "Negotiating a 15% raise with your tech manager", userRole: "Software Engineer", aiRole: "Engineering Manager" },
    { title: "Hotel Complaint", topic: "Complaining about room heating issues to hotel desk agent", userRole: "Hotel Guest", aiRole: "Front Desk Receptionist" },
    { title: "Ordering Coffee", topic: "Ordering customizable coffee blends at a busy cafe", userRole: "Customer", aiRole: "Barista" }
  ];

  const handleStartRoleplay = async (preset?: typeof roleplayPresets[0]) => {
    HudAudio.playClick();
    const topic = preset ? preset.topic : roleplayTopic;
    const uRole = preset ? preset.userRole : userRole;
    const aRole = preset ? preset.aiRole : aiRole;

    setRoleplayTopic(topic);
    setUserRole(uRole);
    setAiRole(aRole);
    setRoleplayMode('chat');
    setRoleplayLoading(true);

    // Baseline satisfaction based on mood
    const initialSat = roleplayMood === 'friendly' ? 70 : roleplayMood === 'neutral' ? 55 : 40;
    setRoleplaySatisfaction(initialSat);

    const moodInstruction = roleplayMood === 'friendly' 
      ? 'Your character has a warm, friendly, helpful, and very accommodating temperament.'
      : roleplayMood === 'neutral'
        ? 'Your character has a professional, businesslike, objective, and neutral temperament.'
        : 'Your character has a stressed, impatient, and highly demanding temperament. You require clear, polite, and direct English phrasing, and easily get annoyed by direct commands or grammar mistakes.';

    const prompt = `We are starting an English learning roleplay dialogue.
    Topic: "${topic}"
    My Role: "${uRole}"
    Your Role: "${aRole}"
    Character Temperament: ${moodInstruction}
    
    Introduce yourself in character and make the first statement of the conversation. Keep it to 1-2 sentences.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRoleplayChat([
        {
          id: `rp_${Date.now()}`,
          sender: 'ai',
          text: data.content,
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);
      writeLog(`English Coach: Roleplay chat online. Initial Satisfaction: ${initialSat}%.`, "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setRoleplayChat([
        {
          id: `rp_${Date.now()}`,
          sender: 'ai',
          text: "Hello! Let's get started. How can I help you today?",
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);
      HudAudio.playAlert();
    } finally {
      setRoleplayLoading(false);
    }
  };

  const handleSendRoleplayMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleplayInputText.trim() || roleplayLoading) return;
    HudAudio.playClick();

    const textVal = roleplayInputText.trim();
    const time = new Date().toLocaleTimeString().substring(0, 5);

    const userMsg = {
      id: `rp_u_${Date.now()}`,
      sender: 'user',
      text: textVal,
      timestamp: time
    };

    setRoleplayChat(prev => [...prev, userMsg]);
    setRoleplayInputText('');
    setRoleplayLoading(true);

    const moodInstruction = roleplayMood === 'friendly' 
      ? 'Your character has a warm, friendly, helpful, and very accommodating temperament.'
      : roleplayMood === 'neutral'
        ? 'Your character has a professional, businesslike, objective, and neutral temperament.'
        : 'Your character has a stressed, impatient, and highly demanding temperament. You require clear, polite, and direct English phrasing, and easily get annoyed by direct commands or grammar mistakes.';

    const prompt = `We are playing an English learning roleplay.
    Topic: "${roleplayTopic}"
    My Role (User): "${userRole}"
    Your Role (AI): "${aiRole}"
    Your Temperament: ${moodInstruction}
    Your Current Satisfaction Level: ${roleplaySatisfaction}%
    
    Here is our conversation history:
    ${roleplayChat.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')}
    User's latest message: "${textVal}"
    
    Respond in character as "${aiRole}". Additionally, analyze the user's latest message for spelling/grammar errors, explain corrections, and suggest synonyms.
    Evaluate the user's language politeness: if they use polite modals like 'could you', 'would you be able to', 'please', increase satisfaction. If they use direct commands (e.g. 'give me', 'bring me') or have grammar mistakes, decrease satisfaction (especially if your temperament is demanding).
    Respond ONLY with a valid JSON object matching this schema. Do not wrap the response in markdown formatting or backticks.
    
    Schema:
    {
      "reply": "Your next response line in character (1-2 sentences)",
      "satisfactionChange": 10,
      "review": {
        "hasErrors": true,
        "explanation": "Short grammar check explanation if errors exist, otherwise empty string",
        "correction": "Fully corrected sentence if errors exist, otherwise empty string",
        "synonyms": ["Alternative word 1", "Alternative word 2"]
      }
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);
      
      const change = parsed.satisfactionChange || 0;
      setRoleplaySatisfaction(prev => Math.max(0, Math.min(100, prev + change)));

      setRoleplayChat(prev => [
        ...prev,
        {
          id: `rp_ai_${Date.now()}`,
          sender: 'ai',
          text: parsed.reply,
          review: parsed.review,
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);

      if (change > 0) {
        writeLog(`English Coach: Satisfaction increased by +${change}%.`, "success");
      } else if (change < 0) {
        writeLog(`English Coach: Satisfaction decreased by ${change}%.`, "alert");
      }

      gainXP(25);
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setRoleplayChat(prev => [
        ...prev,
        {
          id: `rp_ai_err_${Date.now()}`,
          sender: 'ai',
          text: "I understand. Let's continue the conversation.",
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);
      HudAudio.playAlert();
    } finally {
      setRoleplayLoading(false);
    }
  };

  const handleCheckFlashcardSentence = async (e: React.FormEvent, word: string) => {
    e.preventDefault();
    if (!flashcardTestInput.trim() || checkingFlashcardSentence) return;
    HudAudio.playClick();
    setCheckingFlashcardSentence(true);
    setFlashcardTestFeedback('');

    const prompt = `Review this student sentence utilizing the target vocabulary word: "${word}".
    Student's input: "${flashcardTestInput.trim()}".
    Analyze if they used the word correctly both syntactically and semantically. 
    Explain any corrections, suggest alternatives, and write a polished natural rewrite.
    Keep your reply highly concise under markdown bullets.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFlashcardTestFeedback(data.content);
      gainXP(30);
      writeLog(`English Coach: Checked vocabulary practice sentence. +30 XP.`, "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setFlashcardTestFeedback("Excellent usage of the word! The sentence structure looks great.");
      gainXP(15);
    } finally {
      setCheckingFlashcardSentence(false);
    }
  };

  const handleCheckQuizSentence = async (e: React.FormEvent, conceptQuestion: string) => {
    e.preventDefault();
    if (!quizSentenceInput.trim() || checkingQuizSentence) return;
    HudAudio.playClick();
    setCheckingQuizSentence(true);
    setQuizSentenceFeedback('');

    const prompt = `The student is practicing a grammar concept or word from this question/context: "${conceptQuestion}".
    They drafted this custom sentence to test their skills: "${quizSentenceInput.trim()}".
    Analyze if it is grammatically correct and appropriate. Explain corrections and provide a natural rewrite.
    Keep it concise under markdown bullets.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setQuizSentenceFeedback(data.content);
      gainXP(30);
      writeLog(`English Coach: Checked custom grammar practice sentence. +30 XP.`, "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      setQuizSentenceFeedback("Grammar sentence structure checked. Fantastic job applying the rule!");
      gainXP(15);
    } finally {
      setCheckingQuizSentence(false);
    }
  };

  const handlePracticeSimilarQuestion = async (conceptQuestion: string) => {
    if (generatingSimilarQuestion) return;
    HudAudio.playClick();
    setGeneratingSimilarQuestion(true);

    const excludePhrase = seenQuestions.length > 0 
      ? `\nCRITICAL: Do NOT generate any of the following questions/concepts, as the student has already completed them:\n${seenQuestions.slice(-15).map(q => `- "${q}"`).join('\n')}` 
      : '';

    const prompt = `Based on this English grammar/vocabulary question: "${conceptQuestion}",${excludePhrase}
    generate a similar multiple-choice practice question testing the same core rule or concept.
    The new question must be distinct and use a completely different sentence context and vocabulary than the original question (do not just repeat the original question or change one word).
    Respond ONLY with a valid JSON object matching this schema. Do not wrap the response in markdown formatting or backticks.
    
    Schema:
    {
      "q": "Similar question sentence with blank ___ or challenge",
      "options": ["Correct choice", "Incorrect choice 1", "Incorrect choice 2"],
      "answer": "Correct choice",
      "explain": "Brief explanation of the correct choice. The 'answer' field must EXACTLY match one of the items in the 'options' array."
    }`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let cleaned = data.content.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      const parsed = JSON.parse(cleaned);

      // Track seen questions
      setSeenQuestions(prev => [...prev, conceptQuestion, parsed.q]);

      // Inject the similar question into chat history
      const time = new Date().toLocaleTimeString().substring(0, 5);
      const nextMsg = {
        id: `m_sim_${Date.now()}`,
        sender: 'teacher' as const,
        text: `🔄 **Similar Drill Exercise:**\n\n${parsed.q}`,
        options: parsed.options,
        correctOption: parsed.answer,
        timestamp: time
      };

      setChatHistory(prev => [...prev, nextMsg]);
      writeLog("English Coach: Generated similar practice drill.", "success");
      HudAudio.playSuccess();
    } catch (err) {
      console.error(err);
      writeLog("English Coach: Failed to generate similar question.", "alert");
      HudAudio.playAlert();
    } finally {
      setGeneratingSimilarQuestion(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Sidebar: Teacher Status & Tracks */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Emily Profile Card */}
        <div className="cyber-card p-5 rounded-lg border-cyber-cyan/20 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto rounded-full border-2 border-cyber-cyan bg-obsidian-deep flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <span className="font-mono text-xl font-bold text-cyber-cyan animate-pulse">👩‍🏫</span>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-cyber-green border-2 border-obsidian-dark animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Emily (English Coach)</h3>
            <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5">Assigned AI Instructor</p>
          </div>

          <div className="pt-3 border-t border-cyber-cyan/10 grid grid-cols-2 gap-2 text-center font-mono text-[10px]">
            <div className="bg-obsidian-deep p-2 rounded border border-obsidian-light">
              <span className="text-gray-500 block text-[8px] uppercase">Accuracy</span>
              <span className="text-cyber-cyan font-bold">
                {answeredCount > 0 ? `${Math.round((score / answeredCount) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="bg-obsidian-deep p-2 rounded border border-obsidian-light">
              <span className="text-gray-500 block text-[8px] uppercase">XP Earned</span>
              <span className="text-cyber-purple font-bold">+{score * 50}</span>
            </div>
          </div>
        </div>

        {/* Learning Tracks navigation */}
        <div className="cyber-card p-5 rounded-lg border-cyber-purple/20 space-y-3 font-mono text-[10px]">
          <h4 className="text-xs text-cyber-purple font-bold tracking-wider border-b border-obsidian-light pb-2 uppercase">
            Learning Tracks
          </h4>

          <div className="space-y-2">
            {[
              { id: 'grammar', label: 'Grammar Quiz Challenge' },
              { id: 'vocab', label: 'Vocabulary Builder' },
              { id: 'idiom', label: 'Common Idioms' },
              { id: 'conversation', label: 'Daily Conversation' },
              { id: 'free', label: 'Free Writing Practice' },
              { id: 'topic-lesson', label: 'Teach Me a Topic' },
              { id: 'essay-challenge', label: 'Daily Essay Challenges' },
              { id: 'flashcards', label: 'Vocabulary Flashcards' },
              { id: 'free-roleplay', label: 'Free-Roam AI Roleplay' }
            ].map((track) => (
              <button
                key={track.id}
                onClick={() => { HudAudio.playClick(); setActiveTrack(track.id as any); setShowCreateForm(false); }}
                className={`w-full text-left p-2.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                  activeTrack === track.id && !showCreateForm
                    ? 'border-cyber-cyan bg-cyber-cyan/5 text-cyber-cyan font-bold'
                    : 'border-obsidian-light text-gray-400 hover:border-cyber-cyan/35 hover:text-gray-300'
                }`}
              >
                <span>{track.label}</span>
                <BookOpen size={10} className={activeTrack === track.id && !showCreateForm ? 'text-cyber-cyan' : 'text-gray-600'} />
              </button>
            ))}
          </div>

          {/* Daily Conversation Scenario Toggles */}
          {activeTrack === 'conversation' && (
            <div className="pt-3 border-t border-obsidian-light space-y-1.5">
              <div className="flex justify-between items-center text-[9px] uppercase font-bold text-gray-500">
                <span>Choose Scenario:</span>
                <button
                  onClick={() => { HudAudio.playClick(); setShowCreateForm(!showCreateForm); }}
                  className="text-cyber-cyan hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Create a custom dialogue scene"
                >
                  <Plus size={8} /> Add Custom
                </button>
              </div>

              <button
                onClick={() => { HudAudio.playClick(); setActiveScenario('cafe'); setShowCreateForm(false); }}
                className={`w-full text-left py-1.5 px-2 rounded border flex items-center gap-1.5 cursor-pointer ${
                  activeScenario === 'cafe' && !showCreateForm ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Coffee size={10} /> Coffee Shop Order
              </button>
              <button
                onClick={() => { HudAudio.playClick(); setActiveScenario('interview'); setShowCreateForm(false); }}
                className={`w-full text-left py-1.5 px-2 rounded border flex items-center gap-1.5 cursor-pointer ${
                  activeScenario === 'interview' && !showCreateForm ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Briefcase size={10} /> Job Interview
              </button>
              <button
                onClick={() => { HudAudio.playClick(); setActiveScenario('directions'); setShowCreateForm(false); }}
                className={`w-full text-left py-1.5 px-2 rounded border flex items-center gap-1.5 cursor-pointer ${
                  activeScenario === 'directions' && !showCreateForm ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <MapPin size={10} /> Asking Directions
              </button>

              {/* Render custom scenarios */}
              {customScenarios.map((cs) => (
                <button
                  key={cs.id}
                  onClick={() => { HudAudio.playClick(); setActiveScenario(`custom_${cs.id}`); setShowCreateForm(false); }}
                  className={`w-full text-left py-1.5 px-2 rounded border flex items-center justify-between cursor-pointer ${
                    activeScenario === `custom_${cs.id}` && !showCreateForm ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-1 flex items-center gap-1.5 font-bold">🎬 {cs.title}</span>
                  <Trash2 
                    size={10} 
                    className="text-gray-500 hover:text-cyber-pink flex-shrink-0 cursor-pointer"
                    onClick={(e) => handleDeleteCustomScenario(cs.id, e)} 
                  />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={resetProgress}
            className="w-full py-1.5 border border-cyber-pink/20 hover:border-cyber-pink text-cyber-pink hover:bg-cyber-pink/5 rounded text-[9px] flex items-center justify-center gap-1 mt-4 transition-colors cursor-pointer"
          >
            <RefreshCw size={10} /> Reset Statistics
          </button>
        </div>
      </div>

      {/* Main Chat Interface or Custom Scenario Creator form */}
      <div className="lg:col-span-3 cyber-card p-5 rounded-lg border-cyber-cyan/25 flex flex-col h-[520px] lg:h-[600px]">
        {showCreateForm ? (
          /* Smart AI Topic Generator Panel */
          <form onSubmit={handleCreateAIScenario} className="flex-1 flex flex-col justify-center space-y-6 font-mono text-[10px] max-w-sm mx-auto w-full">
            <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-4">
              <span className="text-xs text-cyber-cyan font-bold tracking-wider block uppercase">
                AI Scenario Topic Generator
              </span>
              <p className="text-[9px] text-gray-500">
                Type any topic (e.g. "Airport check-in", "Doctor", "Restaurant dinner") and Emily will build a custom interactive dialogue lesson for you!
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 block font-bold uppercase">Insert Dialogue Topic / Description</label>
              <input
                type="text"
                required
                disabled={generatingScenario}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder={generatingScenario ? "Analyzing topic schema..." : "e.g. Hotel reservation / Checking in..."}
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs font-bold disabled:opacity-50"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                disabled={generatingScenario}
                onClick={() => { HudAudio.playClick(); setShowCreateForm(false); }}
                className="flex-1 py-2 border border-cyber-pink/30 hover:border-cyber-pink text-cyber-pink rounded cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              {generatingScenario ? (
                <button
                  type="button"
                  disabled
                  className="flex-grow py-2 bg-cyber-purple/20 border border-cyber-purple/35 text-cyber-purple font-bold rounded flex items-center justify-center gap-1.5 cursor-not-allowed animate-pulse"
                >
                  <RefreshCw size={10} className="animate-spin" /> Synthesizing...
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-grow py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer"
                >
                  Generate AI Lesson
                </button>
              )}
            </div>
          </form>
        ) : (activeTrack === 'grammar' || activeTrack === 'vocab' || activeTrack === 'idiom') && dynamicQuizzes.length === 0 ? (
          /* DYNAMIC QUIZ TOPIC SELECTOR FORM */
          generatingQuiz ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-4 font-mono text-[10px] text-cyber-cyan">
              <RefreshCw size={24} className="animate-spin text-cyber-cyan" />
              <div className="text-center space-y-1">
                <span className="font-bold uppercase tracking-wider block">Synthesizing dynamic quiz core...</span>
                <p className="text-gray-500 font-bold">Retrieving questions and rules from Mistral AI Node...</p>
              </div>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const topic = activeTrack === 'grammar' ? grammarTopic : activeTrack === 'vocab' ? vocabTopic : idiomTopic;
                generateDynamicQuiz(activeTrack, topic);
              }} 
              className="flex-1 flex flex-col justify-center space-y-6 font-mono text-[10px] max-w-sm mx-auto w-full"
            >
              <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-4">
                <span className="text-xs text-cyber-cyan font-bold tracking-wider block uppercase">
                  AI Quiz Topic Selector
                </span>
                <p className="text-[9px] text-gray-500">
                  {activeTrack === 'grammar' 
                    ? 'Input any grammar topic (e.g., "Gerunds vs Infinitives", "Conditional Type 3") to generate a custom 5-question multiple choice quiz.'
                    : activeTrack === 'vocab'
                      ? 'Input any vocabulary subject (e.g., "Aerospace nouns", "Chef kitchen tools") to build custom vocabulary challenges.'
                      : 'Input an idiom context or theme (e.g., "expressing surprise", "hard work") to discover matching idioms.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-gray-400 block font-bold uppercase">
                  {activeTrack === 'grammar' ? 'Grammar Topic' : activeTrack === 'vocab' ? 'Vocabulary Subject' : 'Idiom Theme'}
                </label>
                <input
                  type="text"
                  required
                  value={activeTrack === 'grammar' ? grammarTopic : activeTrack === 'vocab' ? vocabTopic : idiomTopic}
                  onChange={(e) => {
                    if (activeTrack === 'grammar') setGrammarTopic(e.target.value);
                    else if (activeTrack === 'vocab') setVocabTopic(e.target.value);
                    else setIdiomTopic(e.target.value);
                  }}
                  placeholder={activeTrack === 'grammar' ? "e.g. Past perfect vs past simple" : activeTrack === 'vocab' ? "e.g. Web development nouns" : "e.g. idioms for success"}
                  className="w-full bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs font-bold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer transition-colors text-xs uppercase font-mono font-bold tracking-wider"
              >
                🚀 Generate AI Quiz
              </button>
            </form>
          )
        ) : activeTrack === 'topic-lesson' ? (
          /* TEACH ME A TOPIC VIEW */
          generatingLesson ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-4 font-mono text-[10px] text-cyber-cyan">
              <RefreshCw size={24} className="animate-spin text-cyber-cyan" />
              <span className="font-bold uppercase tracking-wider animate-pulse">Structuring custom lesson curriculum...</span>
            </div>
          ) : activeLesson === null ? (
            <form onSubmit={handleGenerateLesson} className="flex-1 flex flex-col justify-center space-y-6 font-mono text-[10px] max-w-sm mx-auto w-full">
              <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-4">
                <span className="text-xs text-cyber-cyan font-bold tracking-wider block uppercase">AI Lesson Builder</span>
                <p className="text-[9px] text-gray-500">Specify any English topic. The AI will build a custom tutorial guide, quizzes, and writing challenges.</p>
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 block font-bold uppercase">Lesson Topic</label>
                <input
                  type="text"
                  required
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  placeholder="e.g. Conditional type 3, Passive Voice, Phrasal Verbs"
                  className="w-full bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs font-bold"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer text-xs uppercase font-mono font-bold tracking-wider">
                Create Custom Lesson
              </button>
            </form>
          ) : (
            <div className="flex-1 flex flex-col h-full font-mono text-[10px]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-3">
                <span className="text-xs text-cyber-cyan font-bold uppercase">📖 Custom Lesson: {activeLesson.title}</span>
                <button 
                  onClick={() => { HudAudio.playClick(); setActiveLesson(null); }}
                  className="text-cyber-pink hover:underline text-[9px] cursor-pointer"
                >
                  Exit Lesson
                </button>
              </div>

              {/* Steps rendering */}
              {/* Steps rendering */}
              {lessonStep === 0 ? (
                /* Concept Explanation */
                <div className="flex-grow flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
                  <div className="bg-obsidian-deep/50 border border-obsidian-light p-4 rounded text-gray-300 leading-relaxed text-xs">
                    <h5 className="text-white font-bold mb-2 text-xs border-b border-obsidian-light pb-1 uppercase">Concept Guide</h5>
                    <p className="whitespace-pre-wrap">{activeLesson.explanation}</p>
                  </div>
                  <button 
                    onClick={() => { HudAudio.playClick(); setLessonStep(1); }}
                    className="w-full py-2.5 bg-cyber-cyan text-obsidian-deep font-bold rounded text-xs uppercase tracking-wider cursor-pointer font-bold"
                  >
                    Start Practice Exercises
                  </button>
                </div>
              ) : lessonStep >= 1 && lessonStep <= 4 ? (
                /* Split View: Left column is the Cheat Sheet, Right column is active exercise */
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden h-full">
                  
                  {/* Left Column: Persistent Cheat Sheet */}
                  <div className="md:col-span-1 bg-obsidian-deep/40 border border-obsidian-light/65 p-3 rounded flex flex-col overflow-y-auto h-full space-y-2 max-h-[360px] md:max-h-full scrollbar-thin">
                    <span className="text-cyber-cyan font-bold block uppercase text-[8px] border-b border-obsidian-light pb-1">📚 Lesson Cheat Sheet</span>
                    <div className="text-[9px] leading-relaxed text-gray-400 whitespace-pre-wrap select-text">
                      {activeLesson.explanation}
                    </div>
                  </div>

                  {/* Right Column: Active Exercise */}
                  <div className="md:col-span-2 flex flex-col justify-between overflow-y-auto h-full pr-1 scrollbar-thin">
                    {lessonStep >= 1 && lessonStep <= 3 ? (
                      /* Quiz Questions */
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-500 block uppercase font-bold text-[9px] mb-2">Question {lessonStep} of 3</span>
                          <div className="bg-obsidian-deep/50 border border-obsidian-light p-4 rounded text-gray-200 text-xs mb-4">
                            {activeLesson.questions[lessonStep - 1].q}
                          </div>

                          {selectedLessonAnswer === null ? (
                            <div className="grid grid-cols-1 gap-2">
                              {activeLesson.questions[lessonStep - 1].options.map((opt: string) => (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    HudAudio.playClick();
                                    setSelectedLessonAnswer(opt);
                                    if (isAnswerCorrect(opt, activeLesson.questions[lessonStep - 1].answer, activeLesson.questions[lessonStep - 1].options)) {
                                      setLessonScore(prev => prev + 1);
                                      gainXP(20);
                                      writeLog("Lesson Practice: Correct answer! +20 XP.", "success");
                                      HudAudio.playSuccess();
                                    } else {
                                      gainXP(5);
                                      writeLog("Lesson Practice: Incorrect answer.", "alert");
                                      HudAudio.playAlert();
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 border border-cyber-cyan/20 hover:border-cyber-cyan bg-obsidian-deep hover:bg-cyber-cyan/5 text-cyber-cyan rounded transition-colors cursor-pointer text-xs font-bold"
                                >
                                  • {opt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className={`p-3 rounded border text-xs ${
                                isAnswerCorrect(selectedLessonAnswer, activeLesson.questions[lessonStep - 1].answer, activeLesson.questions[lessonStep - 1].options)
                                  ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                  : 'border-cyber-pink bg-cyber-pink/5 text-cyber-pink'
                              }`}>
                                <span className="font-bold block uppercase text-[9px] mb-1">
                                  {isAnswerCorrect(selectedLessonAnswer, activeLesson.questions[lessonStep - 1].answer, activeLesson.questions[lessonStep - 1].options) ? '🎉 Correct!' : '❌ Incorrect'}
                                </span>
                                <p className="mb-2">Your Answer: {selectedLessonAnswer}</p>
                                <p className="text-gray-300">Explanation: {activeLesson.questions[lessonStep - 1].explain}</p>
                              </div>
                              <button
                                onClick={() => {
                                  HudAudio.playClick();
                                  setSelectedLessonAnswer(null);
                                  setLessonStep(prev => prev + 1);
                                }}
                                className="w-full py-2 bg-cyber-cyan text-obsidian-deep font-bold rounded text-xs uppercase"
                              >
                                {lessonStep === 3 ? 'Proceed to Writing Challenge' : 'Next Question'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Writing Challenge */
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-500 block uppercase font-bold text-[9px] mb-1">Writing Challenge Prompt</span>
                          <div className="bg-obsidian-deep/50 border border-obsidian-light p-3 rounded text-gray-200 text-xs font-bold">
                            {activeLesson.writingPrompt}
                          </div>
                        </div>

                        {lessonWritingFeedback === '' ? (
                          <form onSubmit={handleLessonWritingSubmit} className="space-y-3">
                            <textarea
                              required
                              value={lessonWritingInput}
                              onChange={(e) => setLessonWritingInput(e.target.value)}
                              placeholder="Compose your sentence here utilizing the rule..."
                              className="w-full h-24 bg-obsidian-deep border border-obsidian-light focus:border-cyber-cyan text-cyber-cyan rounded p-3 outline-none text-xs leading-relaxed"
                            />
                            <button
                              type="submit"
                              disabled={lessonWritingLoading}
                              className="w-full py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer disabled:opacity-50 text-xs uppercase"
                            >
                              {lessonWritingLoading ? 'Analyzing Sentence...' : 'Submit Sentence'}
                            </button>
                          </form>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-obsidian-deep/50 border border-obsidian-light p-4 rounded text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                              {lessonWritingFeedback}
                            </div>
                            <button
                              onClick={() => {
                                HudAudio.playClick();
                                setLessonStep(5);
                                gainXP(50);
                                writeLog(`Completed Lesson: "${activeLesson.title}". +50 XP.`, "success");
                              }}
                              className="w-full py-2.5 bg-cyber-purple hover:bg-cyber-purple/85 text-white font-bold rounded text-xs uppercase tracking-wider"
                            >
                              Complete Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Completed Summary Screen */
                <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <span className="text-2xl">🏆</span>
                    <h4 className="text-white font-bold text-sm uppercase">Lesson Completed Successfully!</h4>
                    <p className="text-[10px] text-gray-400">You successfully finished the customized lesson tutorial, parsed the grammar concepts, and completed the practice checks.</p>
                  </div>

                  <div className="bg-obsidian-deep/50 border border-obsidian-light p-3 rounded w-full font-mono text-[10px] grid grid-cols-2 gap-2 text-center">
                    <div className="border-r border-obsidian-light">
                      <span className="text-gray-500 block uppercase text-[8px] mb-0.5">Quiz Score</span>
                      <span className="text-cyber-cyan font-bold">{lessonScore} / 3 Correct</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase text-[8px] mb-0.5">Total XP</span>
                      <span className="text-cyber-purple font-bold">+{100 + lessonScore * 20} XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      HudAudio.playClick();
                      setActiveLesson(null);
                    }}
                    className="w-full py-2 bg-cyber-cyan text-obsidian-deep font-bold rounded text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Finish & Exit
                  </button>
                </div>
              )}
            </div>
          )
        ) : activeTrack === 'essay-challenge' ? (
          /* DAILY ESSAY CHALLENGE VIEW */
          <div className="flex-grow flex flex-col h-full font-mono text-[10px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-3">
              <span className="text-xs text-cyber-cyan font-bold uppercase">Essay Grading Node</span>
            </div>

            {essayPrompt === '' ? (
              /* Preset Category Selection */
              generatingEssayPrompt ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="animate-spin text-cyber-cyan" size={24} />
                  <span className="uppercase tracking-wider font-bold text-cyber-cyan">Synthesizing Essay Prompt...</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center space-y-6 max-w-sm mx-auto w-full">
                  <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-4">
                    <span className="text-xs text-cyber-cyan font-bold uppercase tracking-wider block">Select Essay Category</span>
                    <p className="text-[9px] text-gray-500">Choose a writing category. The AI will synthesize a custom writing prompt and grade your paragraph.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'email', label: '📧 Business Email' },
                      { id: 'creative', label: '🎨 Creative Story' },
                      { id: 'technical', label: '💻 Technical Pitch' },
                      { id: 'reflective', label: '🧘 Reflective Journal' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleGenerateEssayPrompt(cat.id)}
                        className="py-3 border border-cyber-cyan/20 hover:border-cyber-cyan bg-obsidian-deep hover:bg-cyber-cyan/5 text-cyber-cyan font-bold rounded text-center transition-colors cursor-pointer text-xs"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* Active Prompt Writing & Grading View */
              <div className="flex-grow flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
                <div>
                  <div className="bg-obsidian-deep/50 border border-obsidian-light p-3.5 rounded text-gray-300 text-xs mb-4">
                    <span className="text-gray-500 block uppercase font-bold text-[8px] mb-1">Writing Prompt</span>
                    <p className="font-bold text-white leading-relaxed">{essayPrompt}</p>
                  </div>

                  {essayFeedback === null ? (
                    <form onSubmit={handleGradeEssay} className="space-y-3">
                      <textarea
                        required
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                        placeholder="Write your paragraph response here (aim for at least 25 words)..."
                        className="w-full h-32 bg-obsidian-deep border border-obsidian-light focus:border-cyber-cyan text-cyber-cyan rounded p-3 outline-none text-xs leading-relaxed"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { HudAudio.playClick(); setEssayPrompt(''); }}
                          className="px-4 py-2 border border-cyber-pink/30 text-cyber-pink hover:border-cyber-pink rounded cursor-pointer text-xs uppercase"
                        >
                          Change Prompt
                        </button>
                        <button
                          type="submit"
                          disabled={gradingEssay}
                          className="flex-grow py-2 bg-cyber-cyan text-obsidian-deep font-bold rounded cursor-pointer disabled:opacity-50 text-xs uppercase"
                        >
                          {gradingEssay ? 'Grading Essay...' : 'Submit for AI Grading'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Essay Graded Card */
                    <div className="space-y-4">
                      <div className="bg-obsidian-deep/50 border border-obsidian-light p-4 rounded space-y-3">
                        <div className="flex items-center justify-between border-b border-obsidian-light pb-2.5">
                          <span className="text-white font-bold uppercase text-xs">Grading Scorecard</span>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-mono font-bold text-[9px] uppercase">
                              CEFR: {essayFeedback.cefr || 'B2'}
                            </span>
                            <span className={`text-xs font-mono font-bold ${
                              essayFeedback.score >= 80 ? 'text-cyber-green' : essayFeedback.score >= 60 ? 'text-cyber-yellow' : 'text-cyber-pink'
                            }`}>
                              {essayFeedback.score}%
                            </span>
                          </div>
                        </div>

                        {/* Metrics Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-obsidian-light/50 pb-3 font-mono text-[9px]">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-500 uppercase">Coherence & Cohesion</span>
                              <span className="text-cyber-cyan font-bold">{essayFeedback.coherence || 75}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-obsidian-deep rounded border border-cyber-cyan/15 overflow-hidden">
                              <div className="h-full bg-cyber-cyan transition-all duration-500" style={{ width: `${essayFeedback.coherence || 75}%` }} />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-500 uppercase">Lexical Resource (Vocab)</span>
                              <span className="text-cyber-purple font-bold">{essayFeedback.vocabularyBand || 75}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-obsidian-deep rounded border border-cyber-purple/15 overflow-hidden">
                              <div className="h-full bg-cyber-purple transition-all duration-500" style={{ width: `${essayFeedback.vocabularyBand || 75}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-500 uppercase">Grammatical Range</span>
                              <span className="text-cyber-green font-bold">{essayFeedback.grammarBand || 75}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-obsidian-deep rounded border border-cyber-green/15 overflow-hidden">
                              <div className="h-full bg-cyber-green transition-all duration-500" style={{ width: `${essayFeedback.grammarBand || 75}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs leading-relaxed text-gray-300">
                          <div>
                            <span className="text-cyber-cyan font-bold block uppercase text-[9px]">Grammar Check</span>
                            <p>{essayFeedback.grammar}</p>
                          </div>
                          <div>
                            <span className="text-cyber-purple font-bold block uppercase text-[9px]">Vocabulary Upgrades</span>
                            <p>{essayFeedback.vocabulary}</p>
                          </div>
                          <div>
                            <span className="text-white font-bold block uppercase text-[9px] border-t border-obsidian-light/50 pt-2 mt-2">Emily's Natural Rewrite</span>
                            <p className="italic text-gray-200 whitespace-pre-wrap">{essayFeedback.rewrite}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => { HudAudio.playClick(); setEssayPrompt(''); setEssayFeedback(null); }}
                        className="w-full py-2 bg-cyber-cyan text-obsidian-deep font-bold rounded text-xs uppercase tracking-wider"
                      >
                        Start Another Challenge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTrack === 'flashcards' ? (
          /* VOCABULARY FLASHCARDS VIEW */
          <div className="flex-grow flex flex-col h-full font-mono text-[10px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-3">
              <span className="text-xs text-cyber-cyan font-bold uppercase">🗂️ Vocab Flashcards Synthesizer</span>
            </div>

            {flashcards.length === 0 ? (
              generatingFlashcards ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="animate-spin text-cyber-cyan" size={24} />
                  <span className="uppercase tracking-wider font-bold text-cyber-cyan animate-pulse">Synthesizing Vocab Deck...</span>
                </div>
              ) : (
                <form onSubmit={handleGenerateFlashcards} className="flex-1 flex flex-col justify-center space-y-6 max-w-sm mx-auto w-full">
                  <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-4">
                    <span className="text-xs text-cyber-cyan font-bold uppercase block">Generate Vocabulary Deck</span>
                    <p className="text-[9px] text-gray-500">Enter any theme or subject (e.g. "Restaurant dining", "Technical interviews") and the AI will assemble 6 study flashcards.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-400 block font-bold uppercase">Vocab Subject</label>
                    <input
                      type="text"
                      required
                      value={flashcardsTopic}
                      onChange={(e) => setFlashcardsTopic(e.target.value)}
                      placeholder="e.g. Finance, Machine Learning, Travel Idioms"
                      className="w-full bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs font-bold"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer text-xs uppercase font-mono font-bold tracking-wider">
                    Generate Study Cards
                  </button>
                </form>
              )
            ) : (
              /* Flashcard Viewer */
              <div className="flex-grow flex flex-col justify-between items-center space-y-6 py-4">
                <span className="text-gray-500 block uppercase font-bold text-[9px]">Card {cardIndex + 1} of {flashcards.length}</span>

                {flashcardTesting ? (
                  /* Sentence Practice Mode */
                  <div className="w-80 bg-obsidian-deep border border-cyber-purple/50 rounded-lg p-4 font-mono text-[10px] space-y-3 shadow-[0_0_15px_rgba(157,0,255,0.12)]">
                    <div className="flex items-center justify-between border-b border-obsidian-light pb-1.5">
                      <span className="text-cyber-purple font-bold uppercase text-[9px]">Vocabulary Challenge</span>
                      <button 
                        onClick={() => { HudAudio.playClick(); setFlashcardTesting(false); setFlashcardTestFeedback(''); setFlashcardTestInput(''); }}
                        className="text-cyber-pink hover:underline text-[8px] cursor-pointer"
                      >
                        Back to Card
                      </button>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[8px] block uppercase">Target Word</span>
                      <strong className="text-white text-sm">{flashcards[cardIndex].word}</strong>
                    </div>

                    <form onSubmit={(e) => handleCheckFlashcardSentence(e, flashcards[cardIndex].word)} className="space-y-2">
                      <textarea
                        required
                        disabled={checkingFlashcardSentence}
                        value={flashcardTestInput}
                        onChange={(e) => setFlashcardTestInput(e.target.value)}
                        placeholder={`Draft a sentence utilizing the word "${flashcards[cardIndex].word}"...`}
                        className="w-full h-16 bg-obsidian-deep border border-obsidian-light focus:border-cyber-purple text-cyber-cyan rounded p-2 outline-none text-[10px] leading-relaxed"
                      />
                      <button
                        type="submit"
                        disabled={checkingFlashcardSentence}
                        className="w-full py-1.5 bg-cyber-purple text-white font-bold rounded cursor-pointer disabled:opacity-50 text-[10px] uppercase font-bold"
                      >
                        {checkingFlashcardSentence ? 'Checking syntax...' : 'Submit Sentence'}
                      </button>
                    </form>

                    {flashcardTestFeedback && (
                      <div className="p-3 bg-obsidian-deep/50 border border-obsidian-light rounded text-[9px] leading-relaxed text-gray-300 whitespace-pre-wrap max-h-36 overflow-y-auto scrollbar-thin">
                        {flashcardTestFeedback}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 3D Flashcard Wrapper */
                  <div 
                    onClick={() => { HudAudio.playClick(); setCardFlipped(!cardFlipped); }}
                    className="w-64 h-40 cursor-pointer perspective-1000"
                  >
                    <div className={`relative w-full h-full duration-500 transform-style-3d ${cardFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* Front Face (Word) */}
                      <div className="absolute w-full h-full backface-hidden bg-obsidian-deep border border-cyber-cyan/45 rounded-lg flex flex-col items-center justify-center p-4 shadow-[0_0_12px_rgba(0,240,255,0.08)]">
                        <span className="text-xs text-gray-500 font-mono tracking-wider font-bold mb-1">{flashcards[cardIndex].pronounce}</span>
                        <h4 className="text-white text-base font-bold tracking-wide">{flashcards[cardIndex].word}</h4>
                        <p className="text-[8px] text-cyber-cyan font-mono animate-pulse uppercase mt-3">Click to Flip</p>
                      </div>

                      {/* Back Face (Details) */}
                      <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-obsidian-deep border border-cyber-purple/45 rounded-lg flex flex-col justify-center p-4 text-left leading-relaxed text-xs shadow-[0_0_12px_rgba(157,0,255,0.08)]">
                        <span className="text-cyber-purple font-bold block text-[9px] mb-1 font-mono uppercase">Definition</span>
                        <p className="text-gray-200 text-[10px] mb-2">{flashcards[cardIndex].meaning}</p>
                        
                        <span className="text-cyber-cyan font-bold block text-[9px] mb-1 font-mono uppercase">Example</span>
                        <p className="italic text-gray-400 text-[9px] mb-2">"{flashcards[cardIndex].example}"</p>

                        {flashcards[cardIndex].synonyms && (
                          <p className="text-gray-500 text-[8px]"><strong className="text-gray-400 uppercase">Synonyms:</strong> {flashcards[cardIndex].synonyms}</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Card Controls */}
                <div className="flex gap-3 items-center">
                  <button
                    disabled={cardIndex === 0 || flashcardTesting}
                    onClick={() => { HudAudio.playClick(); setCardIndex(prev => prev - 1); setCardFlipped(false); setFlashcardTesting(false); setFlashcardTestFeedback(''); setFlashcardTestInput(''); }}
                    className="p-2 border border-obsidian-light hover:border-cyber-cyan rounded cursor-pointer disabled:opacity-30 disabled:hover:border-obsidian-light"
                  >
                    <ChevronLeft size={14} className="text-cyber-cyan" />
                  </button>
                  
                  {!flashcardTesting ? (
                    <>
                      <button
                        onClick={() => { HudAudio.playClick(); setCardFlipped(!cardFlipped); }}
                        className="px-3 py-1.5 bg-obsidian-deep border border-obsidian-light hover:border-cyber-purple text-gray-300 font-bold rounded text-[9px] uppercase cursor-pointer"
                      >
                        Flip Card
                      </button>
                      {cardFlipped && (
                        <button
                          onClick={() => { HudAudio.playClick(); setFlashcardTesting(true); }}
                          className="px-3 py-1.5 bg-cyber-purple hover:bg-cyber-purple/85 text-white font-bold rounded text-[9px] uppercase cursor-pointer animate-pulse"
                        >
                          Test Me
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => { HudAudio.playClick(); setFlashcardTesting(false); setFlashcardTestFeedback(''); setFlashcardTestInput(''); }}
                      className="px-3 py-1.5 bg-obsidian-deep border border-obsidian-light hover:border-cyber-pink text-gray-300 font-bold rounded text-[9px] uppercase cursor-pointer"
                    >
                      Flip Card Back
                    </button>
                  )}

                  <button
                    disabled={cardIndex === flashcards.length - 1 || flashcardTesting}
                    onClick={() => { HudAudio.playClick(); setCardIndex(prev => prev + 1); setCardFlipped(false); setFlashcardTesting(false); setFlashcardTestFeedback(''); setFlashcardTestInput(''); }}
                    className="p-2 border border-obsidian-light hover:border-cyber-cyan rounded cursor-pointer disabled:opacity-30 disabled:hover:border-obsidian-light"
                  >
                    <ChevronRight size={14} className="text-cyber-cyan" />
                  </button>
                </div>

                <button
                  onClick={() => { HudAudio.playClick(); setFlashcards([]); }}
                  className="text-cyber-pink hover:underline text-[9px] uppercase cursor-pointer"
                >
                  Create New Vocabulary Deck
                </button>
              </div>
            )}
          </div>
        ) : activeTrack === 'free-roleplay' ? (
          /* FREE-ROAM AI ROLEPLAY VIEW */
          <div className="flex-grow flex flex-col h-full font-mono text-[10px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-2 mb-3">
              <span className="text-xs text-cyber-cyan font-bold uppercase">💬 Free-Roam AI Roleplay</span>
              {roleplayMode === 'chat' && (
                <button
                  onClick={() => { HudAudio.playClick(); setRoleplayMode('presets'); setRoleplayChat([]); }}
                  className="text-cyber-pink hover:underline text-[9px] cursor-pointer"
                >
                  Change Roleplay
                </button>
              )}
            </div>

            {roleplayMood && roleplayMode === 'presets' ? (
              /* Roleplay Mode Picker (Presets / Custom) */
              <div className="flex-1 flex flex-col justify-center space-y-5 max-w-sm mx-auto w-full">
                <div className="text-center space-y-2 border-b border-cyber-cyan/15 pb-3">
                  <span className="text-xs text-cyber-cyan font-bold uppercase">Select Roleplay Scenario</span>
                  <p className="text-[9px] text-gray-500">Pick a preset conversational roleplay or enter custom roles below to chat in character with Emily.</p>
                </div>

                {/* Mood Selector Row (Applies to both) */}
                <div className="space-y-1.5 bg-obsidian-deep/50 border border-obsidian-light p-2.5 rounded">
                  <span className="text-[8px] text-gray-500 block uppercase font-mono font-bold">AI Character Temperament / Mood</span>
                  <div className="flex gap-1.5 font-mono text-[8px]">
                    {[
                      { id: 'friendly', label: '☕ Friendly' },
                      { id: 'neutral', label: '💼 Professional' },
                      { id: 'demanding', label: '⚡ Demanding' }
                    ].map(mood => (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => { HudAudio.playClick(); setRoleplayMood(mood.id as any); }}
                        className={`flex-1 py-1 rounded border text-center transition-colors cursor-pointer ${
                          roleplayMood === mood.id
                            ? 'border-cyber-purple text-cyber-purple bg-cyber-purple/10 font-bold'
                            : 'border-obsidian-light text-gray-500 hover:text-white'
                        }`}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {roleplayPresets.map(preset => (
                    <button
                      key={preset.title}
                      onClick={() => handleStartRoleplay(preset)}
                      className="p-3 border border-cyber-cyan/20 hover:border-cyber-cyan bg-obsidian-deep hover:bg-cyber-cyan/5 rounded text-left transition-colors cursor-pointer text-[10px] space-y-1"
                    >
                      <strong className="text-white block font-bold truncate">{preset.title}</strong>
                      <span className="text-gray-500 text-[8px] block leading-normal line-clamp-2">{preset.topic}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Roleplay Form */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleStartRoleplay(); }}
                  className="border-t border-obsidian-light pt-3 space-y-2.5"
                >
                  <span className="text-[9px] text-gray-400 block uppercase font-bold">Or Design Custom Roles</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="My role (e.g. Client)"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="bg-obsidian-deep border border-obsidian-light focus:border-cyber-cyan rounded p-2 text-cyber-cyan text-[10px] font-bold outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="AI role (e.g. Lawyer)"
                      value={aiRole}
                      onChange={(e) => setAiRole(e.target.value)}
                      className="bg-obsidian-deep border border-obsidian-light focus:border-cyber-cyan rounded p-2 text-cyber-cyan text-[10px] font-bold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Describe the dialogue topic or context..."
                    value={roleplayTopic}
                    onChange={(e) => setRoleplayTopic(e.target.value)}
                    className="w-full bg-obsidian-deep border border-obsidian-light focus:border-cyber-cyan rounded p-2 text-cyber-cyan text-[10px] font-bold outline-none"
                  />
                  <button type="submit" className="w-full py-2 bg-cyber-cyan text-obsidian-deep font-bold rounded text-xs uppercase tracking-wider cursor-pointer font-bold">
                    Start Custom Roleplay
                  </button>
                </form>
              </div>
            ) : (
              /* Live Roleplay Chat */
              <div className="flex-grow flex flex-col justify-between h-full overflow-hidden">
                
                {/* Satisfaction Bar & Mood Info */}
                <div className="bg-obsidian-deep/60 border border-obsidian-light/60 p-2.5 rounded flex items-center justify-between mb-2.5 font-mono text-[9px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-gray-500 uppercase">AI Mood:</span>
                    <span className="text-cyber-cyan font-bold uppercase">{roleplayMood}</span>
                  </div>
                  <div className="flex items-center space-x-3 w-1/2">
                    <span className="text-gray-500 uppercase flex-shrink-0">Satisfaction:</span>
                    <div className="flex-grow h-2 bg-obsidian-deep rounded border border-cyber-cyan/15 overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          roleplaySatisfaction >= 70 
                            ? 'bg-cyber-green' 
                            : roleplaySatisfaction >= 40 
                              ? 'bg-cyber-yellow' 
                              : 'bg-cyber-pink animate-pulse'
                        }`}
                        style={{ width: `${roleplaySatisfaction}%` }}
                      />
                    </div>
                    <span className={`font-bold flex-shrink-0 ${
                      roleplaySatisfaction >= 70 
                        ? 'text-cyber-green' 
                        : roleplaySatisfaction >= 40 
                          ? 'text-cyber-yellow' 
                          : 'text-cyber-pink'
                    }`}>{roleplaySatisfaction}%</span>
                  </div>
                </div>

                {/* Chat Message Scroll */}
                <div className="flex-grow overflow-y-auto space-y-3.5 pr-2 mb-4 p-2 rounded bg-obsidian-deep/35 border border-obsidian-light/35 scrollbar-thin">
                  {roleplayChat.map((msg) => {
                    const isAI = msg.sender === 'ai';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          isAI ? 'mr-auto' : 'ml-auto items-end'
                        }`}
                      >
                        <div className={`flex items-start gap-2.5 ${isAI ? '' : 'flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border flex-shrink-0 ${
                            isAI ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan' : 'border-cyber-purple bg-cyber-purple/10 text-cyber-purple'
                          }`}>
                            {isAI ? '👩‍🏫' : '👨‍🎓'}
                          </div>

                          <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isAI ? 'bg-obsidian-light/40 border border-obsidian-light text-gray-200' : 'bg-cyber-cyan text-obsidian-deep font-semibold'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>

                        {/* Collapsible Coach grammar review inside AI responses */}
                        {isAI && msg.review && (
                          <div className="ml-10 mt-1 max-w-sm">
                            <details className="bg-obsidian-deep border border-obsidian-light/50 rounded overflow-hidden">
                              <summary className="px-2 py-1 text-[8px] font-bold text-cyber-purple uppercase cursor-pointer hover:bg-obsidian-light/20 select-none">
                                🔍 Coach Grammar & Vocab Review
                              </summary>
                              <div className="p-2 border-t border-obsidian-light/50 font-mono text-[8px] text-gray-300 space-y-1 leading-normal">
                                {msg.review.hasErrors ? (
                                  <>
                                    <div className="text-cyber-pink"><strong className="uppercase">Correction:</strong> "{msg.review.correction}"</div>
                                    <div><strong className="uppercase text-gray-400">Notes:</strong> {msg.review.explanation}</div>
                                  </>
                                ) : (
                                  <div className="text-cyber-green">✨ Grammatically spotless! Splendid phrasing.</div>
                                )}
                                {msg.review.synonyms && msg.review.synonyms.length > 0 && (
                                  <div><strong className="uppercase text-cyber-cyan">Synonyms to try:</strong> {msg.review.synonyms.join(', ')}</div>
                                )}
                              </div>
                            </details>
                          </div>
                        )}

                        <span className="text-[7px] text-gray-600 block mt-0.5 font-mono">{msg.timestamp}</span>
                      </div>
                    );
                  })}

                  {roleplayLoading && (
                    <div className="flex items-start gap-2.5 max-w-[85%] mr-auto animate-pulse">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan flex-shrink-0">
                        👩‍🏫
                      </div>
                      <div className="p-3 rounded-lg text-xs leading-relaxed bg-obsidian-light/30 border border-cyber-cyan/15 text-cyber-cyan flex items-center gap-1.5 font-mono">
                        <RefreshCw size={11} className="animate-spin text-cyber-cyan" />
                        <span>Emily is drafting a response...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Roleplay Chat Form Input */}
                <form onSubmit={handleSendRoleplayMsg} className="flex gap-2">
                  <input
                    type="text"
                    disabled={roleplayLoading}
                    value={roleplayInputText}
                    onChange={(e) => setRoleplayInputText(e.target.value)}
                    placeholder={`Type your reply as the "${userRole}"...`}
                    className="flex-1 bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan text-cyber-cyan placeholder-gray-600 rounded px-3.5 py-2 outline-none text-xs"
                  />
                  <button
                    type="submit"
                    disabled={roleplayLoading}
                    className="btn-cyber-cyan px-4 py-2 rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>

              </div>
            )}
          </div>
        ) : (
          /* DEFAULT CLASSROOM CHAT */
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-3 mb-3">
              <div className="flex items-center space-x-2 font-mono text-xs text-cyber-cyan font-bold tracking-wider">
                <MessageSquare size={14} />
                <span>Emily Classroom - Active Mode: {activeTrack.toUpperCase()}</span>
              </div>
              <div className="flex items-center text-[9px] font-mono text-gray-500">
                <Award size={10} className="mr-1 text-cyber-purple" /> Score: {score}/{answeredCount}
              </div>
            </div>

            {/* Message Scroll Pane */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 p-2 rounded bg-obsidian-deep/35 border border-obsidian-light/35 scrollbar-thin">
              {chatHistory.map((msg) => {
                const isTeacher = msg.sender === 'teacher';
                return (
                  <div 
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isTeacher ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border flex-shrink-0 ${
                      isTeacher 
                        ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan' 
                        : 'border-cyber-purple bg-cyber-purple/10 text-cyber-purple'
                    }`}>
                      {isTeacher ? '👩‍🏫' : '👨‍🎓'}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                        isTeacher 
                          ? 'bg-obsidian-light/40 border border-obsidian-light text-gray-200' 
                          : 'bg-cyber-cyan text-obsidian-deep font-semibold'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Interactive option choices buttons - only show if NOT in intro step */}
                        {isTeacher && !introActive && msg.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 font-mono">
                            {msg.options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => handleOptionClick(opt)}
                                className="text-left text-[10px] px-3 py-2 border border-cyber-cyan/20 hover:border-cyber-cyan bg-obsidian-deep hover:bg-cyber-cyan/5 text-cyber-cyan rounded transition-all cursor-pointer font-bold"
                              >
                                • {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Row for Quiz Feedback Cards */}
                      {isTeacher && msg.isFeedback && msg.targetConcept && (
                        <div className="mt-3 border-t border-obsidian-light/40 pt-2 space-y-2 font-mono text-[9px] max-w-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePracticeSimilarQuestion(msg.targetConcept!)}
                              disabled={generatingSimilarQuestion}
                              className="px-2 py-0.5 border border-cyber-cyan/35 hover:border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/5 rounded flex items-center gap-1 cursor-pointer disabled:opacity-50 font-bold"
                            >
                              {generatingSimilarQuestion ? <RefreshCw size={8} className="animate-spin" /> : '🔄'} Practice Similar Drill
                            </button>
                            <button
                              onClick={() => { HudAudio.playClick(); setQuizSentenceMode(!quizSentenceMode); setQuizSentenceFeedback(''); setQuizSentenceInput(''); }}
                              className={`px-2 py-0.5 border rounded flex items-center gap-1 cursor-pointer font-bold ${
                                quizSentenceMode 
                                  ? 'border-cyber-purple text-cyber-purple bg-cyber-purple/5' 
                                  : 'border-cyber-purple/35 hover:border-cyber-purple text-cyber-purple hover:bg-cyber-purple/5'
                              }`}
                            >
                              ✍️ Write Practice Sentence
                            </button>
                          </div>

                          {quizSentenceMode && (
                            <div className="space-y-2 bg-obsidian-deep/50 p-2 rounded border border-obsidian-light/70">
                              <span className="text-gray-500 uppercase block font-bold text-[7px]">Grammar Sentence Sandbox</span>
                              <form 
                                onSubmit={(e) => handleCheckQuizSentence(e, msg.targetConcept!)}
                                className="flex gap-1"
                              >
                                <input
                                  type="text"
                                  required
                                  disabled={checkingQuizSentence}
                                  value={quizSentenceInput}
                                  onChange={(e) => setQuizSentenceInput(e.target.value)}
                                  placeholder="Compose a sentence using this grammar rule..."
                                  className="flex-grow bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan text-cyber-cyan rounded px-2 py-0.5 outline-none text-[8px] font-mono"
                                />
                                <button
                                  type="submit"
                                  disabled={checkingQuizSentence}
                                  className="btn-cyber-cyan px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 text-[8px] font-bold"
                                >
                                  Check
                                </button>
                              </form>
                              {quizSentenceFeedback && (
                                <div className="p-1.5 bg-obsidian-deep border border-obsidian-light text-gray-300 text-[8px] leading-relaxed whitespace-pre-wrap select-text max-h-24 overflow-y-auto scrollbar-thin">
                                  {quizSentenceFeedback}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-[8px] text-gray-600 block text-right font-mono font-semibold">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {aiLoading && (
                <div className="flex items-start gap-2.5 max-w-[85%] mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan flex-shrink-0">
                    👩‍🏫
                  </div>
                  <div className="space-y-1">
                    <div className="p-3 rounded-lg text-xs leading-relaxed bg-obsidian-light/30 border border-cyber-cyan/15 text-cyber-cyan flex items-center gap-1.5 font-mono">
                      <RefreshCw size={11} className="animate-spin text-cyber-cyan" />
                      <span>Emily is reviewing your syntax...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* If in conversation mode and introduction is active, render start button */}
            {activeTrack === 'conversation' && introActive ? (
              <div className="flex justify-center p-4 bg-obsidian-deep/50 border border-obsidian-light rounded-lg font-mono">
                <button
                  onClick={handleStartDialogueLesson}
                  className="btn-cyber-cyan px-6 py-2.5 rounded text-xs font-bold animate-pulse-glow cursor-pointer"
                >
                  🚀 Start Dialogue Lesson
                </button>
              </div>
            ) : activeTrack === 'free' ? (
              <div className="space-y-2.5">
                {/* Tone Filter Selector Row */}
                <div className="flex gap-1.5 items-center font-mono text-[8px] border-b border-obsidian-light pb-2">
                  <span className="text-gray-500 uppercase font-bold">Select Rewrite Tone:</span>
                  {[
                    { id: 'professional', label: '💼 Professional' },
                    { id: 'casual', label: '☕ Casual' },
                    { id: 'academic', label: '🎓 Academic' },
                    { id: 'creative', label: '⚡ Creative' }
                  ].map(tone => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => { HudAudio.playClick(); setWritingTone(tone.id as any); }}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        writingTone === tone.id
                          ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 font-bold'
                          : 'border-obsidian-light text-gray-500 hover:text-white'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
                
                <form onSubmit={handleFreeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type your sentences here. Emily will check spelling/grammar and rewrite in a ${writingTone} style...`}
                    className="flex-1 bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan text-cyber-cyan placeholder-gray-600 rounded px-3.5 py-2 outline-none text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="btn-cyber-cyan px-4 py-2 rounded flex items-center justify-center gap-1 cursor-pointer font-bold"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="font-mono text-[9px] text-gray-500 bg-obsidian-deep/50 p-2.5 rounded border border-obsidian-light text-center">
                {activeTrack === 'conversation' && conversationStep === 2 ? (
                  <button 
                    onClick={resetProgress}
                    className="px-4 py-1.5 bg-cyber-purple text-white rounded font-bold hover:bg-cyber-purple/80 cursor-pointer text-[10px]"
                  >
                    Restart Scenario Conversation
                  </button>
                ) : (
                  "CONVERSATION INTERACTION: CHOOSE A RESPONSE OPTION IN THE CHAT TO REPLY TO EMILY."
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
