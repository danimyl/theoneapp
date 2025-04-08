# Notification Message Update

This document outlines the changes made to the practice reminder notification message in TheOneApp mobile application.

> **IMPORTANT UPDATE (April 2025)**: We have reverted to a strictly managed Expo workflow with prebuild after encountering issues with the Notifee implementation. All notification functionality is now implemented using Expo's native notification APIs. See [NOTIFICATION_SYSTEM_UPDATE.md](./NOTIFICATION_SYSTEM_UPDATE.md) for details.

## Change Summary

The notification message for incomplete practices has been updated to use a more action-oriented format.

### Previous Message Format:
- Single practice: "You have 1 incomplete practice for today's step."
- Multiple practices: "You have X incomplete practices for today's step."

### New Message Format:
- Single practice: "Don't forget you have 1 Step left to do today!"
- Multiple practices: "Don't forget you have X Steps left to do today!"

## Implementation Details

The change was implemented by updating the message format in the `sendPracticeReminder` function in `notificationService.ts`. The function still:

1. Checks if all practices are complete
2. Counts the number of incomplete practices
3. Creates a notification message based on the count
4. Sends the notification with sound

Only the message text format was changed, while preserving all the existing functionality:
- The notification is still sent at the user-specified time
- The notification still plays a sound
- The notification still respects quiet hours settings
- The notification is still only sent if there are incomplete practices

## Testing

To test this change:

1. Enable practice reminders in the Settings screen
2. Set the reminder time to a few minutes in the future
3. Ensure some practices are unchecked for the current step
4. Wait for the specified time to see if the notification appears with the new message format
5. Verify that the notification shows the correct number of incomplete practices

Note: In Expo development mode, you might only hear the notification sound without seeing the visual notification. This is a limitation of Expo and not an issue with the implementation. The notifications should appear properly in a standalone build.
