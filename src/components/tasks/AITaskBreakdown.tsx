import React, { useState } from 'react';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { getProvider } from '../../utils/aiProviders';
import { generateId } from '../../utils/helpers';
import { 
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
  GripVertical,
  AlertCircle
} from 'lucide-react';

interface AITaskBreakdownProps {
  task: Task;
  onAccept: (subtasks: Partial<Task>[]) => void;
  onClose: () => void;
}

interface BreakdownOption {
  id: string;
  title: string;
  duration: string;
  description: string;
  selected: boolean;
  editable: boolean;
  type: 'work' | 'break' | 'review' | 'reward';
  energyRequired: 'low' | 'medium' | 'high';
  tips?: string;
}

const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({ task, onAccept, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdownOptions, setBreakdownOptions] = useState<BreakdownOption[]>([]);
  const [preferences, setPreferences] = useState({
    maxSteps: 5,
    maxDuration: 30,
    complexity: 'simple',
    includeBreaks: true,
    detailLevel: 'moderate'
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const alwaysAskContext = localStorage.getItem('ai_always_ask_context');
  const [showContextForm, setShowContextForm] = useState(
    // Default to true unless explicitly set to false
    alwaysAskContext !== 'false'
  );
  const [contextData, setContextData] = useState({
    currentState: '',
    blockers: '',
    specificGoal: '',
    environment: ''
  });

  const generateBreakdown = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get settings from localStorage
      const apiKey = localStorage.getItem('ai_api_key');
      const providerName = localStorage.getItem('ai_provider') || 'openai';
      const modelName = localStorage.getItem('ai_model');
      const provider = getProvider(providerName);
      const selectedModel = modelName || provider.defaultModel;
      
      
      if (!apiKey) {
        throw new Error('No API key configured. Please add your API key in Settings to use AI task breakdown.');
      }
    
    // Real AI API call
    const messages = [
          {
            role: 'system',
            content: `You are an ADHD-aware assistant creating actionable task breakdowns. 

CRITICAL RULES:
1. READ AND USE THE CONTEXT PROVIDED - especially blockers, current state, and specific goals
2. The "Goal" field defines the task boundary - if goal is "clean dry clothes", do NOT include putting away steps
3. UNDERSTAND THE SPECIFIC TASK - laundry means washing/drying, not folding; dishes means washing dishes, not organizing cabinets
4. Address blockers FIRST, not last - adapt steps to work around the specific challenges mentioned
5. Reduce decision fatigue by grouping, categorizing, or deferring decisions
6. Create momentum with easy wins before harder tasks
7. Each step must reduce overwhelm, clarify decision-making, or externalize mental load
8. MINIMIZE REWARDS - Focus on actual work steps, not celebration/reward steps

ADHD-AWARE PRINCIPLES:
- Triage before action: Sort into categories before detailed work
- Decision scaffolding: Break big decisions into micro-decisions  
- Externalize memory: Write things down, use containers, label clearly
- Easy wins first: Start with obvious/simple items to build momentum
- Batch similar items: Group processing reduces context switching
- Visual cues: Use physical separation, containers, or notes
- CONTEXT MATTERS: "Laundry" tasks are about washing/drying; "organizing" tasks are about finding homes for items

BREAKDOWN STRATEGY:
- FIRST: Understand what the task actually requires (washing vs folding, writing vs researching, etc.)
- If "don't know where to put things" AND task is about organizing → Create categories/zones
- If "don't know where to put things" AND task is about laundry → Focus on sorting by wash settings/colors
- If "decision fatigue" → Start with obvious/easy decisions, defer complex ones
- If "overwhelmed by volume" → Break into smaller chunks or time blocks
- If "boring/unmotivating" → Add variety, background entertainment, or alternate between task types
- ALWAYS: Make steps match the actual task - washing/drying steps for laundry, NOT organizing/putting away

NEVER:
- Jump to detailed work before triage
- Ask questions as steps
- Require decisions without scaffolding
- Process items one-by-one when batching would help
- Include reward/celebration steps unless specifically requested
- Add breaks unless the user's context indicates fatigue
- Talk about "finding homes" or "putting away" for laundry tasks - that's a different task
- Mix task types: laundry = washing/drying; organizing = finding homes/putting away

STEP TYPES:
- Use "work" for 95% of steps - actual task progress
- Use "break" ONLY if task exceeds 1 hour or user mentions fatigue
- Use "review" ONLY for final verification of complex tasks
- AVOID "reward" type entirely

Format as JSON array with structure:
[
  {
    "title": "Action-oriented title",
    "duration": "5-10 mins",
    "description": "What to do and why",
    "type": "work",
    "energyRequired": "low|medium|high",
    "tips": "ADHD-friendly tips"
  }
]`
          },
          {
            role: 'user',
            content: `Task: "${task.title}"${task.description ? `\nDetails: ${task.description}` : ''}

${contextData.currentState ? `Current state: ${contextData.currentState}` : ''}
${contextData.blockers ? `Blockers: ${contextData.blockers}` : ''}
${contextData.specificGoal ? `Goal: ${contextData.specificGoal}` : ''}
${contextData.environment ? `Constraints: ${contextData.environment}` : ''}

Create ${preferences.maxSteps} actionable WORK steps that DIRECTLY ADDRESS THE BLOCKERS LISTED ABOVE.
Each step should be ${preferences.complexity === 'simple' ? 'very simple and specific' : preferences.complexity === 'detailed' ? 'detailed with clear sub-actions' : 'moderately detailed'}.
Keep total task duration under ${preferences.maxDuration} minutes.

IMPORTANT REQUIREMENTS:
1. IDENTIFY THE TASK TYPE FIRST - "do laundry" = washing/drying, NOT organizing/putting away
2. If the blocker is "don't know where things go" - this blocker ONLY applies to organizing tasks, NOT laundry
3. If the blocker is "decision fatigue" - DEFER hard decisions, process easy items first
4. If the blocker is "overwhelming amount" - BREAK into visual chunks before processing
5. Use the context to customize steps - don't give generic task sequences
6. FOCUS ON WORK - No reward steps, minimal breaks (only if truly needed)
7. Each step should move the task forward concretely
8. LAUNDRY TASKS should include: gathering, sorting by wash type, loading washer, switching to dryer, etc.

Example adaptations:
- Task: "Clean room" + Blocker: "don't know where to put things" → First step: "Create 3 zones: keep here, belongs elsewhere, decide later"
- Task: "Do laundry" + Blocker: "overwhelming amount" → First step: "Sort into 2 loads: urgent items needed this week, everything else"
- Task: "Do laundry" + Blocker: "boring" → Steps like: "Gather while listening to podcast", "Start washer", "Set timer", "Switch to dryer"
- Task: "Fold and put away clothes" + Blocker: "don't know where things go" → First step: "Sort into piles by person/room"
- WRONG: Task "Do laundry" with steps about "finding homes" - that's organizing, not laundry!

Each step should ACTIVELY WORK AROUND the stated blockers, not ignore them.
CRITICAL: "Do laundry" = wash/dry only. "Put away laundry" = organizing/finding homes. Don't mix these!
Mark all steps as type: "work" unless a break is absolutely essential.

Return JSON array only.`
          }
        ];
    
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: provider.headers(apiKey),
      body: JSON.stringify(provider.formatRequest(messages, selectedModel))
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const content = provider.parseResponse(data);
    
    // Parse the JSON response
    let steps;
    try {
      // Extract JSON from the response (in case it includes extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        steps = JSON.parse(jsonMatch[0]);
      } else {
        steps = JSON.parse(content);
      }
      
      // Handle Groq's different response format (check both "Step" and "step")
      if (steps.length > 0 && (steps[0].Step || steps[0].step)) {
        steps = steps.map((step, index) => ({
          title: step.Step || step.step || `Step ${index + 1}`,
          duration: '5-10 mins',
          description: step.Step || step.step || `Step ${index + 1}`,
          type: 'work',
          energyRequired: 'medium',
          tips: 'Focus on this specific action'
        }));
      }
    } catch (e) {
      throw new Error('Invalid response format');
    }
    
    // Log the steps before conversion
    
    // Check if steps is actually an array with content
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('No steps returned from AI');
    }
    
    // Convert to BreakdownOption format
    const breakdown: BreakdownOption[] = steps.map((step: any, index: number) => ({
      id: `${index + 1}`,
      title: step.title || step.Step || step.step || `Step ${index + 1}`,
      duration: step.duration || '5-10 mins',
      description: step.description || step.Step || step.step || `Complete step ${index + 1}`,
      selected: true,
      editable: false,
      type: step.type || 'work',
      energyRequired: step.energyRequired || 'medium',
      tips: step.tips || 'Focus on this specific action'
    }));
    
    setBreakdownOptions(breakdown);
    } catch (err) {
      let errorMessage = 'Failed to generate breakdown: ';
      
      if (err instanceof Error) {
        if (err.message.includes('No API key')) {
          errorMessage = err.message;
        } else if (err.message.includes('API request failed') || err.message.includes('fetch')) {
          errorMessage += 'Unable to connect to AI service. Please check your API settings and try again.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'An unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOption = (id: string) => {
    setBreakdownOptions(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, selected: !opt.selected } : opt
      )
    );
  };

  const startEditing = (id: string) => {
    setBreakdownOptions(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, editable: true } : opt
      )
    );
  };

  const updateOption = (id: string, field: keyof BreakdownOption, value: string) => {
    setBreakdownOptions(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    );
  };

  const saveEdit = (id: string) => {
    setBreakdownOptions(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, editable: false } : opt
      )
    );
  };

  const deleteOption = (id: string) => {
    setBreakdownOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const addCustomStep = () => {
    const newStep: BreakdownOption = {
      id: generateId(),
      title: 'New step',
      duration: '10 mins',
      description: 'Describe this step',
      selected: true,
      editable: true,
      type: 'work',
      energyRequired: 'medium',
      tips: 'Add any ADHD-specific tips for this step'
    };
    setBreakdownOptions(prev => [...prev, newStep]);
  };

  const acceptBreakdown = () => {
    const selectedOptions = breakdownOptions.filter(opt => opt.selected);
    
    const subtasks: Partial<Task>[] = selectedOptions.map((opt, index) => {
      // Parse duration from formats like "5-10 mins" or "15 mins"
      let estimatedMinutes = 15; // default
      const durationMatch = opt.duration.match(/(\d+)(?:-(\d+))?\s*mins?/i);
      if (durationMatch) {
        const min = parseInt(durationMatch[1]);
        const max = durationMatch[2] ? parseInt(durationMatch[2]) : min;
        estimatedMinutes = Math.ceil((min + max) / 2); // Use average
      }
      
      return {
        id: generateId(),
        title: opt.title,
        description: opt.description,
        parentTaskId: task.id,
        projectId: task.projectId,
        categoryIds: task.categoryIds,
        priority: task.priority,
        completed: false,
        estimatedMinutes,
        dueDate: task.dueDate
      };
    });
    
    onAccept(subtasks);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (itemId !== draggedItem) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain') || draggedItem;
    if (!draggedId || draggedId === targetId) return;

    const items = [...breakdownOptions];
    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item
    const [draggedOption] = items.splice(draggedIndex, 1);
    
    // Insert at new position
    items.splice(targetIndex, 0, draggedOption);
    
    setBreakdownOptions(items);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedItem(null);
    setDragOverItem(null);
  };

  React.useEffect(() => {
    // Don't generate breakdown automatically if we're showing context form
    if (!showContextForm && !hasGenerated) {
      setHasGenerated(true);
      generateBreakdown();
    }
  }, [showContextForm, hasGenerated]);
  
  // Reset state when component unmounts only
  React.useEffect(() => {
    return () => {
      setHasGenerated(false);
      setBreakdownOptions([]);
      setError(null);
      setContextData({
        currentState: '',
        blockers: '',
        specificGoal: '',
        environment: ''
      });
    };
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Task Breakdown" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <div className="flex items-center">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Breaking down: {task.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {showContextForm 
                  ? 'Let\'s understand this task better for a personalized breakdown' 
                  : 'AI is creating manageable steps for you'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start">
              <X size={20} className="mr-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Unable to generate breakdown</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                {error.includes('API key') && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                    <a href="/settings" className="underline font-medium hover:text-red-600 dark:hover:text-red-300">Go to Settings</a> to configure your AI provider.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showContextForm && !isLoading && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-3">Quick questions to customize your breakdown</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
                Answer these to get steps that work around your specific challenges.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Have you started this task yet?
                  </label>
                  <select
                    value={contextData.currentState}
                    onChange={(e) => setContextData({...contextData, currentState: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select one...</option>
                    <option value="Not started yet">Not started yet</option>
                    <option value="Started but stuck">Started but stuck</option>
                    <option value="Partially done">Partially done</option>
                    <option value="Almost finished">Almost finished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    What's your biggest challenge with this task?
                  </label>
                  <select
                    value={contextData.blockers}
                    onChange={(e) => setContextData({...contextData, blockers: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Select one...</option>
                    <option value="Don't know where to start">Don't know where to start</option>
                    <option value="Too many decisions to make">Too many decisions to make</option>
                    <option value="It's boring/unmotivating">It's boring/unmotivating</option>
                    <option value="It feels too big/overwhelming">It feels too big/overwhelming</option>
                    <option value="Don't know what I need">Don't know what I need</option>
                    <option value="Keep getting distracted">Keep getting distracted</option>
                    <option value="Other">Other (I'll specify below)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    When this task is done, what will you have?
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    For laundry: "Clean dry clothes" NOT "Clothes put away"
                  </p>
                  <textarea
                    value={contextData.specificGoal}
                    onChange={(e) => setContextData({...contextData, specificGoal: e.target.value})}
                    placeholder="Be specific: 'Laundry washed and dried', 'Room clean', 'Report written', 'Dishes washed', etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max steps
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="15"
                      value={preferences.maxSteps}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxSteps: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max duration (mins)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      step="10"
                      value={preferences.maxDuration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step complexity
                    </label>
                    <select
                      value={preferences.complexity}
                      onChange={(e) => setPreferences(prev => ({ ...prev, complexity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="moderate">Moderate</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anything else I should know? (Optional)
                  </label>
                  <textarea
                    value={contextData.environment}
                    onChange={(e) => setContextData({...contextData, environment: e.target.value})}
                    placeholder="Time limits, specific tools needed, other constraints..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all focus:border-purple-500 focus:ring-purple-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="alwaysAskContext"
                  checked={localStorage.getItem('ai_always_ask_context') !== 'false'}
                  onChange={(e) => {
                    localStorage.setItem('ai_always_ask_context', e.target.checked.toString());
                  }}
                  className="mr-2"
                />
                <label htmlFor="alwaysAskContext" className="text-sm text-gray-700">
                  Always ask for context (you can change this in Settings)
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowContextForm(false);
                    setHasGenerated(false); // Allow regeneration
                  }}
                  className="flex items-center"
                >
                  Skip Context
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowContextForm(false);
                    setHasGenerated(false); // Allow regeneration with new context
                    // The useEffect will trigger generateBreakdown when showContextForm becomes false
                  }}
                  className="flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Personalized Breakdown
                </Button>
              </div>
            </div>
          </div>
        )}
        

        {breakdownOptions.length > 0 && !showContextForm && (
          <>
            <div className="space-y-4 max-w-2xl mx-auto">
              {breakdownOptions.map(option => (
                <div 
                  key={option.id} 
                  className={`p-5 flex flex-row items-start gap-4 transition-all cursor-move shadow-sm border-2 border-amber-200 bg-white rounded-xl ${
                    dragOverItem === option.id ? 'ring-2 ring-blue-400' : ''
                  } ${draggedItem === option.id ? 'opacity-50' : ''}`}
                  draggable={true}
                  onDragStart={(e: React.DragEvent) => handleDragStart(e, option.id)}
                  onDragOver={(e: React.DragEvent) => handleDragOver(e, option.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e: React.DragEvent) => handleDrop(e, option.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex flex-col items-center mr-2 pt-2">
                    <GripVertical size={20} className="text-gray-400 mb-3" />
                    <input
                      type="checkbox"
                      checked={option.selected}
                      onChange={() => toggleOption(option.id)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {option.editable ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={option.title}
                          onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                        <input
                          type="text"
                          value={option.duration}
                          onChange={(e) => updateOption(option.id, 'duration', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                        <textarea
                          value={option.description}
                          onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(option.id)}
                            icon={<CheckCircle size={14} />}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteOption(option.id)}
                            icon={<Trash2 size={14} />}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-lg">{option.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{option.duration}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(option.id)}
                              icon={<Edit3 size={14} />}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{option.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${option.type === 'break' ? 'bg-green-100 text-green-800' :
                              option.type === 'review' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {option.type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${option.energyRequired === 'low' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              option.energyRequired === 'medium' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                            {option.energyRequired} energy
                          </span>
                        </div>
                        {option.tips && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-300 dark:border-purple-700 p-3 rounded-xl text-xs text-purple-900 dark:text-purple-300 mt-2">
                            <span className="font-semibold">Tip:</span> {option.tips}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-start">
              <Button
                variant="secondary"
                size="sm"
                onClick={addCustomStep}
                icon={<Plus size={14} />}
              >
                Add custom step
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!showContextForm && breakdownOptions.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setShowContextForm(true);
                setHasGenerated(false); // Reset so it will regenerate
                setBreakdownOptions([]); // Clear old results
                setError(null); // Clear any errors
              }}
              icon={<Edit3 size={16} />}
            >
              Add Context & Regenerate
            </Button>
          )}
          {!showContextForm && (
            <Button
              onClick={acceptBreakdown}
              disabled={breakdownOptions.filter(opt => opt.selected).length === 0}
              icon={<Sparkles size={16} />}
            >
              Accept & Create Subtasks
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AITaskBreakdown;