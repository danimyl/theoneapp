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
        badge: 1,
        categoryIdentifier: 'Steps to Knowledge', // Custom app name for notification title
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            icon: 'notification-icon',
          },
        }),
      },
      trigger: {
        type: 'timestamp',
        timestamp: date.getTime(),
        repeats: false,
      } as any,
    });
    console.log(`[NOTIFICATION] Scheduled ${identifier} for ${date.toLocaleString()}`);
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

  async scheduleHourlyReminders(): Promise<void> {
    const { currentStepId, alwaysHourlyReminders } = useSettingsStore.getState();
    if (!currentStepId) return;

    const currentStep = stepService.getStepById(currentStepId);
    if (!currentStep || !(currentStep.hourly || alwaysHourlyReminders)) return;

    // First, clear any existing hourly reminders
    await this.cancelHourlyReminders();
    
    // Then schedule new ones, but only for future times
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let scheduledCount = 0;
    
    for (let i = 1; i <= 24; i++) {
      const hour = (currentHour + i) % 24;
      const nextDate = new Date(now);
      nextDate.setHours(hour, 0, 0, 0);
      
      // Ensure the date is in the future
      if (nextDate <= now) {
        // If we're in the same hour, the date might be in the past
        // Add a day to make sure it's in the future
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      const identifier = await this.scheduleNotification(
        `Hourly Reminder: Step ${currentStepId}`, 
        currentStep.title, 
        nextDate, 
        true
      );
      
      if (identifier) {
        scheduledCount++;
      }
    }
    
    console.log(`[NOTIFICATION] Scheduled ${scheduledCount} hourly reminders for the next 24 hours`);
  },

  async cancelHourlyReminders(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.title?.includes('Hourly Reminder')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  },

  /**
   * Clear all hourly reminders scheduled for times in the past
   * This prevents a pile-up of outdated notifications when the app opens
   * @returns {Promise<number>} Number of past notifications cleared
   */
  async clearPastHourlyReminders(): Promise<number> {
    try {
      const now = new Date();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      let clearedCount = 0;

      for (const notification of scheduled) {
        // Only process hourly reminders
        if (!notification.content.title?.includes('Hourly Reminder')) {
          continue;
        }

        // Check if this notification has a timestamp trigger
        if (notification.trigger && 'timestamp' in notification.trigger) {
          const timestamp = notification.trigger.timestamp as number;
          const triggerTime = new Date(timestamp);
          
          // If the trigger time is in the past, cancel the notification
          if (triggerTime < now) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            clearedCount++;
            console.log(`[NOTIFICATION] Cleared past hourly reminder scheduled for ${triggerTime.toLocaleString()}`);
          }
        }
      }

      if (clearedCount > 0) {
        console.log(`[NOTIFICATION] Cleared ${clearedCount} past hourly reminders`);
      }
      
      return clearedCount;
    } catch (error) {
      console.error('[NOTIFICATION] Error clearing past hourly reminders:', error);
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
