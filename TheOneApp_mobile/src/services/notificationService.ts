/**
 * Notification Service
 * 
 * Handles mobile notifications and sounds for the application.
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
   */
  async registerBackgroundTasks(): Promise<void> {
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
        stopOnTerminate: false,
        startOnBoot: true,
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
   */
  async setupAndroidForegroundService(): Promise<void> {
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
        sound: 'bell.mp3', // Use our custom sound
        bypassDnd: true, // Bypass Do Not Disturb
      });

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
        body: 'Hourly reminders will play until you clear this notification',
        sound: false,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'foreground-service',
            priority: 'low',
            icon: 'notification-icon', // Use our monochrome notification icon
          },
        }),
      } as any);
      
      // Store the date when the foreground service was started
      const today = new Date().toISOString().split('T')[0];
      useSettingsStore.getState().setLastForegroundServiceDate(today);

      console.log('[BACKGROUND] Android notification channels and foreground service set up');
    } catch (error) {
      console.error('[BACKGROUND] Error setting up Android foreground service:', error);
    }
  },
  
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
        },
      });
      return status === 'granted';
    }
    return false;
  },
  
  /**
   * Check if current time is within sleep hours
   */
  isWithinSleepHours(): boolean {
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
   */
  async playNotificationSound(): Promise<void> {
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
   */
  async scheduleRecurringNotification(
    title: string,
    body: string,
    hour: number,
    minute: number,
    playSound = true,
    channelId = 'hourly-reminders' // Default to high-priority channel
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

      // Schedule using Expo's native scheduling
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: playSound ? (Platform.OS === 'android' ? 'bell.mp3' : true) : undefined,
          ...(Platform.OS === 'android' && {
            android: {
              sound: playSound ? 'bell.mp3' : undefined,
              channelId: channelId,
              icon: 'notification-icon',
              priority: 'max',
            },
          }),
          ...(Platform.OS === 'ios' && {
            ios: {
              sound: playSound ? true : undefined,
            },
          }),
        },
        trigger: {
          hour: hour,
          minute: minute,
          repeats: true,
          channelId: Platform.OS === 'android' ? channelId : undefined,
        } as any, // Type assertion needed due to Expo types not being fully accurate
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
      
      // Schedule for the next hour
      const now = new Date();
      const currentHour = now.getHours();
      const nextHour = (currentHour + 1) % 24;
      
      await this.scheduleRecurringNotification(
        `Hourly Reminder: Step ${currentStepId}`,
        currentStep.title,
        nextHour,
        0, // Minute
        true, // Play sound
        'hourly-reminders' // Use the dedicated channel
      );
      
      console.log('[NOTIFICATION] Successfully scheduled hourly reminder');
    } catch (error) {
      console.error('[NOTIFICATION] Error scheduling hourly reminders:', error);
    }
  },

  /**
   * Cancel all scheduled hourly reminders
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
   * Send a timer completion sound
   */
  async sendTimerCompletionSound(): Promise<void> {
    try {
      console.log('[NOTIFICATION] Sending timer completion sound');
      
      // Play sound directly for immediate feedback when app is in foreground
      await this.playNotificationSound();
      
      // Also send a notification for when app is in background
      await Notifications.presentNotificationAsync({
        title: 'Timer Complete',
        body: 'Your practice timer has finished',
        sound: Platform.OS === 'android' ? 'bell.mp3' : true,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'default',
            sound: 'bell.mp3',
            priority: 'max',
            icon: 'notification-icon',
          },
        }),
      });
    } catch (error) {
      console.error('[NOTIFICATION] Error playing timer completion sound:', error);
      // Fallback to direct sound playback if notification fails
      try {
        await this.playNotificationSound();
      } catch (err) {
        console.error('[NOTIFICATION] Fallback sound playback failed:', err);
      }
    }
  },

  /**
   * Test notification functionality
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

      // 2. Test timer completion sound
      console.log('[TEST] Testing timer completion sound');
      await this.sendTimerCompletionSound();
      
      // 3. Test hourly reminder (30 seconds later)
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
              sound: 'bell.mp3',
              icon: 'notification-icon',
              priority: 'max',
            },
          }),
        },
        trigger: {
          type: 'timestamp',
          timestamp: thirtySecondsLater.getTime(),
        } as any,
      });

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
