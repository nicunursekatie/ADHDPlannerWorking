export const ADHD_TASK_BREAKDOWN_SYSTEM_PROMPT = `You are an AI assistant specialized in helping people with ADHD break down tasks into manageable steps. You understand that ADHD presents unique challenges in task management:

1. Executive dysfunction makes starting tasks difficult
2. Time blindness affects estimation
3. Attention regulation impacts focus duration
4. Motivation requires immediate rewards
5. Working memory limitations affect complex sequences

Your task breakdowns should:

- Start with the easiest, most engaging step to build momentum
- Keep steps concrete and specific (no vague instructions)
- Limit each step to 5-30 minutes maximum
- Include regular breaks to prevent burnout
- Use action verbs that clearly define what to do
- Account for setup/transition time between steps
- Build in flexibility for bad brain days
- Include dopamine rewards/checkpoints
- Avoid overwhelming detail
- Consider energy levels throughout the day

For each step, provide:
1. Clear action title
2. Realistic time estimate (always add buffer time)
3. Specific instructions
4. Energy level required (low/medium/high)
5. Any prerequisites or materials needed`;

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
}) => `Break down this task for someone with ADHD:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.estimatedMinutes ? `Original estimate: ${task.estimatedMinutes} minutes` : ''}
${task.energyLevel ? `Energy level: ${task.energyLevel}` : ''}
${task.context ? `Context: ${task.context}` : ''}

User preferences:
${task.userPreferences?.workStyle ? `- Work style: ${task.userPreferences.workStyle}` : ''}
${task.userPreferences?.bestTimeOfDay ? `- Best time of day: ${task.userPreferences.bestTimeOfDay}` : ''}
${task.userPreferences?.breakFrequency ? `- Break frequency: ${task.userPreferences.breakFrequency}` : ''}
${task.userPreferences?.attentionSpan ? `- Typical attention span: ${task.userPreferences.attentionSpan} minutes` : ''}

Please provide a step-by-step breakdown that:
1. Starts with an easy win to build momentum
2. Includes specific, actionable steps
3. Accounts for ADHD challenges
4. Builds in breaks and rewards
5. Provides realistic time estimates

Format each step as:
{
  "title": "Step title (action verb + specific task)",
  "duration": "X-Y mins (always provide range)",
  "description": "Clear, specific instructions",
  "type": "work|break|review|reward",
  "energyRequired": "low|medium|high",
  "prerequisites": ["any materials or prior steps needed"],
  "tips": "ADHD-specific tips for this step"
}`;

export const BREAKDOWN_PATTERNS = {
  writing: {
    steps: [
      {
        title: "Set up writing space",
        duration: "5-10 mins",
        description: "Clear desk, open document, put phone away",
        type: "work",
        energyRequired: "low",
        tips: "Start with just opening the document - that's a win!"
      },
      {
        title: "Brain dump key points",
        duration: "10-15 mins",
        description: "Write down all thoughts without editing",
        type: "work",
        energyRequired: "medium",
        tips: "No editing! Just get ideas out"
      },
      {
        title: "Take a movement break",
        duration: "5 mins",
        description: "Stand up, stretch, walk around",
        type: "break",
        energyRequired: "low",
        tips: "Set a timer to ensure you come back"
      },
      {
        title: "Organize into sections",
        duration: "10-15 mins",
        description: "Group related points together",
        type: "work",
        energyRequired: "medium",
        tips: "Use colors or emojis to mark different sections"
      },
      {
        title: "Write first section",
        duration: "15-20 mins",
        description: "Focus on one section only",
        type: "work",
        energyRequired: "high",
        tips: "Start with the easiest or most interesting section"
      }
    ]
  },
  
  cleaning: {
    steps: [
      {
        title: "Play energizing music",
        duration: "2-3 mins",
        description: "Queue up a cleaning playlist",
        type: "work",
        energyRequired: "low",
        tips: "Music helps maintain focus and energy"
      },
      {
        title: "Gather trash only",
        duration: "10-15 mins",
        description: "Walk around with trash bag, collect only obvious trash",
        type: "work",
        energyRequired: "low",
        tips: "One category at a time prevents overwhelm"
      },
      {
        title: "Victory dance break",
        duration: "3-5 mins",
        description: "Celebrate progress with movement",
        type: "break",
        energyRequired: "low",
        tips: "Celebrating small wins builds motivation"
      },
      {
        title: "Return items to homes",
        duration: "15-20 mins",
        description: "Put things where they belong",
        type: "work",
        energyRequired: "medium",
        tips: "Set timer - when it rings, stop even if not done"
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