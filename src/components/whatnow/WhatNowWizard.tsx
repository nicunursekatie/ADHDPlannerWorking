import React, { useState, useEffect } from 'react';
import { Task, WhatNowCriteria } from '../../types';
import { useAppContext } from '../../context/AppContextSupabase';
import Card from '../common/Card';
import Button from '../common/Button';
import { TaskDisplay } from "../TaskDisplay";
import { CloudLightning as Lightning, Clock, BrainCircuit } from 'lucide-react';

interface WhatNowWizardProps {
  onSelectTask: (task: Task) => void;
}

const WhatNowWizard: React.FC<WhatNowWizardProps> = ({ onSelectTask }) => {
  const { recommendTasks, projects, categories, deleteTask, updateTask } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState<WhatNowCriteria>({
    availableTime: 'medium',
    energyLevel: 'medium',
    blockers: [],
  });
  
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [newBlocker, setNewBlocker] = useState('');
  
  useEffect(() => {
    if (step === 4) {
      const tasks = recommendTasks(criteria);
      setRecommendedTasks(tasks);
    }
  }, [step, criteria, recommendTasks]);
  
  const handleTimeSelection = (time: 'short' | 'medium' | 'long') => {
    setCriteria(prev => ({ ...prev, availableTime: time }));
    setStep(2);
  };
  
  const handleEnergySelection = (energy: 'low' | 'medium' | 'high') => {
    setCriteria(prev => ({ ...prev, energyLevel: energy }));
    setStep(3);
  };
  
  const handleAddBlocker = () => {
    if (newBlocker.trim()) {
      setCriteria(prev => ({
        ...prev,
        blockers: [...prev.blockers, newBlocker.trim()],
      }));
      setNewBlocker('');
    }
  };
  
  const handleRemoveBlocker = (index: number) => {
    setCriteria(prev => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index),
    }));
  };
  
  const handleNextFromBlockers = () => {
    setStep(4);
  };
  
  const handleReset = () => {
    setStep(1);
    setCriteria({
      availableTime: 'medium',
      energyLevel: 'medium',
      blockers: [],
    });
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
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-danger-300 dark:hover:border-danger-600">
            <div className="text-center">
              <Lightning className="w-12 h-12 text-danger-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Low Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tired, unfocused, or unmotivated
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleEnergySelection('medium')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-warning-300 dark:hover:border-warning-600">
            <div className="text-center">
              <Lightning className="w-12 h-12 text-warning-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Medium Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Average focus and motivation
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer group" 
          onClick={() => handleEnergySelection('high')}
        >
          <Card className="hover:shadow-lg transition-all duration-200 h-full hover:scale-105 border-2 hover:border-success-300 dark:hover:border-success-600">
            <div className="text-center">
              <Lightning className="w-12 h-12 text-success-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                High Energy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Focused, motivated, and ready to work
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
          
          {criteria.blockers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current blockers:</h3>
              <div className="flex flex-wrap gap-2">
                {criteria.blockers.map((blocker, index) => (
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
                <span className="font-medium">Time:</span> {criteria.availableTime === 'short' ? 'A little time' : criteria.availableTime === 'medium' ? 'Some time' : 'Lots of time'}
              </li>
              <li>
                <span className="font-medium">Energy:</span> {criteria.energyLevel === 'low' ? 'Low energy' : criteria.energyLevel === 'medium' ? 'Medium energy' : 'High energy'}
              </li>
              {criteria.blockers.length > 0 && (
                <li>
                  <span className="font-medium">Blockers:</span> {criteria.blockers.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        {recommendedTasks.length > 0 ? (
          recommendedTasks.map(task => (
            <TaskDisplay
            key={task.id}
            task={task}
            onToggle={(id) => {
              // WhatNow doesn't need toggle - tasks are selected, not completed
            }}
            onEdit={() => onSelectTask(task)}
            onDelete={() => deleteTask(task.id)}
          />
          ))
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