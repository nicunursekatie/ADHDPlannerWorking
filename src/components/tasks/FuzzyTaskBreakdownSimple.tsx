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

const QUESTIONS = [
  "What's the ideal outcome here? (keep it short)",
  "What's blocking that from happening?",
  "What needs to happen first?",
  "Anyone else involved?",
  "When does this need to be done?"
];

export const FuzzyTaskBreakdownSimple: React.FC<FuzzyTaskBreakdownSimpleProps> = ({ 
  task, 
  onClose, 
  onComplete 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', text: "Let's break down \"" + task.title + "\" into manageable steps." },
    { type: 'bot', text: QUESTIONS[0] }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input and scroll to bottom
  useEffect(() => {
    inputRef.current?.focus();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!currentInput.trim()) return;

    const userAnswer = currentInput.trim();
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userAnswer }]);
    setAnswers(prev => [...prev, userAnswer]);
    setCurrentInput('');

    // Check if we have more questions
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      // Ask next question
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setMessages(prev => [...prev, { type: 'bot', text: QUESTIONS[currentQuestionIndex + 1] }]);
      }, 500);
    } else {
      // All questions answered, generate tasks
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: "Got it! Let me create some actionable tasks for you..." }]);
        generateTasks([...answers, userAnswer]);
      }, 500);
    }
  };

  const generateTasks = async (allAnswers: string[]) => {
    setIsGenerating(true);
    
    const [outcome, blockers, firstStep, people, timing] = allAnswers;
    
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
      console.log('Attempting AI generation with', providerName, 'using model', selectedModel);
      try {
        const prompt = 
'Task: "' + task.title + '"\n\n' +
'Context from conversation:\n' +
'- Desired outcome: ' + outcome + '\n' +
'- What\'s blocking: ' + blockers + '\n' +
'- First step needed: ' + firstStep + '\n' +
'- People involved: ' + (people || 'none mentioned') + '\n' +
'- Timeline: ' + (timing || 'no specific deadline') + '\n\n' +
'CRITICAL: Generate EXECUTABLE INSTRUCTIONS, not conceptual tasks!\n\n' +
'For someone with ADHD who gets stuck between intention and action, create tasks that require ZERO additional decisions.\n\n' +
'Examples of what I need:\n' +
'BAD: "Research local options"\n' +
'GOOD: "Open Google, type \'[city name] youth cheerleading teams 2024\', write down first 3 results"\n\n' +
'BAD: "Reach out to contacts"\n' +
'GOOD: "Text Sarah: \'Hey! Do you know any good cheer teams for kids?\' Copy/paste to Mom and Jessica too"\n\n' +
'BAD: "Organize information"\n' +
'GOOD: "Open Notes app, create \'Cheer Teams\' note, paste these 3 headers: Contact Info, Costs, Schedule"\n\n' +
'Each task must:\n' +
'- Start with a specific app/tool to open or action to take\n' +
'- Include exact search terms, URLs, or message templates\n' +
'- Name specific people if mentioned in context\n' +
'- Give exact words to say/type/write\n' +
'- Be completable without any additional thinking\n\n' +
'Return ONLY a JSON array:\n' +
'[\n' +
'  {\n' +
'    "title": "Exact executable action (max 60 chars)",\n' +
'    "description": "Step-by-step: Open X, click Y, type \'exact words\', etc.",\n' +
'    "type": "communication|research|decision|cleanup|action",\n' +
'    "energyLevel": "low|medium|high",\n' +
'    "estimatedMinutes": 15,\n' +
'    "urgency": "today|tomorrow|week|month|someday",\n' +
'    "emotionalWeight": "easy|neutral|stressful|dreading"\n' +
'  }\n' +
']';

        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.formatRequest([
            { role: 'system', content: 'You create EXECUTABLE INSTRUCTIONS for people with ADHD. Never give conceptual tasks. Always provide exact steps, exact words to type/say, specific apps to open, and precise actions that require NO additional thinking or decision-making. If they need to contact someone, give them the exact message to copy/paste. If they need to search, give them the exact search terms. Make every task immediately doable without any planning.' },
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
    const tasks: GeneratedTask[] = [];
    
    // Parse the actual user inputs to create EXECUTABLE tasks
    // Start with what they said needs to happen first
    if (firstStep && firstStep.trim()) {
      // Make it executable based on keywords
      let executableStep: GeneratedTask = {
        title: 'Do this first: ' + (firstStep.length > 40 ? firstStep.substring(0, 40) + '...' : firstStep),
        description: '',
        type: 'action',
        energyLevel: 'low',
        estimatedMinutes: 15,
        urgency: 'today',
        emotionalWeight: 'neutral'
      };
      
      if (firstStep.toLowerCase().includes('call') || firstStep.toLowerCase().includes('phone')) {
        executableStep.title = 'Open phone app and dial now';
        executableStep.description = 'Script: "Hi, I\'m calling about ' + task.title + '. Can you help me with..."';
        executableStep.type = 'communication';
      } else if (firstStep.toLowerCase().includes('email') || firstStep.toLowerCase().includes('message')) {
        executableStep.title = 'Open email, paste this message';
        executableStep.description = 'Subject: "Question about ' + task.title + '"\nBody: "Hi, I need help with ' + firstStep + '. Could you..."';
        executableStep.type = 'communication';
      } else if (firstStep.toLowerCase().includes('find') || firstStep.toLowerCase().includes('search')) {
        executableStep.title = 'Open Google right now';
        executableStep.description = 'Search for: "' + firstStep.replace(/find|search|look for/gi, '').trim() + ' near me 2024"';
        executableStep.type = 'research';
      } else {
        executableStep.description = 'Open your task app/notes and write: "Started ' + firstStep + '" - just starting counts!';
      }
      
      tasks.push(executableStep);
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
      tasks.push({
        title: 'Loop in ' + personName,
        description: 'Share what you\'re working on. They might have ideas or want to help.',
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // Add urgency-based task if needed
    if (timing && (timing.toLowerCase().includes('today') || timing.toLowerCase().includes('now') || timing.toLowerCase().includes('asap'))) {
      tasks.unshift({
        title: 'Start with 5 minutes NOW',
        description: 'Pick the easiest thing and do it right now. Momentum matters more than perfection.',
        type: 'action',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'today',
        emotionalWeight: 'easy'
      });
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
    
    const apiKey = localStorage.getItem('ai_api_key');
    const providerName = localStorage.getItem('ai_provider') || 'openai';
    const modelName = localStorage.getItem('ai_model');
    
    if (apiKey) {
      try {
        const provider = getProvider(providerName);
        const selectedModel = modelName || provider.defaultModel;
        
        const refinementPrompt = 
'Here are the current tasks:\n' +
JSON.stringify(generatedTasks, null, 2) + '\n\n' +
'User feedback: "' + feedbackInput + '"\n\n' +
'Refine these tasks based on the feedback. Keep the same format but make them even MORE executable and specific.\n' +
'Remember: Each task must tell the user EXACTLY what to do, what to click, what to type, with no thinking required.\n\n' +
'Return ONLY the updated JSON array with the same structure.';

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
    // Create task objects from generated tasks
    const newTasks: Partial<Task>[] = generatedTasks.map(genTask => ({
      title: genTask.title,
      description: genTask.description,
      energyLevel: genTask.energyLevel,
      estimatedMinutes: genTask.estimatedMinutes,
      urgency: genTask.urgency,
      emotionalWeight: genTask.emotionalWeight,
      projectId: task.projectId,
      priority: genTask.urgency === 'today' ? 'high' : 'medium',
      braindumpSource: "Broken down from: " + task.title
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