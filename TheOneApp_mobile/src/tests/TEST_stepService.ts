/**
 * TEST FILE: Step Service Testing
 * Created: 3/27/2025
 * 
 * This file tests the stepService implementation to ensure it correctly
 * accesses and manages the synchronized steps data.
 */

import stepService, { Step, StepTitle } from '../services/stepService';

/**
 * Simple test runner for stepService
 */
function testStepService() {
  console.log('=== TESTING STEP SERVICE ===');
  
  // Test 1: Get all step titles
  console.log('\nTest 1: Get all step titles');
  const allTitles = stepService.getAllStepTitles();
  console.log(`Total steps: ${allTitles.length}`);
  console.log('First 5 steps:');
  allTitles.slice(0, 5).forEach(step => {
    console.log(`- Step ${step.id}: ${step.title}`);
  });
  
  // Test 2: Get total steps count
  console.log('\nTest 2: Get total steps count');
  const totalCount = stepService.getTotalStepsCount();
  console.log(`Total steps count: ${totalCount}`);
  console.log(`Matches titles array length: ${totalCount === allTitles.length ? 'Yes' : 'No'}`);
  
  // Test 3: Get step by ID
  console.log('\nTest 3: Get step by ID');
  const step1 = stepService.getStepById(1);
  console.log(`Step 1 title: ${step1?.title}`);
  console.log(`Step 1 practices: ${step1?.practices.length}`);
  console.log(`Step 1 first practice: ${step1?.practices[0]}`);
  console.log(`Step 1 first duration: ${step1?.durations[0]} seconds`);
  
  // Test 4: Get non-existent step
  console.log('\nTest 4: Get non-existent step');
  const nonExistentStep = stepService.getStepById(9999);
  console.log(`Non-existent step: ${nonExistentStep ? 'Found (ERROR)' : 'Not found (CORRECT)'}`);
  
  // Test 5: Test caching
  console.log('\nTest 5: Test caching');
  console.log('Getting step 2 for the first time...');
  const startTime1 = performance.now();
  const step2First = stepService.getStepById(2);
  const endTime1 = performance.now();
  console.log(`First load time: ${(endTime1 - startTime1).toFixed(2)}ms`);
  
  console.log('Getting step 2 again (should be from cache)...');
  const startTime2 = performance.now();
  const step2Second = stepService.getStepById(2);
  const endTime2 = performance.now();
  console.log(`Second load time: ${(endTime2 - startTime2).toFixed(2)}ms`);
  
  // Test 6: Preload next step
  console.log('\nTest 6: Preload next step');
  console.log('Preloading step 3...');
  stepService.preloadNextStep(2);
  
  console.log('Getting step 3 (should be from cache)...');
  const startTime3 = performance.now();
  const step3 = stepService.getStepById(3);
  const endTime3 = performance.now();
  console.log(`Load time: ${(endTime3 - startTime3).toFixed(2)}ms`);
  
  // Test 7: Clear cache
  console.log('\nTest 7: Clear cache');
  console.log('Clearing cache...');
  stepService.clearCache();
  
  console.log('Getting step 2 again (should be loaded from data)...');
  const startTime4 = performance.now();
  const step2AfterClear = stepService.getStepById(2);
  const endTime4 = performance.now();
  console.log(`Load time after cache clear: ${(endTime4 - startTime4).toFixed(2)}ms`);
  
  // Test 8: Get steps by range
  console.log('\nTest 8: Get steps by range');
  const rangeSteps = stepService.getStepsByRange(5, 3);
  console.log(`Got ${rangeSteps.length} steps in range`);
  rangeSteps.forEach(step => {
    console.log(`- Step ${step.id}: ${step.title}`);
  });
  
  // Test 9: Search steps by title
  console.log('\nTest 9: Search steps by title');
  const searchResults = stepService.searchStepsByTitle('knowledge');
  console.log(`Found ${searchResults.length} steps containing 'knowledge'`);
  searchResults.slice(0, 5).forEach(step => {
    console.log(`- Step ${step.id}: ${step.title}`);
  });
  
  console.log('\n=== STEP SERVICE TESTS COMPLETED ===');
}

// Run the tests
testStepService();

// Export for potential use in other tests
export { testStepService };
