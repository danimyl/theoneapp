const fs = require('fs');

// Read the steps.json file
const stepsJson = fs.readFileSync('src/data/steps.json', 'utf8');

// Add missing commas between properties
let fixedJson = stepsJson
  // Add commas between properties
  .replace(/"\n\s*"/g, '",\n  "')
  // Add commas between array elements
  .replace(/"\n\s+"/g, '",\n    "')
  .replace(/\d\n\s+\d/g, (match) => match.replace('\n', ',\n'));

// Make sure the JSON is valid
try {
  JSON.parse(fixedJson);
  console.log('Fixed JSON is valid');
} catch (e) {
  console.error('Error parsing fixed JSON:', e.message);
  process.exit(1);
}

// Write the fixed JSON back to the file
fs.writeFileSync('src/data/steps.json', fixedJson);
console.log('Successfully fixed steps.json');
