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
TaskManager.defineTask(HOURLY_NOTIFICATION_TASK, async () => {
  try {
    await notificationService.checkAndSendHourlyNotification();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BACKGROUND] Error in hourly notification task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

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

      // Register hourly notification task
      await BackgroundFetch.registerTaskAsync(HOURLY_NOTIFICATION_TASK, {
        minimumInterval: 60 * 60, // 1 hour in seconds
        stopOnTerminate: false,    // Continue running when app is closed
        startOnBoot: true,         // Run on device boot
      });
      console.log('[BACKGROUND] Registered hourly notification task');
      
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

      // Create high-priority channel for hourly reminders
      await Notifications.setNotificationChannelAsync('hourly-reminders', {
        name: 'Hourly Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954',
        enableLights: true,
        enableVibrate: true,
        sound: 'bell.mp3',
        ...(Platform.OS === 'android' && {
          android: {
            priority: 'max',
            alarmClock: true, // This ensures exact timing
          },
        }),
      });

      await Notifications.setNotificationChannelAsync('foreground-service', {
        name: 'Background Service',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#1DB954',
        enableLights: false,
        enableVibrate: false,
        showBadge: false,
      });

      // Create a persistent notification for the foreground service
      await Notifications.presentNotificationAsync({
        title: 'The One App',
        body: 'Running in background to deliver your notifications',
        sound: false,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'foreground-service',
            priority: 'low',
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
    playSound = true
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

      // For hourly reminders, use exact timing with date trigger
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: playSound ? (Platform.OS === 'android' ? 'bell.mp3' : true) : undefined,
          badge: 1,
          ...(Platform.OS === 'android' && {
            android: {
              sound: playSound ? 'bell.mp3' : undefined,
              channelId: 'hourly-reminders',
              priority: 'max',
              alarmClock: true,
            },
          }),
        },
        trigger: {
          type: 'timestamp',
          timestamp: nextDate.getTime(),
          repeats: true,
        } as any,
      });

      console.log(`[NOTIFICATION] Scheduled recurring notification ${identifier} for ${hour}:${minute}`);
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
      
      if (!currentStepId) {
        console.log('[NOTIFICATION] No current step ID, skipping hourly reminder scheduling');
        return;
      }
      
      const currentStep = stepService.getStepById(currentStepId);
      if (!currentStep) {
        console.log('[NOTIFICATION] Step not found, skipping hourly reminder scheduling');
        return;
      }
      
      // Only schedule if the step has hourly:true or alwaysHourlyReminders is true
      if (!(currentStep.hourly || alwaysHourlyReminders)) {
        console.log('[NOTIFICATION] Step is not hourly and alwaysHourlyReminders is false, skipping');
        return;
      }
      
      // Cancel any existing hourly reminders
      await this.cancelHourlyReminders();
      
      // Schedule a reminder for each hour
      const now = new Date();
      const currentHour = now.getHours();
      
      // Schedule for the next 24 hours
      for (let i = 1; i <= 24; i++) {
        const hour = (currentHour + i) % 24;
        await this.scheduleRecurringNotification(
          `Hourly Reminder: Step ${currentStepId}`,
          currentStep.title,
          hour,
          0, // At the top of the hour
          true // Play sound
        );
      }
      
      console.log('[NOTIFICATION] Scheduled hourly reminders for the next 24 hours');
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

      // 2. Test hourly reminder (30 seconds)
      console.log('[TEST] Scheduling 30-second hourly reminder test');
      const thirtySecondsLater = new Date(Date.now() + 30000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Test Hourly Reminder: Step ${currentStepId}`,
          body: currentStep.title,
          sound: Platform.OS === 'android' ? 'bell.mp3' : true,
          ...(Platform.OS === 'android' && {
            android: {
              channelId: 'hourly-reminders',
              priority: 'max',
              alarmClock: true,
              sound: 'bell.mp3',
            },
          }),
        },
        trigger: {
          type: 'timestamp',
          timestamp: thirtySecondsLater.getTime(),
        } as any,
      });

      // 3. Test practice reminder (1 minute)
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
