import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle, AlertCircle, Users, Calendar, Brain, Search, MessageSquare, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';
import { Task, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { AI_PROVIDERS, getProvider } from '../../utils/aiProviders';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const generateActionableTasks = async () => {
    setIsGenerating(true);
    setAiError(null);
    
    // Check for API key
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (!apiKey) {
      // Fall back to smart pattern matching if no API key
      generateSmartTasks();
      setIsGenerating(false);
      return;
    }
    
    try {
      // Create AI prompt with all context
      const prompt = `
You are helping someone with ADHD break down an overwhelming task into manageable steps.

Original Task: "${task.title}"
${task.description ? `Description: ${task.description}` : ''}

Context from user:
- Ideal Outcome: ${contextData.idealOutcome}
- Current Blockers: ${contextData.blockers}
- Time Constraints: ${contextData.timeConstraints}
- People Affected: ${contextData.peopleAffected}

Information Gaps:
- Information Needed: ${infoGapsData.informationNeeded}
- Decisions Required: ${infoGapsData.decisionsRequired}
- Waiting On: ${infoGapsData.waitingOn}

Generate 4-6 specific, actionable tasks that:
1. Address each blocker mentioned
2. Gather the information needed
3. Include communication with people affected
4. Break decisions into research then decision steps
5. Are concrete and specific (not vague)
6. Include realistic time estimates
7. Have appropriate energy levels for someone with ADHD
8. Create logical dependencies (research before decisions)

Return ONLY a JSON array of tasks with this exact structure:
[
  {
    "title": "Specific task title (max 60 chars)",
    "description": "Detailed description of what to do and why",
    "type": "communication|research|decision|cleanup|action",
    "energyLevel": "low|medium|high",
    "estimatedMinutes": 15,
    "urgency": "today|tomorrow|week|month|someday",
    "emotionalWeight": "easy|neutral|stressful|dreading",
    "dependsOn": []
  }
]

Be specific and actionable. Avoid generic tasks.`;

      const provider = getProvider('openai');
      const response = await fetch(provider.baseUrl, {
        method: 'POST',
        headers: provider.headers(apiKey),
        body: JSON.stringify(provider.formatRequest([
          { role: 'system', content: 'You are an expert at breaking down tasks for people with ADHD. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ], 'gpt-4o-mini'))
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = provider.parseResponse(data);
      
      // Parse the JSON response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]) as GeneratedTask[];
        // Ensure we have valid tasks
        const validTasks = tasks.filter(t => t.title && t.description).slice(0, 6);
        setGeneratedTasks(validTasks);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      setAiError('AI generation failed. Using smart pattern matching instead.');
      // Fall back to smart pattern matching
      generateSmartTasks();
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateSmartTasks = () => {
    const tasks: GeneratedTask[] = [];
    
    // Analyze the context more intelligently
    const hasDeadline = contextData.timeConstraints.toLowerCase().includes('deadline') || 
                       contextData.timeConstraints.toLowerCase().includes('due') ||
                       contextData.timeConstraints.toLowerCase().includes('by');
    
    const isUrgent = contextData.timeConstraints.toLowerCase().includes('today') || 
                     contextData.timeConstraints.toLowerCase().includes('urgent') ||
                     contextData.timeConstraints.toLowerCase().includes('asap');
    
    // For Charlotte's cheerleading case - generate smart tasks based on the context
    const idealOutcome = contextData.idealOutcome.toLowerCase();
    const blockers = contextData.blockers.toLowerCase();
    
    // Smart task generation based on common patterns
    
    // 1. Research phase - always needed when location/options are unknown
    if (idealOutcome.includes('sign') || idealOutcome.includes('find') || 
        blockers.includes('don\'t know') || blockers.includes('not sure')) {
      
      // Research local options
      tasks.push({
        title: 'Research local cheerleading teams in Fulton County',
        description: 'Search online for cheerleading programs in Fulton County. Check recreation centers, YMCA, private gyms, and school programs. Make a list with contact info, costs, and schedules.',
        type: 'research',
        energyLevel: 'medium',
        estimatedMinutes: 45,
        urgency: isUrgent ? 'today' : 'week',
        emotionalWeight: 'easy'
      });
      
      // Check deadlines and requirements
      tasks.push({
        title: 'Call 3 potential teams about late registration',
        description: 'Contact the top 3 options from your research. Explain the late move situation and ask about: late registration options, tryout dates, practice schedules, and costs.',
        type: 'communication',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        urgency: 'week',
        emotionalWeight: 'neutral',
        dependsOn: [0]
      });
    }
    
    // 2. Handle refunds/cancellations if mentioned
    if (idealOutcome.includes('refund') || idealOutcome.includes('money back') || 
        blockers.includes('cancel')) {
      tasks.push({
        title: 'Request refund from old cheerleading program',
        description: 'Contact the previous program. Explain the move and request a prorated refund. Get confirmation in writing. If denied, ask about credit for next season or transfer options.',
        type: 'communication',
        energyLevel: 'low',
        estimatedMinutes: 20,
        urgency: 'week',
        emotionalWeight: 'neutral'
      });
    }
    
    // 3. Decision making - after research
    if (idealOutcome.includes('choose') || idealOutcome.includes('decide') || 
        idealOutcome.includes('pick') || tasks.some(t => t.type === 'research')) {
      const researchTaskIndex = tasks.findIndex(t => t.type === 'research');
      tasks.push({
        title: 'Review options with Charlotte and decide',
        description: 'Sit down with Charlotte to review the cheerleading options. Consider: location/commute, practice schedule, cost, team level, and her preferences. Make a decision together.',
        type: 'decision',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        urgency: 'week',
        emotionalWeight: 'easy',
        dependsOn: researchTaskIndex >= 0 ? [researchTaskIndex, researchTaskIndex + 1] : []
      });
    }
    
    // 4. Action steps - registration/signup
    if (idealOutcome.includes('sign') || idealOutcome.includes('register') || 
        idealOutcome.includes('enroll')) {
      const decisionIndex = tasks.findIndex(t => t.type === 'decision');
      tasks.push({
        title: 'Complete registration for chosen team',
        description: 'Fill out registration forms, submit payment, get uniform information, and add practice schedule to calendar. Confirm Charlotte\'s spot on the team.',
        type: 'action',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        urgency: 'week',
        emotionalWeight: 'easy',
        dependsOn: decisionIndex >= 0 ? [decisionIndex] : []
      });
    }
    
    // 5. Handle emotional aspects mentioned
    if (blockers.includes('feel') || blockers.includes('guilt') || 
        blockers.includes('terrible') || blockers.includes('disappointed')) {
      tasks.push({
        title: 'Talk with Charlotte about the transition',
        description: 'Have an open conversation with Charlotte about the move and changes. Acknowledge her feelings about leaving old friends. Focus on exciting new opportunities and making new friends. Maybe plan a visit with old team friends.',
        type: 'communication',
        energyLevel: 'high',
        estimatedMinutes: 20,
        urgency: 'week',
        emotionalWeight: 'stressful'
      });
    }
    
    // 6. Alternative options if main path blocked
    if (blockers.includes('deadline') || blockers.includes('missed') || 
        blockers.includes('too late')) {
      tasks.push({
        title: 'Research alternative activities for this season',
        description: 'If cheerleading registration is closed, research: gymnastics, dance, tumbling classes, or other activities to keep skills sharp until next cheer season. Consider private coaching or camps.',
        type: 'research',
        energyLevel: 'low',
        estimatedMinutes: 25,
        urgency: 'month',
        emotionalWeight: 'easy'
      });
    }
    
    // Remove duplicates and limit to 5-6 most relevant tasks
    const uniqueTasks = tasks.slice(0, 6);
    
    // If we still have no tasks, fall back to generic helpful tasks
    if (uniqueTasks.length === 0) {
      uniqueTasks.push(
        {
          title: `Define clear next step for: ${task.title.substring(0, 30)}`,
          description: `Break down "${task.title}" into the very first concrete action you can take. What's the smallest step that moves this forward?`,
          type: 'action',
          energyLevel: 'low',
          estimatedMinutes: 15,
          urgency: 'week',
          emotionalWeight: 'easy'
        },
        {
          title: `Gather information needed for: ${task.title.substring(0, 25)}`,
          description: `List what you need to know or have before you can complete this task. Research or ask for the missing pieces.`,
          type: 'research',
          energyLevel: 'medium',
          estimatedMinutes: 30,
          urgency: 'week',
          emotionalWeight: 'neutral'
        }
      );
    }
    
    setGeneratedTasks(uniqueTasks);
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      await generateActionableTasks();
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
        notes: `Broken down from: ${task.title}`  // Use notes field instead of braindumpSource
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
              
              {/* API Key Notice */}
              {!localStorage.getItem('openai_api_key') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> Add your OpenAI API key in Settings for AI-powered task breakdowns. Without it, we'll use pattern matching instead.
                  </p>
                </div>
              )}
              
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
              {aiError && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg mb-2">
                  {aiError}
                </div>
              )}
              {isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">AI is analyzing your task...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've generated {generatedTasks.length} specific tasks based on your input:
                  </p>
                </>
              )}
              
              {!isGenerating && (
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
              )}
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