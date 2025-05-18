import React, { useState } from 'react';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { getProvider } from '../../utils/aiProviders';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferences, setPreferences] = useState({
    maxSteps: 5,
    maxDuration: 30,
    complexity: 'simple',
    includeBreaks: true,
    detailLevel: 'moderate'
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
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
      const provider = getProvider(providerName);
      
      console.log('Generating breakdown for task:', task.title);
      console.log('API key present:', !!apiKey);
      
      if (!apiKey) {
        // Use fallback if no API key
        console.log('Using fallback breakdown - no API key');
        setUsingFallback(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Create adaptive, task-specific breakdown
        const taskTitle = task.title.toLowerCase();
        let mockBreakdown: BreakdownOption[] = [];
        
        // Task-specific breakdowns
        if (taskTitle.includes('clean') || taskTitle.includes('put away')) {
          console.log('Using clean/put away specific breakdown');
          mockBreakdown = [
            {
              id: '1',
              title: 'Put away items that already have homes',
              duration: '5-10 mins',
              description: 'Only grab things you KNOW where they go - skip everything else',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'This clears space without any decisions needed'
            },
            {
              id: '2',
              title: 'Gather homeless items into one container',
              duration: '3-5 mins',
              description: 'Put all items without obvious homes into a box/bag - deal with them later',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Containing the chaos makes the space functional now'
            },
            {
              id: '3',
              title: 'Clear obvious trash only',
              duration: '2-3 mins',
              description: 'Only grab things that are definitely trash - when in doubt, leave it out',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'No decisions = faster progress'
            },
            {
              id: '4',
              title: 'Try temporary homes for 2-3 items',
              duration: '5 mins',
              description: 'Pick any spot that makes sense and put items there - can always move later',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Done is better than perfect - you can refine locations anytime'
            },
            {
              id: '5',
              title: 'Label the "decide later" container',
              duration: '1 min',
              description: 'Write "Sort by [date]" on the container and put it somewhere visible',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Making it official reduces guilt about not deciding now'
            }
          ];
        } else if (taskTitle.includes('laundry') || taskTitle.includes('hamper') || taskTitle.includes('clothes')) {
          // Simple laundry-specific breakdown
          const isLoading = taskTitle.includes('load') || taskTitle.includes('hamper');
          console.log('Using laundry specific breakdown, isLoading:', isLoading);
          mockBreakdown = [
            {
              id: '1',
              title: isLoading ? 'Dump hamper directly into machine' : 'Pull everything out at once',
              duration: '2-3 mins',
              description: isLoading ? 'Empty entire hamper into washer - sort later if needed' : 'Transfer entire load to dryer/basket in one go',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'One big action is easier than many small decisions'
            },
            {
              id: '2',
              title: isLoading ? 'Add soap & hit start immediately' : 'Start dryer or dump on bed',
              duration: '1-2 mins',
              description: isLoading ? 'Pour detergent (amount doesn\'t need to be perfect) and start' : 'Either start dryer or create one big pile on bed',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Starting the machine creates commitment to finish later'
            },
            ...(preferences.includeBreaks ? [{
              id: '3',
              title: 'Quick reward break',
              duration: '5 mins',
              description: 'Watch a short video or have a snack',
              selected: true,
              editable: false,
              type: 'break',
              energyRequired: 'low',
              tips: 'You did it! Enjoy a small dopamine boost'
            }] : [])
          ];
        } else if (taskTitle.includes('write') || taskTitle.includes('email') || taskTitle.includes('report')) {
          mockBreakdown = [
            {
              id: '1',
              title: 'Write 3 main points you want to make',
              duration: '3-5 mins',
              description: 'Just 3 bullet points - what\'s the core message?',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Starting with structure prevents rambling'
            },
            {
              id: '2',
              title: 'Turn easiest point into 2-3 sentences',
              duration: '5-7 mins',
              description: 'Pick the point you\'re most confident about and expand it',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Starting with easy wins builds momentum'
            },
            {
              id: '3',
              title: 'Write opening sentence using your strongest point',
              duration: '5 mins',
              description: 'Lead with your best idea - hook them immediately',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Strong start makes the rest flow easier'
            },
            {
              id: '4',
              title: 'Fill in remaining points - stream of consciousness',
              duration: '10-15 mins',
              description: 'Write continuously without stopping to edit - just get ideas down',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'high',
              tips: 'Editing while writing is the enemy - separate creation from correction'
            },
            {
              id: '5',
              title: 'Read once out loud and hit send',
              duration: '3-5 mins',
              description: 'One read through for obvious errors, then send immediately',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Reading aloud catches errors your eyes miss'
            }
          ];
        } else {
          // Generic breakdown for other tasks
          console.log('Using generic breakdown for task:', taskTitle);
          mockBreakdown = [
            {
              id: '1',
              title: 'Start with the easiest visible part',
              duration: '5 mins',
              description: 'Pick the most obvious/simple aspect and just begin there',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Starting anywhere beats planning everywhere'
            },
            {
              id: '2',
              title: 'Complete one concrete piece',
              duration: '10 mins',
              description: 'Do any small part that can be finished without needing decisions',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Progress beats perfection - build momentum'
            },
            {
              id: '3',
              title: 'Try the simplest approach for 10 mins',
              duration: '10 mins',
              description: 'Use the most basic method - you can always refine later',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Set timer - when it rings you can stop or adjust approach'
            },
            {
              id: '4',
              title: 'Capture what\'s left in a note',
              duration: '3 mins',
              description: 'Write down any remaining pieces/decisions for next time',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Externalizing unfinished parts reduces mental load'
            }
          ];
        }
      
      console.log('Setting breakdown options:', mockBreakdown.length, 'steps');
      setBreakdownOptions(mockBreakdown);
      return;
    }
    
    // Real AI API call
    console.log('Making real API call to:', providerName, 'with model:', provider.defaultModel);
    console.log('Context data being sent:', contextData);
    const messages = [
          {
            role: 'system',
            content: `You are an ADHD-aware assistant creating actionable task breakdowns.

CRITICAL PRINCIPLES:
1. Start with what CAN be done NOW, not what needs to be decided
2. If there are blockers, work AROUND them, not through them
3. Prioritize partial progress over perfect planning
4. Scaffold decisions - don't require them upfront
5. Default to action over ideation

BREAKDOWN STRATEGY:
- If location is unclear → "Put items that DO have homes away first"
- If process is unknown → "Start with the obvious/easy parts"
- If decision needed → "Try one approach for 10 mins, then adjust"
- If overwhelmed → "Pick any corner and clear just that"

NEVER ASK QUESTIONS in steps. Instead:
❌ "Decide where clothes will go" 
✓ "Put away clothes with existing homes (skip the rest for now)"

❌ "Figure out tracking format"
✓ "Open notes app and write today's data in any format"

ALWAYS:
- Make progress possible WITHOUT solving all blockers
- Offer "good enough" paths alongside ideal ones
- Break decisions into experiments, not commitments
- Focus on clearing what's clearable first

Format as JSON array - each step must be immediately actionable.`
          },
          {
            role: 'user',
            content: `Task: "${task.title}"${task.description ? `\nDetails: ${task.description}` : ''}

${contextData.currentState ? `Current state: ${contextData.currentState}` : ''}
${contextData.blockers ? `Blockers: ${contextData.blockers}` : ''}
${contextData.specificGoal ? `Goal: ${contextData.specificGoal}` : ''}
${contextData.environment ? `Constraints: ${contextData.environment}` : ''}

Create ${preferences.maxSteps} steps that are IMMEDIATELY actionable.

CRITICAL: 
- NO questions or decisions as steps
- Work AROUND blockers, not through them
- Enable partial progress even if full solution unclear
- If user mentions a blocker like "don't know where X goes", create steps that handle what IS known first

Examples:
- If blocker is "deciding where items go" → Step: "Put away items that already have designated spots"
- If blocker is "choosing format" → Step: "Start with simplest format (bullet list) for 5 mins"
- If blocker is "too overwhelming" → Step: "Clear just the 2-foot area directly in front of you"

Each step should move the task forward WITHOUT requiring the blocker to be solved first.

Return JSON array only.`
          }
        ];
    
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: provider.headers(apiKey),
      body: JSON.stringify(provider.formatRequest(messages, provider.defaultModel))
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    console.log('Full API response:', JSON.stringify(data, null, 2));
    const content = provider.parseResponse(data);
    console.log('Parsed content:', content);
    
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
      
      // Handle Groq's different response format
      if (steps.length > 0 && steps[0].Step) {
        console.log('Detected Groq format, converting...');
        steps = steps.map((step, index) => ({
          title: step.Step || `Step ${index + 1}`,
          duration: '5-10 mins',
          description: step.Step || `Step ${index + 1}`,
          type: 'work',
          energyRequired: 'medium',
          tips: 'Focus on this specific action'
        }));
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Content that failed to parse:', content);
      throw new Error('Invalid response format');
    }
    
    // Convert to BreakdownOption format
    const breakdown: BreakdownOption[] = steps.map((step: any, index: number) => ({
      id: `${index + 1}`,
      title: step.title,
      duration: step.duration,
      description: step.description,
      selected: true,
      editable: false,
      type: step.type || 'work',
      energyRequired: step.energyRequired || 'medium',
      tips: step.tips
    }));
    
    console.log('Generated breakdown:', breakdown);
    setBreakdownOptions(breakdown);
    } catch (err) {
      console.error('Error generating breakdown:', err);
      setError(`Failed to generate breakdown: ${err.message}`);
      // Log more details about the error
      if (err instanceof Error) {
        console.error('Error stack:', err.stack);
      }
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
      id: Date.now().toString(),
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
    console.log('Selected options:', selectedOptions);
    
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
        id: `${task.id}-sub-${index + 1}-${Date.now()}`,
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
    
    console.log('Subtasks to create:', subtasks);
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
    console.log('useEffect running, showContextForm:', showContextForm);
    if (!showContextForm) {
      console.log('Generating breakdown because showContextForm is false');
      generateBreakdown();
    }
  }, [showContextForm]);

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Task Breakdown" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Brain className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-medium text-gray-900">Breaking down: {task.title}</h4>
              <p className="text-sm text-gray-600">
                {showContextForm 
                  ? 'Let\'s understand this task better for a personalized breakdown' 
                  : usingFallback 
                    ? 'Using fallback suggestions (no API key)' 
                    : 'AI is creating manageable steps for you'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {usingFallback && !isLoading && (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">Fallback Mode</span>
              </div>
            )}
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
            <X size={16} className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {showContextForm && !isLoading && (() => {
          console.log('Rendering context form, showContextForm:', showContextForm, 'isLoading:', isLoading);
          return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-3">Tell me more about this task</h3>
              <p className="text-sm text-purple-700 mb-4">
                The more context you provide, the better I can tailor the breakdown to your specific needs and challenges.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Where are you with this task?
                  </label>
                  <input
                    type="text"
                    value={contextData.currentState}
                    onChange={(e) => setContextData({...contextData, currentState: e.target.value})}
                    placeholder="e.g., 'Need to start', 'Have some info but not organized', 'Tried before but got stuck'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What makes this task challenging?
                  </label>
                  <input
                    type="text"
                    value={contextData.blockers}
                    onChange={(e) => setContextData({...contextData, blockers: e.target.value})}
                    placeholder="e.g., 'Too many steps', 'Don't know the process', 'Requires decisions I haven't made'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What outcome do you need?
                  </label>
                  <input
                    type="text"
                    value={contextData.specificGoal}
                    onChange={(e) => setContextData({...contextData, specificGoal: e.target.value})}
                    placeholder="e.g., 'Complete application', 'Get documents in order', 'Have everything ready to submit'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Any constraints or special requirements?
                  </label>
                  <input
                    type="text"
                    value={contextData.environment}
                    onChange={(e) => setContextData({...contextData, environment: e.target.value})}
                    placeholder="e.g., 'Need specific documents', 'Must be done online', 'Requires appointment'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  variant="outline"
                  onClick={() => {
                    setShowContextForm(false);
                  }}
                  className="flex items-center"
                >
                  Skip Context
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowContextForm(false);
                  }}
                  className="flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Personalized Breakdown
                </Button>
              </div>
            </div>
          </div>
          );
        })()}
        
        {usingFallback && !showContextForm && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Fallback Mode Active</p>
                <p className="text-sm text-amber-700 mt-1">
                  These are pre-configured suggestions. To get personalized AI-generated breakdowns, 
                  please add your API key in the <a href="/settings" className="underline font-medium">Settings</a> page.
                </p>
              </div>
            </div>
          </div>
        )}

        {breakdownOptions.length > 0 && !showContextForm && (
          <>
            <div className="space-y-2">
              {breakdownOptions.map(option => (
                <Card 
                  key={option.id} 
                  className={`p-3 transition-all cursor-move ${
                    dragOverItem === option.id ? 'ring-2 ring-blue-400' : ''
                  } ${draggedItem === option.id ? 'opacity-50' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, option.id)}
                  onDragOver={(e) => handleDragOver(e, option.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, option.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-start">
                    <div className="mr-2 cursor-move">
                      <GripVertical size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="checkbox"
                      checked={option.selected}
                      onChange={() => toggleOption(option.id)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
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
                              variant="outline"
                              onClick={() => deleteOption(option.id)}
                              icon={<Trash2 size={14} />}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{option.title}</h4>
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
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                              ${option.type === 'break' ? 'bg-green-100 text-green-800' :
                                option.type === 'review' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {option.type}
                            </span>
                            
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                              ${option.energyRequired === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                option.energyRequired === 'medium' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'}`}>
                              {option.energyRequired} energy
                            </span>
                          </div>
                          
                          {option.tips && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                              <strong>Tip:</strong> {option.tips}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomStep}
                icon={<Plus size={14} />}
              >
                Add custom step
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                icon={showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              >
                Advanced options
              </Button>
            </div>

            {showAdvanced && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max steps</label>
                    <input
                      type="number"
                      value={preferences.maxSteps}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxSteps: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max duration (mins)</label>
                    <input
                      type="number"
                      value={preferences.maxDuration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxDuration: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Complexity</label>
                  <select
                    value={preferences.complexity}
                    onChange={(e) => setPreferences(prev => ({ ...prev, complexity: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="simple">Simple steps</option>
                    <option value="moderate">Moderate detail</option>
                    <option value="detailed">Very detailed</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeBreaks"
                    checked={preferences.includeBreaks}
                    onChange={(e) => setPreferences(prev => ({ ...prev, includeBreaks: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="includeBreaks" className="text-sm text-gray-700">Include break reminders</label>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!showContextForm && breakdownOptions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowContextForm(true)}
              icon={<Edit3 size={16} />}
            >
              Add Context
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