// Test script to verify Groq JSON conversion

// Simulate the Groq response format
const groqResponse = [
  { Step: "Clear visible flat surfaces first" },
  { Step: "Gather loose items into temporary containers" },
  { Step: "Sort one container at a time" }
];

console.log('Original Groq response:', JSON.stringify(groqResponse, null, 2));

// Test the conversion logic from AITaskBreakdown.tsx
let steps = groqResponse;

// Handle Groq's different response format
if (steps.length > 0 && steps[0].Step) {
  console.log('Detected Groq format, converting...');
  steps = steps.map((step, index) => ({
    title: step.Step || `Step ${index + 1}`,
    duration: '5-10 mins',
    description: step.Step || `Step ${index + 1}`,
    type: 'work',
    energyRequired: 'medium',
    tips: 'Focus on this specific action'
  }));
}

console.log('\nConverted format:', JSON.stringify(steps, null, 2));

// Verify the conversion worked
if (steps[0].title && steps[0].duration && steps[0].description) {
  console.log('\n✅ SUCCESS: Conversion created proper structure');
} else {
  console.log('\n❌ FAILED: Conversion failed to create proper structure');
}

// Test edge cases
console.log('\n--- Testing edge cases ---');

// Test with undefined Step
const edgeCase1 = [{ Step: undefined }];
console.log('Edge case 1 - undefined Step:', edgeCase1);
const converted1 = edgeCase1.map((step, index) => ({
  title: step.Step || `Step ${index + 1}`,
  duration: '5-10 mins',
  description: step.Step || `Step ${index + 1}`,
  type: 'work',
  energyRequired: 'medium',
  tips: 'Focus on this specific action'
}));
console.log('Result:', converted1[0].title); // Should be "Step 1"

// Test with empty array
const edgeCase2 = [];
console.log('\nEdge case 2 - empty array:', edgeCase2);
if (edgeCase2.length > 0 && edgeCase2[0].Step) {
  console.log('Would convert');
} else {
  console.log('No conversion needed - array is empty');
}