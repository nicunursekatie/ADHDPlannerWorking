import React, { useState, useEffect } from 'react';
import { Task, WhatNowCriteria } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import { sortTasks, EnergyLevel, getTaskRecommendationReason } from '../../utils/taskPrioritization';
import Card from '../common/Card';
import Button from '../common/Button';
import { TaskDisplay } from "../TaskDisplay";
import { CloudLightning as Lightning, Clock, BrainCircuit, Battery, Star } from 'lucide-react';

interface WhatNowWizardProps {
  onSelectTask: (task: Task) => void;
}

const WhatNowWizard: React.FC<WhatNowWizardProps> = ({ onSelectTask }) => {
  const { tasks, projects, categories, deleteTask, updateTask } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [availableTime, setAvailableTime] = useState<'short' | 'medium' | 'long'>('medium');
  const [blockers, setBlockers] = useState<string[]>([]);
  
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [newBlocker, setNewBlocker] = useState('');
  
  useEffect(() => {
    if (step === 4) {
      // Use our new smart sorting to get recommended tasks
      let filteredTasks = [...tasks].filter(t => !t.completed && !t.archived);
      
      // Filter by available time
      if (availableTime === 'short') {
        filteredTasks = filteredTasks.filter(t => !t.estimatedMinutes || t.estimatedMinutes <= 30);
      } else if (availableTime === 'medium') {
        filteredTasks = filteredTasks.filter(t => !t.estimatedMinutes || t.estimatedMinutes <= 120);
      }
      // For 'long', no time filtering needed
      
      // Get smart sorted tasks based on energy level
      const smartSorted = sortTasks(filteredTasks, 'smart', energyLevel);
      
      // Take top 5 recommendations
      setRecommendedTasks(smartSorted.slice(0, 5));
    }
  }, [step, tasks, energyLevel, availableTime, blockers]);
  
  const handleTimeSelection = (time: 'short' | 'medium' | 'long') => {
    setAvailableTime(time);
    setStep(2);
  };
  
  const handleEnergySelection = (energy: EnergyLevel) => {
    setEnergyLevel(energy);
    setStep(3);
  };
  
  const handleAddBlocker = () => {
    if (newBlocker.trim()) {
      setBlockers(prev => [...prev, newBlocker.trim()]);
      setNewBlocker('');
    }
  };
  
  const handleRemoveBlocker = (index: number) => {
    setBlockers(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleNextFromBlockers = () => {
    setStep(4);
  };
  
  const handleReset = () => {
    setStep(1);
    setAvailableTime('medium');
    setEnergyLevel('medium');
    setBlockers([]);
    setRecommendedTasks([]);
  };
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">How much time do you have?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleTimeSelection('short')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-primary-300 dark:hover:border-primary-600">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                A little time
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Less than 30 minutes
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleTimeSelection('medium')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-primary-300 dark:hover:border-primary-600">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Some time
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                30 minutes to 2 hours
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleTimeSelection('long')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-primary-300 dark:hover:border-primary-600">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Lots of time
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                More than 2 hours
              </p>
            </div>
          </Card>
        </button>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center flex-1">How's your energy level?</h2>
        <button 
          onClick={() => setStep(1)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleEnergySelection('low')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-red-300 dark:hover:border-red-600">
            <div className="text-center">
              <Battery className="w-12 h-12 text-red-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🔋 Low Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tired, unfocused, need easy tasks
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleEnergySelection('medium')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-yellow-300 dark:hover:border-yellow-600">
            <div className="text-center">
              <Battery className="w-12 h-12 text-yellow-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🔋🔋 Medium Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Average focus, can handle most tasks
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleEnergySelection('high')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-green-300 dark:hover:border-green-600">
            <div className="text-center">
              <Battery className="w-12 h-12 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🔋🔋🔋 High Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Focused, ready to tackle anything
              </p>
            </div>
          </Card>
        </button>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center flex-1">Any current blockers?</h2>
        <button 
          onClick={() => setStep(2)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Back
        </button>
      </div>
      
      <Card>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Add any current limitations (e.g., "no internet", "can't make noise", "no computer")
          </p>
          
          <div className="flex">
            <input
              type="text"
              value={newBlocker}
              onChange={(e) => setNewBlocker(e.target.value)}
              className="block w-full rounded-l-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter a blocker"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddBlocker();
                }
              }}
            />
            <Button
              onClick={handleAddBlocker}
              className="rounded-l-none"
            >
              Add
            </Button>
          </div>
          
          {blockers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current blockers:</h3>
              <div className="flex flex-wrap gap-2">
                {blockers.map((blocker, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                  >
                    <span>{blocker}</span>
                    <button
                      className="ml-2 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      onClick={() => handleRemoveBlocker(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNextFromBlockers}
            >
              Find Tasks
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center flex-1">Perfect tasks for you right now</h2>
        <button 
          onClick={() => setStep(3)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Back
        </button>
      </div>
      
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700">
        <div className="flex items-start">
          <BrainCircuit className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Based on your preferences
            </h3>
            <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>
                <span className="font-medium">Time:</span> {availableTime === 'short' ? 'A little time (≤30 min)' : availableTime === 'medium' ? 'Some time (30 min - 2 hrs)' : 'Lots of time (2+ hrs)'}
              </li>
              <li>
                <span className="font-medium">Energy:</span> {energyLevel === 'low' ? '🔋 Low energy' : energyLevel === 'medium' ? '🔋🔋 Medium energy' : '🔋🔋🔋 High energy'}
              </li>
              {blockers.length > 0 && (
                <li>
                  <span className="font-medium">Blockers:</span> {blockers.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        {recommendedTasks.length > 0 ? (
          recommendedTasks.map((task, index) => {
            const reasons = getTaskRecommendationReason(task, 'smart', energyLevel);
            return (
              <div key={task.id} className="relative">
                {/* Ranking Badge */}
                <div className="absolute -left-3 -top-3 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Task Display */}
                <div className={`border-2 rounded-xl p-1 ${
                  index === 0 ? 'border-yellow-300 bg-yellow-50/50' : 
                  index === 1 ? 'border-gray-300 bg-gray-50/50' : 
                  index === 2 ? 'border-orange-300 bg-orange-50/50' : 
                  'border-gray-200'
                }`}>
                  <TaskDisplay
                    task={task}
                    onToggle={(id) => {
                      // WhatNow doesn't need toggle - tasks are selected, not completed
                    }}
                    onEdit={() => onSelectTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                </div>
                
                {/* Recommendation Reasons */}
                {reasons.length > 0 && (
                  <div className="mt-2 ml-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                            Why this task?
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {reasons.map((reason, idx) => (
                              <span key={idx} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks match your criteria.</p>
            <p className="mt-2">Try adjusting your preferences or adding new tasks.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center pt-4">
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          Start Over
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-3xl mx-auto">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
};

export default WhatNowWizard;