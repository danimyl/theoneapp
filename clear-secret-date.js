// Script to clear lastSecretShownDate from localStorage
const settingsKey = 'settings-storage';
const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');

// Display current settings
console.log('Current settings:');
console.log(settings);

// Check if lastStepAdvanceDate exists and is not today
const today = new Date().toISOString().split('T')[0];
  console.log('Warning: lastStepAdvanceDate is not set. Secret popup may not appear.');
} else if (settings.state.lastStepAdvanceDate === today) {
  console.log('Warning: lastStepAdvanceDate is set to today. Secret popup may not appear.');
}

// Clear lastSecretShownDate
if (settings.state) {
  settings.state.lastSecretShownDate = null;
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  console.log('lastSecretShownDate has been cleared.');
  console.log('Reload the page to see if the secret popup appears.');
} else {
  console.log('Error: Could not find state in settings.');
}

// Display updated settings
console.log('Updated settings:');
console.log(JSON.parse(localStorage.getItem(settingsKey) || '{}'));
