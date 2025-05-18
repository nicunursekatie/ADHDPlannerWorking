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
  GripVertical
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

  const generateBreakdown = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get settings from localStorage
      const apiKey = localStorage.getItem('ai_api_key');
      const providerName = localStorage.getItem('ai_provider') || 'openai';
      const provider = getProvider(providerName);
      
      if (!apiKey) {
        // Use fallback if no API key
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Create adaptive, task-specific breakdown
        const taskTitle = task.title.toLowerCase();
        let mockBreakdown: BreakdownOption[] = [];
        
        // Task-specific breakdowns
        if (taskTitle.includes('clean') || taskTitle.includes('put away') || taskTitle.includes('laundry')) {
          mockBreakdown = [
            {
              id: '1',
              title: 'Set timer & gather supplies',
              duration: '2-3 mins',
              description: 'Set 10-15 min timer, get bag/basket for items',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Timer helps prevent overwhelm and creates urgency'
            },
            {
              id: '2',
              title: 'Sort by destination',
              duration: '5-7 mins',
              description: 'Group items by where they go (bedroom, kitchen, etc)',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Sorting first makes the actual put-away much faster'
            },
            {
              id: '3',
              title: 'Quick movement break',
              duration: '2-3 mins',
              description: 'Stretch, hydrate, do jumping jacks',
              selected: preferences.includeBreaks,
              editable: false,
              type: 'break',
              energyRequired: 'low',
              tips: 'Movement helps reset focus and energy'
            },
            {
              id: '4',
              title: 'Put away one category at a time',
              duration: '10-15 mins',
              description: 'Start with closest room or easiest category',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Take basket to each room instead of many trips'
            },
            {
              id: '5',
              title: 'Final check & celebrate',
              duration: '2-3 mins',
              description: 'Quick scan for missed items, then reward yourself',
              selected: true,
              editable: false,
              type: 'review',
              energyRequired: 'low',
              tips: 'Take before/after photo for dopamine boost'
            }
          ];
        } else if (taskTitle.includes('write') || taskTitle.includes('email') || taskTitle.includes('report')) {
          mockBreakdown = [
            {
              id: '1',
              title: 'Gather all relevant info',
              duration: '5-10 mins',
              description: 'Collect documents, notes, requirements in one place',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Having everything ready prevents context switching'
            },
            {
              id: '2',
              title: 'Create rough bullet points',
              duration: '5-10 mins',
              description: 'List key points to cover, no sentences yet',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'medium',
              tips: 'Bullet points are less intimidating than paragraphs'
            },
            {
              id: '3',
              title: 'Body doubling break',
              duration: '5 mins',
              description: 'Tell someone what you\'re working on or post update',
              selected: preferences.includeBreaks,
              editable: false,
              type: 'break',
              energyRequired: 'low',
              tips: 'Accountability can boost motivation'
            },
            {
              id: '4',
              title: 'Write first draft (bad is okay!)',
              duration: '15-20 mins',
              description: 'Turn bullets into sentences, focus on completion not perfection',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'high',
              tips: 'Perfect is the enemy of done - you can edit later'
            },
            {
              id: '5',
              title: 'Quick edit and send',
              duration: '5-10 mins',
              description: 'Basic spell check, then send before overthinking',
              selected: true,
              editable: false,
              type: 'review',
              energyRequired: 'medium',
              tips: 'Set 5 min limit to prevent perfectionism spiral'
            }
          ];
        } else {
          // Generic breakdown for other tasks
          mockBreakdown = [
            {
              id: '1',
              title: `Prepare for ${task.title}`,
              duration: '5 mins',
              description: 'Clear workspace, gather materials, take deep breath',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Starting is often the hardest part'
            },
            {
              id: '2',
              title: `Break down ${task.title} into smallest steps`,
              duration: '5-10 mins',
              description: 'List the tiniest possible actions needed',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'low',
              tips: 'Smaller steps = less overwhelm'
            },
            {
              id: '3',
              title: 'Movement/sensory break',
              duration: '5 mins',
              description: 'Walk, stretch, fidget toy, or music',
              selected: preferences.includeBreaks,
              editable: false,
              type: 'break',
              energyRequired: 'low',
              tips: 'Physical movement helps mental reset'
            },
            {
              id: '4',
              title: `Do main work on ${task.title}`,
              duration: '15-20 mins',
              description: 'Focus on completing the core task',
              selected: true,
              editable: false,
              type: 'work',
              energyRequired: 'high',
              tips: 'Use pomodoro timer to maintain focus'
            },
            {
              id: '5',
              title: 'Review and transition',
              duration: '5 mins',
              description: 'Check completion, note next steps, celebrate',
              selected: true,
              editable: false,
              type: 'review',
              energyRequired: 'low',
              tips: 'Acknowledging progress helps build momentum'
            }
          ];
        }
      
      setBreakdownOptions(mockBreakdown);
      return;
    }
    
    // Real AI API call
    const messages = [
          {
            role: 'system',
            content: `You are an AI assistant specialized in breaking down tasks for people with ADHD. 
Your breakdowns should be:
- Clear and specific
- Small, manageable chunks (5-30 minutes max)
- Include regular breaks
- Start with easier subtasks to build momentum
- Account for ADHD challenges like time blindness and executive dysfunction
- Use action verbs
- Include energy level indicators

Format your response as a JSON array with this structure:
{
  "title": "Step title",
  "duration": "X-Y mins",
  "description": "Clear description",
  "type": "work|break|review|reward",
  "energyRequired": "low|medium|high",
  "tips": "ADHD-specific tip"
}`
          },
          {
            role: 'user',
            content: `Break down this task into ADHD-friendly steps:
Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.estimatedMinutes ? `Time estimate: ${task.estimatedMinutes} minutes` : ''}

Requirements:
- Maximum ${preferences.maxSteps} steps
- ${preferences.includeBreaks ? 'Include breaks' : 'No breaks needed'}
- Complexity: ${preferences.complexity}
- Each step should be ${preferences.maxDuration} minutes or less

Provide a JSON array of steps.`
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
    } catch (e) {
      console.error('Failed to parse AI response:', e);
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
    
    setBreakdownOptions(breakdown);
    } catch (err) {
      setError('Failed to generate breakdown. Please try again.');
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
    generateBreakdown();
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Task Breakdown" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Brain className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-medium text-gray-900">Breaking down: {task.title}</h4>
              <p className="text-sm text-gray-600">AI is creating manageable steps for you</p>
            </div>
          </div>
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
            <X size={16} className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {breakdownOptions.length > 0 && (
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
          <Button
            onClick={acceptBreakdown}
            disabled={breakdownOptions.filter(opt => opt.selected).length === 0}
            icon={<Sparkles size={16} />}
          >
            Accept & Create Subtasks
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AITaskBreakdown;