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

        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: provider.headers(apiKey),
          body: JSON.stringify(provider.formatRequest([
            { role: 'system', content: 'You help break down overwhelming tasks into simple, concrete next steps. Be specific and actionable.' },
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
    
    // Parse the actual user inputs more intelligently
    // Start with what they said needs to happen first - this is usually the most actionable
    if (firstStep && firstStep.trim()) {
      tasks.push({
        title: firstStep.length > 50 ? firstStep.substring(0, 50) + '...' : firstStep,
        description: 'You said this needs to happen first. Start here - even a small step counts.',
        type: 'action',
        energyLevel: 'low',
        estimatedMinutes: 15,
        urgency: 'today',
        emotionalWeight: 'neutral'
      });
    }
    
    // Break down the blockers into actionable items
    if (blockers && blockers.trim()) {
      // If they don't know something, add research task
      if (blockers.toLowerCase().includes('don\'t know') || blockers.toLowerCase().includes('not sure')) {
        tasks.push({
          title: 'Quick 10-min research',
          description: 'Find just ONE piece of information that moves you forward. Set a timer.',
          type: 'research',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'week',
          emotionalWeight: 'easy'
        });
      }
      
      // If they need to contact someone
      if (blockers.toLowerCase().includes('need to') || blockers.toLowerCase().includes('have to')) {
        tasks.push({
          title: 'Draft the message/email',
          description: 'Just write it, don\'t send yet. Getting it written is half the battle.',
          type: 'communication',
          energyLevel: 'low',
          estimatedMinutes: 10,
          urgency: 'week',
          emotionalWeight: 'neutral'
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