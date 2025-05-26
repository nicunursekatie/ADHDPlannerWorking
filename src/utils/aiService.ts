import { ADHD_TASK_BREAKDOWN_SYSTEM_PROMPT, TASK_BREAKDOWN_USER_PROMPT_TEMPLATE, getPatternForTask } from './aiPrompts';

interface AIBreakdownRequest {
  taskTitle: string;
  taskDescription?: string;
  projectContext?: string;
  preferences: {
    maxSteps: number;
    maxDuration: number;
    complexity: 'simple' | 'moderate' | 'detailed';
    includeBreaks: boolean;
    userProfile?: {
      adhd_type?: string;
      focus_duration?: number;
      preferred_task_size?: string;
    };
  };
}

interface AIBreakdownStep {
  title: string;
  duration: string;
  description: string;
  type: 'work' | 'break' | 'review' | 'reward';
  energyRequired: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  tips?: string;
}

export class AITaskBreakdownService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.apiEndpoint = endpoint || '/api/ai/breakdown';
  }

  async generateBreakdown(request: AIBreakdownRequest): Promise<AIBreakdownStep[]> {
    const prompt = this.constructPrompt(request);
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: ADHD_TASK_BREAKDOWN_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data);
    } catch (error) {
      return this.getFallbackBreakdown(request);
    }
  }

  private constructPrompt(request: AIBreakdownRequest): string {
    const { taskTitle, taskDescription, preferences } = request;
    
    return TASK_BREAKDOWN_USER_PROMPT_TEMPLATE({
      title: taskTitle,
      description: taskDescription,
      estimatedMinutes: preferences.maxDuration,
      energyLevel: undefined,
      context: request.projectContext,
      userPreferences: {
        workStyle: preferences.complexity,
        bestTimeOfDay: undefined,
        breakFrequency: preferences.includeBreaks ? 'regular' : 'minimal',
        attentionSpan: preferences.userProfile?.focus_duration
      }
    });
  }

  private parseAIResponse(response: any): AIBreakdownStep[] {
    try {
      // Extract JSON from the AI response
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if no JSON found
      return this.parseTextResponse(content);
    } catch (error) {
      return [];
    }
  }

  private parseTextResponse(text: string): AIBreakdownStep[] {
    // Simple text parsing fallback
    const lines = text.split('\n').filter(line => line.trim());
    const steps: AIBreakdownStep[] = [];
    
    for (const line of lines) {
      if (line.includes(':') || line.match(/^\d+\./)) {
        const cleanLine = line.replace(/^\d+\.?\s*/, '');
        const [title, ...rest] = cleanLine.split(':');
        
        steps.push({
          title: title.trim(),
          duration: '10 mins',
          description: rest.join(":").trim() || title.trim(),
          type: 'work',
          energyRequired: 'medium'
        });
      }
    }
    
    return steps;
  }

  private getFallbackBreakdown(request: AIBreakdownRequest): AIBreakdownStep[] {
    const { taskTitle, preferences } = request;
    
    // Try to use our predefined patterns first
    const pattern = getPatternForTask(taskTitle);
    if (pattern) {
      const mappedSteps = pattern.steps.map(step => ({
        title: step.title,
        duration: step.duration,
        description: step.description,
        type: step.type,
        energyRequired: step.energyRequired,
        prerequisites: step.prerequisites || [],
        tips: step.tips
      }));
      
      // Filter based on includeBreaks preference
      const filteredSteps = preferences.includeBreaks 
        ? mappedSteps 
        : mappedSteps.filter(step => step.type !== 'break');
      
      return filteredSteps.slice(0, preferences.maxSteps);
    }
    
    // Generic ADHD-friendly breakdown
    const steps: AIBreakdownStep[] = [
      {
        title: "Clear workspace and gather materials",
        duration: "5-10 mins",
        description: "Remove distractions, get water, gather any needed supplies",
        type: "work",
        energyRequired: "low",
        tips: "This easy step helps you transition into work mode"
      },
      {
        title: `Quick brain dump for ${taskTitle}`,
        duration: "5-10 mins",
        description: "Write down all thoughts about the task without filtering",
        type: "work",
        energyRequired: "low",
        tips: "Don't worry about organization - just get ideas out"
      },
      {
        title: "Start with the easiest part",
        duration: "10-15 mins",
        description: "Begin with whatever feels most approachable",
        type: "work",
        energyRequired: "medium",
        tips: "Building momentum is key - any progress is good progress"
      }
    ];
    
    if (preferences.includeBreaks) {
      steps.push({
        title: "Movement break",
        duration: "5 mins",
        description: "Stand up, stretch, walk around, or dance",
        type: "break",
        energyRequired: "low",
        tips: "Set a timer to ensure you come back"
      });
    }
    
    steps.push(
      {
        title: "Work on main task",
        duration: "15-20 mins",
        description: "Focus on the core work now that you're warmed up",
        type: "work",
        energyRequired: "high",
        tips: "Use a timer - knowing there's an endpoint helps focus"
      },
      {
        title: "Quick review and celebrate",
        duration: "5 mins",
        description: "Check your work and acknowledge what you accomplished",
        type: "review",
        energyRequired: "low",
        tips: "Celebrating progress helps motivation for next time"
      }
    );
    
    return steps.slice(0, preferences.maxSteps);
  }
}

// Singleton instance
let aiService: AITaskBreakdownService | null = null;

export const getAIService = (apiKey?: string): AITaskBreakdownService => {
  if (!aiService && apiKey) {
    aiService = new AITaskBreakdownService(apiKey);
  }
  
  if (!aiService) {
    throw new Error('AI service not initialized. Please provide an API key.');
  }
  
  return aiService;
};

export const initializeAIService = (apiKey: string, endpoint?: string): void => {
  aiService = new AITaskBreakdownService(apiKey, endpoint);
};