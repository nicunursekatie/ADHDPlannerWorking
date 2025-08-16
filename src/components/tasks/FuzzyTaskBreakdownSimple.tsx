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
    
    // Check for API key
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (apiKey) {
      // Use AI to generate tasks
      try {
        const prompt = 
'Task: "' + task.title + '"\n\n' +
'Context from conversation:\n' +
'- Desired outcome: ' + outcome + '\n' +
'- What\'s blocking: ' + blockers + '\n' +
'- First step needed: ' + firstStep + '\n' +
'- People involved: ' + (people || 'none mentioned') + '\n' +
'- Timeline: ' + (timing || 'no specific deadline') + '\n\n' +
'Generate 3-5 specific, actionable tasks that directly address these points. Focus on the immediate next actions.\n\n' +
'Return ONLY a JSON array:\n' +
'[\n' +
'  {\n' +
'    "title": "Specific action (max 60 chars)",\n' +
'    "description": "What to do and why (1-2 sentences)",\n' +
'    "type": "communication|research|decision|cleanup|action",\n' +
'    "energyLevel": "low|medium|high",\n' +
'    "estimatedMinutes": 15,\n' +
'    "urgency": "today|tomorrow|week|month|someday",\n' +
'    "emotionalWeight": "easy|neutral|stressful|dreading"\n' +
'  }\n' +
']';

        const provider = getProvider('openai');
        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.formatRequest([
            { role: 'system', content: 'You help break down overwhelming tasks into simple, concrete next steps. Be specific and actionable.' },
            { role: 'user', content: prompt }
          ], 'gpt-4o-mini'))
        });

        if (response.ok) {
          const data = await response.json();
          const content = provider.parseResponse(data);
          const jsonMatch = content.match(/\[.*\]/s);
          if (jsonMatch) {
            const tasks = JSON.parse(jsonMatch[0]) as GeneratedTask[];
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
          }
        }
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    }
    
    // Fallback: Generate smart tasks based on actual context
    const tasks: GeneratedTask[] = [];
    
    // Analyze what the user actually needs
    const needsResearch = blockers.toLowerCase().includes('don\'t know') || 
                         blockers.toLowerCase().includes('find') ||
                         blockers.toLowerCase().includes('not sure') ||
                         blockers.toLowerCase().includes('options');
    
    const needsRefund = outcome.toLowerCase().includes('refund') || 
                       outcome.toLowerCase().includes('money back') ||
                       blockers.toLowerCase().includes('money');
    
    const hasEmotionalBlock = blockers.toLowerCase().includes('feel') ||
                             blockers.toLowerCase().includes('guilt') ||
                             blockers.toLowerCase().includes('terrible') ||
                             blockers.toLowerCase().includes('shame') ||
                             blockers.toLowerCase().includes('letting') ||
                             blockers.toLowerCase().includes('down');
    
    // const needsToContact = firstStep.toLowerCase().includes('call') ||
    //                       firstStep.toLowerCase().includes('email') ||
    //                       firstStep.toLowerCase().includes('contact') ||
    //                       firstStep.toLowerCase().includes('ask') ||
    //                       firstStep.toLowerCase().includes('talk');
    
    // Generate ACTUAL helpful tasks based on the context
    
    // 1. If they need to research options (like finding local cheer teams)
    if (needsResearch) {
      tasks.push({
        title: 'Google search: 3 local options',
        description: 'Quick 15-minute search. Just find 3 options with phone numbers. Don\'t overthink - any 3 will do.',
        type: 'research',
        energyLevel: 'low',
        estimatedMinutes: 15,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
      
      tasks.push({
        title: 'Call the first place on your list',
        description: 'Just one call. Ask: "Are you accepting new members? What\'s the process?" That\'s it.',
        type: 'communication',
        energyLevel: 'medium',
        estimatedMinutes: 10,
        urgency: 'week',
        emotionalWeight: 'neutral'
      });
    }
    
    // 2. If they need a refund
    if (needsRefund) {
      tasks.push({
        title: 'Email for refund (use template)',
        description: 'Template: "Hi, we moved counties and can\'t attend. Please process a refund for [child name]. Thank you." Send and done.',
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // 3. If there's emotional blocking
    if (hasEmotionalBlock) {
      tasks.push({
        title: 'Text a friend: "Parenting is hard today"',
        description: 'You don\'t have to explain. Just reach out to someone who gets it. Or skip this - you\'re doing your best.',
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 2,
        urgency: 'someday',
        emotionalWeight: 'easy'
      });
    }
    
    // 4. If someone else is affected (like Charlotte)
    if (people && people.toLowerCase() !== 'no' && people.toLowerCase() !== 'none') {
      // Extract the actual person's name intelligently
      const personName = people.includes('(') ? people.split('(')[0].trim() : people.split(',')[0].trim();
      tasks.push({
        title: "Quick chat with " + personName,
        description: "\"Hey, we're working on finding a new team. Want to help me look?\" Make it collaborative, not guilty.",
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // 5. Based on what they said needs to happen first
    if (firstStep && firstStep.length > 3) {
      // Parse their first step more intelligently
      if (firstStep.toLowerCase().includes('refund')) {
        if (!tasks.some(t => t.title.includes('refund'))) {
          tasks.push({
            title: 'Get the refund process started',
            description: 'One email or call. Don\'t wait for perfect wording. "We moved, need refund" is enough.',
            type: 'communication',
            energyLevel: 'low',
            estimatedMinutes: 10,
            urgency: 'week',
            emotionalWeight: 'easy'
          });
        }
      } else if (firstStep.toLowerCase().includes('find') || firstStep.toLowerCase().includes('look')) {
        if (!tasks.some(t => t.type === 'research')) {
          tasks.push({
            title: 'Quick search - set 10 min timer',
            description: 'Set a timer for 10 minutes. Find ANY option. Perfection is the enemy here.',
            type: 'research',
            energyLevel: 'low',
            estimatedMinutes: 10,
            urgency: 'week',
            emotionalWeight: 'easy'
          });
        }
      }
    }
    
    // 6. If timeline is urgent, add a "do it now" task
    if (timing?.toLowerCase().includes('today') || timing?.toLowerCase().includes('urgent') || 
        timing?.toLowerCase().includes('asap')) {
      tasks.unshift({
        title: 'Do ONE thing right now',
        description: 'Pick the easiest task below and do it immediately. 5 minutes. Progress beats perfection.',
        type: 'action',
        energyLevel: 'low',
        estimatedMinutes: 5,
        urgency: 'today',
        emotionalWeight: 'easy'
      });
    }
    
    // Make sure we don't have duplicate types of tasks
    const uniqueTasks = tasks.reduce((acc, task) => {
      // Don't add multiple research tasks or multiple similar communication tasks
      const hasSimilar = acc.some(t => 
        (t.type === task.type && t.title.toLowerCase().includes(task.title.toLowerCase().substring(0, 10))) ||
        (t.title === task.title)
      );
      if (!hasSimilar) {
        acc.push(task);
      }
      return acc;
    }, [] as GeneratedTask[]);
    
    // If we still have no tasks, create simple concrete ones
    if (uniqueTasks.length === 0) {
      uniqueTasks.push(
        {
          title: 'Write down what you need',
          description: 'Take 2 minutes. Write the outcome you want in one sentence. That\'s your north star.',
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 2,
          urgency: 'today',
          emotionalWeight: 'easy'
        },
        {
          title: 'Find one person who might know',
          description: 'Think of anyone who might have done this before. Send them a quick "Hey, quick question?" text.',
          type: 'communication',
          energyLevel: 'low',
          estimatedMinutes: 5,
          urgency: 'week',
          emotionalWeight: 'easy'
        }
      );
    }
    
    const finalTasks = uniqueTasks.length > 0 ? uniqueTasks.slice(0, 5) : tasks.slice(0, 5);
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
            <button
              onClick={handleComplete}
              className="mt-3 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium"
            >
              Replace fuzzy task with these
            </button>
          </div>
        )}

        {/* Input */}
        {!showTasks && (
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