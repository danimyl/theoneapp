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
    }),
    {
      name: 'settings-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useSettingsStore;
