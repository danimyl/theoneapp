# Background Notifications Implementation

This document outlines the implementation of background notifications in the mobile app to ensure notifications are delivered even when the app is closed or in the background.

## Problem Statement

The current notification system only works when the app is in the foreground. Hourly notifications and practice reminders are not delivered when the app is in the background or closed, which significantly reduces their effectiveness.

## Solution Overview

To enable background notifications, we need to:

1. Implement background tasks using Expo's TaskManager
2. Enhance the notification service to support scheduled notifications
3. Use proper notification scheduling instead of immediate notifications
4. Add a foreground service for Android to ensure reliable background operation

## Implementation Details

### 1. Background Task Registration

We'll register background tasks using Expo's TaskManager to handle notifications even when the app is closed:

```typescript
// Register background tasks for notifications
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const HOURLY_NOTIFICATION_TASK = 'hourly-notification-task';
const PRACTICE_REMINDER_TASK = 'practice-reminder-task';

// Register task handlers
TaskManager.defineTask(HOURLY_NOTIFICATION_TASK, async () => {
  // Check and send hourly notifications
  await notificationService.checkAndSendHourlyNotification();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

TaskManager.defineTask(PRACTICE_REMINDER_TASK, async () => {
  // Check and send practice reminders
  await notificationService.checkAndSendPracticeReminder();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

### 2. Enhanced Notification Service

We'll modify the notification service to support scheduled notifications and background operation:

```typescript
// Add to notificationService.ts
async registerBackgroundTasks() {
  // Register hourly notification task (runs every hour)
  await BackgroundFetch.registerTaskAsync(HOURLY_NOTIFICATION_TASK, {
    minimumInterval: 60 * 60, // 1 hour in seconds
    stopOnTerminate: false,    // Continue running when app is closed
    startOnBoot: true,         // Run on device boot
  });
  
  // Register practice reminder task (runs daily)
  await BackgroundFetch.registerTaskAsync(PRACTICE_REMINDER_TASK, {
    minimumInterval: 24 * 60 * 60, // 24 hours in seconds
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

// Add methods for the background tasks to use
async checkAndSendHourlyNotification() {
  // Implementation that works in background context
}

async checkAndSendPracticeReminder() {
  // Implementation that works in background context
}
```

### 3. Scheduled Notifications

Instead of immediate notifications, we'll schedule them for specific times:

```typescript
// For hourly notifications
await Notifications.scheduleNotificationAsync({
  content: {
    title: `Hourly Reminder: Step ${stepId}`,
    body: stepTitle,
    sound: true,
  },
  trigger: {
    hour: new Date().getHours() + 1, // Next hour
    minute: 0,
    repeats: true,
  },
});

// For practice reminders
await Notifications.scheduleNotificationAsync({
  content: {
    title: `Practice Reminder: Step ${stepId}`,
    body: message,
    sound: true,
  },
  trigger: {
    hour: reminderHour,
    minute: reminderMinute,
    repeats: true,
  },
});
```

### 4. Foreground Service for Android

For Android, we'll implement a foreground service to ensure reliable background operation:

```typescript
// For Android devices
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  
  // Start foreground service
  await Notifications.startForegroundServiceAsync('notification-service', {
    title: 'The One App',
    body: 'Running in background to deliver your notifications',
    icon: '../assets/icon.png',
    color: '#1DB954',
  });
}
```

### 5. Initialization on App Start

We'll initialize all of this when the app starts:

```typescript
// In App.tsx useEffect
useEffect(() => {
  const setupNotifications = async () => {
    // Request permissions
    await notificationService.requestPermissions();
    
    // Register background tasks
    await notificationService.registerBackgroundTasks();
  };
  
  setupNotifications();
}, []);
```

## Required Dependencies

To implement this solution, we need to add the following dependencies:

- `expo-background-fetch`: For background task scheduling
- `expo-task-manager`: For defining and managing background tasks

## Testing

To test the background notification system:

1. Install the app on a physical device
2. Configure notification settings
3. Close the app completely
4. Wait for the scheduled notification time
5. Verify that notifications are received even when the app is closed

## Potential Issues and Mitigations

1. **iOS Background Restrictions**: iOS has strict limitations on background processing. We'll need to use the most efficient background fetch intervals allowed by iOS.

2. **Battery Usage**: Background tasks can impact battery life. We'll optimize the frequency of background checks to minimize battery drain.

3. **Notification Permissions**: Users may deny notification permissions. We'll implement graceful fallbacks and prompts to encourage enabling notifications.

4. **Device Reboots**: Background tasks may not persist across device reboots on all platforms. We'll register tasks on app launch to ensure they're always active.

## Future Improvements

1. Add support for custom notification sounds
2. Implement notification history to track which notifications have been sent
3. Add user-configurable notification frequencies
4. Implement notification grouping for better organization
