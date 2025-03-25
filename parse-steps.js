import fs from 'fs';

// Read the text file
const text = fs.readFileSync('C:/Users/danmy/Desktop/steps end.txt', 'utf8');

// Parse the table of contents to get step titles
const tocSection = text.substring(0, text.indexOf('PART ONE'));
const titleMap = {};

// Extract titles from table of contents
let tocLines = tocSection.split('\n');
let tocCurrentStep = null;
let tocCurrentTitle = '';

for (let i = 0; i < tocLines.length; i++) {
  const line = tocLines[i].trim();
  
  // Skip empty lines and the "b" lines (PDF artifacts)
  if (!line || line === 'b' || line === 'Table of Contents') {
    continue;
  }
  
  // Check if this is a step line
  const stepMatch = line.match(/^Step (\d+): (.+)$/);
  if (stepMatch) {
    // If we were building a title, save it
    if (tocCurrentStep) {
      titleMap[tocCurrentStep] = tocCurrentTitle.trim();
    }
    
    // Start a new title
    tocCurrentStep = stepMatch[1];
    tocCurrentTitle = stepMatch[2];
    
    // Check if the next line is a continuation of the title (not a step and not a "b" line)
    if (i + 1 < tocLines.length) {
      const nextLine = tocLines[i + 1].trim();
      if (nextLine && !nextLine.match(/^Step \d+:/) && nextLine !== 'b') {
        tocCurrentTitle += ' ' + nextLine;
        i++; // Skip the next line since we've processed it
      }
    }
  }
}

// Save the last title if there is one
if (tocCurrentStep) {
  titleMap[tocCurrentStep] = tocCurrentTitle.trim();
}

console.log(`Extracted ${Object.keys(titleMap).length} titles from table of contents`);

// Find where the actual step content begins
const contentStartIndex = text.indexOf('PART ONE');
if (contentStartIndex === -1) {
  console.error('Could not find the start of step content');
  process.exit(1);
}

// Parse the step content
const stepContentSection = text.substring(contentStartIndex);

// Use a more robust regex to match steps
const lines = stepContentSection.split('\n');
const steps = [];
let currentStep = null;
let currentTitle = '';
let currentInstructions = '';
let currentPractices = [];
let currentDurations = [];
let hasHourly = false;
let inPracticeSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Check if this is a step line
  const stepMatch = line.match(/^Step (\d+)$/);
  
  if (stepMatch) {
    // If we were building a step, save it
    if (currentStep) {
      // Use title from table of contents if available
      const title = titleMap[currentStep.toString()] || currentTitle;
      
      steps.push({
        id: currentStep,
        title: title,
        instructions: currentInstructions.trim(),
        practices: currentPractices,
        durations: currentDurations,
        hourly: hasHourly
      });
      
      console.log(`Processed Step ${currentStep}: ${title}`);
    }
    
    // Start a new step
    currentStep = parseInt(stepMatch[1]);
    currentTitle = '';
    currentInstructions = '';
    currentPractices = [];
    currentDurations = [];
    hasHourly = false;
    inPracticeSection = false;
    
    // Get the title from the next line
    if (i + 1 < lines.length) {
      currentTitle = lines[i + 1].trim();
      i++; // Skip the title line
    }
  } else if (line.includes(`Practice ${currentStep}`)) {
    // We've reached the practice section
    inPracticeSection = true;
    
    // Extract practice information
    const practiceInfo = line;
    
    // Check for hourly practice on the next line
    if (i + 1 < lines.length && lines[i + 1].includes('Hourly practice')) {
      hasHourly = true;
    }
    
    // Extract practice periods from the practice info
    if (practiceInfo.includes('30-minute practice period')) {
      if (practiceInfo.includes('Two')) {
        currentPractices.push('30-minute practice period (1)');
        currentPractices.push('30-minute practice period (2)');
        currentDurations.push(1800);
        currentDurations.push(1800);
      } else {
        currentPractices.push('30-minute practice period');
        currentDurations.push(1800);
      }
    } else if (practiceInfo.includes('15-minute practice period')) {
      if (practiceInfo.includes('Two')) {
        currentPractices.push('15-minute practice period (1)');
        currentPractices.push('15-minute practice period (2)');
        currentDurations.push(900);
        currentDurations.push(900);
      } else {
        currentPractices.push('15-minute practice period');
        currentDurations.push(900);
      }
    } else if (practiceInfo.includes('40-minute practice period')) {
      if (practiceInfo.includes('Two')) {
        currentPractices.push('40-minute practice period (1)');
        currentPractices.push('40-minute practice period (2)');
        currentDurations.push(2400);
        currentDurations.push(2400);
      } else {
        currentPractices.push('40-minute practice period');
        currentDurations.push(2400);
      }
    } else if (practiceInfo.includes('One long practice period')) {
      currentPractices.push('One long practice period');
      currentDurations.push(0);
    } else if (practiceInfo.includes('Review')) {
      // For review steps
      currentPractices.push('Review');
      currentDurations.push(0);
    } else if (practiceInfo.includes('10-minute practice period')) {
      if (practiceInfo.includes('Three')) {
        currentPractices.push('10-minute practice period (1)');
        currentPractices.push('10-minute practice period (2)');
        currentPractices.push('10-minute practice period (3)');
        currentDurations.push(600);
        currentDurations.push(600);
        currentDurations.push(600);
      } else if (practiceInfo.includes('Two')) {
        currentPractices.push('10-minute practice period (1)');
        currentPractices.push('10-minute practice period (2)');
        currentDurations.push(600);
        currentDurations.push(600);
      } else {
        currentPractices.push('10-minute practice period');
        currentDurations.push(600);
      }
    } else if (practiceInfo.includes('20-minute practice period')) {
      if (practiceInfo.includes('Two')) {
        currentPractices.push('20-minute practice period (1)');
        currentPractices.push('20-minute practice period (2)');
        currentDurations.push(1200);
        currentDurations.push(1200);
      } else {
        currentPractices.push('20-minute practice period');
        currentDurations.push(1200);
      }
    }
  } else if (currentStep && !inPracticeSection) {
    // Add to instructions
    currentInstructions += line + ' ';
  }
}

// Add the last step
if (currentStep) {
  // Use title from table of contents if available
  const title = titleMap[currentStep.toString()] || currentTitle;
  
  steps.push({
    id: currentStep,
    title: title,
    instructions: currentInstructions.trim(),
    practices: currentPractices,
    durations: currentDurations,
    hourly: hasHourly
  });
  
  console.log(`Processed Step ${currentStep}: ${title}`);
}

console.log(`Extracted ${steps.length} steps from content`);

// Sort steps by ID to ensure they're in the correct order
steps.sort((a, b) => a.id - b.id);

// Create the final JSON object with proper formatting
const stepsJson = {
  steps: steps.map(step => ({
    id: step.id,
    title: step.title,
    instructions: step.instructions,
    practices: step.practices,
    durations: step.durations,
    hourly: step.hourly
  }))
};

// Write the complete new content to steps.json with proper JSON formatting
// First, convert to JSON string
const jsonString = JSON.stringify(stepsJson, null, 2);

// Fix any missing commas in the JSON string
const fixedJsonString = jsonString
  // Add commas between properties
  .replace(/"\n\s*"/g, '",\n  "')
  // Add commas between array elements
  .replace(/"\n\s+"/g, '",\n    "')
  .replace(/\d\n\s+\d/g, (match) => match.replace('\n', ',\n'));

// Write the fixed JSON to the file
fs.writeFileSync('src/data/steps.json', fixedJsonString);

console.log(`Successfully updated steps.json with all ${steps.length} steps`);
