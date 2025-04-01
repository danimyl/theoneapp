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
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../store/settingsStore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Service to handle mobile notifications and sounds
 */
const notificationService = {
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
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendNotification(title: string, body: string, playSound = false): Promise<boolean> {
    try {
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        return false;
      }
      
      // Play sound if requested
      if (playSound) {
        await this.playNotificationSound();
      }
      
      // Send actual notification on mobile platforms
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: null, // Immediate notification
        });
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
   * Send a reminder notification for a step
   * @param {number} stepId Step ID
   * @param {string} stepTitle Step title
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendHourlyReminder(stepId: number, stepTitle: string): Promise<boolean> {
    return this.sendNotification(
      `Hourly Reminder: Step ${stepId}`,
      stepTitle,
      true // Play sound with hourly reminders
    );
  },
  
  /**
   * Send a practice reminder notification if practices are incomplete
   * @param {number} stepId Current step ID
   * @param {string} stepTitle Step title
   * @param {boolean[]} practiceChecks Array of practice completion states
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendPracticeReminder(stepId: number, stepTitle: string, practiceChecks: boolean[]): Promise<boolean> {
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
      true // Play sound with practice reminders
    );
  }
};

export default notificationService;
