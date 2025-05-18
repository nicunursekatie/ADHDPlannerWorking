import React, { useState, useEffect } from 'react';
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

const AITaskBreakdownDebug: React.FC<AITaskBreakdownProps> = ({ task, onAccept, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdownOptions, setBreakdownOptions] = useState<BreakdownOption[]>([]);
  const [showContextForm, setShowContextForm] = useState(true);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const generateBreakdown = async () => {
    log('generateBreakdown called');
    setIsLoading(true);
    setError(null);
    
    try {
      log('Starting breakdown generation...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock breakdown
      const mockBreakdown: BreakdownOption[] = [
        {
          id: '1',
          title: 'Put away items that already have homes',
          duration: '5-10 mins',
          description: 'Only grab things you KNOW where they go',
          selected: true,
          editable: false,
          type: 'work',
          energyRequired: 'low',
          tips: 'This clears space without decisions'
        },
        {
          id: '2',
          title: 'Group similar items',
          duration: '5 mins',
          description: 'Put like items together',
          selected: true,
          editable: false,
          type: 'work',
          energyRequired: 'low',
          tips: 'Makes deciding easier later'
        }
      ];
      
      log(`Setting ${mockBreakdown.length} breakdown options`);
      setBreakdownOptions(mockBreakdown);
      log('Breakdown options set successfully');
    } catch (err) {
      log(`Error: ${err.message}`);
      setError(`Failed to generate breakdown: ${err.message}`);
    } finally {
      setIsLoading(false);
      log('generateBreakdown completed');
    }
  };

  useEffect(() => {
    log(`useEffect triggered - showContextForm: ${showContextForm}`);
    if (!showContextForm) {
      log('Context form hidden, generating breakdown...');
      generateBreakdown();
    }
  }, [showContextForm]);

  const handleCreateBreakdown = () => {
    log('Create Personalized Breakdown clicked');
    setShowContextForm(false);
  };

  const renderState = {
    showContextForm,
    breakdownOptionsLength: breakdownOptions.length,
    isLoading,
    shouldShowOptions: breakdownOptions.length > 0 && !showContextForm
  };

  log(`Render state: ${JSON.stringify(renderState)}`);

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Task Breakdown (Debug)" size="lg">
      <div className="space-y-4">
        {/* Debug panel */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Debug Info</h4>
          <div className="text-xs font-mono text-yellow-800">
            <div>showContextForm: {showContextForm.toString()}</div>
            <div>breakdownOptions.length: {breakdownOptions.length}</div>
            <div>isLoading: {isLoading.toString()}</div>
            <div>Should show options: {(breakdownOptions.length > 0 && !showContextForm).toString()}</div>
          </div>
          <div className="mt-2 max-h-32 overflow-y-auto text-xs font-mono text-yellow-700">
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Generating breakdown...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
            <X size={16} className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Context form */}
        {showContextForm && !isLoading && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-3">Context Form</h3>
            <p className="text-sm text-purple-700 mb-4">
              (Simplified for debugging)
            </p>
            <Button
              variant="primary"
              onClick={handleCreateBreakdown}
              className="flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Personalized Breakdown
            </Button>
          </div>
        )}

        {/* Breakdown options */}
        {breakdownOptions.length > 0 && !showContextForm && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Breakdown Options ({breakdownOptions.length})
            </h3>
            <div className="space-y-2">
              {breakdownOptions.map(option => (
                <Card key={option.id} className="p-3">
                  <h4 className="font-medium text-gray-900">{option.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {option.duration}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {option.energyRequired} energy
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {breakdownOptions.length > 0 && !showContextForm && (
            <Button
              onClick={() => {
                log('Accept clicked');
                const subtasks = breakdownOptions.map((opt, index) => ({
                  id: `${task.id}-sub-${index + 1}`,
                  title: opt.title,
                  description: opt.description,
                  parentTaskId: task.id,
                  completed: false
                }));
                onAccept(subtasks);
              }}
              icon={<CheckCircle size={16} />}
            >
              Accept & Create Subtasks
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AITaskBreakdownDebug;