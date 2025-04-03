/**
 * Settings Store
 * 
 * Manages application settings and state persistence using Zustand.
 * Handles timer-related settings, practice completion tracking,
 * daily advancement, and notification preferences.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to validate timer state
const isTimerValid = (
  stepId: number | null, 
  practiceIndex: number | null, 
  endTime: number | null, 
  duration: number | null
): boolean => {
  // Check if all timer values are present
  if (stepId === null || practiceIndex === null || endTime === null || duration === null) {
    console.log('[SETTINGS] Timer state invalid: missing values');
    return false;
  }
  
  // Check if the timer has already expired
  if (endTime < Date.now()) {
    console.log('[SETTINGS] Timer state invalid: timer expired');
    return false;
  }
  
  // Check if the timer has a reasonable duration (between 1 second and 1 hour)
  if (duration < 1 || duration > 3600) {
    console.log('[SETTINGS] Timer state invalid: unreasonable duration', duration);
    return false;
  }
  
  return true;
};

interface PracticeChecks {
  [stepId: number]: boolean[];
}

interface SettingsState {
  // Theme setting
  isDarkMode: boolean;

  // Timer-related settings
  practiceChecks: PracticeChecks;
  lastPracticeStartDate: string | null;
  
  // Timer persistence across steps
  activeTimerStepId: number | null;
  activeTimerPracticeIndex: number | null;
  activeTimerEndTime: number | null; // Timestamp when timer will end
  activeTimerDuration: number | null; // Original duration in seconds
  activeTimerIsPaused: boolean; // Whether the timer is paused
  
  // Daily advancement tracking
  currentStepId: number;
  startDate: string | null; // Now stores timestamp as string
  lastAdvancementCheck: string | null; // Now stores timestamp as string
  
  // Notification settings
  alwaysHourlyReminders: boolean;
  sleepStart: string; // Format: "22:00" (10:00 PM)
  sleepEnd: string;   // Format: "07:00" (7:00 AM)
  
  // Practice reminder settings
  practiceReminderEnabled: boolean;
  practiceReminderTime: string; // Format: "HH:MM" (e.g., "19:00" for 7:00 PM)
  
  // Secret feature tracking
  appOpenCountToday: number;
  lastAppOpenDate: string | null; // Format: "YYYY-MM-DD"
  lastSecretShownDate: string | null; // Format: "YYYY-MM-DD"
  
  // Theme actions
  setIsDarkMode: (isDark: boolean) => void;

  // Actions
  setPracticeChecks: (stepId: number, checks: boolean[]) => void;
  setLastPracticeStartDate: (date: string | null) => void;
  
  // Timer persistence actions
  setActiveTimer: (stepId: number, practiceIndex: number, duration: number) => void;
  clearActiveTimer: () => void;
  updateActiveTimerEndTime: (endTime: number | null) => void;
  setActiveTimerPaused: (isPaused: boolean) => void;
  
  setCurrentStepId: (stepId: number) => void;
  setStartDate: (date: string) => void;
  setLastAdvancementCheck: (date: string) => void;
  setAlwaysHourlyReminders: (value: boolean) => void;
  setSleepStart: (time: string) => void;
  setSleepEnd: (time: string) => void;
  setPracticeReminderEnabled: (enabled: boolean) => void;
  setPracticeReminderTime: (time: string) => void;
  setAppOpenCountToday: (count: number) => void;
  setLastAppOpenDate: (date: string | null) => void;
  setLastSecretShownDate: (date: string | null) => void;
  
  // Reset functionality
  resetAllChecks: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDarkMode: true, // Default to dark mode
      practiceChecks: {},
      lastPracticeStartDate: null,
      
      // Timer persistence across steps
      activeTimerStepId: null,
      activeTimerPracticeIndex: null,
      activeTimerEndTime: null,
      activeTimerDuration: null,
      activeTimerIsPaused: false,
      
      currentStepId: 1,
      startDate: null, // Will store timestamp as string
      lastAdvancementCheck: null, // Will store timestamp as string
      
      // Notification settings with defaults
      alwaysHourlyReminders: false,
      sleepStart: "22:00", // Default sleep start time (10:00 PM)
      sleepEnd: "07:00",   // Default sleep end time (7:00 AM)
      
      // Practice reminder settings with defaults
      practiceReminderEnabled: true,
      practiceReminderTime: "19:00", // Default reminder time (7:00 PM)
      
      // Secret feature tracking
      appOpenCountToday: 0,
      lastAppOpenDate: null,
      lastSecretShownDate: null,
      
      // Theme actions
      setIsDarkMode: (isDark) =>
        set({ isDarkMode: isDark }),

      // Actions
      setPracticeChecks: (stepId, checks) => 
        set((state) => ({
          practiceChecks: {
            ...state.practiceChecks,
            [stepId]: checks,
          },
        })),
      
      setLastPracticeStartDate: (date) => 
        set({ lastPracticeStartDate: date }),
      
      setCurrentStepId: (stepId) => 
        set({ currentStepId: stepId }),
      
      setStartDate: (date) => 
        set({ startDate: date }),
      
      setLastAdvancementCheck: (date) => 
        set({ lastAdvancementCheck: date }),
      
      // Notification setting actions
      setAlwaysHourlyReminders: (value) => 
        set({ alwaysHourlyReminders: value }),
      
      setSleepStart: (time) => 
        set({ sleepStart: time }),
      
      setSleepEnd: (time) => 
        set({ sleepEnd: time }),
      
      // Practice reminder setting actions
      setPracticeReminderEnabled: (enabled) => 
        set({ practiceReminderEnabled: enabled }),
      
      setPracticeReminderTime: (time) => 
        set({ practiceReminderTime: time }),
      
      // Secret feature actions
      setAppOpenCountToday: (count) => 
        set({ appOpenCountToday: count }),
      
      setLastAppOpenDate: (date) => 
        set({ lastAppOpenDate: date }),
      
      setLastSecretShownDate: (date) => 
        set({ lastSecretShownDate: date }),
      
      // Timer persistence actions
      setActiveTimer: (stepId, practiceIndex, duration) => {
        const endTime = Date.now() + (duration * 1000);
        console.log('[SETTINGS] Setting active timer:', {
          stepId,
          practiceIndex,
          duration,
          endTime
        });
        set({
          activeTimerStepId: stepId,
          activeTimerPracticeIndex: practiceIndex,
          activeTimerEndTime: endTime,
          activeTimerDuration: duration,
          activeTimerIsPaused: false // Reset paused state when starting a new timer
        });
      },
      
      clearActiveTimer: () => {
        console.log('[SETTINGS] Clearing active timer');
        set({
          activeTimerStepId: null,
          activeTimerPracticeIndex: null,
          activeTimerEndTime: null,
          activeTimerDuration: null,
          activeTimerIsPaused: false
        });
      },
      
      updateActiveTimerEndTime: (endTime) => {
        // Ensure we don't lose the step ID when updating the end time
        const currentState = get();
        console.log('[SETTINGS] Updating timer end time:', {
          currentStepId: currentState.activeTimerStepId,
          newEndTime: endTime
        });
        set({ activeTimerEndTime: endTime });
      },
      
      setActiveTimerPaused: (isPaused) => {
        console.log('[SETTINGS] Setting timer paused state:', isPaused);
        set({ activeTimerIsPaused: isPaused });
      },
      
      resetAllChecks: () => 
        set({ practiceChecks: {} }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // When the store is rehydrated from storage, validate the timer state
        console.log('[SETTINGS] Rehydrating store, validating timer state');
        
        if (state) {
          const { 
            activeTimerStepId, 
            activeTimerPracticeIndex, 
            activeTimerEndTime, 
            activeTimerDuration,
            clearActiveTimer
          } = state;
          
          // Check if timer state is valid
          if (!isTimerValid(
            activeTimerStepId, 
            activeTimerPracticeIndex, 
            activeTimerEndTime, 
            activeTimerDuration
          )) {
            console.log('[SETTINGS] Invalid timer state detected on rehydration, clearing timer');
            // Clear the timer state
            state.activeTimerStepId = null;
            state.activeTimerPracticeIndex = null;
            state.activeTimerEndTime = null;
            state.activeTimerDuration = null;
            state.activeTimerIsPaused = false;
          } else {
            console.log('[SETTINGS] Valid timer state found on rehydration');
          }
        }
      }
    }
  )
);
