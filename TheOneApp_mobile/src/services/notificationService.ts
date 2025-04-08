/**
 * Notification Service
 * 
 * Handles mobile notifications and sounds for the application.
 * Provides functionality for:
 * - Requesting notification permissions
 * - Checking quiet hours settings
 * - Playing notification sounds
 * - Sending notifications with customizable content
 * - Sending hourly reminders for steps
 * - Background notification support
 * - Scheduled notifications
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import notifee, { 
  AndroidImportance, 
  AndroidVisibility, 
  AndroidCategory,
  RepeatFrequency, // Added import
  TriggerType,     // Added import
  TimestampTrigger, // Added import
  Notification     // Added import
} from '@notifee/react-native';
import { useSettingsStore } from '../store/settingsStore';
import stepService from './stepService';

// Define task names
const HOURLY_NOTIFICATION_TASK = 'hourly-notification-task';
const PRACTICE_REMINDER_TASK = 'practice-reminder-task';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define background tasks
// TaskManager.defineTask(HOURLY_NOTIFICATION_TASK, ...) // REMOVED (Handled by Notifee triggers)

TaskManager.defineTask(PRACTICE_REMINDER_TASK, async () => {
  try {
    await notificationService.checkAndSendPracticeReminder();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BACKGROUND] Error in practice reminder task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Service to handle mobile notifications and sounds
 */
const notificationService = {
  /**
   * Register background tasks for notifications
   * @returns {Promise<void>}
   */
  async registerBackgroundTasks() {
    try {
      // Check if we have notification permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('[BACKGROUND] Notification permissions not granted, skipping background task registration');
        return;
      }

      // Register hourly notification task - REMOVED (Handled by Notifee triggers)
      // await BackgroundFetch.registerTaskAsync(HOURLY_NOTIFICATION_TASK, { ... });
      
      // Register practice reminder task
      await BackgroundFetch.registerTaskAsync(PRACTICE_REMINDER_TASK, {
        minimumInterval: 24 * 60 * 60, // 24 hours in seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BACKGROUND] Registered practice reminder task');

      // For Android, set up a foreground service
      if (Platform.OS === 'android') {
        await this.setupAndroidForegroundService();
      }
    } catch (error) {
      console.error('[BACKGROUND] Error registering background tasks:', error);
    }
  },

  /**
   * Set up Android foreground service for reliable background operation
   * @returns {Promise<void>}
   */
  async setupAndroidForegroundService() {
    if (Platform.OS !== 'android') return;

    try {
      // Create notification channels
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954',
        enableLights: true,
        enableVibrate: true,
        sound: 'bell.mp3', // Use our custom sound
      });

      // Create high-priority channel for hourly reminders - REMOVED (Handled by Notifee below)
      // await Notifications.setNotificationChannelAsync('hourly-reminders', { ... });

      await Notifications.setNotificationChannelAsync('foreground-service', {
        name: 'Background Service',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#1DB954',
        enableLights: false,
        enableVibrate: false,
        showBadge: false
      });

      // Create a persistent notification for the foreground service
      await Notifications.presentNotificationAsync({
        title: 'Steps to Knowledge',
        body: 'Running in background to deliver your notifications',
        sound: false,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'foreground-service',
            priority: 'low',
            icon: 'notification-icon', // Use our monochrome notification icon
          },
        }),
      } as any);

      console.log('[BACKGROUND] Android notification channels and foreground service set up');
    } catch (error) {
      console.error('[BACKGROUND] Error setting up Android foreground service:', error);
    }
  },
  /**
   * Request notification permissions
   * @returns {Promise<boolean>} True if permissions granted
   */
  async requestPermissions() {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return false;
  },
  
  /**
   * Check if current time is within sleep hours
   * @returns {boolean} True if current time is within sleep hours
   */
  isWithinSleepHours() {
    try {
      const { sleepStart, sleepEnd } = useSettingsStore.getState();
      
      // Parse sleep times
      const [startHour, startMinute] = sleepStart.split(':').map(Number);
      const [endHour, endMinute] = sleepEnd.split(':').map(Number);
      
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Convert all times to minutes for easier comparison
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const sleepStartInMinutes = startHour * 60 + startMinute;
      const sleepEndInMinutes = endHour * 60 + endMinute;
      
      // Handle the case where sleep time crosses midnight
      if (sleepStartInMinutes > sleepEndInMinutes) {
        // If current time is after sleep start OR before sleep end, it's within sleep hours
        return currentTimeInMinutes >= sleepStartInMinutes || currentTimeInMinutes <= sleepEndInMinutes;
      } else {
        // If current time is between sleep start and sleep end, it's within sleep hours
        return currentTimeInMinutes >= sleepStartInMinutes && currentTimeInMinutes <= sleepEndInMinutes;
      }
    } catch (error) {
      console.error('[NOTIFICATION] Error checking sleep hours:', error);
      return false; // Default to not in sleep hours if there's an error
    }
  },
  
  /**
   * Play notification sound
   * @returns {Promise<void>}
   */
  async playNotificationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/bell.mp3')
      );
      
      await sound.playAsync();
      
      // Unload sound after playing
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(err => 
            console.error('[NOTIFICATION] Error unloading sound:', err)
          );
        }
      });
    } catch (error) {
      console.error('[NOTIFICATION] Failed to play notification sound:', error);
    }
  },
  
  /**
   * Send a notification
   * @param {string} title The notification title
   * @param {string} body The notification body
   * @param {boolean} playSound Whether to play a sound with the notification
   * @param {boolean} immediate Whether to send immediately or schedule
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendNotification(
    title: string, 
    body: string, 
    playSound = false, 
    immediate = true
  ): Promise<boolean> {
    try {
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        return false;
      }
      
      // Play sound if requested and we're in the foreground
      if (playSound && immediate && Platform.OS !== 'web') {
        await this.playNotificationSound();
      }
      
      // Send actual notification on mobile platforms
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        if (immediate) {
          // For immediate notifications, use presentNotificationAsync
          await Notifications.presentNotificationAsync({
            title,
            body,
            sound: playSound ? (Platform.OS === 'android' ? 'bell.mp3' : true) : undefined,
            ...(Platform.OS === 'android' && {
              android: {
                sound: playSound ? 'bell.mp3' : undefined,
                channelId: 'default',
                icon: 'notification-icon',
              },
            }),
          });
        } else {
          // For delayed notifications, use a simple delay
          setTimeout(async () => {
            await Notifications.presentNotificationAsync({
              title,
              body,
              sound: playSound ? (Platform.OS === 'android' ? 'bell.mp3' : true) : undefined,
              ...(Platform.OS === 'android' && {
                android: {
                  sound: playSound ? 'bell.mp3' : undefined,
                  channelId: 'default',
                  icon: 'notification-icon',
                },
              }),
            });
          }, 1000); // 1 second delay
        }
      } else {
        // On web or other platforms, just log
        console.log(`[NOTIFICATION] ${title}: ${body}`);
      }
      
      return true;
    } catch (error) {
      console.error('[NOTIFICATION] Failed to send notification:', error);
      return false;
    }
  },

  /**
   * Schedule a notification for a specific time
   * @param {string} title The notification title
   * @param {string} body The notification body
   * @param {Date} date The date and time to send the notification
   * @param {boolean} playSound Whether to play a sound with the notification
   * @returns {Promise<string>} The notification identifier
   */
  async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    playSound = true
  ): Promise<string> {
    try {
      // Ensure date is in the future
      const now = new Date();
      if (date <= now) {
        console.warn('[NOTIFICATION] Attempted to schedule notification in the past');
        return '';
      }

      // Calculate seconds from now until target date
      const seconds = Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));

      // Schedule using Expo's native scheduling
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: playSound ? (Platform.OS === 'android' ? 'bell.mp3' : true) : undefined,
          badge: 1,
          ...(Platform.OS === 'android' && {
            android: {
              sound: playSound ? 'bell.mp3' : undefined,
              channelId: 'default',
              icon: 'notification-icon',
            },
          }),
        },
        trigger: {
          type: 'timeInterval',
          seconds,
          channelId: Platform.OS === 'android' ? 'default' : undefined,
        } as any, // Type assertion needed due to Expo types not being fully accurate
      });

      console.log(`[NOTIFICATION] Scheduled notification ${identifier} for ${date.toLocaleString()}`);
      return identifier;
    } catch (error) {
      console.error('[NOTIFICATION] Failed to schedule notification:', error);
      return '';
    }
  },

  /**
   * Schedule a recurring notification
   * @param {string} title The notification title
   * @param {string} body The notification body
   * @param {number} hour The hour to send the notification (0-23)
   * @param {number} minute The minute to send the notification (0-59)
   * @param {boolean} playSound Whether to play a sound with the notification
   * @returns {Promise<string>} The notification identifier
   */
  async scheduleRecurringNotification(
    title: string,
    body: string,
    hour: number,
    minute: number,
    playSound = true,
    channelId = 'notifee-hourly-reminders', // Default to high-priority channel
    repeatFrequency: RepeatFrequency = RepeatFrequency.NONE // Default to no repeat - Use imported type
  ): Promise<string> {
    try {
      // Calculate the next occurrence
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setHours(hour, minute, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      // Use Notifee for recurring trigger notifications with enhanced settings
      const trigger: TimestampTrigger = { // Use imported type
        type: TriggerType.TIMESTAMP, // Use imported enum
        timestamp: nextDate.getTime(),
        repeatFrequency: repeatFrequency,
        // Use AlarmManager with exact timing for Android
        ...(Platform.OS === 'android' && {
          alarmManager: {
            allowWhileIdle: true, // Work in Doze mode
          } as any // Type assertion to bypass TypeScript check
        }),
      };

      // Define notification details with enhanced settings for lock screen breakthrough
      const notificationDetails: Notification = { // Use imported type
        title,
        body,
        android: {
          channelId: channelId, // Use the specified channel ID
          sound: playSound ? 'bell' : undefined,
          importance: AndroidImportance.HIGH, // Maximum importance
          visibility: AndroidVisibility.PUBLIC, // Show on lock screen
          category: AndroidCategory.ALARM, // Use ALARM category for high priority
          autoCancel: false, // Keep notification until dismissed
          pressAction: { id: 'default' },
          smallIcon: 'notification_icon', // Ensure this matches drawable name
          showTimestamp: true, // Show when notification was triggered
          vibrationPattern: [100, 200, 100], // Custom vibration pattern
        },
        ios: {
          sound: playSound ? 'bell.mp3' : undefined,
          critical: true, // Critical alerts break through on iOS
          interruptionLevel: 'critical', // Highest priority
          criticalVolume: 1.0, // Full volume
          foregroundPresentationOptions: {
            sound: true,
            banner: true,
            list: true,
          },
        },
      };

      // Create the trigger notification
      const identifier = await notifee.createTriggerNotification(notificationDetails, trigger);

      console.log(`[NOTIFICATION] Scheduled enhanced Notifee trigger notification ${identifier} for ${nextDate.toLocaleString()} on channel ${channelId} with frequency ${repeatFrequency}`);
      return identifier;
    } catch (error) {
      console.error('[NOTIFICATION] Failed to schedule recurring notification:', error);
      return '';
    }
  },
  
  /**
   * Send a reminder notification for a step
   * @param {number} stepId Step ID
   * @param {string} stepTitle Step title
   * @param {boolean} immediate Whether to send immediately or schedule
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendHourlyReminder(
    stepId: number, 
    stepTitle: string, 
    immediate = true
  ): Promise<boolean> {
    return this.sendNotification(
      `Hourly Reminder: Step ${stepId}`,
      stepTitle,
      true, // Play sound with hourly reminders
      immediate
    );
  },

  /**
   * Schedule hourly reminders for the current step
   * @returns {Promise<void>}
   */
  async scheduleHourlyReminders(): Promise<void> {
    try {
      // Get the current step
      const { currentStepId, alwaysHourlyReminders } = useSettingsStore.getState();
      
      console.log('[NOTIFICATION] Scheduling hourly reminders, settings:', {
        currentStepId,
        alwaysHourlyReminders
      });
      
      if (!currentStepId) {
        console.log('[NOTIFICATION] No current step ID, skipping hourly reminder scheduling');
        return;
      }
      
      const currentStep = stepService.getStepById(currentStepId);
      if (!currentStep) {
        console.log('[NOTIFICATION] Step not found, skipping hourly reminder scheduling');
        return;
      }
      
      console.log('[NOTIFICATION] Current step hourly setting:', {
        stepId: currentStep.id,
        hourly: currentStep.hourly
      });
      
      // Only schedule if the step has hourly:true or alwaysHourlyReminders is true
      if (!(currentStep.hourly || alwaysHourlyReminders)) {
        console.log('[NOTIFICATION] Step is not hourly and alwaysHourlyReminders is false, skipping');
        return;
      }
      
      // Cancel any existing hourly reminders
      await this.cancelHourlyReminders();
      
      // Schedule only the *next* hourly reminder using Notifee's trigger with hourly repeat
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); // Top of the next hour
      
      console.log('[NOTIFICATION] Scheduling next hourly reminder for:', nextHour.toLocaleTimeString());

      await this.scheduleRecurringNotification(
        `Hourly Reminder: Step ${currentStepId}`,
        currentStep.title,
        nextHour.getHours(),
        0, // Minute
        true, // Play sound
        'notifee-hourly-reminders', // Use the dedicated Notifee channel
        RepeatFrequency.HOURLY // Set repeat frequency - Use imported enum
      );
      
      console.log('[NOTIFICATION] Successfully scheduled next hourly reminder using Notifee trigger');
    } catch (error) {
      console.error('[NOTIFICATION] Error scheduling hourly reminders:', error);
    }
  },

  /**
   * Cancel all scheduled hourly reminders
   * @returns {Promise<void>}
   */
  async cancelHourlyReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel hourly reminders
      for (const notification of scheduledNotifications) {
        if (notification.content.title?.includes('Hourly Reminder')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log('[NOTIFICATION] Cancelled all hourly reminders');
    } catch (error) {
      console.error('[NOTIFICATION] Error cancelling hourly reminders:', error);
    }
  },
  
  /**
   * Send a practice reminder notification if practices are incomplete
   * @param {number} stepId Current step ID
   * @param {string} stepTitle Step title
   * @param {boolean[]} practiceChecks Array of practice completion states
   * @param {boolean} immediate Whether to send immediately or schedule
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendPracticeReminder(
    stepId: number, 
    stepTitle: string, 
    practiceChecks: boolean[],
    immediate = true
  ): Promise<boolean> {
    // Check if all practices are complete
    const allComplete = practiceChecks.every(check => check);
    
    // If all practices are complete, don't send a notification
    if (allComplete) {
      console.log('[NOTIFICATION] All practices complete, skipping reminder');
      return false;
    }
    
    // Count incomplete practices
    const incompleteCount = practiceChecks.filter(check => !check).length;
    
    // Create notification message
    const message = incompleteCount === 1
      ? `Don't forget you have 1 Step left to do today!`
      : `Don't forget you have ${incompleteCount} Steps left to do today!`;
    
    // Send the notification
    return this.sendNotification(
      `Practice Reminder: Step ${stepId}`,
      message,
      true, // Play sound with practice reminders
      immediate
    );
  },

  /**
   * Schedule a practice reminder for a specific time
   * @returns {Promise<void>}
   */
  async schedulePracticeReminder(): Promise<void> {
    try {
      // Get settings from store
      const { 
        practiceReminderEnabled, 
        practiceReminderTime,
        currentStepId,
        practiceChecks
      } = useSettingsStore.getState();
      
      // If reminder is disabled, do nothing
      if (!practiceReminderEnabled) {
        console.log('[NOTIFICATION] Practice reminders disabled, skipping scheduling');
        return;
      }
      
      // Parse reminder time
      const [reminderHour, reminderMinute] = practiceReminderTime.split(':').map(Number);
      
      // Get current step
      const currentStep = stepService.getStepById(currentStepId);
      if (!currentStep) {
        console.log('[NOTIFICATION] No current step found, skipping practice reminder scheduling');
        return;
      }
      
      // Cancel any existing practice reminders
      await this.cancelPracticeReminders();
      
      // Schedule the reminder
      await this.scheduleRecurringNotification(
        `Practice Reminder: Step ${currentStepId}`,
        `Don't forget to complete your practices for Step ${currentStepId}!`,
        reminderHour,
        reminderMinute,
        true // Play sound
      );
      
      console.log(`[NOTIFICATION] Scheduled practice reminder for ${reminderHour}:${reminderMinute}`);
    } catch (error) {
      console.error('[NOTIFICATION] Error scheduling practice reminder:', error);
    }
  },

  /**
   * Cancel all scheduled practice reminders
   * @returns {Promise<void>}
   */
  async cancelPracticeReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel practice reminders
      for (const notification of scheduledNotifications) {
        if (notification.content.title?.includes('Practice Reminder')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log('[NOTIFICATION] Cancelled all practice reminders');
    } catch (error) {
      console.error('[NOTIFICATION] Error cancelling practice reminders:', error);
    }
  },

  /**
   * Check and send hourly notification (for background tasks)
   * @returns {Promise<boolean>} True if notification was sent
   */
  async checkAndSendHourlyNotification(): Promise<boolean> {
    try {
      // Get the current step
      const { currentStepId, alwaysHourlyReminders } = useSettingsStore.getState();
      
      if (!currentStepId) {
        console.log('[BACKGROUND] No current step ID, skipping hourly notification');
        return false;
      }
      
      const currentStep = stepService.getStepById(currentStepId);
      if (!currentStep) {
        console.log('[BACKGROUND] Step not found, skipping hourly notification');
        return false;
      }
      
      // Only send if the step has hourly:true or alwaysHourlyReminders is true
      if (!(currentStep.hourly || alwaysHourlyReminders)) {
        console.log('[BACKGROUND] Step is not hourly and alwaysHourlyReminders is false, skipping');
        return false;
      }
      
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        console.log('[BACKGROUND] Within sleep hours, skipping hourly notification');
        return false;
      }
      
      // Send the notification (with immediate=false to avoid playing sound in background)
      return this.sendHourlyReminder(currentStepId, currentStep.title, false);
    } catch (error) {
      console.error('[BACKGROUND] Error checking hourly notification:', error);
      return false;
    }
  },

  /**
   * Check and send practice reminder (for background tasks)
   * @returns {Promise<boolean>} True if notification was sent
   */
  async checkAndSendPracticeReminder(): Promise<boolean> {
    try {
      // Get settings from store
      const { 
        practiceReminderEnabled, 
        practiceReminderTime,
        currentStepId,
        practiceChecks
      } = useSettingsStore.getState();
      
      // If reminder is disabled, do nothing
      if (!practiceReminderEnabled) {
        console.log('[BACKGROUND] Practice reminders disabled, skipping');
        return false;
      }
      
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Parse reminder time
      const [reminderHour, reminderMinute] = practiceReminderTime.split(':').map(Number);
      
      // Check if it's time for the reminder (within 5 minutes)
      const isReminderTime = 
        currentHour === reminderHour && 
        Math.abs(currentMinute - reminderMinute) <= 5;
      
      if (!isReminderTime) {
        console.log('[BACKGROUND] Not time for practice reminder, skipping');
        return false;
      }
      
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        console.log('[BACKGROUND] Within sleep hours, skipping practice reminder');
        return false;
      }
      
      // Get current step
      const currentStep = stepService.getStepById(currentStepId);
      if (!currentStep) {
        console.log('[BACKGROUND] No current step found, skipping practice reminder');
        return false;
      }
      
      // Get practice checks for current step
      const stepChecks = practiceChecks[currentStepId] || [];
      
      // If no checks exist or length doesn't match, create default array
      const checks = stepChecks.length === currentStep.practices.length
        ? stepChecks
        : Array(currentStep.practices.length).fill(false);
      
      // Send reminder notification (with immediate=false to avoid playing sound in background)
      return this.sendPracticeReminder(
        currentStepId,
        currentStep.title,
        checks,
        false
      );
    } catch (error) {
      console.error('[BACKGROUND] Error checking practice reminder:', error);
      return false;
    }
  },

  /**
   * Test notification functionality
   * @returns {Promise<string>} Test status message
   */
  /**
   * Send a timer completion sound that works even when device is locked
   * Uses high-priority notification channel for exact timing
   * @returns {Promise<void>}
   */
  /**
   * Initialize Notifee channels and settings
   * @returns {Promise<void>}
   */
  async initializeNotifee(): Promise<void> {
    try {
      // Request permissions with critical alert option (especially important for iOS)
      const permissionSettings = {
        sound: true,
        announcement: true,
        criticalAlert: true, // iOS critical alert permission
      };
      
      // Add Android-specific permissions for Android 12+ (API level 31+)
      if (Platform.OS === 'android') {
        // @ts-ignore - TypeScript doesn't recognize the android property
        permissionSettings.android = {
          alarm: true, // Request SCHEDULE_EXACT_ALARM permission
          scheduleExactAlarm: true, // Alternative way to request the permission
        };
      }
      
      // Request permissions
      const permissionResult = await notifee.requestPermission(permissionSettings);
      
      console.log('[NOTIFICATION] Permission request result:', permissionResult);
      
      // Check if we have alarm permission on Android
      if (Platform.OS === 'android') {
        try {
          // Use type assertion since the method might not be in the type definitions
          const hasAlarmPermission = await (notifee as any).getAlarmPermissionStatus?.();
          console.log('[NOTIFICATION] Alarm permission status:', hasAlarmPermission);
          
          // If permission is denied, log a warning
          if (hasAlarmPermission === 'denied') {
            console.warn('[NOTIFICATION] Alarm permission denied. Timer bells may not work properly when device is locked.');
          }
        } catch (err) {
          // The method might not exist in older versions of notifee
          console.log('[NOTIFICATION] Could not check alarm permission status:', err);
        }
      }

      if (Platform.OS === 'android') {
        // Create a high-priority channel for timer completion with enhanced settings
        await notifee.createChannel({
          id: 'timer-completion',
          name: 'Timer Completion',
          sound: 'bell',  // References bell.mp3 in android/app/src/main/res/raw/
          importance: AndroidImportance.HIGH, // Maximum importance
          vibration: true, 
          vibrationPattern: [0, 500, 200, 500], // Stronger vibration pattern
          // Critical settings for lock screen breakthrough
          bypassDnd: true, // Bypass Do Not Disturb
          visibility: AndroidVisibility.PUBLIC, // Show on lock screen
          lights: true, // Use notification lights if available
          lightColor: '#1DB954', // Match app theme color
        });

        // Create a high-priority channel for HOURLY reminders using Notifee
        await notifee.createChannel({
          id: 'notifee-hourly-reminders',
          name: 'Hourly Reminders (Notifee)',
          sound: 'bell',
          importance: AndroidImportance.HIGH,
          vibration: true,
          vibrationPattern: [100, 200, 100],
          bypassDnd: true,
          visibility: AndroidVisibility.PUBLIC,
          lights: true,
          lightColor: '#1DB954',
        });
      }
      
      console.log('[NOTIFICATION] Notifee initialized with enhanced permissions and channels');
    } catch (error) {
      console.error('[NOTIFICATION] Error initializing Notifee:', error);
    }
  },

  async sendTimerCompletionSound(): Promise<void> {
    try {
      console.log('[NOTIFICATION] Sending timer completion sound with enhanced settings');
      
      // Send notification first for maximum reliability when device is locked
      // Using maximum aggressive settings for lock screen breakthrough
      await notifee.displayNotification({
        id: 'timer-completion-primary', // Use a consistent ID to avoid duplicates
        title: 'Timer Complete',
        body: 'Your practice timer has finished',
        android: {
          channelId: 'timer-completion',
          sound: 'bell',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.ALARM, // Use ALARM category for highest priority
          timestamp: Date.now(),
          showTimestamp: true,
          ongoing: true, // Make notification persistent until dismissed
          autoCancel: false, // Prevent auto-cancellation
          pressAction: { id: 'default' },
          fullScreenAction: { // Add full screen intent for maximum visibility
            id: 'default',
          },
          vibrationPattern: [0, 500, 200, 500], // Strong vibration pattern
          // Note: lights property is not directly supported in this context
          // Use the channel's light settings instead
          
          // Add alarm manager settings for Android
          ...(Platform.OS === 'android' && {
            asForegroundService: true, // Run as foreground service for better reliability
          }),
        },
        ios: {
          critical: true, // Critical alerts break through Focus modes
          sound: 'bell.mp3',
          interruptionLevel: 'critical', // Highest priority
          foregroundPresentationOptions: {
            sound: true,
            banner: true,
            list: true,
          },
          criticalVolume: 1.0, // Maximum volume for critical alerts
        },
      });
      
      // Try to play sound directly for immediate feedback when app is in foreground
      await this.playNotificationSound();

      // For maximum reliability, send a second notification after a longer delay
      // This helps on some devices where the first notification might be suppressed
      setTimeout(async () => {
        try {
          await notifee.displayNotification({
            id: 'timer-completion-backup', // Use a different ID for the backup
            title: 'Timer Complete',
            body: 'Your practice timer has finished',
            android: {
              channelId: 'timer-completion',
              sound: 'bell',
              importance: AndroidImportance.HIGH,
              visibility: AndroidVisibility.PUBLIC,
              category: AndroidCategory.ALARM,
              vibrationPattern: [0, 500, 200, 500], // Strong vibration pattern
            },
            ios: {
              critical: true,
              sound: 'bell.mp3',
              interruptionLevel: 'critical',
              criticalVolume: 1.0,
            },
          });
        } catch (err) {
          console.error('[NOTIFICATION] Error sending backup timer completion notification:', err);
        }
      }, 2000); // 2 second delay for better spacing
      
      // Send a third notification with a different approach for maximum compatibility
      setTimeout(async () => {
        try {
          // Use Expo notifications as a fallback
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Timer Complete',
              body: 'Your practice timer has finished',
              sound: Platform.OS === 'android' ? 'bell.mp3' : true,
              ...(Platform.OS === 'android' && {
                android: {
                  channelId: 'default',
                  sound: 'bell.mp3',
                  priority: 'max',
                },
              }),
            },
            trigger: null, // Send immediately
          });
        } catch (err) {
          console.error('[NOTIFICATION] Error sending third timer completion notification:', err);
        }
      }, 3000); // 3 second delay

    } catch (error) {
      console.error('[NOTIFICATION] Error playing timer completion sound:', error);
      // Fallback to direct sound playback if notification fails
      try {
        await this.playNotificationSound();
        
        // Also try a basic notification as last resort
        await Notifications.presentNotificationAsync({
          title: 'Timer Complete',
          body: 'Your practice timer has finished',
          sound: true,
        });
      } catch (err) {
        console.error('[NOTIFICATION] All fallback methods failed:', err);
      }
    }
  },

  /**
   * Test lock screen breakthrough notifications
   * This function sends a series of notifications specifically designed to test
   * lock screen breakthrough capabilities
   * @returns {Promise<string>} Test status message
   */
  async testLockScreenBreakthrough(): Promise<string> {
    try {
      console.log('[TEST] Starting lock screen breakthrough test sequence');
      
      // Get current step info for context
      const { currentStepId } = useSettingsStore.getState();
      const currentStep = stepService.getStepById(currentStepId);
      
      if (!currentStep) {
        console.log('[TEST] No current step found');
        return 'Error: No current step found';
      }
      
      // 1. Send immediate timer completion notification with maximum breakthrough settings
      console.log('[TEST] Testing enhanced timer completion notification');
      await this.sendTimerCompletionSound();
      
      // 2. Schedule a notification for 10 seconds later to test delayed breakthrough
      console.log('[TEST] Scheduling delayed lock screen test (10 seconds)');
      const tenSecondsLater = new Date(Date.now() + 10000);
      await notifee.createTriggerNotification(
        {
          title: 'Lock Screen Test (Delayed)',
          body: 'This notification should break through the lock screen',
          android: {
            channelId: 'timer-completion',
            sound: 'bell',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            category: AndroidCategory.ALARM,
            fullScreenAction: { id: 'default' },
            ongoing: true,
            autoCancel: false,
            vibrationPattern: [0, 500, 200, 500],
          },
          ios: {
            critical: true,
            sound: 'bell.mp3',
            interruptionLevel: 'critical',
            criticalVolume: 1.0,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: tenSecondsLater.getTime(),
          ...(Platform.OS === 'android' && {
            alarmManager: {
              allowWhileIdle: true,
            } as any // Type assertion to bypass TypeScript check
          }),
        }
      );
      
      // 3. Send a test notification using the hourly reminder channel
      console.log('[TEST] Testing hourly reminder channel breakthrough');
      await notifee.displayNotification({
        title: 'Hourly Channel Test',
        body: 'Testing hourly reminder channel breakthrough',
        android: {
          channelId: 'notifee-hourly-reminders',
          sound: 'bell',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          category: AndroidCategory.ALARM,
        },
        ios: {
          critical: true,
          sound: 'bell.mp3',
          interruptionLevel: 'critical',
        },
      });
      
      console.log('[TEST] All lock screen breakthrough tests initiated');
      return 'Lock screen breakthrough tests initiated. Please lock your device to test if notifications break through. You should hear sounds and see notifications in 10 seconds.';
    } catch (error) {
      console.error('[TEST] Error testing lock screen breakthrough:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error testing lock screen breakthrough: ${errorMessage}`;
    }
  },

  /**
   * Check for scheduled hourly reminders
   * This is a debugging function to verify that hourly reminders are properly scheduled
   * @returns {Promise<string>} Status message with information about scheduled reminders
   */
  async checkScheduledHourlyReminders(): Promise<string> {
    try {
      console.log('[DEBUG] Checking for scheduled hourly reminders');
      
      // Get all scheduled notifications from Expo
      const expoNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const expoHourlyReminders = expoNotifications.filter(
        notification => notification.content.title?.includes('Hourly Reminder')
      );
      
      // Get all trigger notifications from Notifee
      const notifeeNotifications = await notifee.getTriggerNotifications();
      const notifeeHourlyReminders = notifeeNotifications.filter(
        notification => notification.notification.title?.includes('Hourly Reminder')
      );
      
      // Log the findings
      console.log('[DEBUG] Found scheduled hourly reminders:', {
        expo: expoHourlyReminders.length,
        notifee: notifeeHourlyReminders.length
      });
      
      // Format the results
      let result = `Found ${expoHourlyReminders.length + notifeeHourlyReminders.length} scheduled hourly reminders:\n`;
      
      if (expoHourlyReminders.length > 0) {
        result += `\n- Expo Notifications (${expoHourlyReminders.length}):\n`;
        expoHourlyReminders.forEach((notification, index) => {
          const trigger = notification.trigger as any;
          const nextTriggerDate = trigger.nextTriggerDate 
            ? new Date(trigger.nextTriggerDate).toLocaleString()
            : 'Unknown';
          
          result += `  ${index + 1}. "${notification.content.title}" at ${nextTriggerDate}\n`;
        });
      }
      
      if (notifeeHourlyReminders.length > 0) {
        result += `\n- Notifee Notifications (${notifeeHourlyReminders.length}):\n`;
        notifeeHourlyReminders.forEach((notification, index) => {
          // Check if the trigger is a TimestampTrigger
          const trigger = notification.trigger as any;
          const timestamp = trigger.timestamp;
          const triggerDate = timestamp 
            ? new Date(timestamp).toLocaleString()
            : 'Unknown';
          
          result += `  ${index + 1}. "${notification.notification.title}" at ${triggerDate}\n`;
          result += `     Repeat: ${trigger.repeatFrequency || 'None'}\n`;
        });
      }
      
      if (expoHourlyReminders.length === 0 && notifeeHourlyReminders.length === 0) {
        result += "\nNo scheduled hourly reminders found. This could indicate a problem with the scheduling process.";
      }
      
      return result;
    } catch (error) {
      console.error('[DEBUG] Error checking scheduled hourly reminders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error checking scheduled hourly reminders: ${errorMessage}`;
    }
  },
  
  /**
   * Test timer bell notifications specifically
   * This function sends a series of timer completion notifications with different approaches
   * to help diagnose and verify lock screen breakthrough
   * @returns {Promise<string>} Test status message
   */
  async testTimerBells(): Promise<string> {
    try {
      console.log('[TEST] Starting timer bell test sequence');
      
      // 1. Send the enhanced timer completion notification
      console.log('[TEST] Testing primary timer completion notification');
      await this.sendTimerCompletionSound();
      
      // 2. Schedule a delayed notification for 15 seconds later
      console.log('[TEST] Scheduling delayed timer bell test (15 seconds)');
      const fifteenSecondsLater = new Date(Date.now() + 15000);
      
      // Use Notifee with alarm manager
      await notifee.createTriggerNotification(
        {
          id: 'timer-bell-test-delayed',
          title: 'Timer Bell Test (Delayed)',
          body: 'This notification should play a sound through the lock screen',
          android: {
            channelId: 'timer-completion',
            sound: 'bell',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            category: AndroidCategory.ALARM,
            fullScreenAction: { id: 'default' },
            ongoing: true,
            autoCancel: false,
            vibrationPattern: [0, 500, 200, 500],
          },
          ios: {
            critical: true,
            sound: 'bell.mp3',
            interruptionLevel: 'critical',
            criticalVolume: 1.0,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: fifteenSecondsLater.getTime(),
          ...(Platform.OS === 'android' && {
            alarmManager: {
              allowWhileIdle: true,
            } as any
          }),
        }
      );
      
      // 3. Schedule another notification using Expo's API for 30 seconds later
      console.log('[TEST] Scheduling Expo notification test (30 seconds)');
      const thirtySecondsLater = new Date(Date.now() + 30000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Timer Bell Test (Expo)',
          body: 'This is a timer bell notification using Expo API',
          sound: Platform.OS === 'android' ? 'bell.mp3' : true,
          ...(Platform.OS === 'android' && {
            android: {
              channelId: 'default',
              sound: 'bell.mp3',
              priority: 'max',
            },
          }),
        },
        trigger: {
          type: 'timestamp',
          timestamp: thirtySecondsLater.getTime(),
        } as any,
      });
      
      return 'Timer bell tests initiated. Please lock your device to test if notifications break through and play sounds at 15 and 30 seconds from now.';
    } catch (error) {
      console.error('[TEST] Error testing timer bells:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error testing timer bells: ${errorMessage}`;
    }
  },
  
  async testNotifications(): Promise<string> {
    try {
      console.log('[TEST] Starting notification test sequence');

      // Cancel any existing notifications to start fresh
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[TEST] Cleared existing notifications');

      // Get current step info
      const { currentStepId } = useSettingsStore.getState();
      const currentStep = stepService.getStepById(currentStepId);
      
      if (!currentStep) {
        console.log('[TEST] No current step found');
        return 'Error: No current step found';
      }

      // 1. Test immediate notification
      console.log('[TEST] Sending immediate notification');
      await this.sendNotification(
        'Test Immediate Notification',
        'This is a test immediate notification',
        true,
        true
      );

      // 2. Test Notifee timer completion sound
      console.log('[TEST] Testing Notifee timer completion sound');
      await this.sendTimerCompletionSound();
      
      // 3. Test Notifee hourly reminder (using the new channel)
      console.log('[TEST] Testing Notifee hourly reminder');
      const thirtySecondsLater = new Date(Date.now() + 30000);
      await notifee.createTriggerNotification(
        {
          title: `Test Notifee Hourly Reminder: Step ${currentStepId}`,
          body: currentStep.title,
          android: {
            channelId: 'notifee-hourly-reminders',
            sound: 'bell',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            category: AndroidCategory.ALARM,
            pressAction: { id: 'default' },
            smallIcon: 'notification_icon',
          },
          ios: {
            sound: 'bell.mp3',
            interruptionLevel: 'timeSensitive',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: thirtySecondsLater.getTime(),
        }
      );

      // 4. Test practice reminder (1 minute)
      console.log('[TEST] Scheduling 1-minute practice reminder test');
      const oneMinuteLater = new Date(Date.now() + 60000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Test Practice Reminder: Step ${currentStepId}`,
          body: `Don't forget to complete your practices for Step ${currentStepId}!`,
          sound: Platform.OS === 'android' ? 'bell.mp3' : true,
          ...(Platform.OS === 'android' && {
            android: {
              channelId: 'default',
              sound: 'bell.mp3',
              icon: 'notification-icon',
            },
          }),
        },
        trigger: {
          type: 'timestamp',
          timestamp: oneMinuteLater.getTime(),
        } as any,
      });

      console.log('[TEST] All test notifications scheduled successfully');
      return 'Test notifications scheduled: Check for notifications over the next minute';
    } catch (error) {
      console.error('[TEST] Error scheduling test notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error scheduling test notifications: ${errorMessage}`;
    }
  }
};

export default notificationService;
