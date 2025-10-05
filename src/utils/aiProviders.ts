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
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    headers: (apiKey?: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (response) => response.choices[0].message.content
  },
  
  groq: {
    name: 'Groq (Free & Fast)',
    apiKeyRequired: true,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'llama3-8b-8192', 'gemma2-9b-it'],
    defaultModel: 'llama-3.3-70b-versatile',
    headers: (apiKey?: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }),
    parseResponse: (response) => response.choices[0].message.content
  },
  
  anthropic: {
    name: 'Anthropic Claude',
    apiKeyRequired: true,
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    headers: (apiKey?: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, model) => {
      const systemMessages = messages.filter((msg) => msg.role === 'system');
      const conversationMessages = messages.filter((msg) => msg.role !== 'system');

      const formatContent = (content: any) => {
        if (Array.isArray(content)) {
          return content.map((item) => {
            if (typeof item === 'string') {
              return { type: 'text', text: item };
            }

            if (item && typeof item === 'object' && 'type' in item) {
              return item;
            }

            return { type: 'text', text: String(item) };
          });
        }

        if (typeof content === 'string') {
          return [{ type: 'text', text: content }];
        }

        return [{ type: 'text', text: String(content) }];
      };

      const formattedMessages = conversationMessages.reduce((acc: any[], msg) => {
        const normalizedRole = msg.role === 'assistant' ? 'assistant' : 'user';
        const formattedContent = formatContent(msg.content);

        if (acc.length === 0 && normalizedRole !== 'user') {
          acc.push({ role: 'user', content: formattedContent });
          return acc;
        }

        if (acc.length === 0) {
          acc.push({ role: 'user', content: formattedContent });
          return acc;
        }

        acc.push({ role: normalizedRole, content: formattedContent });
        return acc;
      }, []);

      const systemPrompt = systemMessages
        .map((msg) => {
          if (typeof msg.content === 'string') {
            return msg.content;
          }

          if (Array.isArray(msg.content)) {
            return msg.content
              .map((item) => {
                if (typeof item === 'string') {
                  return item;
                }

                if (item && typeof item === 'object' && 'text' in item) {
                  return item.text;
                }

                return String(item);
              })
              .join('\n');
          }

          return String(msg.content);
        })
        .filter(Boolean)
        .join('\n\n');

      return {
        model,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: formattedMessages,
        max_tokens: 2000,
        temperature: 0.7
      };
    },
    parseResponse: (response) => response.content[0].text
  }
};

export const getProvider = (providerName: string = 'openai'): AIProvider => {
  return AI_PROVIDERS[providerName] || AI_PROVIDERS.openai;
};