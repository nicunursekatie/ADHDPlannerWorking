import React, { useState } from 'react';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
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
  X
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

  // Mock AI function - replace with actual API call
  const generateBreakdown = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI breakdown based on task
      const mockBreakdown: BreakdownOption[] = [
        {
          id: '1',
          title: `Prepare workspace for ${task.title}`,
          duration: '5-10 mins',
          description: 'Clear distractions, gather materials, get water',
          selected: true,
          editable: false,
          type: 'work',
          energyRequired: 'low',
          tips: 'This easy step helps transition into work mode'
        },
        {
          id: '2', 
          title: `Brain dump for ${task.title}`,
          duration: '5-10 mins',
          description: 'Write down all thoughts without filtering',
          selected: true,
          editable: false,
          type: 'work',
          energyRequired: 'low',
          tips: 'No judgment - just get ideas out of your head'
        },
        {
          id: '3',
          title: 'Movement break',
          duration: '5 mins',
          description: 'Stand up, stretch, walk, or dance',
          selected: preferences.includeBreaks,
          editable: false,
          type: 'break',
          energyRequired: 'low',
          tips: 'Set a timer to ensure you return'
        },
        {
          id: '4',
          title: `Main work on ${task.title}`,
          duration: '15-20 mins',
          description: 'Focus on the core task now that you\'re warmed up',
          selected: true,
          editable: false,
          type: 'work',
          energyRequired: 'high',
          tips: 'Use a timer - knowing there\'s an endpoint helps'
        },
        {
          id: '5',
          title: `Review and celebrate`,
          duration: '5 mins',
          description: 'Check work and acknowledge progress',
          selected: true,
          editable: false,
          type: 'review',
          energyRequired: 'low',
          tips: 'Celebrating builds motivation for next time'
        }
      ];
      
      setBreakdownOptions(mockBreakdown);
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
    const subtasks: Partial<Task>[] = selectedOptions.map((opt, index) => ({
      id: `${task.id}-sub-${index + 1}`,
      title: opt.title,
      description: opt.description,
      parentId: task.id,
      projectId: task.projectId,
      categoryId: task.categoryId,
      priority: task.priority,
      completed: false,
      estimatedDuration: opt.duration,
      order: index + 1,
      dueDate: task.dueDate
    }));
    
    onAccept(subtasks);
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
                <Card key={option.id} className="p-3">
                  <div className="flex items-start">
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