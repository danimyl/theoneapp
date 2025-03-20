import useSettingsStore from '../store/settingsStore';

/**
 * Service to handle browser notifications
 */
const notificationService = {
  /**
   * Check if notifications are supported and permission has been granted
   * @returns {Promise<boolean>} True if notifications are available
   */
  async checkPermission() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    // Check if we already have permission
    if (Notification.permission === 'granted') {
      return true;
    }

    // Otherwise, request permission
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  /**
   * Check if current time is within sleep hours
   * @returns {boolean} True if current time is within sleep hours
   */
  isWithinSleepHours() {
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
  },

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      const audio = new Audio('/aud/bell.mp3');
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  },

  /**
   * Send a notification
   * @param {string} title The notification title
   * @param {object} options Notification options
   * @param {boolean} playSound Whether to play a sound with the notification
   * @returns {Promise<boolean>} True if notification was sent
   */
  async sendNotification(title, options = {}, playSound = false) {
    try {
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        console.log(`[NOTIFICATION SKIPPED - QUIET HOURS] ${title}`);
        return false;
      }
      
      const hasPermission = await this.checkPermission();
      
      if (!hasPermission) {
        // Fall back to console if notifications aren't available
        console.log(`[NOTIFICATION] ${title}`, options);
        return false;
      }

      // Create and show notification
      const notification = new Notification(title, {
        icon: '/vite.svg', // Default icon
        ...options
      });

      // Optional: add event listeners
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Play sound if requested
      if (playSound) {
        this.playNotificationSound();
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Fall back to console
      console.log(`[NOTIFICATION] ${title}`, options);
      return false;
    }
  },

  /**
   * Send a reminder notification for a step
   * @param {number} stepId Step ID
   * @param {string} stepTitle Step title
   * @param {boolean} forceNotify Whether to force the notification regardless of settings
   */
  async sendStepReminder(stepId, stepTitle, forceNotify = false) {
    // If we're in sleep hours, don't send notification
    if (this.isWithinSleepHours()) {
      console.log(`[HOURLY REMINDER SKIPPED - QUIET HOURS] Step ${stepId}: ${stepTitle}`);
      return false;
    }
    
    return this.sendNotification(`Hourly Reminder: Step ${stepId}`, {
      body: stepTitle,
      tag: `step-reminder-${stepId}`, // Prevents duplicate notifications
      requireInteraction: true // Notification persists until user interacts with it
    }, true); // Play sound with hourly reminders
  }
};

export default notificationService;
