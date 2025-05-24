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
      const provider = getProvider(providerName);
      
      
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
2. Address blockers FIRST, not last - if they don't know where things go, don't tell them to fold first
3. Reduce decision fatigue by grouping, categorizing, or deferring decisions
4. Create momentum with easy wins before harder tasks
5. Each step must reduce overwhelm, clarify decision-making, or externalize mental load

ADHD-AWARE PRINCIPLES:
- Triage before action: Sort into categories before detailed work
- Decision scaffolding: Break big decisions into micro-decisions  
- Externalize memory: Write things down, use containers, label clearly
- Easy wins first: Start with obvious/simple items to build momentum
- Batch similar items: Group processing reduces context switching
- Visual cues: Use physical separation, containers, or notes

BREAKDOWN STRATEGY:
- If "don't know where to put things" → First create categories/piles, THEN process each pile
- If "decision fatigue" → Start with items that have obvious homes, defer harder decisions
- If "overwhelmed by volume" → Break into smaller visual chunks first
- If "boring/unmotivating" → Add variety, breaks, or rewards between steps

NEVER:
- Jump to detailed work before triage
- Ask questions as steps
- Require decisions without scaffolding
- Process items one-by-one when batching would help

Format as JSON array with structure:
[
  {
    "title": "Action-oriented title",
    "duration": "5-10 mins",
    "description": "What to do and why",
    "type": "work|break|review",
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

Create ${preferences.maxSteps} steps that DIRECTLY ADDRESS THE BLOCKERS LISTED ABOVE.

IMPORTANT REQUIREMENTS:
1. If the blocker is "don't know where things go" - START with categorization/sorting, not with folding
2. If the blocker is "decision fatigue" - DEFER hard decisions, process easy items first
3. If the blocker is "overwhelming amount" - BREAK into visual chunks before processing
4. Use the context to customize steps - don't give generic task sequences

Example adaptations:
- Blocker: "don't know where clothes go" → First step: "Sort into 3 piles: has home, needs home, donate/unsure"
- Blocker: "bored with folding" → Mix folding with other actions, add music/podcast, or batch by type
- Blocker: "decision fatigue" → Start with socks/underwear (easy homes), defer complex items

Each step should ACTIVELY WORK AROUND the stated blockers, not ignore them.

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
      console.error('Failed to parse AI response:', e);
      console.error('Content that failed to parse:', content);
      throw new Error('Invalid response format');
    }
    
    // Log the steps before conversion
    
    // Check if steps is actually an array with content
    if (!Array.isArray(steps) || steps.length === 0) {
      console.error('Invalid steps array:', steps);
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
      console.error('Error generating breakdown:', err);
      let errorMessage = 'Failed to generate breakdown: ';
      
      if (err instanceof Error) {
        if (err.message.includes('No API key')) {
          errorMessage = err.message;
        } else if (err.message.includes('API request failed') || err.message.includes('fetch')) {
          errorMessage += 'Unable to connect to AI service. Please check your API settings and try again.';
        } else {
          errorMessage += err.message;
        }
        console.error('Error stack:', err.stack);
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
    
    onAccept(subtasks);
    
    // Reset the component state for next use
    setHasGenerated(false);
    setShowContextForm(localStorage.getItem('ai_always_ask_context') !== 'false');
    setBreakdownOptions([]);
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
  
  // Reset state when component mounts/unmounts
  React.useEffect(() => {
    return () => {
      setHasGenerated(false);
      setBreakdownOptions([]);
      setError(null);
    };
  }, []);

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
                  : 'AI is creating manageable steps for you'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <X size={20} className="mr-3 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Unable to generate breakdown</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {error.includes('API key') && (
                  <p className="text-sm text-red-700 mt-2">
                    <a href="/settings" className="underline font-medium">Go to Settings</a> to configure your AI provider.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showContextForm && !isLoading && (
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
                    What makes this task challenging? (Be specific!)
                  </label>
                  <input
                    type="text"
                    value={contextData.blockers}
                    onChange={(e) => setContextData({...contextData, blockers: e.target.value})}
                    placeholder="e.g., 'Decision fatigue - don't know where things go', 'Boring/unmotivating', 'Too overwhelming to start'"
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
                <Card 
                  key={option.id} 
                  className={`p-5 flex flex-row items-start gap-4 transition-all cursor-move shadow-sm border-2 border-amber-200 bg-white rounded-xl ${
                    dragOverItem === option.id ? 'ring-2 ring-blue-400' : ''
                  } ${draggedItem === option.id ? 'opacity-50' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, option.id)}
                  onDragOver={(e) => handleDragOver(e, option.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, option.id)}
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
                            ${option.energyRequired === 'low' ? 'bg-yellow-100 text-yellow-800' :
                              option.energyRequired === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'}`}>
                            {option.energyRequired} energy
                          </span>
                        </div>
                        {option.tips && (
                          <div className="bg-blue-50 border-l-4 border-blue-300 p-3 rounded text-xs text-blue-900 mt-2">
                            <span className="font-semibold">Tip:</span> {option.tips}
                          </div>
                        )}
                      </>
                    )}
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