# AI Task Breakdown Prompt Improvements

## Problem
The AI was generating generic task sequences that ignored user-provided context, especially blockers like "don't know where things go" or "decision fatigue." It would jump straight into folding clothes instead of addressing the real barriers first.

## Solution
Completely rewrote the system and user prompts to:
1. Force the AI to read and address blockers FIRST
2. Follow ADHD-aware principles like triage-before-action
3. Customize steps based on specific context provided

## Key Changes

### 1. System Prompt Improvements
```
CRITICAL RULES:
1. READ AND USE THE CONTEXT PROVIDED - especially blockers
2. Address blockers FIRST, not last
3. Reduce decision fatigue by grouping, categorizing, or deferring decisions
4. Create momentum with easy wins before harder tasks
5. Each step must reduce overwhelm, clarify decision-making, or externalize mental load
```

### 2. ADHD-Aware Principles Added
- **Triage before action**: Sort into categories before detailed work
- **Decision scaffolding**: Break big decisions into micro-decisions  
- **Externalize memory**: Write things down, use containers, label clearly
- **Easy wins first**: Start with obvious/simple items to build momentum
- **Batch similar items**: Group processing reduces context switching
- **Visual cues**: Use physical separation, containers, or notes

### 3. Blocker-Specific Strategies
```
- If "don't know where to put things" → First create categories/piles, THEN process
- If "decision fatigue" → Start with items that have obvious homes, defer harder decisions
- If "overwhelmed by volume" → Break into smaller visual chunks first
- If "boring/unmotivating" → Add variety, breaks, or rewards between steps
```

### 4. User Prompt Enforcement
Added explicit requirements:
```
IMPORTANT REQUIREMENTS:
1. If the blocker is "don't know where things go" - START with categorization/sorting
2. If the blocker is "decision fatigue" - DEFER hard decisions, process easy items first
3. If the blocker is "overwhelming amount" - BREAK into visual chunks before processing
4. Use the context to customize steps - don't give generic task sequences
```

### 5. Improved Context Form
- Changed label to "What makes this task challenging? (Be specific!)"
- Updated placeholder examples to encourage specific blockers
- Better examples: "Decision fatigue - don't know where things go"

## Expected Results

### Before
For "Fold and put away laundry" with blocker "don't know where things go":
1. Fold shirts
2. Fold pants
3. Fold underwear
4. Put items in drawers

### After
For the same task and blocker:
1. Sort clothes into 3 piles: has home, needs home, unsure/donate
2. Put away items from "has home" pile (easy wins)
3. Create temporary box for "needs home" items
4. Label box with "Find homes by [date]"
5. Process "unsure" pile - try on or set aside for later decision

## Benefits
1. **Context-aware**: AI actually uses the provided blockers
2. **ADHD-friendly**: Reduces overwhelm from the start
3. **Decision scaffolding**: Defers hard choices until after momentum
4. **Practical**: Works around real barriers instead of ignoring them