# Groq Integration Debugging Summary

## Changes Made to Improve AI Task Breakdowns

### LATEST UPDATE: Work-Around-Blockers Philosophy
Completely revamped the breakdown approach to address these issues:
- AI was fixating on single blockers mentioned by users
- Steps were becoming questions rather than actions
- Breakdowns required decisions before enabling progress

New system:
- Works AROUND blockers instead of through them
- Prioritizes partial progress over perfect planning
- Never asks questions as steps
- Enables immediate action despite uncertainty

### NEW: Context-Aware Breakdowns
Added a context gathering form that appears before generating breakdowns to collect:
- Current state with the task
- Specific blockers
- Specific goal
- Time available
- Energy level
- Environment/constraints

Users can:
- Skip the context form if they want quick suggestions
- Set a preference to always/never show the context form
- Go back to add context after seeing initial results

### 1. Enhanced Console Logging
- Added logging of full API response: `console.log('Full API response:', JSON.stringify(data, null, 2))`
- Added logging of parsed content: `console.log('Parsed content:', content)`
- Added error stack traces for better debugging
- Added logging of generated breakdowns
- Added logging of provider details (name, model)

### 2. Improved System Prompt
- Explicitly forbids filler steps like "take a break", "gather materials", "set timer"
- Requires concrete actions that advance the task
- Emphasizes breaking complex decisions into simple ones
- Focuses on starting rather than preparing

### 3. Improved User Prompt
- More specific requirements for action-oriented steps
- Provides concrete examples of good vs bad steps
- Requests exact number of steps
- Asks for JSON-only response with no extra text

### 4. Revamped Fallback Patterns
All fallback patterns now avoid filler and focus on concrete actions:

**Cleaning Tasks:**
- Dump everything onto one surface
- Create 3 piles: trash, belongs here, goes elsewhere
- Toss trash immediately
- Put "belongs here" items in exact spots
- Deliver "elsewhere" pile to destinations

**Laundry Tasks:**
- Dump hamper directly into machine
- Add soap & hit start immediately
- For dryer: transfer everything at once

**Writing Tasks:**
- Write 3 main points first
- Turn easiest point into sentences
- Write opening with strongest point
- Fill remaining points without editing
- Read once out loud and send

**Generic Tasks:**
- Define "done" in 1 sentence
- Do the very first physical action
- Complete hardest 20% that creates 80% value
- Make it "good enough" and declare done

## To Test the Changes:

1. Open the browser console (F12) 
2. Click the Brain icon on any task
3. Watch for these new log messages:
   - "Using fallback breakdown - no API key" (if no API key)
   - "Making real API call to: groq with model: ..."
   - "Full API response: ..." (the raw Groq response)
   - "Parsed content: ..." (extracted content)
   - "Generated breakdown: ..." (final breakdown array)

## Common Issues to Look For:

1. **API Response Issues:**
   - Check if Groq is returning valid JSON
   - Look for error messages in the response
   - Verify the model name is correct (llama3-8b-8192)

2. **Parsing Issues:**
   - Content might not be proper JSON
   - Groq might be adding extra text around the JSON
   - JSON structure might not match expected format

3. **Prompt Issues:**
   - Groq might not be following the JSON-only instruction
   - Model might still be generating filler steps

## Next Steps:

1. Run a test with the Brain icon and check console logs
2. Share the full API response from Groq
3. Based on what we see, we can:
   - Adjust the prompt for Groq specifically
   - Add better JSON extraction for Groq responses
   - Switch to a different Groq model if needed