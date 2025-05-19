// Test the actual Groq response format from the logs

const groqResponse = [
  {
    "step": "Pick up any clean clothes with designated homes (e.g., towels, socks, etc.) and put them away immediately."
  },
  {
    "step": "Put away clothes with existing homes (skip the rest for now) and sort them into categories (e.g., tops, bottoms, etc.)."
  },
  {
    "step": "Clear a small area (e.g., a single shelf or basket) and put away a handful of clothes that have similar characteristics (e.g., all the same type of shirt)."
  }
];

console.log('Testing Groq response format...');
console.log('First item:', JSON.stringify(groqResponse[0], null, 2));
console.log('Has Step field?', !!groqResponse[0].Step);
console.log('Has step field?', !!groqResponse[0].step);
console.log('Step value:', groqResponse[0].Step);
console.log('step value:', groqResponse[0].step);

// Test the conversion logic
if (groqResponse.length > 0 && (groqResponse[0].Step || groqResponse[0].step)) {
  console.log('\nDetected Groq format, converting...');
  const converted = groqResponse.map((step, index) => ({
    title: step.Step || step.step || `Step ${index + 1}`,
    duration: '5-10 mins',
    description: step.Step || step.step || `Step ${index + 1}`,
    type: 'work',
    energyRequired: 'medium',
    tips: 'Focus on this specific action'
  }));
  
  console.log('Converted first item:', JSON.stringify(converted[0], null, 2));
} else {
  console.log('\nGroq format not detected!');
}

// Test what happens with current logic
console.log('\n--- Testing current breakdown mapping ---');
const breakdown = groqResponse.map((step, index) => ({
  id: `${index + 1}`,
  title: step.title || step.Step || step.step || `Step ${index + 1}`,
  duration: step.duration || '5-10 mins',
  description: step.description || step.Step || step.step || `Complete step ${index + 1}`,
  selected: true,
  editable: false,
  type: step.type || 'work',
  energyRequired: step.energyRequired || 'medium',
  tips: step.tips || 'Focus on this specific action'
}));

console.log('Final breakdown item:', JSON.stringify(breakdown[0], null, 2));