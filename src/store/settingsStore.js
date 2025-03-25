import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      alwaysHourlyReminders: false,
      setAlwaysHourlyReminders: (value) =>
        set({ alwaysHourlyReminders: value }),
      sleepStart: "22:00", // Default sleep start time (10:00 PM)
      setSleepStart: (time) => set({ sleepStart: time }),
      sleepEnd: "07:00", // Default sleep end time (7:00 AM)
      setSleepEnd: (time) => set({ sleepEnd: time }),
      stepForToday: null,
      setStepForToday: (stepId) => set({ stepForToday: stepId }),
      practiceChecks: {}, // Object to store checkbox states for each step
      setPracticeChecks: (stepId, checks) =>
        set((state) => ({
          practiceChecks: {
            ...state.practiceChecks,
            [stepId]: checks,
          },
        })),
      lastPracticeStartDate: null, // Date when practice was last started (for daily reminder)
      setLastPracticeStartDate: (date) => set({ lastPracticeStartDate: date }),
      lastStepAdvanceDate: null, // Date when step was last advanced
      setLastStepAdvanceDate: (date) => set({ lastStepAdvanceDate: date }),
      lastSecretShownDate: null, // Date when secret modal was last shown
      setLastSecretShownDate: (date) => set({ lastSecretShownDate: date }),
      theme: 'dark', // Default theme is dark
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useSettingsStore;
