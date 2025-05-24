export const ADHD_TASK_BREAKDOWN_SYSTEM_PROMPT = `You are an ADHD-aware assistant who breaks tasks into 3–5 motivating, concrete steps. Avoid filler like "take a break," "use a basket," or "set a timer." 
Each subtask should either reduce overwhelm, clarify decision-making, or externalize mental load.
Label steps with optional tags like: low energy, focus boost, accountability.
Speak directly to someone who needs just the right nudge to get started.

Key principles:
- Make each step a specific action, not preparation
- Focus on what matters most for task completion
- Skip obvious breaks and reward steps unless specifically requested
- Each step should move the task forward meaningfully
- Use motivating language that acknowledges ADHD challenges

For each step, provide:
1. Action-oriented title (verb + specific task)
2. Realistic time estimate (be generous with time)
3. Clear, concrete instructions
4. Energy level required (low/medium/high)
5. ADHD-specific tip for that step`;

export const TASK_BREAKDOWN_USER_PROMPT_TEMPLATE = (task: {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  energyLevel?: string;
  context?: string;
  userPreferences?: {
    workStyle?: string;
    bestTimeOfDay?: string;
    breakFrequency?: string;
    attentionSpan?: number;
  };
}) => `Break down this task into 3-5 concrete, actionable steps for someone with ADHD:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.estimatedMinutes ? `Time available: ${task.estimatedMinutes} minutes` : ''}
${task.context ? `Context: ${task.context}` : ''}

Create steps that:
- Are specific actions (not prep work)
- Reduce overwhelm or clarify decisions
- Keep momentum going forward
- Skip filler steps unless the user specifically wants breaks

${task.userPreferences?.breakFrequency === 'regular' ? 'Include 1-2 strategic breaks' : 'Skip breaks unless essential'}

Return JSON format:
{
  "title": "Verb + specific action",
  "duration": "X-Y mins",
  "description": "What exactly to do",
  "type": "work",
  "energyRequired": "low|medium|high",
  "tips": "ADHD nudge for this step"
}`;

export interface PatternStep {
  title: string;
  duration: string;
  description: string;
  type: 'work' | 'break' | 'review' | 'reward';
  energyRequired: 'low' | 'medium' | 'high';
  tips: string;
  prerequisites?: string[];
}

export const BREAKDOWN_PATTERNS: Record<string, { steps: PatternStep[] }> = {
  writing: {
    steps: [
      {
        title: "Brain dump all ideas",
        duration: "5-10 mins",
        description: "Open doc, write everything that comes to mind - messy is perfect",
        type: "work",
        energyRequired: "low",
        tips: "No editing! Just dump thoughts like texts to a friend"
      },
      {
        title: "Pick 3 main points",
        duration: "5 mins",
        description: "Circle or highlight your best ideas from the dump",
        type: "work",
        energyRequired: "low",
        tips: "Don't overthink - go with gut feeling"
      },
      {
        title: "Write ugly first paragraph",
        duration: "10-15 mins",
        description: "Turn one point into sentences - grammar doesn't matter yet",
        type: "work",
        energyRequired: "medium",
        tips: "Bad writing can be fixed; blank pages can't"
      },
      {
        title: "Expand easiest section",
        duration: "15-20 mins",
        description: "Pick the most interesting point and flesh it out",
        type: "work",
        energyRequired: "high",
        tips: "Follow your interest - excitement is fuel"
      }
    ]
  },
  
  cleaning: {
    steps: [
      {
        title: "Trash run",
        duration: "5-10 mins",
        description: "Grab a bag, collect all obvious trash - don't sort, just grab",
        type: "work",
        energyRequired: "low",
        tips: "Movement + visible progress = dopamine hit"
      },
      {
        title: "Clothes to hamper",
        duration: "5-10 mins",
        description: "Scoop all clothes into hamper - dirty or clean, doesn't matter",
        type: "work",
        energyRequired: "low",
        tips: "Perfect sorting is tomorrow's problem"
      },
      {
        title: "Clear one surface",
        duration: "10-15 mins",
        description: "Pick desk, bed, or floor - make it completely clear",
        type: "work",
        energyRequired: "medium",
        tips: "One clear surface changes the whole room vibe"
      },
      {
        title: "5-minute speed sort",
        duration: "5 mins",
        description: "Put things in general right area - kitchen stuff toward kitchen",
        type: "work",
        energyRequired: "medium",
        tips: "Timer racing makes boring tasks fun"
      }
    ]
  },
  
  studying: {
    steps: [
      {
        title: "Prepare study materials",
        duration: "5-10 mins",
        description: "Gather books, notes, snacks, water",
        type: "work",
        energyRequired: "low",
        tips: "Having everything ready prevents interruptions"
      },
      {
        title: "Quick review of headings",
        duration: "5-10 mins",
        description: "Skim chapter headings and summaries",
        type: "work",
        energyRequired: "low",
        tips: "Gives your brain a map of what's coming"
      },
      {
        title: "Active reading - section 1",
        duration: "20-25 mins",
        description: "Read with highlighter, take notes",
        type: "work",
        energyRequired: "high",
        tips: "Use Pomodoro timer, reward yourself after"
      },
      {
        title: "Movement and snack break",
        duration: "10 mins",
        description: "Stretch, hydrate, healthy snack",
        type: "break",
        energyRequired: "low",
        tips: "Movement helps reset attention"
      },
      {
        title: "Summarize what you learned",
        duration: "10-15 mins",
        description: "Write key points in your own words",
        type: "review",
        energyRequired: "medium",
        tips: "Teaching yourself helps retention"
      }
    ]
  }
};

export const getPatternForTask = (taskTitle: string): typeof BREAKDOWN_PATTERNS[keyof typeof BREAKDOWN_PATTERNS] | null => {
  const lowerTitle = taskTitle.toLowerCase();
  
  if (lowerTitle.includes('write') || lowerTitle.includes('essay') || lowerTitle.includes('report')) {
    return BREAKDOWN_PATTERNS.writing;
  }
  
  if (lowerTitle.includes('clean') || lowerTitle.includes('organize') || lowerTitle.includes('tidy')) {
    return BREAKDOWN_PATTERNS.cleaning;
  }
  
  if (lowerTitle.includes('study') || lowerTitle.includes('read') || lowerTitle.includes('learn')) {
    return BREAKDOWN_PATTERNS.studying;
  }
  
  return null;
};