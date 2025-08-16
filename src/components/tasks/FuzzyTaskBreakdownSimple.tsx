import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Task } from '../../types';
import { getProvider } from '../../utils/aiProviders';

interface FuzzyTaskBreakdownSimpleProps {
  task: Task;
  onClose: () => void;
  onComplete: (newTasks: Partial<Task>[]) => void;
}

interface Message {
  type: 'bot' | 'user';
  text: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  type: 'communication' | 'research' | 'decision' | 'cleanup' | 'action';
  energyLevel: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  urgency: 'today' | 'tomorrow' | 'week' | 'month' | 'someday';
  emotionalWeight: 'easy' | 'neutral' | 'stressful' | 'dreading';
}

// Base questions - we'll make these dynamic based on context
const BASE_QUESTIONS = [
  "What's the ideal outcome here? (keep it short)",
  "What's blocking that from happening?",
  "What info do you already have? (even tiny bits help)",
  "Anyone else involved?",
  "What happens if you don't do this soon? (or when's the deadline if there is one)"
];

// Generate contextual questions based on the task and previous answers
const getSmartQuestion = (questionIndex: number, task: Task, previousAnswers: string[]): string => {
  const baseQuestion = BASE_QUESTIONS[questionIndex];
  
  // Smart question for "Anyone else involved?"
  if (questionIndex === 3) {
    const taskLower = task.title.toLowerCase();
    const [outcome, blockers, firstStep] = previousAnswers;
    
    // Suggest involving others based on task type
    if (taskLower.includes('find') || taskLower.includes('search') || taskLower.includes('looking for')) {
      return "Who might know about this already? (friends, family, social media groups - or 'no' if doing solo)";
    }
    if (taskLower.includes('team') || taskLower.includes('class') || taskLower.includes('group')) {
      return "Who else has kids in similar activities? They might have recommendations (or type 'no')";
    }
    if (blockers && blockers.toLowerCase().includes('don\'t know')) {
      return "Who could you ask for advice? Even a quick text to a friend might help (or 'no' to figure it out yourself)";
    }
    if (taskLower.includes('move') || taskLower.includes('organize') || taskLower.includes('clean')) {
      return "Anyone who could help or needs to know about this? (or just 'no' if it's all you)";
    }
    // Default but more helpful
    return "Anyone who could help, needs to know, or might have done this before? (or just 'no')";
  }
  
  // Smart question for consequences/urgency
  if (questionIndex === 4) {
    const [outcome, blockers, info, people] = previousAnswers;
    const taskLower = task.title.toLowerCase();
    
    // Tailor the consequence question to the task type
    if (taskLower.includes('kid') || taskLower.includes('child') || taskLower.includes('daughter') || taskLower.includes('son')) {
      return "What happens if this doesn't get done this week? Next week? (e.g., 'miss the season', 'she gets more upset', 'nothing really')";
    }
    if (taskLower.includes('pay') || taskLower.includes('bill') || taskLower.includes('payment')) {
      return "What happens if you don't do this by end of week? End of month? (late fee, service cut, or just guilt?)";
    }
    if (taskLower.includes('clean') || taskLower.includes('organize')) {
      return "What happens if this waits another week? Month? (guests coming, losing things, or just mental weight?)";
    }
    if (taskLower.includes('work') || taskLower.includes('job') || taskLower.includes('boss')) {
      return "What happens if this isn't done by Monday? Next week? (boss asks, team blocked, or just stress?)";
    }
    // Default - timeframe-based consequences
    return "What happens if you don't do this by next week? Next month? (or type 'deadline: [date]' if there's a real one)";
  }
  
  // Smart follow-ups for blockers
  if (questionIndex === 1) {
    const [outcome] = previousAnswers;
    if (outcome && outcome.toLowerCase().includes('find')) {
      return "What's making this hard? (e.g., 'don't know where to look', 'too many options', 'no time to research')";
    }
  }
  
  // Smart question for "What info do you already have?"
  if (questionIndex === 2) {
    const [outcome, blockers] = previousAnswers;
    const taskLower = task.title.toLowerCase();
    
    if (taskLower.includes('find') || taskLower.includes('search')) {
      return "What do you already know? (location, budget, age requirements, someone who did this - anything!)";
    }
    if (blockers && blockers.toLowerCase().includes('don\'t know')) {
      return "What tiny piece DO you know? (a name, a website, a vague memory - literally anything)";
    }
    if (taskLower.includes('organize') || taskLower.includes('clean')) {
      return "What have you already tried or thought about? (even failed attempts count!)";
    }
    // Default but more encouraging
    return "What info do you have, even if it seems useless? (contacts, old emails, random facts)";
  }
  
  return baseQuestion;
};

export const FuzzyTaskBreakdownSimple: React.FC<FuzzyTaskBreakdownSimpleProps> = ({ 
  task, 
  onClose, 
  onComplete 
}) => {
  // Check for relevant past context
  const checkForPastContext = () => {
    const contexts = JSON.parse(localStorage.getItem('task_breakdown_contexts') || '[]');
    const taskWords = task.title.toLowerCase().split(' ');
    
    // Find similar past breakdowns
    const relevant = contexts.filter((ctx: any) => {
      const ctxWords = ctx.taskTitle.toLowerCase().split(' ');
      const commonWords = taskWords.filter(word => 
        word.length > 4 && ctxWords.includes(word)
      );
      return commonWords.length > 0;
    });
    
    if (relevant.length > 0) {
      const recent = relevant[relevant.length - 1];
      return `I found context from a similar task ("${recent.taskTitle}"):\n` +
             `• People involved: ${recent.people || 'None'}\n` +
             `• Known info: ${recent.knownInfo || 'None'}\n` +
             `This might be helpful!`;
    }
    return null;
  };
  
  const pastContext = checkForPastContext();
  const initialMessages: Message[] = [
    { type: 'bot', text: "Let's break down \"" + task.title + "\" into manageable steps." }
  ];
  
  if (pastContext) {
    initialMessages.push({ type: 'bot', text: pastContext });
  }
  
  initialMessages.push({ type: 'bot', text: BASE_QUESTIONS[0] });
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [detailLevel, setDetailLevel] = useState<'micro' | 'normal' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input and scroll to bottom
  useEffect(() => {
    inputRef.current?.focus();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClarification = (userQuestion: string, questionIndex: number) => {
    setCurrentInput('');
    
    // Provide helpful suggestions based on what they're asking
    let suggestion = '';
    
    if (questionIndex === 3) { // "Anyone else involved?"
      if (userQuestion.toLowerCase().includes('should')) {
        const taskLower = task.title.toLowerCase();
        
        if (taskLower.includes('find') || taskLower.includes('search')) {
          suggestion = "Yes! Try asking: Local parent Facebook groups, neighbors with kids, your kid's current teachers, or that friend who always knows everything. I'll create tasks to message them with exact wording.";
        } else if (taskLower.includes('team') || taskLower.includes('sport')) {
          suggestion = "Parents of your kid's friends often know about activities. Also try: school counselors, PE teachers, or local recreation center staff. Type their names and I'll create the messages for you.";
        } else {
          suggestion = "Think about: Who's done this before? Who always has good advice? Who might be affected? Even just one name helps - I'll write the message for you.";
        }
      }
    } else if (questionIndex === 2) { // "What info do you already have?"
      if (userQuestion.toLowerCase().includes('nothing') || userQuestion.toLowerCase().includes('don\'t know')) {
        suggestion = "You know more than you think! Maybe: The city you're in? Your kid's age? That another parent mentioned something? A school that has teams? Even 'my kid likes to jump around' counts!";
      } else {
        suggestion = "Even tiny things help: A friend's kid does it? You saw a sign somewhere? There's a gym nearby? Your budget limit? Any random detail gives me something to work with!";
      }
    } else if (questionIndex === 1) { // "What's blocking?"
      suggestion = "Common blocks: Don't know where to start, too many options, waiting on someone, need information, feeling overwhelmed, or just boring. What's yours?";
    }
    
    if (suggestion) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: suggestion 
        }]);
        // Re-ask the same question
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: "So with that in mind - " + getSmartQuestion(questionIndex, task, answers) 
          }]);
        }, 1000);
      }, 500);
    }
  };

  const handleSend = async () => {
    if (!currentInput.trim()) return;

    const userAnswer = currentInput.trim();
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userAnswer }]);
    
    // Check if we're waiting for detail level choice
    if (currentQuestionIndex === -1) {
      const level = userAnswer.toLowerCase();
      if (level === 'micro' || level === 'm') {
        setDetailLevel('micro');
        setCurrentInput('');
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'bot', text: "Creating super detailed micro-steps with every action spelled out..." }]);
          generateTasks(answers, 'micro');
        }, 500);
      } else if (level === 'normal' || level === 'n') {
        setDetailLevel('normal');
        setCurrentInput('');
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'bot', text: "Creating clear tasks without overwhelming detail..." }]);
          generateTasks(answers, 'normal');
        }, 500);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: "Please type 'micro' (or 'm') for detailed steps, or 'normal' (or 'n') for regular tasks." }]);
        setCurrentInput('');
      }
      return;
    }
    
    // Check if user is asking for clarification or suggestions
    if (userAnswer.endsWith('?') || userAnswer.toLowerCase().includes('should')) {
      // They're asking us a question - provide helpful context
      handleClarification(userAnswer, currentQuestionIndex);
      return;
    }
    
    setAnswers(prev => [...prev, userAnswer]);
    setCurrentInput('');

    // Check if we have more questions
    if (currentQuestionIndex < BASE_QUESTIONS.length - 1) {
      // Ask next question - but make it smart based on context
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        const updatedAnswers = [...answers, userAnswer];
        const smartQuestion = getSmartQuestion(nextIndex, task, updatedAnswers);
        
        setCurrentQuestionIndex(nextIndex);
        setMessages(prev => [...prev, { type: 'bot', text: smartQuestion }]);
      }, 500);
    } else {
      // All questions answered, ask about detail level
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: "One more thing - how detailed should the tasks be?\n\n🔬 **Micro-steps**: Every click and keystroke spelled out\n📝 **Normal tasks**: Clear actions but not overwhelming detail\n\nType 'micro' or 'normal' (or 'm' or 'n')"
        }]);
        // Store the final answer and wait for detail level choice
        setAnswers(prev => [...prev, userAnswer]);
        setCurrentQuestionIndex(-1); // Special state for detail level question
      }, 500);
    }
  };

  const generateTasks = async (allAnswers: string[], detail: 'micro' | 'normal' = 'micro') => {
    setIsGenerating(true);
    
    const [outcome, blockers, existingInfo, people, timing] = allAnswers;
    
    // Check for API key - use the CORRECT localStorage keys!
    const apiKey = localStorage.getItem('ai_api_key');
    const providerName = localStorage.getItem('ai_provider') || 'openai';
    const modelName = localStorage.getItem('ai_model');
    console.log('API Key found:', apiKey ? 'Yes' : 'No');
    console.log('Provider:', providerName, 'Model:', modelName);
    
    if (apiKey) {
      // Use AI to generate tasks
      const provider = getProvider(providerName);
      const selectedModel = modelName || provider.defaultModel;
      console.log('Attempting AI generation with', providerName, 'using model', selectedModel, 'detail level:', detail);
      try {
        const promptBase = 
'Task: "' + task.title + '"\n\n' +
'Context from conversation:\n' +
'- Desired outcome: ' + outcome + '\n' +
'- What\'s blocking: ' + blockers + '\n' +
'- What they already know: ' + (existingInfo || 'nothing specific mentioned') + '\n' +
'- People involved: ' + (people || 'none mentioned') + '\n' +
'- Consequences if delayed: ' + (timing || 'no specific consequences mentioned') + '\n\n' +
'Use the CONSEQUENCES to set urgency - if "kid asking daily" = today, if "miss the season" = this week, if "just bothering me" = someday\n\n' +
'CRITICAL: Only use information EXPLICITLY provided in the conversation above!\n' +
'- If they said "Jackie knows about teams" → create task about texting Jackie\n' +
'- If they did NOT mention gyms → do NOT create tasks about gyms\n' +
'- If they did NOT mention specific places → start with Google searches\n' +
'- Build tasks from THEIR actual answers, not your assumptions\n\n';

        const microPrompt = promptBase +
'USER WANTS: MICRO-STEPS with every detail spelled out\n\n' +
'CRITICAL: Generate EXECUTABLE MICRO-INSTRUCTIONS!\n\n' +
'FORBIDDEN TASKS - NEVER GENERATE THESE:\n' +
'❌ "Research..." (too vague)\n' +
'❌ "Create a list..." (what list? how?)\n' +
'❌ "Reach out..." (to who? saying what?)\n' +
'❌ "Schedule..." (how? where? with who?)\n' +
'❌ "Reflect on..." (absolutely useless)\n' +
'❌ "Plan..." (that\'s what we\'re doing NOW)\n' +
'❌ "Organize..." (HOW?!)\n' +
'❌ "Consider..." (no thinking, only doing)\n\n' +
'REQUIRED - Every task MUST:\n' +
'✓ Start with "Open [specific app/website]" or "Pick up [specific object]"\n' +
'✓ Include EXACT words to type, say, or write (in quotes)\n' +
'✓ Give specific names, numbers, or addresses\n' +
'✓ Be doable in one sitting without getting up (unless it\'s specifically about going somewhere)\n\n' +
'REQUIRED FORMAT for each task type:\n\n' +
'FOR SEARCHING:\n' +
'Title: "Google: [exact search phrase]"\n' +
'Description: "Open browser, type exactly: \'[city from context] youth cheerleading age [age]\'. Click top 3 results. For each, write down: name, phone, website. Close tabs after."\n\n' +
'FOR TEXTING SOMEONE:\n' +
'Title: "Text [exact name]"\n' +
'Description: MUST include the FULL message to copy. Example: "Open messages, find Jackie, copy and send exactly: \'Hey! Quick question - my daughter wants to start cheerleading. Know any good teams or where to look? Thanks!\' Don\'t edit, just send."\n\n' +
'FOR CALLING:\n' +
'Title: "Call [specific place or number]"\n' +
'Description: "If you mentioned a specific place, call them. Otherwise, call the first result from your Google search. Say: \'Hi, my daughter is [age] and interested in cheer. What programs do you have?\'"\n\n' +
'READ THE CONTEXT! If user said:\n' +
'- "Jackie might know" → Task: "Text Jackie: [message]"\n' +
'- "I live in Seattle" → Task: "Google: Seattle youth cheerleading"\n' +
'- Nothing about gyms → DO NOT create gym tasks!\n' +
'- "She\'s 7" → Use age 7 in searches\n' +
'Only create tasks based on information they ACTUALLY provided.\n\n' +
'NEVER create meta-tasks about planning, reflecting, considering, or organizing. Only concrete actions!\n\n' +
'Return ONLY a JSON array:\n' +
'[\n' +
'  {\n' +
'    "title": "Exact executable action (max 60 chars)",\n' +
'    "description": "Step-by-step: Open X, click Y, type \'exact words\', etc. FOR TEXT MESSAGES: ALWAYS include the complete message to send!",\n' +
'    "type": "communication|research|decision|cleanup|action",\n' +
'    "energyLevel": "low|medium|high",\n' +
'    "estimatedMinutes": 15,\n' +
'    "urgency": "today|tomorrow|week|month|someday",\n' +
'    "emotionalWeight": "easy|neutral|stressful|dreading"\n' +
'  }\n' +
']';
        
        const normalPrompt = promptBase +
'USER WANTS: Clear tasks without overwhelming detail\n\n' +
'Generate ACTIONABLE TASKS (not micro-managed):\n\n' +
'FORBIDDEN TASKS - NEVER GENERATE THESE:\n' +
'❌ "Research [topic]" → Instead: "Find 3 [specific thing] options online"\n' +
'❌ "Organize [thing]" → Instead: "Sort [thing] into [specific categories]"\n' +
'❌ "Plan [activity]" → Instead: "Pick date and location for [activity]"\n' +
'❌ "Consider options" → Instead: "Compare top 3 [specific options]"\n' +
'❌ "Reflect on..." → Never useful\n\n' +
'REQUIRED - Every task MUST:\n' +
'✓ Be a clear, single action\n' +
'✓ Include what to look for or ask\n' +
'✓ Have a concrete deliverable\n' +
'✓ Be completable in one session\n\n' +
'EXAMPLES of good normal tasks:\n' +
'- "Find 3 local cheerleading programs online"\n' +
'- "Call top option and ask about registration"\n' +
'- "Text Jackie about cheer team recommendations"\n' +
'- "Compare costs and schedules of 3 programs"\n' +
'- "Fill out registration for chosen program"\n\n' +
'FOR TEXTING: Always include the message!\n' +
'Title: "Text Jackie about cheer teams"\n' +
'Description: "Send: \'Hey! Charlotte wants to do cheerleading. Know any good teams or where I should look? Thanks!\'"\n\n' +
'FOR RESEARCH:\n' +
'Title: "Find 3 local cheer programs"\n' +
'Description: "Search for youth cheerleading in your area. Get names, websites, and contact info for 3 options."\n\n' +
'FOR CALLING:\n' +
'Title: "Call programs about late registration"\n' +
'Description: "Call the programs you found. Ask: Can kids still join? What\'s the schedule? What\'s the cost?"\n\n' +
'Return ONLY a JSON array with these normal-level tasks.';

        const prompt = detail === 'micro' ? microPrompt : normalPrompt;
        const systemMessage = detail === 'micro' 
          ? 'RULE 1: Only use information ACTUALLY PROVIDED by the user. Do NOT invent gyms, places, or people they didn\'t mention. RULE 2: Every task must include EXACTLY what to open and EXACTLY what to type/say (in quotes). RULE 3: If they mentioned Jackie, use Jackie. If they didn\'t mention gyms, don\'t create gym tasks. Only work with what they actually said.'
          : 'Generate clear, actionable tasks without overwhelming detail. Each task should be a single action with a concrete outcome. For text messages, ALWAYS include the full message to send in the description.';
        
        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.formatRequest([
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ], selectedModel))
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AI Response received:', data);
          const content = provider.parseResponse(data);
          console.log('Parsed content:', content);
          const jsonMatch = content.match(/\[.*\]/s);
          if (jsonMatch) {
            const tasks = JSON.parse(jsonMatch[0]) as GeneratedTask[];
            console.log('Generated tasks from AI:', tasks);
            setGeneratedTasks(tasks.slice(0, 5));
            setShowTasks(true);
            setIsGenerating(false);
            
            // Show success message
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                {
                  type: 'bot',
                  text: "I've created " + tasks.length + " tasks to get you started. Ready to replace the fuzzy task?"
                }
              ]);
            }, 1000);
            return;
          } else {
            console.error('No JSON array found in AI response:', content);
          }
        } else {
          console.error('AI API call failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('AI generation failed with exception:', error);
      }
    }
    
    // Fallback: Generate smart tasks based on actual context
    console.log('Using fallback task generation');
    let tasks: GeneratedTask[] = [];
    
    // Parse the actual user inputs to create EXECUTABLE tasks
    // Use what they already know to create the first task
    if (existingInfo && existingInfo.trim() && !existingInfo.toLowerCase().includes('nothing')) {
      // Build on what they know
      const info = existingInfo.toLowerCase();
      
      if (info.includes('gym') || info.includes('center') || info.includes('place')) {
        tasks.push({
          title: 'Call that place you mentioned',
          description: 'Phone script: "Hi, do you have cheerleading programs for [age] year olds? What\'s the schedule and cost?"',
          type: 'communication',
          energyLevel: 'medium',
          estimatedMinutes: 5,
          urgency: 'today',
          emotionalWeight: 'neutral'
        });
      } else if (info.includes('friend') || info.includes('know someone') || (people && people.trim() && people.toLowerCase() !== 'no')) {
        const personName = info.match(/(\w+) (?:knows|might|could|has)/)?.[1] || people.split(/[,\s]/)[0] || 'them';
        tasks.push({
          title: 'Text ' + personName + ' right now',
          description: 'Open messages, find ' + personName + ', copy and send this exact message: "Hey! Quick question - ' + outcome + '. Do you know any good options or where I should look? Thanks!" Don\'t edit, just send.',
          type: 'communication',
          energyLevel: 'low',
          estimatedMinutes: 2,
          urgency: 'today',
          emotionalWeight: 'easy'
        });
      } else if (info.includes('age') || info.includes('year')) {
        tasks.push({
          title: 'Google: "[your city] cheerleading age [X]"',
          description: 'Replace [your city] with your actual city and [X] with the age mentioned. Click first 3 results, screenshot each.',
          type: 'research',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'today',
          emotionalWeight: 'easy'
        });
      } else {
        // Generic but using their info
        tasks.push({
          title: 'Write down what you know',
          description: 'Open Notes app, type: "' + existingInfo + '" - then add 3 questions you want answered about it.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 5,
          urgency: 'today',
          emotionalWeight: 'easy'
        });
      }
    }
    
    
    // Break down blockers into executable actions
    if (blockers && blockers.trim()) {
      // If they don't know something, give exact search terms
      if (blockers.toLowerCase().includes('don\'t know') || blockers.toLowerCase().includes('not sure')) {
        const unknownThing = blockers.replace(/i don't know|not sure|unsure about/gi, '').trim();
        tasks.push({
          title: 'Google this exact phrase now',
          description: 'Search: "how to ' + unknownThing + ' step by step guide"\nThen: "' + unknownThing + ' for beginners"\nWrite down first answer you find.',
          type: 'research',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'week',
          emotionalWeight: 'easy'
        });
      }
      
      // If they need to do something, make it executable
      if (blockers.toLowerCase().includes('need to') || blockers.toLowerCase().includes('have to')) {
        const needToDo = blockers.replace(/i need to|have to|must/gi, '').trim();
        tasks.push({
          title: 'Open Notes app, write this',
          description: 'Type exactly: "To do ' + task.title + ', I need to: ' + needToDo + '"\nThen add 3 bullet points for mini-steps.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 5,
          urgency: 'week',
          emotionalWeight: 'easy'
        });
      }
    }
    
    // Create a task based on the desired outcome
    if (outcome && outcome.trim()) {
      tasks.push({
        title: 'Define success: ' + (outcome.length > 30 ? outcome.substring(0, 30) + '...' : outcome),
        description: 'Write down exactly what "done" looks like. This is your target.',
        type: 'decision',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    
    // Add tasks based on people involved
    if (people && people.trim() && people.toLowerCase() !== 'no' && people.toLowerCase() !== 'none') {
      const personName = people.split(/[,(]/)[0].trim();
      const taskDescription = task.title.toLowerCase();
      
      // Create specific message based on task context
      let messageContent = '';
      if (taskDescription.includes('cheer') || taskDescription.includes('team') || taskDescription.includes('sport')) {
        messageContent = 'Hey ' + personName + '! Quick question - my daughter wants to join a cheerleading team. Do you know any good programs or have any recommendations? Would really appreciate any tips!';
      } else if (taskDescription.includes('find') || taskDescription.includes('looking')) {
        messageContent = 'Hey ' + personName + '! I\'m trying to ' + task.title.toLowerCase() + '. Have you done this before or know anyone who has? Could use some advice!';
      } else {
        messageContent = 'Hey ' + personName + '! Working on something and could use your input: ' + task.title + '. Any thoughts or suggestions?';
      }
      
      tasks.push({
        title: 'Text ' + personName + ' for help',
        description: 'Open messages, find ' + personName + ', copy and send this exact message: "' + messageContent + '" Wait for their response before moving forward.',
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // Add urgency based on consequences
    if (timing && timing.trim()) {
      const consequence = timing.toLowerCase();
      let urgencyLevel: 'today' | 'tomorrow' | 'week' | 'month' | 'someday' = 'week';
      
      // Parse consequences to determine urgency
      if (consequence.includes('daily') || consequence.includes('asking') || consequence.includes('crying') || consequence.includes('upset')) {
        urgencyLevel = 'today';
        tasks.unshift({
          title: 'Start NOW - kid is waiting',
          description: 'Open Google right now and search. Your kid needs this. 5 minutes to show you care.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 5,
          urgency: 'today',
          emotionalWeight: 'easy'
        });
      } else if (consequence.includes('miss') || consequence.includes('deadline') || consequence.includes('late fee')) {
        urgencyLevel = 'tomorrow';
        tasks.unshift({
          title: 'Do this TODAY to avoid consequences',
          description: 'Set a timer for 15 minutes. Do the first task below. Avoiding the consequence is worth 15 minutes.',
          type: 'action',
          energyLevel: 'medium',
          estimatedMinutes: 15,
          urgency: 'today',
          emotionalWeight: 'neutral'
        });
      } else if (consequence.includes('stress') || consequence.includes('bothering') || consequence.includes('guilt')) {
        // Mental load consequences - still important!
        tasks.push({
          title: 'Clear this from your mental load',
          description: 'This is taking up brain space. Do one small step to get it moving.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'week',
          emotionalWeight: 'easy'
        });
      }
      
      // Adjust all task urgencies based on consequences
      tasks = tasks.map(t => ({ ...t, urgency: urgencyLevel }));
    }
    
    // If we have no tasks yet, create generic helpful ones based on the original task
    if (tasks.length === 0) {
      tasks.push(
        {
          title: 'Break it into 3 parts',
          description: 'List the 3 main components of "' + task.title + '". Pick the easiest one.',
          type: 'decision',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'today',
          emotionalWeight: 'easy'
        },
        {
          title: 'Set up for success',
          description: 'Gather what you need, clear space, or schedule time. Preparation counts as progress.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 15,
          urgency: 'week',
          emotionalWeight: 'easy'
        }
      );
    }
    
    const finalTasks = tasks.slice(0, 5);
    setGeneratedTasks(finalTasks);
    setShowTasks(true);
    setIsGenerating(false);
    
    // Show success message
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "I've created " + finalTasks.length + " tasks to get you started. Ready to replace the fuzzy task?"
      }]);
    }, 1000);
  };

  const handleFeedback = async () => {
    if (!feedbackInput.trim() || !generatedTasks.length) return;
    
    setIsGenerating(true);
    setFeedbackMode(false);
    
    // Show loading message
    setMessages(prev => [...prev, { 
      type: 'bot', 
      text: "Refining tasks based on your feedback..."
    }]);
    
    const apiKey = localStorage.getItem('ai_api_key');
    const providerName = localStorage.getItem('ai_provider') || 'openai';
    const modelName = localStorage.getItem('ai_model');
    
    if (apiKey) {
      try {
        const provider = getProvider(providerName);
        const selectedModel = modelName || provider.defaultModel;
        
        const refinementPrompt = 
'Current tasks:\n' +
JSON.stringify(generatedTasks, null, 2) + '\n\n' +
'User complaint: "' + feedbackInput + '"\n\n' +
'FIX THESE TASKS! Common problems:\n' +
'- "Call the gym you mentioned" → User: "I don\'t know what gym!" → Fix: "Google: gyms near me with kids programs"\n' +
'- "Open Google Chrome for options" → User: "Then what??" → Fix: "Google: \'[your city] youth cheer teams\', click first 3 links"\n' +
'- Vague references → Make them SPECIFIC actions\n\n' +
'If user says they don\'t know something, NEVER reference it. Create a task to FIND it first.\n' +
'Every task must be doable even if user has memory of a goldfish.\n\n' +
'Return the FIXED JSON array:';

        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.formatRequest([
            { role: 'system', content: 'You refine task lists to be MORE executable based on user feedback. Always make tasks more specific, never more vague. Include exact words, exact steps, exact actions.' },
            { role: 'user', content: refinementPrompt }
          ], selectedModel))
        });

        if (response.ok) {
          const data = await response.json();
          const content = provider.parseResponse(data);
          const jsonMatch = content.match(/\[.*\]/s);
          if (jsonMatch) {
            const refinedTasks = JSON.parse(jsonMatch[0]) as GeneratedTask[];
            setGeneratedTasks(refinedTasks.slice(0, 5));
            setMessages(prev => [...prev, { 
              type: 'bot', 
              text: "I've refined the tasks based on your feedback. Take a look!"
            }]);
          }
        }
      } catch (error) {
        console.error('Refinement failed:', error);
      }
    }
    
    setFeedbackInput('');
    setIsGenerating(false);
  };

  const handleComplete = async () => {
    // Compile all the context information from the conversation
    const contextSummary = `
=== Context from Task Breakdown ===
Original task: ${task.title}

Desired outcome: ${answers[0] || 'Not specified'}
What's blocking: ${answers[1] || 'Not specified'}
What they know: ${answers[2] || 'Not specified'}
People involved: ${answers[3] || 'None'}
Consequences: ${answers[4] || 'Not specified'}

Generated on: ${new Date().toLocaleDateString()}
===================================
`;
    
    // Create a detailed log entry for reflection
    const logEntry = {
      date: new Date().toISOString(),
      readableDate: new Date().toLocaleString(),
      originalTask: task.title,
      conversation: {
        outcome: answers[0] || 'Not specified',
        blockers: answers[1] || 'Not specified', 
        knownInfo: answers[2] || 'Not specified',
        people: answers[3] || 'None',
        consequences: answers[4] || 'Not specified'
      },
      generatedTasks: generatedTasks.map(t => ({
        title: t.title,
        description: t.description,
        minutes: t.estimatedMinutes,
        energy: t.energyLevel
      })),
      reflectionPrompts: [
        `Pattern: Am I often blocked by "${answers[1]}"?`,
        `Resource: Could ${answers[3]} help with other tasks too?`,
        `Learning: What did I discover about ${task.title}?`
      ]
    };
    
    // Save to the breakdown log
    const existingLog = JSON.parse(localStorage.getItem('task_breakdown_log') || '[]');
    existingLog.unshift(logEntry); // Add to beginning so newest is first
    
    // Keep last 100 entries for the log
    if (existingLog.length > 100) {
      existingLog.pop();
    }
    localStorage.setItem('task_breakdown_log', JSON.stringify(existingLog));
    
    // Create a markdown version for easy copying
    const markdownLog = `
## Task Breakdown Log - ${new Date().toLocaleDateString()}

### Original Task: "${task.title}"

**What I wanted:** ${answers[0] || 'Not specified'}

**What was blocking me:** ${answers[1] || 'Not specified'}

**What I already knew:** ${answers[2] || 'Not specified'}

**People who could help:** ${answers[3] || 'None'}

**Consequences of delay:** ${answers[4] || 'Not specified'}

### Tasks Generated:
${generatedTasks.map((t, i) => `${i + 1}. **${t.title}** (${t.estimatedMinutes}min, ${t.energyLevel} energy)
   - ${t.description}`).join('\n')}

### Reflection Questions:
- Am I seeing patterns in what blocks me?
- Who else could I reach out to for help?
- What did I learn that applies to other tasks?

---
`;
    
    // Save markdown version separately for easy export
    const markdownLogs = localStorage.getItem('task_breakdown_markdown_log') || '';
    localStorage.setItem('task_breakdown_markdown_log', markdownLog + markdownLogs);
    
    // Save context to localStorage for future reference
    const contextKey = `task_context_${task.id || Date.now()}`;
    localStorage.setItem(contextKey, contextSummary);
    
    // Also save a general context history (keep existing code)
    const existingContexts = JSON.parse(localStorage.getItem('task_breakdown_contexts') || '[]');
    existingContexts.push({
      taskTitle: task.title,
      date: new Date().toISOString(),
      outcome: answers[0],
      blockers: answers[1],
      knownInfo: answers[2],
      people: answers[3],
      consequences: answers[4],
      contextKey: contextKey
    });
    // Keep only last 50 contexts
    if (existingContexts.length > 50) {
      existingContexts.shift();
    }
    localStorage.setItem('task_breakdown_contexts', JSON.stringify(existingContexts));
    
    // Create task objects from generated tasks
    const newTasks: Partial<Task>[] = generatedTasks.map((genTask, index) => ({
      title: genTask.title,
      description: genTask.description,
      energyLevel: genTask.energyLevel,
      estimatedMinutes: genTask.estimatedMinutes,
      urgency: genTask.urgency,
      emotionalWeight: genTask.emotionalWeight,
      projectId: task.projectId,
      priority: genTask.urgency === 'today' ? 'high' : 'medium',
      notes: index === 0 ? contextSummary : "Part of: " + task.title  // Add full context to first task
    }));
    
    onComplete(newTasks);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Task Breakdown Helper</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={"flex " + (message.type === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={"max-w-[80%] px-4 py-2 rounded-2xl " + (
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Generated Tasks Preview */}
        {showTasks && !isGenerating && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-[200px] overflow-y-auto">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Generated tasks:</p>
            <div className="space-y-1">
              {generatedTasks.map((task, index) => (
                <div key={index} className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}. {task.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {task.estimatedMinutes} min • {task.energyLevel} energy
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFeedbackMode(true)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm font-medium"
              >
                Refine these tasks
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium"
              >
                Accept & use these
              </button>
            </div>
            <button
              onClick={() => {
                const log = localStorage.getItem('task_breakdown_markdown_log');
                if (log) {
                  // Copy to clipboard
                  navigator.clipboard.writeText(log);
                  // Show success message in chat
                  setMessages(prev => [...prev, { 
                    type: 'bot', 
                    text: '📋 Log copied! Paste it into your notes app to review patterns and insights.'
                  }]);
                } else {
                  setMessages(prev => [...prev, { 
                    type: 'bot', 
                    text: 'No logs yet. Complete some breakdowns to build your log!'
                  }]);
                }
              }}
              className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
            >
              View my breakdown history & patterns
            </button>
          </div>
        )}

        {/* Feedback Input */}
        {feedbackMode && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              How should I adjust these tasks? (e.g., "make them more specific", "add phone numbers", "simpler language")
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && feedbackInput.trim()) {
                    e.preventDefault();
                    handleFeedback();
                  }
                }}
                placeholder="Tell me how to improve these tasks..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isGenerating}
                autoFocus
              />
              <button
                onClick={handleFeedback}
                disabled={!feedbackInput.trim() || isGenerating}
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {!showTasks && !feedbackMode && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isGenerating}
              />
              <button
                onClick={handleSend}
                disabled={!currentInput.trim() || isGenerating}
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Quick tip: Keep answers short and simple
            </p>
          </div>
        )}
      </div>
    </div>
  );
};