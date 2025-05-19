# Removed Hardcoded Breakdowns

## Summary
Removed all hardcoded fallback task breakdowns from the AI Task Breakdown component. The app now requires a valid API connection to generate task breakdowns.

## Changes Made

### 1. Removed Fallback Logic
- Deleted all hardcoded task-specific breakdowns
- Removed `usingFallback` state variable
- Removed fallback UI indicators

### 2. Added Proper Error Handling
- Shows clear error message when no API key is configured
- Provides helpful error messages for connection issues
- Includes link to Settings page when API key is missing

### 3. Error Messages
- **No API Key**: "No API key configured. Please add your API key in Settings to use AI task breakdown."
- **Connection Error**: "Unable to connect to AI service. Please check your API settings and try again."
- **Other Errors**: Shows the actual error message

### 4. Improved Error UI
```html
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <div className="flex items-start">
    <X size={20} className="mr-3 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="text-sm font-medium text-red-800">Unable to generate breakdown</h3>
      <p className="text-sm text-red-700 mt-1">{error}</p>
      {error.includes('API key') && (
        <p className="text-sm text-red-700 mt-2">
          <a href="/settings" className="underline font-medium">Go to Settings</a> to configure your AI provider.
        </p>
      )}
    </div>
  </div>
</div>
```

## Behavior Changes

### Before
- Without API key: Showed hardcoded breakdowns based on task keywords
- With API error: Fell back to hardcoded breakdowns

### After
- Without API key: Shows error message with link to Settings
- With API error: Shows specific error message
- No fallback options - requires working API connection

## Benefits
1. **Cleaner Code**: Removed ~200 lines of hardcoded breakdowns
2. **Clear Expectations**: Users know they need API access
3. **Better Error Handling**: Specific error messages help users resolve issues
4. **Maintainability**: No need to maintain hardcoded breakdowns