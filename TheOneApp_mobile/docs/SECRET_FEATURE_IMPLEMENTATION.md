# Secret Feature Implementation

## Overview

The "Secret" feature displays a popup with a random inspirational message from a collection of secrets. This feature is designed to appear only on the second time the app is opened on any given day, creating a special moment for users without being intrusive.

## Implementation Details

### 1. Data Source

- Secrets are stored in `src/data/secrets.json`
- Each secret has an ID and text content
- The file is a direct copy from the web app, ensuring consistency

### 2. Components

#### SecretModal Component

A React Native modal component that displays the secret message:

- Clean, minimal design with a dark theme
- Close button in the header
- Scrollable content area for longer messages
- "CLOSE" button in the footer

#### App.tsx Integration

The main App component handles:

- Tracking app opens per day
- Determining when to show the secret
- Selecting a random secret to display
- Managing the modal visibility state

### 3. State Management

Added to the settings store:

- `appOpenCountToday`: Tracks how many times the app has been opened today
- `lastAppOpenDate`: Stores the date of the last app open (format: "YYYY-MM-DD")
- `lastSecretShownDate`: Records when a secret was last shown

### 4. Logic Flow

1. When the app starts, it checks if it's a new day:
   - If yes, reset the counter to 1
   - If no, increment the counter

2. If the counter equals 2 AND no secret has been shown today:
   - Select a random secret from the collection
   - Display the SecretModal
   - Update lastSecretShownDate to today

3. The modal can be dismissed by:
   - Tapping the X button in the corner
   - Tapping the CLOSE button at the bottom
   - Tapping outside the modal

## Code Snippets

### App Open Tracking

```typescript
useEffect(() => {
  const trackAppOpen = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if it's a new day
    if (lastAppOpenDate !== today) {
      // Reset counter for new day
      setLastAppOpenDate(today);
      setAppOpenCountToday(1);
    } else {
      // Increment counter for same day
      const newCount = appOpenCountToday + 1;
      setAppOpenCountToday(newCount);
      
      // Show secret on second open of the day
      if (newCount === 2 && lastSecretShownDate !== today) {
        showRandomSecret();
        setLastSecretShownDate(today);
      }
    }
  };
  
  // Small delay to ensure store is loaded
  const timer = setTimeout(trackAppOpen, 500);
  return () => clearTimeout(timer);
}, [/* dependencies */]);
```

### Random Secret Selection

```typescript
const showRandomSecret = () => {
  // Get a random secret from the secrets.json file
  const randomIndex = Math.floor(Math.random() * secrets.length);
  const randomSecret = secrets[randomIndex].secret;
  
  // Set the current secret and show the modal
  setCurrentSecret(randomSecret);
  setIsSecretModalVisible(true);
};
```

## Testing

To test the feature:

1. Open the app for the first time on a given day
   - No secret should appear
   - The app open count should be set to 1

2. Close the app completely and reopen it
   - A secret should appear
   - The app open count should be 2
   - The lastSecretShownDate should be updated to today

3. Close and reopen the app again
   - No secret should appear
   - The app open count should be 3+

4. Wait until the next day and open the app
   - No secret should appear
   - The app open count should reset to 1

5. Close and reopen the app on the new day
   - A new random secret should appear
   - The process repeats

## Future Enhancements

Potential improvements for the future:

1. Allow users to save favorite secrets
2. Add animations for a more engaging experience
3. Implement a way to view past secrets
4. Add a setting to control the frequency of secrets
