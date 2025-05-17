import React, { useState, useEffect } from 'react';
import { Brain, Save, Eye, EyeOff, Info, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { AI_PROVIDERS } from '../../utils/aiProviders';

interface AISettingsProps {
  onSave?: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ onSave }) => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('/api/ai/breakdown');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load existing settings
    const savedProvider = localStorage.getItem('ai_provider') || 'openai';
    const savedApiKey = localStorage.getItem('ai_api_key') || '';
    const savedEndpoint = localStorage.getItem('ai_api_endpoint') || '/api/ai/breakdown';
    
    setProvider(savedProvider);
    setApiKey(savedApiKey);
    setApiEndpoint(savedEndpoint);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Save to localStorage (in production, you'd want more secure storage)
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem('ai_api_key', apiKey);
      localStorage.setItem('ai_api_endpoint', apiEndpoint);
      
      // Initialize the AI service with new settings
      if (apiKey) {
        // This would initialize your AI service
        // initializeAIService(apiKey, apiEndpoint);
      }
      
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
                {AI_PROVIDERS[provider]?.name === 'Groq (Free)' 
                  ? 'Free tier available with Groq API. Get your key at console.groq.com'
                  : 'Choose your preferred AI provider'
                }
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
              The AI Task Breakdown feature uses OpenAI's GPT-4 to create ADHD-friendly task breakdowns.
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
                <li>Task data is sent to OpenAI for processing</li>
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