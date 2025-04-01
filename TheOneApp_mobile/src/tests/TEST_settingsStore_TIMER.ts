/**
 * TEST FILE: Settings Store for Timer Testing
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestPracticeChecks {
  [stepId: number]: boolean[];
}

interface TestSettingsState {
  // Timer-related settings
  practiceChecks: TestPracticeChecks;
  lastPracticeStartDate: string | null;
  
  // Daily advancement tracking
  currentStepId: number;
  startDate: string | null;
  lastAdvancementCheck: string | null;
  
  // Notification settings
  alwaysHourlyReminders: boolean;
  sleepStart: string; // Format: "22:00" (10:00 PM)
  sleepEnd: string;   // Format: "07:00" (7:00 AM)
  
  // Actions
  setPracticeChecks: (stepId: number, checks: boolean[]) => void;
  setLastPracticeStartDate: (date: string | null) => void;
  setCurrentStepId: (stepId: number) => void;
  setStartDate: (date: string) => void;
  setLastAdvancementCheck: (date: string) => void;
  setAlwaysHourlyReminders: (value: boolean) => void;
  setSleepStart: (time: string) => void;
  setSleepEnd: (time: string) => void;
  
  // For testing persistence
  resetAllChecks: () => void;
}

export const useTestSettingsStore = create<TestSettingsState>()(
  persist(
    (set) => ({
      // Initial state
      practiceChecks: {},
      lastPracticeStartDate: null,
      currentStepId: 1,
      startDate: null,
      lastAdvancementCheck: null,
      
      // Notification settings with defaults
      alwaysHourlyReminders: false,
      sleepStart: "22:00", // Default sleep start time (10:00 PM)
      sleepEnd: "07:00",   // Default sleep end time (7:00 AM)
      
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
      
      resetAllChecks: () => 
        set({ practiceChecks: {} }),
    }),
    {
      name: 'test-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
