# AI Context Regeneration Fix

## Problem
When users clicked "Add Context" after AI had already generated steps, the component would show the context form but wouldn't regenerate the breakdown with the new context information.

## Solution
Updated the AITaskBreakdown component to properly handle context addition and regeneration.

### Changes Made

1. **"Add Context & Regenerate" Button**
   - Changed button text to clarify it will regenerate
   - Resets `hasGenerated` flag to allow regeneration
   - Clears existing breakdown options
   - Clears any errors

2. **"Skip Context" Button**
   - Resets `hasGenerated` flag to allow regeneration

3. **"Create Personalized Breakdown" Button**
   - Resets `hasGenerated` flag to ensure regeneration with context

### Code Changes

```typescript
// Add Context button now properly triggers regeneration
onClick={() => {
  setShowContextForm(true);
  setHasGenerated(false);  // Reset so it will regenerate
  setBreakdownOptions([]);  // Clear old results
  setError(null);          // Clear any errors
}}
```

### User Experience

1. User gets initial AI breakdown
2. User realizes they want to add context
3. Clicks "Add Context & Regenerate"
4. Old results are cleared
5. Context form appears
6. User fills in context and clicks "Create Personalized Breakdown"
7. AI regenerates with the new context information

### Benefits

- Clear user feedback about what will happen
- No confusion about whether context will be used
- Clean slate for new generation
- Better results based on provided context