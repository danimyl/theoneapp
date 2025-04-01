# Hourly Notification System Guide

This document explains the hourly notification system implemented in the mobile app. The system provides hourly reminders with bell sounds for the current step.

## Overview

The hourly notification system sends a notification with a bell sound at the top of each hour (XX:00) for the current step. This helps users maintain awareness of their practice throughout the day.

## Features

1. **Hourly Reminders**: Notifications are sent at the top of each hour (XX:00)
2. **Bell Sound**: Each notification plays a bell sound to alert the user
3. **Quiet Hours**: No notifications are sent during configured quiet hours
4. **Configurable Settings**: Users can customize notification behavior in the Settings screen
5. **Hourly Status Indicator**: Visual indicator in the step instructions showing whether hourly reminders are enabled for the current step

## Settings

The following settings are available in the Settings screen:

1. **Always Show Hourly Reminders**: When enabled, hourly reminders will be shown for all steps, not just those marked as hourly in the step data.
2. **Quiet Hours**: Define a time range during which notifications will be silenced (e.g., during sleep hours).
   - **Start Time**: The time when quiet hours begin (default: 22:00 / 10:00 PM)
   - **End Time**: The time when quiet hours end (default: 07:00 / 7:00 AM)

## Technical Implementation

The hourly notification system consists of the following components:

### 1. Settings Store

The settings store (`settingsStore.ts`) maintains the notification settings:

```typescript
// Notification settings
alwaysHourlyReminders: boolean;
sleepStart: string; // Format: "22:00" (10:00 PM)
sleepEnd: string;   // Format: "07:00" (7:00 AM)

// Actions
setAlwaysHourlyReminders: (value: boolean) => void;
setSleepStart: (time: string) => void;
setSleepEnd: (time: string) => void;
```

### 2. Notification Service

The notification service (`notificationService.ts`) handles:

- Checking if the current time is within quiet hours
- Playing the bell sound
- Sending notifications to the device
- Providing a specific method for hourly reminders

Key methods:
- `isWithinSleepHours()`: Determines if the current time is within the configured quiet hours
- `playNotificationSound()`: Plays the bell sound
- `sendNotification()`: Sends a notification with optional sound
- `sendHourlyReminder()`: Sends a reminder notification for the current step

### 3. Steps Screen Integration

The Steps Screen (`StepsScreen.tsx`) integrates the hourly notification check:

- Maintains a reference to track the last notification sent to prevent duplicates
- Checks for hourly notifications every minute
- Only sends notifications at exactly XX:00
- Respects the user's settings for always showing reminders and quiet hours
- Displays an hourly status indicator in the step instructions

### 4. UI Components

#### Hourly Status Indicator

The hourly status indicator is displayed at the end of the step instructions and shows whether hourly reminders are enabled for the current step:

- **Icon**: Uses either "notifications-active" (ON) or "notifications-off" (OFF) icon
- **Text**: "Hourly Reminders: ON" or "Hourly Reminders: OFF"
- **Color**: Green for ON, gray for OFF
- **Location**: Below the step instructions, separated by a divider line

This indicator helps users quickly see whether the current step will trigger hourly reminders without having to check the settings.

## How It Works

1. The app checks for hourly notifications every minute
2. When the current time is exactly XX:00, it checks if a notification has already been sent for this hour
3. If no notification has been sent for this hour, it checks if the current step has `hourly: true` or if the user has enabled "Always Show Hourly Reminders"
4. If notifications should be sent, it checks if the current time is within quiet hours
5. If not in quiet hours, it plays the bell sound and sends a notification

## Testing

To test the hourly notification system:

1. Open the app and navigate to the Settings screen
2. Configure the notification settings as desired
3. Wait until the top of the hour (XX:00) to see if notifications are sent
4. To test quiet hours, set the quiet hours to include the current time and verify that notifications are not sent

## Troubleshooting

If notifications are not working:

1. Check if the device has notifications enabled for the app
2. Verify that the current time is not within the configured quiet hours
3. Make sure the current step has `hourly: true` or "Always Show Hourly Reminders" is enabled
4. Check if the app has the necessary permissions to send notifications

## Future Improvements

Potential future improvements to the notification system:

1. Add support for custom notification sounds
2. Implement notification scheduling for specific times of day
3. Add support for different notification frequencies (e.g., every 30 minutes)
4. Implement notification history to track which notifications have been sent
