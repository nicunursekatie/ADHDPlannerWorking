import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle, AlertCircle, Users, Calendar, Brain, Search, MessageSquare, ClipboardList, ChevronRight } from 'lucide-react';
import { Task, Category } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Button from '../common/Button';

interface FuzzyTaskBreakdownProps {
  task: Task;
  onClose: () => void;
  onComplete: (newTasks: Partial<Task>[]) => void;
}

interface ContextData {
  idealOutcome: string;
  blockers: string;
  timeConstraints: string;
  peopleAffected: string;
}

interface InfoGapsData {
  informationNeeded: string;
  decisionsRequired: string;
  waitingOn: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  type: 'communication' | 'research' | 'decision' | 'cleanup' | 'action';
  energyLevel: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  urgency: 'today' | 'tomorrow' | 'week' | 'month' | 'someday';
  emotionalWeight: 'easy' | 'neutral' | 'stressful' | 'dreading';
  dependsOn?: number[]; // indices of other tasks this depends on
}

export const FuzzyTaskBreakdown: React.FC<FuzzyTaskBreakdownProps> = ({ task, onClose, onComplete }) => {
  const { categories } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [contextData, setContextData] = useState<ContextData>({
    idealOutcome: '',
    blockers: '',
    timeConstraints: '',
    peopleAffected: ''
  });
  const [infoGapsData, setInfoGapsData] = useState<InfoGapsData>({
    informationNeeded: '',
    decisionsRequired: '',
    waitingOn: ''
  });
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([]);

  const generateActionableTasks = () => {
    const tasks: GeneratedTask[] = [];
    
    // Parse context data to generate specific tasks
    
    // Communication tasks from people affected
    if (contextData.peopleAffected.trim()) {
      const people = contextData.peopleAffected.split(',').map(p => p.trim());
      people.forEach(person => {
        if (person) {
          tasks.push({
            title: `Contact ${person} about ${task.title.substring(0, 30)}...`,
            description: `Reach out to ${person} regarding the task: ${task.title}. Discuss the ideal outcome: ${contextData.idealOutcome}`,
            type: 'communication',
            energyLevel: 'medium',
            estimatedMinutes: 15,
            urgency: contextData.timeConstraints.toLowerCase().includes('today') || contextData.timeConstraints.toLowerCase().includes('urgent') ? 'today' : 'week',
            emotionalWeight: 'neutral'
          });
        }
      });
    }
    
    // Research tasks from information gaps
    if (infoGapsData.informationNeeded.trim()) {
      const infoItems = infoGapsData.informationNeeded.split(',').map(i => i.trim());
      infoItems.forEach(info => {
        if (info) {
          tasks.push({
            title: `Research: ${info.substring(0, 50)}`,
            description: `Find information about: ${info}. This is needed to achieve: ${contextData.idealOutcome}`,
            type: 'research',
            energyLevel: 'medium',
            estimatedMinutes: 30,
            urgency: 'week',
            emotionalWeight: 'easy'
          });
        }
      });
    }
    
    // Decision tasks from decisions required
    if (infoGapsData.decisionsRequired.trim()) {
      const decisions = infoGapsData.decisionsRequired.split(',').map(d => d.trim());
      decisions.forEach((decision, index) => {
        if (decision) {
          const dependsOnResearch = tasks.findIndex(t => t.type === 'research');
          tasks.push({
            title: `Decide: ${decision.substring(0, 50)}`,
            description: `Make a decision about: ${decision}. Consider the blockers: ${contextData.blockers}`,
            type: 'decision',
            energyLevel: 'high',
            estimatedMinutes: 20,
            urgency: 'week',
            emotionalWeight: 'stressful',
            dependsOn: dependsOnResearch >= 0 ? [dependsOnResearch] : []
          });
        }
      });
    }
    
    // Action tasks from blockers
    if (contextData.blockers.trim()) {
      const blockerItems = contextData.blockers.split(',').map(b => b.trim());
      blockerItems.forEach(blocker => {
        if (blocker) {
          // Determine if this is a cleanup or action task
          const isCleanup = blocker.toLowerCase().includes('cancel') || 
                           blocker.toLowerCase().includes('remove') || 
                           blocker.toLowerCase().includes('delete') ||
                           blocker.toLowerCase().includes('refund');
          
          tasks.push({
            title: `${isCleanup ? 'Cleanup' : 'Resolve'}: ${blocker.substring(0, 40)}`,
            description: `Address the blocker: ${blocker}. This is preventing: ${contextData.idealOutcome}`,
            type: isCleanup ? 'cleanup' : 'action',
            energyLevel: isCleanup ? 'low' : 'medium',
            estimatedMinutes: isCleanup ? 10 : 25,
            urgency: contextData.timeConstraints.toLowerCase().includes('urgent') ? 'today' : 'week',
            emotionalWeight: isCleanup ? 'easy' : 'neutral'
          });
        }
      });
    }
    
    // Follow-up task if waiting on someone
    if (infoGapsData.waitingOn.trim()) {
      const waitingItems = infoGapsData.waitingOn.split(',').map(w => w.trim());
      waitingItems.forEach(item => {
        if (item) {
          tasks.push({
            title: `Follow up: ${item.substring(0, 40)}`,
            description: `Check on the status of: ${item}. This is needed to proceed with: ${contextData.idealOutcome}`,
            type: 'communication',
            energyLevel: 'low',
            estimatedMinutes: 10,
            urgency: 'week',
            emotionalWeight: 'easy'
          });
        }
      });
    }
    
    // If no specific tasks were generated, create general breakdown
    if (tasks.length === 0) {
      tasks.push(
        {
          title: `Plan approach for: ${task.title.substring(0, 30)}`,
          description: `Break down the task into smaller steps. Goal: ${contextData.idealOutcome || task.description}`,
          type: 'action',
          energyLevel: 'medium',
          estimatedMinutes: 20,
          urgency: 'week',
          emotionalWeight: 'neutral'
        },
        {
          title: `Start implementation: ${task.title.substring(0, 25)}`,
          description: `Begin working on the first part of the task`,
          type: 'action',
          energyLevel: 'high',
          estimatedMinutes: 30,
          urgency: 'week',
          emotionalWeight: 'neutral',
          dependsOn: [0]
        }
      );
    }
    
    setGeneratedTasks(tasks);
  };

  const handleNext = () => {
    if (currentStep === 2) {
      generateActionableTasks();
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    // Create task objects from generated tasks with priorities
    const newTasks: Partial<Task>[] = generatedTasks.map((genTask, index) => {
      // Determine categories based on task type
      const taskCategories: string[] = [];
      const categoryMap: { [key: string]: string } = {};
      
      // Build category map
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });
      
      // Assign categories based on type
      if (genTask.type === 'communication' && categoryMap['communication']) {
        taskCategories.push(categoryMap['communication']);
      } else if (genTask.type === 'research' && categoryMap['research']) {
        taskCategories.push(categoryMap['research']);
      } else if (genTask.type === 'decision' && categoryMap['decisions']) {
        taskCategories.push(categoryMap['decisions']);
      }
      
      // Set priority based on user selection
      const isHighPriority = selectedPriorities.includes(index);
      
      return {
        title: genTask.title,
        description: genTask.description,
        energyLevel: genTask.energyLevel,
        estimatedMinutes: genTask.estimatedMinutes,
        urgency: isHighPriority ? 'today' : genTask.urgency,
        emotionalWeight: genTask.emotionalWeight,
        categoryIds: taskCategories,
        projectId: task.projectId,
        priority: isHighPriority ? 'high' : 'medium',
        braindumpSource: `Broken down from: ${task.title}`
      };
    });
    
    onComplete(newTasks);
  };

  const getTaskIcon = (type: GeneratedTask['type']) => {
    switch (type) {
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'research': return <Search className="w-4 h-4" />;
      case 'decision': return <Brain className="w-4 h-4" />;
      case 'cleanup': return <ClipboardList className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getTaskTypeColor = (type: GeneratedTask['type']) => {
    switch (type) {
      case 'communication': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'research': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'decision': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cleanup': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Break Down This Task
              </h2>
              <p className="text-purple-100 mt-2">Let's turn this overwhelming task into manageable steps</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Task being broken down */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Breaking down:</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</p>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Context Extraction */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Step 1: Let's understand the context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What's the ideal outcome you want? 🎯
                  </label>
                  <textarea
                    value={contextData.idealOutcome}
                    onChange={(e) => setContextData({...contextData, idealOutcome: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., 'Have all my tax documents organized and submitted' or 'Get the project proposal approved'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What's currently blocking that from happening? 🚧
                  </label>
                  <textarea
                    value={contextData.blockers}
                    onChange={(e) => setContextData({...contextData, blockers: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., 'Missing receipts, don't know which forms to use' (separate multiple with commas)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Are there any time constraints or deadlines? ⏰
                  </label>
                  <input
                    type="text"
                    value={contextData.timeConstraints}
                    onChange={(e) => setContextData({...contextData, timeConstraints: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 'Due by Friday' or 'No specific deadline'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who else is affected by this? <Users className="inline w-4 h-4" />
                  </label>
                  <input
                    type="text"
                    value={contextData.peopleAffected}
                    onChange={(e) => setContextData({...contextData, peopleAffected: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 'Boss, accounting team, Sarah' (separate with commas)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Information Gaps */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Step 2: What information do you need?
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What information do you need to move forward? 🔍
                  </label>
                  <textarea
                    value={infoGapsData.informationNeeded}
                    onChange={(e) => setInfoGapsData({...infoGapsData, informationNeeded: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., 'Tax form numbers, submission deadline, required documents' (separate with commas)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What decisions need to be made? 🤔
                  </label>
                  <textarea
                    value={infoGapsData.decisionsRequired}
                    onChange={(e) => setInfoGapsData({...infoGapsData, decisionsRequired: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., 'Choose between standard or itemized deduction, pick a meeting date' (separate with commas)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Are you waiting on anyone else? ⏳
                  </label>
                  <input
                    type="text"
                    value={infoGapsData.waitingOn}
                    onChange={(e) => setInfoGapsData({...infoGapsData, waitingOn: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 'Manager approval, client feedback' (separate with commas)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generated Actions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Step 3: Here are your actionable tasks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We've generated {generatedTasks.length} specific tasks based on your input:
              </p>
              
              <div className="space-y-3">
                {generatedTasks.map((genTask, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTaskTypeColor(genTask.type)}`}>
                        {getTaskIcon(genTask.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{genTask.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{genTask.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                            {genTask.estimatedMinutes} min
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                            {genTask.energyLevel} energy
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                            {genTask.urgency}
                          </span>
                          {genTask.dependsOn && genTask.dependsOn.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                              depends on task {genTask.dependsOn[0] + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Urgency Assessment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Step 4: Which tasks need to happen first?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the tasks that are most time-sensitive:
              </p>
              
              <div className="space-y-3">
                {generatedTasks.map((genTask, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (selectedPriorities.includes(index)) {
                        setSelectedPriorities(selectedPriorities.filter(i => i !== index));
                      } else {
                        setSelectedPriorities([...selectedPriorities, index]);
                      }
                    }}
                    className={`w-full text-left border rounded-lg p-4 transition-all ${
                      selectedPriorities.includes(index)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTaskTypeColor(genTask.type)}`}>
                        {getTaskIcon(genTask.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{genTask.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{genTask.description}</p>
                      </div>
                      {selectedPriorities.includes(index) && (
                        <div className="text-purple-600 dark:text-purple-400">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> The original fuzzy task will be deleted and replaced with these specific, actionable tasks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={currentStep === 1 ? onClose : handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              variant="primary"
              onClick={currentStep === 4 ? handleFinish : handleNext}
              className="flex items-center gap-2"
              disabled={
                (currentStep === 1 && !contextData.idealOutcome.trim()) ||
                (currentStep === 2 && !infoGapsData.informationNeeded.trim() && !infoGapsData.decisionsRequired.trim())
              }
            >
              {currentStep === 4 ? 'Create Tasks' : 'Next'}
              {currentStep < 4 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};