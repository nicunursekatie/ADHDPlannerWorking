import React, { useState, useEffect } from 'react';
import { Brain, Save, Eye, EyeOff, Info, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { AI_PROVIDERS } from '../../utils/aiProviders';

interface AISettingsProps {
  onSave?: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ onSave }) => {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('/api/ai/breakdown');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'untested' | 'testing' | 'success' | 'error'>('untested');
  const [apiStatusMessage, setApiStatusMessage] = useState('');
  const [alwaysAskContext, setAlwaysAskContext] = useState(true);

  useEffect(() => {
    // Load existing settings
    const savedProvider = localStorage.getItem('ai_provider') || 'openai';
    const savedModel = localStorage.getItem('ai_model') || '';
    const savedApiKey = localStorage.getItem('ai_api_key') || '';
    const savedEndpoint = localStorage.getItem('ai_api_endpoint') || '/api/ai/breakdown';
    const savedContextPref = localStorage.getItem('ai_always_ask_context');
    
    setProvider(savedProvider);
    setModel(savedModel || AI_PROVIDERS[savedProvider]?.defaultModel || '');
    setApiKey(savedApiKey);
    setApiEndpoint(savedEndpoint);
    setAlwaysAskContext(savedContextPref !== 'false');
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const providerInfo = AI_PROVIDERS[provider];
    if (providerInfo && !providerInfo.models.includes(model)) {
      setModel(providerInfo.defaultModel);
    }
  }, [provider, model]);

  const testApiConnection = async () => {
    if (!apiKey) {
      setApiStatus('error');
      setApiStatusMessage('Please enter an API key');
      return;
    }

    setIsTestingApi(true);
    setApiStatus('testing');
    setApiStatusMessage('Testing API connection...');

    try {
      const providerInfo = AI_PROVIDERS[provider];
      const testMessages = [
        { role: 'system', content: 'Test connection' },
        { role: 'user', content: 'Reply with "OK" if you can read this.' }
      ];

      const response = await fetch(providerInfo.baseUrl, {
        method: 'POST',
        headers: providerInfo.headers(apiKey),
        body: JSON.stringify(providerInfo.formatRequest(testMessages, model || providerInfo.defaultModel))
      });

      if (response.ok) {
        const data = await response.json();
        const content = providerInfo.parseResponse(data);
        if (content) {
          setApiStatus('success');
          setApiStatusMessage(`API is working! Provider: ${providerInfo.name}`);
        } else {
          setApiStatus('error');
          setApiStatusMessage('Invalid response from API');
        }
      } else {
        const errorData = await response.json();
        setApiStatus('error');
        setApiStatusMessage(errorData.error?.message || 'API request failed');
      }
    } catch (error) {
      setApiStatus('error');
      setApiStatusMessage('Connection error: ' + (error as Error).message);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Save to localStorage (in production, you'd want more secure storage)
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem('ai_model', model);
      localStorage.setItem('ai_api_key', apiKey);
      localStorage.setItem('ai_api_endpoint', apiEndpoint);
      localStorage.setItem('ai_always_ask_context', alwaysAskContext.toString());
      
      
      setSaveMessage('Settings saved successfully!');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Brain className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">AI Task Breakdown Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                AI Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                {Object.entries(AI_PROVIDERS).map(([key, providerInfo]) => (
                  <option key={key} value={key}>
                    {providerInfo.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-600">
                {AI_PROVIDERS[provider]?.name === 'Groq (Free & Fast)' 
                  ? 'Free tier available with Groq API. Get your key at console.groq.com'
                  : 'Choose your preferred AI provider'
                }
              </p>
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                {AI_PROVIDERS[provider]?.models.map((modelOption) => (
                  <option key={modelOption} value={modelOption}>
                    {modelOption}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-600">
                {provider === 'openai' && model === 'gpt-4o-mini' && 'Fast and cost-effective model, great for task breakdowns'}
                {provider === 'openai' && model === 'gpt-4o' && 'Most capable OpenAI model with vision capabilities'}
                {provider === 'groq' && model === 'llama-3.3-70b-versatile' && 'Latest Llama model, excellent for detailed breakdowns'}
                {provider === 'anthropic' && model === 'claude-3-5-sonnet-20241022' && 'Claude 3.5 Sonnet - balanced performance and cost'}
              </p>
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                {AI_PROVIDERS[provider]?.name || 'API'} Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
            
            <div>
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint (Optional)
              </label>
              <input
                type="text"
                id="endpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="/api/ai/breakdown"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-600">
                Leave default unless you're using a custom endpoint.
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Status
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testApiConnection}
                  disabled={isTestingApi || !apiKey}
                  icon={isTestingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                >
                  Test Connection
                </Button>
              </div>
              <div className={`flex items-center p-3 rounded-lg border ${
                apiStatus === 'success' ? 'bg-green-50 border-green-200' :
                apiStatus === 'error' ? 'bg-red-50 border-red-200' :
                apiStatus === 'testing' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {apiStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
                {apiStatus === 'error' && <XCircle className="w-5 h-5 text-red-600 mr-2" />}
                {apiStatus === 'testing' && <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />}
                {apiStatus === 'untested' && <Info className="w-5 h-5 text-gray-600 mr-2" />}
                <span className={`text-sm ${
                  apiStatus === 'success' ? 'text-green-800' :
                  apiStatus === 'error' ? 'text-red-800' :
                  apiStatus === 'testing' ? 'text-blue-800' :
                  'text-gray-600'
                }`}>
                  {apiStatusMessage || 'API key not tested yet'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Task Breakdown Preferences</h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="alwaysAskContext"
                  checked={alwaysAskContext}
                  onChange={(e) => setAlwaysAskContext(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="alwaysAskContext" className="ml-2 block text-sm text-gray-700">
                  Always ask for context before generating breakdown
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-600 ml-6">
                {alwaysAskContext 
                  ? "You'll be prompted to provide specific details about each task for better breakdowns"
                  : "Task breakdowns will be generated immediately based on the task title and description"
                }
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              icon={<Save size={16} />}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            {saveMessage && (
              <p className={`mt-2 text-sm ${
                saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Info className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              The AI Task Breakdown feature uses advanced language models to create ADHD-friendly task breakdowns.
            </p>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-1">What makes it ADHD-friendly?</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Starts with easy steps to build momentum</li>
                <li>Includes regular breaks to prevent burnout</li>
                <li>Keeps steps short (5-30 minutes max)</li>
                <li>Provides specific, actionable instructions</li>
                <li>Includes energy level indicators</li>
                <li>Offers ADHD-specific tips for each step</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Privacy & Security</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Your API key is stored locally in your browser</li>
                <li>Task data is sent to your chosen AI provider for processing</li>
                <li>We don't store or have access to your API key</li>
                <li>All communication is encrypted</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Getting an API Key</h3>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>To use the AI Task Breakdown feature, you'll need an API key:</p>
            
            {provider === 'openai' ? (
              <>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">platform.openai.com</a></li>
                  <li>Create an account or sign in</li>
                  <li>Navigate to API keys in your account settings</li>
                  <li>Create a new API key</li>
                  <li>Copy the key and paste it above</li>
                </ol>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> OpenAI charges for API usage. The cost is typically very low
                    (about $0.01-0.02 per task breakdown), but you should monitor your usage.
                  </p>
                </div>
              </>
            ) : provider === 'groq' ? (
              <>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">console.groq.com</a></li>
                  <li>Create a free account</li>
                  <li>Navigate to API Keys section</li>
                  <li>Create a new API key</li>
                  <li>Copy the key and paste it above</li>
                </ol>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800">
                    <strong>Free Tier:</strong> Groq offers a generous free tier with high-speed inference.
                    Perfect for personal use!
                  </p>
                </div>
              </>
            ) : provider === 'anthropic' ? (
              <>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">console.anthropic.com</a></li>
                  <li>Create an account or sign in</li>
                  <li>Navigate to API Keys section</li>
                  <li>Create a new API key</li>
                  <li>Copy the key and paste it above</li>
                </ol>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Claude Models:</strong> Anthropic's Claude models are known for helpful, harmless, and honest responses.
                    Claude 3.5 Sonnet offers excellent performance for task breakdowns.
                  </p>
                </div>
              </>
            ) : (
              <p>Select a provider above to see setup instructions.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISettings;