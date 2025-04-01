# Practice Reminder Implementation

This document outlines the implementation of the practice reminder feature in TheOneApp mobile application. The feature sends a notification to remind users if they have incomplete practices for the current step at a user-specified time.

## Overview

The practice reminder feature consists of:

1. **User Settings**: Users can enable/disable the reminder and set the time when they want to be reminded.
2. **Completion Check**: The app checks if all practices for the current step are completed.
3. **Notification**: If practices are incomplete, a notification is sent at the specified time.

## Implementation Details

### 1. Settings Store

The feature uses the following state in the settings store:

```typescript
// Practice reminder settings
practiceReminderEnabled: boolean;
practiceReminderTime: string; // Format: "HH:MM" (e.g., "19:00" for 7:00 PM)
```

Default values:
- `practiceReminderEnabled`: `true` (enabled by default)
- `practiceReminderTime`: `"19:00"` (7:00 PM)

### 2. Settings UI

The settings screen includes a new section for practice reminders with:
- A toggle switch to enable/disable the reminder
- A time picker to set the reminder time
- Explanatory text about the feature

The time picker is disabled when reminders are turned off, with visual cues (reduced opacity) to indicate this state.

### 3. Notification Service

The notification service has been enhanced with a new method:

```typescript
async sendPracticeReminder(stepId: number, stepTitle: string, practiceChecks: boolean[]): Promise<boolean>
```

This method:
- Checks if all practices are complete
- Counts incomplete practices
- Creates an appropriate notification message
- Sends the notification with sound

### 4. Reminder Logic

The reminder logic is implemented in `App.tsx` and:
- Runs a check every minute
- Compares the current time with the user's set reminder time
- When the times match, it checks if practices are incomplete
- If practices are incomplete, it sends a notification

The notification respects the app's quiet hours settings, ensuring it won't disturb users during their sleep time.

## User Experience

From the user's perspective:

1. The user can enable/disable practice reminders in the Settings screen
2. The user can set their preferred reminder time
3. If practices are incomplete at the specified time, they receive a notification
4. The notification shows how many practices are incomplete
5. The notification includes the current step number and title

## Technical Implementation

### Settings Store Updates

Added to `settingsStore.ts`:
- New state properties for reminder enabled/disabled and time
- Setter functions for these properties
- Default values

### Notification Service Enhancement

Added to `notificationService.ts`:
- New method to check practice completion status
- Logic to count incomplete practices
- Notification message formatting

### Settings UI Updates

Added to `SettingsScreen.tsx`:
- New section for practice reminders
- Toggle switch for enabling/disabling
- Time picker for setting the reminder time
- Visual states for enabled/disabled

### App Logic

Added to `App.tsx`:
- Time comparison function
- Practice completion check
- Scheduled notification logic

## Testing

The feature can be tested by:
1. Setting a reminder time that's a minute or two in the future
2. Ensuring some practices are incomplete
3. Waiting for the specified time to see if the notification appears
4. Testing with all practices complete to verify no notification is sent
5. Testing with reminders disabled to verify no notification is sent

## Future Enhancements

Potential future enhancements could include:
- Multiple reminder times throughout the day
- Custom reminder messages
- Different notification sounds for practice reminders
- Weekly summary of practice completion
