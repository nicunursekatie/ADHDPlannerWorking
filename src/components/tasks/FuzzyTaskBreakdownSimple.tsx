import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import { AI_PROVIDERS, getProvider } from '../../utils/aiProviders';

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
  const { categories, addTask, deleteTask } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', text: `Let's break down "${task.title}" into manageable steps.` },
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
        const prompt = `
Task: "${task.title}"

Context from conversation:
- Desired outcome: ${outcome}
- What's blocking: ${blockers}
- First step needed: ${firstStep}
- People involved: ${people || 'none mentioned'}
- Timeline: ${timing || 'no specific deadline'}

Generate 3-5 specific, actionable tasks that directly address these points. Focus on the immediate next actions.

Return ONLY a JSON array:
[
  {
    "title": "Specific action (max 60 chars)",
    "description": "What to do and why (1-2 sentences)",
    "type": "communication|research|decision|cleanup|action",
    "energyLevel": "low|medium|high",
    "estimatedMinutes": 15,
    "urgency": "today|tomorrow|week|month|someday",
    "emotionalWeight": "easy|neutral|stressful|dreading"
  }
]`;

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
              setMessages(prev => [...prev, { 
                type: 'bot', 
                text: `I've created ${tasks.length} tasks to get you started. Ready to replace the fuzzy task?` 
              }]);
            }, 1000);
            return;
          }
        }
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    }
    
    // Fallback: Generate tasks based on patterns
    const tasks: GeneratedTask[] = [];
    
    // Based on first step
    if (firstStep.toLowerCase().includes('call') || firstStep.toLowerCase().includes('email') || 
        firstStep.toLowerCase().includes('contact') || firstStep.toLowerCase().includes('ask')) {
      tasks.push({
        title: `Contact: ${firstStep.substring(0, 50)}`,
        description: `Reach out as described: ${firstStep}. This addresses: ${blockers}`,
        type: 'communication',
        energyLevel: 'medium',
        estimatedMinutes: 15,
        urgency: timing?.toLowerCase().includes('today') ? 'today' : 'week',
        emotionalWeight: 'neutral'
      });
    }
    
    // Based on blockers
    if (blockers.toLowerCase().includes('don\'t know') || blockers.toLowerCase().includes('not sure') ||
        blockers.toLowerCase().includes('find') || blockers.toLowerCase().includes('research')) {
      tasks.push({
        title: `Research: ${blockers.substring(0, 45)}`,
        description: `Find information to address: ${blockers}. Goal: ${outcome}`,
        type: 'research',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // Based on people
    if (people && people.toLowerCase() !== 'no' && people.toLowerCase() !== 'none') {
      const peopleList = people.split(/[,&]/).map(p => p.trim());
      peopleList.forEach(person => {
        if (person && !tasks.some(t => t.title.includes(person))) {
          tasks.push({
            title: `Coordinate with ${person.substring(0, 40)}`,
            description: `Discuss the plan with ${person} about: ${outcome}`,
            type: 'communication',
            energyLevel: 'low',
            estimatedMinutes: 10,
            urgency: 'week',
            emotionalWeight: 'neutral'
          });
        }
      });
    }
    
    // Based on outcome
    if (outcome.toLowerCase().includes('refund') || outcome.toLowerCase().includes('cancel')) {
      tasks.push({
        title: 'Handle refund/cancellation',
        description: `Process the refund or cancellation to achieve: ${outcome}`,
        type: 'cleanup',
        energyLevel: 'low',
        estimatedMinutes: 20,
        urgency: 'week',
        emotionalWeight: 'easy'
      });
    }
    
    // Always add a concrete first action if we don't have enough
    if (tasks.length === 0) {
      tasks.push({
        title: `First step: ${firstStep.substring(0, 45)}`,
        description: `Start with: ${firstStep}. This moves you toward: ${outcome}`,
        type: 'action',
        energyLevel: 'medium',
        estimatedMinutes: 20,
        urgency: timing?.toLowerCase().includes('urgent') ? 'today' : 'week',
        emotionalWeight: 'neutral'
      });
    }
    
    setGeneratedTasks(tasks.slice(0, 5));
    setShowTasks(true);
    setIsGenerating(false);
    
    // Show success message
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: `I've created ${tasks.length} tasks to get you started. Ready to replace the fuzzy task?` 
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
      braindumpSource: `Broken down from: ${task.title}`
    }));
    
    onComplete(newTasks);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
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
                onKeyPress={handleKeyPress}
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