/**
 * Notification Service
 * Handles mobile notifications for lock screen with improved timing precision in Expo managed workflow.
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

    await BackgroundFetch.registerTaskAsync(HOURLY_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 min (iOS minimum)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[BACKGROUND] Registered hourly task');

    await BackgroundFetch.registerTaskAsync(PRACTICE_REMINDER_TASK, {
      minimumInterval: 24 * 60 * 60, // 24 hours
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[BACKGROUND] Registered practice task');

    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }
  },

  async setupAndroidChannels() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('hourly-reminders', {
      name: 'Hourly Reminders',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'bell.mp3',
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

  async playNotificationSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/bell.mp3'));
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) sound.unloadAsync().catch(err => console.error('[NOTIFICATION] Unload error:', err));
      });
    } catch (error) {
      console.error('[NOTIFICATION] Sound error:', error);
    }
  },

  async sendNotification(title: string, body: string, playSound = false, immediate = true): Promise<boolean> {
    if (this.isWithinSleepHours()) return false;

    if (playSound && immediate && Platform.OS !== 'web') {
      await this.playNotificationSound();
    }

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      await Notifications.presentNotificationAsync({
        title,
        body,
        sound: playSound ? 'bell.mp3' : undefined,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            sound: 'bell.mp3',
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
        sound: playSound ? 'bell.mp3' : undefined,
        badge: 1,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            sound: 'bell.mp3',
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

    await this.cancelHourlyReminders();
    const now = new Date();
    const currentHour = now.getHours();
    for (let i = 1; i <= 24; i++) {
      const hour = (currentHour + i) % 24;
      const nextDate = new Date(now);
      nextDate.setHours(hour, 0, 0, 0);
      await this.scheduleNotification(`Hourly Reminder: Step ${currentStepId}`, currentStep.title, nextDate, true);
    }
  },

  async cancelHourlyReminders(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.title?.includes('Hourly Reminder')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
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
        sound: 'bell.mp3',
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'hourly-reminders',
            priority: 'max',
            alarmClock: true,
            sound: 'bell.mp3',
            vibrate: false,
            showWhen: false,
          },
        }),
        ...(Platform.OS === 'ios' && {
          ios: {
            sound: 'bell.mp3',
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
