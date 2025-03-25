const fs = require('fs');

// Read the steps.json file
const stepsJson = fs.readFileSync('src/data/steps.json', 'utf8');

// Parse the JSON (this will fail if it's not valid)
try {
  const parsedJson = JSON.parse(stepsJson);
  
  // Write the JSON back to the file with proper formatting
  fs.writeFileSync('src/data/steps.json', JSON.stringify(parsedJson, null, 2));
  
  console.log('Successfully fixed steps.json');
} catch (e) {
  console.error('Error parsing JSON:', e.message);
  
  // Try to fix the JSON by adding missing commas
  console.log('Attempting to fix JSON formatting...');
  
  // Add missing commas between properties
  let fixedJson = stepsJson
    .replace(/"\n\s*"/g, '",\n  "')
    // Add commas between array elements
    .replace(/"\n\s+"/g, '",\n    "')
    .replace(/\d\n\s+\d/g, (match) => match.replace('\n', ',\n'));
  
  try {
    // Try to parse the fixed JSON
    JSON.parse(fixedJson);
    
    // Write the fixed JSON back to the file
    fs.writeFileSync('src/data/steps.json', fixedJson);
    
    console.log('Successfully fixed steps.json');
  } catch (e2) {
    console.error('Error parsing fixed JSON:', e2.message);
  }
}
