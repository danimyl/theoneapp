/**
 * Notification Service
 * Handles mobile notifications for lock screen with improved timing precision in Expo managed workflow.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { useSettingsStore } from '../store/settingsStore';
import stepService from './stepService';

// Define task names
const HOURLY_NOTIFICATION_TASK = 'hourly-notification-task';
const PRACTICE_REMINDER_TASK = 'practice-reminder-task';

// Configure notifications for lock screen
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
    console.error('[BACKGROUND] Error in hourly task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(PRACTICE_REMINDER_TASK, async () => {
  try {
    await notificationService.checkAndSendPracticeReminder();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BACKGROUND] Error in practice task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const notificationService = {
  async registerBackgroundTasks() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
      
      // Create a background service channel with custom name
      await Notifications.setNotificationChannelAsync('background-service', {
        name: 'Steps to Knowledge',  // This will be used as the notification title
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#1DB954',
      });
    }

    // Register background tasks
    await BackgroundFetch.registerTaskAsync(HOURLY_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 min (iOS minimum)
      stopOnTerminate: false,
      startOnBoot: true,
      ...(Platform.OS === 'android' && {
        options: {
          channelId: 'background-service',
        }
      }),
    });
    console.log('[BACKGROUND] Registered hourly task');

    await BackgroundFetch.registerTaskAsync(PRACTICE_REMINDER_TASK, {
      minimumInterval: 24 * 60 * 60, // 24 hours
      stopOnTerminate: false,
      startOnBoot: true,
      ...(Platform.OS === 'android' && {
        options: {
          channelId: 'background-service',
        }
      }),
    });
    console.log('[BACKGROUND] Registered practice task');
  },

  async setupAndroidChannels() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('hourly-reminders', {
      name: 'Hourly Reminders',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1DB954',
      enableLights: true,
    });
    console.log('[BACKGROUND] Android channels set up');
  },

  async requestPermissions() {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: true }
      });
      return status === 'granted';
    }
    return false;
  },

  isWithinSleepHours() {
    const { sleepStart, sleepEnd } = useSettingsStore.getState();
    const [startHour, startMinute] = sleepStart.split(':').map(Number);
    const [endHour, endMinute] = sleepEnd.split(':').map(Number);
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const sleepStartInMinutes = startHour * 60 + startMinute;
    const sleepEndInMinutes = endHour * 60 + endMinute;
    return sleepStartInMinutes > sleepEndInMinutes
      ? currentTimeInMinutes >= sleepStartInMinutes || currentTimeInMinutes <= sleepEndInMinutes
      : currentTimeInMinutes >= sleepStartInMinutes && currentTimeInMinutes <= sleepEndInMinutes;
  },

  async sendNotification(title: string, body: string, playSound = false, immediate = true): Promise<boolean> {
    if (this.isWithinSleepHours()) return false;

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await Notifications.presentNotificationAsync({
        title,
        body,
        sound: playSound,
        categoryIdentifier: 'Steps to Knowledge', // Custom app name for notification title
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            icon: 'notification-icon',
          },
        }),
      });
      return true;
    }
    console.log(`[NOTIFICATION] ${title}: ${body}`);
    return true;
  },

  async scheduleNotification(title: string, body: string, date: Date, playSound = true): Promise<string> {
    const now = new Date();
    if (date <= now) return '';

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: playSound,
        badge: 0, // Set to 0 to prevent badge notifications
        categoryIdentifier: 'Steps to Knowledge', // Custom app name for notification title
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            icon: 'notification-icon',
            // Prevent immediate notification
            showWhen: false,
            visibility: 'secret',
          },
        }),
        ...(Platform.OS === 'ios' && {
          ios: {
            // Prevent immediate notification on iOS
            _displayInForeground: false,
          },
        }),
      },
      trigger: {
        type: 'timestamp',
        timestamp: date.getTime(),
        repeats: false,
      } as any,
    });
    // Only log in development, not in production
    if (__DEV__) {
      console.log(`[NOTIFICATION] Scheduled ${identifier} for ${date.toLocaleString()}`);
    }
    return identifier;
  },

  async scheduleRecurringNotification(title: string, body: string, hour: number, minute: number, playSound = true): Promise<string> {
    let nextDate = new Date();
    nextDate.setHours(hour, minute, 0, 0);
    if (nextDate <= new Date()) nextDate.setDate(nextDate.getDate() + 1);

    const identifier = await this.scheduleNotification(title, body, nextDate, playSound);
    Notifications.addNotificationResponseReceivedListener(async () => {
      const tomorrow = new Date(nextDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.scheduleNotification(title, body, tomorrow, playSound);
    });
    return identifier;
  },

  async sendHourlyReminder(stepId: number, stepTitle: string, immediate = true): Promise<boolean> {
    return this.sendNotification(`Hourly Reminder: Step ${stepId}`, stepTitle, true, immediate);
  },

  /**
   * Check if a time is within sleep hours
   * @param date The date to check
   * @returns true if the time is within sleep hours
   */
  isTimeWithinSleepHours(date: Date): boolean {
    const { sleepStart, sleepEnd } = useSettingsStore.getState();
    const [startHour, startMinute] = sleepStart.split(':').map(Number);
    const [endHour, endMinute] = sleepEnd.split(':').map(Number);
    
    const timeInMinutes = date.getHours() * 60 + date.getMinutes();
    const sleepStartInMinutes = startHour * 60 + startMinute;
    const sleepEndInMinutes = endHour * 60 + endMinute;
    
    // Handle cases where sleep period crosses midnight
    return sleepStartInMinutes > sleepEndInMinutes
      ? timeInMinutes >= sleepStartInMinutes || timeInMinutes <= sleepEndInMinutes
      : timeInMinutes >= sleepStartInMinutes && timeInMinutes <= sleepEndInMinutes;
  },
  
  /**
   * Check if we need to schedule new hourly reminders
   * @returns true if we need to schedule new reminders
   */
  needToScheduleHourlyReminders(): boolean {
    const { 
      scheduledHourlyNotifications, 
      lastNotificationScheduleTime 
    } = useSettingsStore.getState();
    
    const now = Date.now();
    
    // If we haven't scheduled any notifications yet, or it's been more than 12 hours
    if (!lastNotificationScheduleTime || (now - lastNotificationScheduleTime) > 12 * 60 * 60 * 1000) {
      return true;
    }
    
    // If we have fewer than 12 notifications scheduled
    if (scheduledHourlyNotifications.length < 12) {
      return true;
    }
    
    // Check if we have notifications scheduled for at least the next 12 hours
    const twelveHoursFromNow = now + (12 * 60 * 60 * 1000);
    const futureNotifications = scheduledHourlyNotifications.filter(
      notification => notification.timestamp > now && notification.timestamp < twelveHoursFromNow
    );
    
    // If we have fewer than 6 notifications in the next 12 hours, schedule more
    return futureNotifications.length < 6;
  },
  
  async scheduleHourlyReminders(): Promise<void> {
    const { 
      currentStepId, 
      alwaysHourlyReminders,
      clearScheduledNotifications,
      setLastNotificationScheduleTime
    } = useSettingsStore.getState();
    
    if (!currentStepId) return;

    const currentStep = stepService.getStepById(currentStepId);
    if (!currentStep || !(currentStep.hourly || alwaysHourlyReminders)) return;
    
    // Check if we need to schedule new reminders
    if (!this.needToScheduleHourlyReminders()) {
      console.log('[NOTIFICATION] No need to schedule new hourly reminders');
      return;
    }

    // First, clear any existing hourly reminders
    await this.cancelHourlyReminders();
    
    // Clear the scheduled notifications in the store
    clearScheduledNotifications();
    
    // Then schedule new ones, but only for future times and wake hours
    const now = new Date();
    let scheduledCount = 0;
    
    // Schedule for the next 24 hours, but only during wake hours
    for (let i = 1; i <= 24; i++) {
      const nextDate = new Date(now);
      nextDate.setHours(now.getHours() + i, 0, 0, 0);
      
      // Skip if this time is within sleep hours
      if (this.isTimeWithinSleepHours(nextDate)) {
        continue;
      }
      
      const identifier = await this.scheduleNotification(
        `Hourly Reminder: Step ${currentStepId}`, 
        currentStep.title, 
        nextDate, 
        true
      );
      
      if (identifier) {
        // Store the scheduled notification in the store
        useSettingsStore.getState().addScheduledNotification(
          identifier,
          nextDate.getTime()
        );
        scheduledCount++;
      }
    }
    
    // Update the last schedule time
    setLastNotificationScheduleTime(Date.now());
    
    console.log(`[NOTIFICATION] Scheduled ${scheduledCount} hourly reminders during wake hours`);
  },

  async cancelHourlyReminders(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const { clearScheduledNotifications } = useSettingsStore.getState();
    
    for (const notification of scheduled) {
      if (notification.content.title?.includes('Hourly Reminder')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    // Clear the scheduled notifications in the store
    clearScheduledNotifications();
    console.log('[NOTIFICATION] Cancelled all hourly reminders');
  },

  /**
   * Clear all hourly reminders and update the store
   * This prevents a pile-up of outdated notifications when the app opens
   * @returns {Promise<number>} Number of notifications cleared
   */
  async clearPastHourlyReminders(): Promise<number> {
    try {
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const { 
        clearScheduledNotifications,
        addScheduledNotification
      } = useSettingsStore.getState();
      
      let clearedCount = 0;
      let keptCount = 0;
      
      // Clear all stored notifications first
      clearScheduledNotifications();

      for (const notification of scheduled) {
        // Only process hourly reminders
        if (notification.content.title?.includes('Hourly Reminder')) {
          // Check if this notification has a timestamp trigger
          if (notification.trigger && 'timestamp' in notification.trigger) {
            const timestamp = notification.trigger.timestamp as number;
            const triggerTime = new Date(timestamp);
            const now = new Date();
            
            // If the trigger time is in the past or within sleep hours, cancel it
            if (triggerTime <= now || this.isTimeWithinSleepHours(triggerTime)) {
              await Notifications.cancelScheduledNotificationAsync(notification.identifier);
              clearedCount++;
            } else {
              // Keep track of valid future notifications
              addScheduledNotification(notification.identifier, timestamp);
              keptCount++;
            }
          } else {
            // If no timestamp trigger, cancel it
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            clearedCount++;
          }
        }
      }

      if (clearedCount > 0) {
        console.log(`[NOTIFICATION] Cleared ${clearedCount} hourly reminders, kept ${keptCount}`);
      }
      
      return clearedCount;
    } catch (error) {
      console.error('[NOTIFICATION] Error clearing hourly reminders:', error);
      return 0;
    }
  },

  async sendPracticeReminder(stepId: number, stepTitle: string, practiceChecks: boolean[], immediate = true): Promise<boolean> {
    const allComplete = practiceChecks.every(check => check);
    if (allComplete) return false;

    const incompleteCount = practiceChecks.filter(check => !check).length;
    const message = incompleteCount === 1
      ? `Don't forget you have 1 Step left today!`
      : `Don't forget you have ${incompleteCount} Steps left today!`;
    return this.sendNotification(`Practice Reminder: Step ${stepId}`, message, true, immediate);
  },

  async schedulePracticeReminder(): Promise<void> {
    const { practiceReminderEnabled, practiceReminderTime, currentStepId } = useSettingsStore.getState();
    if (!practiceReminderEnabled || !currentStepId) return;

    const currentStep = stepService.getStepById(currentStepId);
    if (!currentStep) return;

    const [hour, minute] = practiceReminderTime.split(':').map(Number);
    await this.cancelPracticeReminders();
    await this.scheduleRecurringNotification(
      `Practice Reminder: Step ${currentStepId}`,
      `Don't forget your practices for Step ${currentStepId}!`,
      hour,
      minute,
      true
    );
  },

  async cancelPracticeReminders(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.title?.includes('Practice Reminder')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  },

  async checkAndSendHourlyNotification(): Promise<boolean> {
    const now = new Date();
    if (now.getMinutes() > 5 || this.isWithinSleepHours()) return false;

    const { currentStepId, alwaysHourlyReminders } = useSettingsStore.getState();
    if (!currentStepId) return false;

    const currentStep = stepService.getStepById(currentStepId);
    if (!currentStep || !(currentStep.hourly || alwaysHourlyReminders)) return false;

    return this.sendHourlyReminder(currentStepId, currentStep.title, false);
  },

  async checkAndSendPracticeReminder(): Promise<boolean> {
    const { practiceReminderEnabled, practiceReminderTime, currentStepId, practiceChecks } = useSettingsStore.getState();
    if (!practiceReminderEnabled || !currentStepId) return false;

    const now = new Date();
    const [hour, minute] = practiceReminderTime.split(':').map(Number);
    if (now.getHours() !== hour || Math.abs(now.getMinutes() - minute) > 5 || this.isWithinSleepHours()) return false;

    const currentStep = stepService.getStepById(currentStepId);
    if (!currentStep) return false;

    const checks = practiceChecks[currentStepId] || Array(currentStep.practices.length).fill(false);
    return this.sendPracticeReminder(currentStepId, currentStep.title, checks, false);
  },

  async sendTimerCompletionSound(): Promise<void> {
    await Notifications.presentNotificationAsync({
      content: {
        title: '',
        body: '',
        sound: true,
        categoryIdentifier: 'Steps to Knowledge', // Custom app name for notification title
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            vibrate: false,
            showWhen: false,
          },
        }),
        ...(Platform.OS === 'ios' && {
          ios: {
            critical: true,
            interruptionLevel: 'timeSensitive',
            _displayInForeground: false,
          },
        }),
      },
    } as any);
  },
};

export default notificationService;
