# Test Files Manifest

This document lists all the test files created for validating React Native functionality.

## Created: 3/26/2025

These files are temporary and should be removed after the full migration is complete.

## Test Files

| File | Purpose |
|------|---------|
| `TEST_steps_data.ts` | Contains sample step data for testing the timer functionality |
| `TEST_settingsStore_TIMER.ts` | Zustand store for persisting timer settings with AsyncStorage |
| `TEST_useTimer_HOOK.ts` | Custom hook for timer functionality with background handling |
| `TEST_StepDisplay_TIMER.tsx` | Component that implements the timer UI and functionality |
| `TEST_TimerScreen.tsx` | Screen component that integrates the test component into navigation |
| `TEST_expo_types.d.ts` | Type declarations for Expo modules used in testing |
| `TEST_expo_av_types.d.ts` | Type declarations for Expo AV module used for sound playback |

## How to Use

1. The test files are integrated into the app's navigation in `App.tsx`
2. The timer functionality can be tested by:
   - Starting/pausing/stopping the timer
   - Checking/unchecking practices
   - Switching between steps
   - Testing persistence between app restarts
   - Testing background behavior

## Cleanup

When the full migration is complete, search for files with the `TEST_` prefix and remove them from the project.
