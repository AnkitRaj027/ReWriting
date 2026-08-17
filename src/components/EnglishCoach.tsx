'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, RefreshCw, MessageSquare, Award, Coffee, Briefcase, MapPin, Plus, Trash2, Settings2 } from 'lucide-react';
import { HudAudio } from '../utils/HudAudio';

interface Message {
  id: string;
  sender: 'teacher' | 'student';
  text: string;
  options?: string[];
  correctOption?: string;
  timestamp: string;
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
  const [activeTrack, setActiveTrack] = useState<'grammar' | 'vocab' | 'idiom' | 'conversation' | 'free'>('grammar');
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
    setIntroActive(true); // Always introduce scenarios first
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

    if (activeTrack === 'grammar') {
      const qNum = score % grammarQuizzes.length;
      const quiz = grammarQuizzes[qNum];
      msgText = `Hello! I'm Emily, your English Coach. Let's practice some grammar skills!\n\nQuestion:\n${quiz.q}`;
    } else if (activeTrack === 'vocab') {
      const wNum = score % vocabWords.length;
      const vw = vocabWords[wNum];
      msgText = `Let's build your vocabulary!\n\nWord of the Day:\n📘 **${vw.word}** ${vw.pronounce}\nMeaning: ${vw.meaning}\nExample: "${vw.example}"\n\nChallenge:\n${vw.q}`;
    } else if (activeTrack === 'idiom') {
      const iNum = score % idioms.length;
      const idm = idioms[iNum];
      msgText = `Let's learn an English Idiom!\n\nPhrase:\n🌟 **"${idm.idiom}"**\nMeaning: ${idm.meaning}\nExample: "${idm.example}"\n\nPractice Question:\n${idm.q}`;
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
      const isCorrect = optionText === currentTeacherMsg.correctOption;

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
        if (isCorrect) {
          HudAudio.playSuccess();
          setScore(prev => prev + 1);
          gainXP(50);
          writeLog("English Coach: Correct answer! +50 XP rewarded.", "success");
          
          responseText = `🎉 **Correct!** Excellent work!\n\n`;
          if (activeTrack === 'grammar') {
            const qNum = score % grammarQuizzes.length;
            responseText += grammarQuizzes[qNum].explain;
          } else {
            responseText += "You fully understood the meaning.";
          }
        } else {
          HudAudio.playAlert();
          writeLog("English Coach: Incorrect answer. Try reviewing the explanation.", "alert");
          
          responseText = `❌ **Oops!** That's not correct.\n\nThe correct answer is: **${currentTeacherMsg.correctOption}**.\n\n`;
          if (activeTrack === 'grammar') {
            const qNum = score % grammarQuizzes.length;
            responseText += grammarQuizzes[qNum].explain;
          }
        }

        const feedbackMsg: Message = {
          id: `m_feed_${Date.now()}`,
          sender: 'teacher',
          text: responseText,
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        };

        setChatHistory(prev => [...prev, feedbackMsg]);

        // Auto-generate next question in 2.2 seconds
        setTimeout(() => {
          generateNextQuestion();
        }, 2200);

      }, 800);
    }
  };

  const generateNextQuestion = () => {
    const time = new Date().toLocaleTimeString().substring(0, 5);
    let nextText = '';
    let options: string[] = [];
    let correctOption = undefined;

    const index = (score + answeredCount + 1);

    if (activeTrack === 'grammar') {
      const qNum = index % grammarQuizzes.length;
      const quiz = grammarQuizzes[qNum];
      nextText = `Here is your next grammar question:\n\n${quiz.q}`;
      options = quiz.options;
      correctOption = quiz.answer;
    } else if (activeTrack === 'vocab') {
      const wNum = index % vocabWords.length;
      const vw = vocabWords[wNum];
      nextText = `Here is your next vocabulary builder:\n\n📘 **${vw.word}** ${vw.pronounce}\nMeaning: ${vw.meaning}\n\nChallenge:\n${vw.q}`;
      options = vw.options;
      correctOption = vw.answer;
    } else if (activeTrack === 'idiom') {
      const iNum = index % idioms.length;
      const idm = idioms[iNum];
      nextText = `Next idiom drill:\n\n🌟 **"${idm.idiom}"**\nMeaning: ${idm.meaning}\n\nQuestion:\n${idm.q}`;
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

  const handleFreeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    HudAudio.playClick();
    const time = new Date().toLocaleTimeString().substring(0, 5);

    const studentMsg: Message = {
      id: `m_free_s_${Date.now()}`,
      sender: 'student',
      text: inputText,
      timestamp: time
    };

    setChatHistory(prev => [...prev, studentMsg]);
    setInputText('');

    setTimeout(() => {
      let feedback = "Splendid job writing! Your sentence is grammatically clear. Keep practicing to build confidence.";
      
      const lower = inputText.toLowerCase();
      for (const t of freeCorrectionTemplates) {
        if (t.keywords.some(kw => lower.includes(kw))) {
          feedback = t.reply;
          break;
        }
      }

      gainXP(15);

      const feedbackMsg: Message = {
        id: `m_free_t_${Date.now()}`,
        sender: 'teacher',
        text: feedback,
        timestamp: new Date().toLocaleTimeString().substring(0, 5)
      };

      setChatHistory(prev => [...prev, feedbackMsg]);
    }, 1000);
  };

  const handleCreateAIScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    HudAudio.playClick();
    const lowerTopic = topicInput.toLowerCase();
    let generatedTitle = topicInput;

    // Define smart templates
    let step1Text = '';
    let step1Options: string[] = [];
    let step1Answer = '';
    let step1Explain = '';

    let step2Text = '';
    let step2Options: string[] = [];
    let step2Answer = '';
    let step2Explain = '';

    let step3Text = '';

    // Match keywords
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
    } else if (lowerTopic.includes('hospital') || lowerTopic.includes('doctor') || lowerTopic.includes('sick') || lowerTopic.includes('health') || lowerTopic.includes('pain') || lowerTopic.includes('medical')) {
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
      // Fallback General Greeting Scenario
      generatedTitle = topicInput.length > 20 ? topicInput.substring(0, 20) + "..." : topicInput;
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
        {
          text: step1Text,
          options: step1Options,
          answer: step1Answer,
          explain: step1Explain
        },
        {
          text: step2Text,
          options: step2Options,
          answer: step2Answer,
          explain: step2Explain
        },
        {
          text: step3Text
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
    loadWelcomeMessage();
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
              { id: 'free', label: 'Free Writing Practice' }
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
      <div className="lg:col-span-3 cyber-card p-5 rounded-lg border-cyber-cyan/25 flex flex-col h-[450px] sm:h-[520px] lg:h-[600px]">
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
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Hotel reservation / Checking in..."
                className="w-full bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan rounded px-3 py-2 text-cyber-cyan outline-none text-xs font-bold"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => { HudAudio.playClick(); setShowCreateForm(false); }}
                className="flex-1 py-2 border border-cyber-pink/30 hover:border-cyber-pink text-cyber-pink rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-grow py-2 bg-cyber-cyan hover:bg-cyber-cyan/85 text-obsidian-deep font-bold rounded cursor-pointer"
              >
                Generate AI Lesson
              </button>
            </div>
          </form>
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
                      <span className="text-[8px] text-gray-600 block text-right font-mono font-semibold">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
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
              <form onSubmit={handleFreeSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your sentences here to check grammar errors..."
                  className="flex-1 bg-obsidian-deep border border-cyber-cyan/30 focus:border-cyber-cyan text-cyber-cyan placeholder-gray-600 rounded px-3.5 py-2 outline-none text-xs font-mono"
                />
                <button
                  type="submit"
                  className="btn-cyber-cyan px-4 py-2 rounded flex items-center justify-center gap-1 cursor-pointer"
                >
                  Send
                </button>
              </form>
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
