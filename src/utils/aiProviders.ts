interface AIProvider {
  name: string;
  apiKeyRequired: boolean;
  baseUrl: string;
  models: string[];
  defaultModel: string;
  headers: (apiKey?: string) => Record<string, string>;
  formatRequest: (messages: any[], model: string) => any;
  parseResponse: (response: any) => string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    name: 'OpenAI',
    apiKeyRequired: true,
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4',
    headers: (apiKey?: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    }),
    parseResponse: (response) => response.choices[0].message.content
  },
  
  groq: {
    name: 'Groq (Free)',
    apiKeyRequired: true,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['mixtral-8x7b-32768', 'llama2-70b-4096'],
    defaultModel: 'mixtral-8x7b-32768',
    headers: (apiKey?: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    }),
    parseResponse: (response) => response.choices[0].message.content
  },
  
  // You can add more providers here like Anthropic, Cohere, etc.
};

export const getProvider = (providerName: string = 'openai'): AIProvider => {
  return AI_PROVIDERS[providerName] || AI_PROVIDERS.openai;
};