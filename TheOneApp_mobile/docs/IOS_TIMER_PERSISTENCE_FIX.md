# iOS Timer Persistence Fix

## Overview

This document outlines the platform-specific fix implemented to address timer persistence issues on iOS devices. The issue was that when using the timer across step changes on iOS, the timer state was being cleared prematurely, preventing the timer from persisting when navigating between steps.

## Problem Description

On iOS devices, the timer state was being cleared immediately after starting or shortly after navigating between steps. This was happening because:

1. The timer would start correctly
2. The timer state would be saved to the global store
3. Almost immediately, the effect responsible for clearing the timer would detect that the timer was not running (due to a race condition) and clear the global timer state
4. When navigating back to the original step, there would be no timer state to restore

This issue did not occur on Android devices, so the fix needed to be platform-specific to avoid disrupting the working Android functionality.

## Implementation Details

The fix implements a platform-specific approach using React Native's `Platform.OS` detection:

### 1. Timer Start Time Tracking

Added a reference to track when the timer was started:

```typescript
// Reference to track when the timer started (for iOS)
const timerStartTimeRef = useRef<number>(0);
```

### 2. Recording Timer Start Time on iOS

When a timer is started or resumed on iOS, we record the current timestamp:

```typescript
// Record the timer start time for iOS
if (Platform.OS === 'ios') {
  timerStartTimeRef.current = Date.now();
  console.log('[STEPS] iOS: Recording timer start time:', timerStartTimeRef.current);
}
```

### 3. Platform-Specific Timer Clearing Logic

Modified the timer clearing effect to have different behavior on iOS:

```typescript
// Platform-specific handling
if (Platform.OS === 'ios') {
  // iOS-specific code path with additional safeguards
  if (!isRunning && activeTimerStepId === stepId) {
    // Add debounce and validation for iOS
    const now = Date.now();
    const timerStartTime = timerStartTimeRef.current || 0;
    const timeSinceStart = now - timerStartTime;
    const hasRunLongEnough = timeSinceStart > 1000; // 1 second minimum
    
    if (hasRunLongEnough) {
      console.log('[STEPS] iOS: Timer stopped and ran long enough, clearing global timer state');
      clearActiveTimer();
    } else {
      console.log('[STEPS] iOS: Timer stopped too soon, preserving timer state');
      // Don't clear the timer state on iOS if it hasn't run long enough
    }
  }
} else {
  // Original Android code path - unchanged
  if (!isRunning && activeTimerStepId === stepId) {
    console.log('[STEPS] Timer stopped, clearing global timer state');
    clearActiveTimer();
  }
}
```

### Key Aspects of the Fix:

1. **Minimum Runtime Check**: On iOS, we only clear the timer state if the timer has been running for at least 1 second. This prevents premature clearing due to race conditions.

2. **Preserved Android Behavior**: The original code path for Android remains unchanged, ensuring we don't disrupt the working functionality.

3. **Enhanced Logging**: Added platform-specific logging to help track and debug iOS-specific behavior.

4. **Timer Resume Handling**: When resuming a paused timer on iOS, we also update the timer start time to ensure accurate runtime tracking.

## Testing

To test this fix:

1. Start a timer on any step on an iOS device
2. Navigate to a different step
3. Verify the floating indicator appears
4. Navigate back to the original step
5. Verify the timer is still running
6. Try pausing the timer, navigating away, and then returning
7. Verify the timer remains paused with the correct remaining time

## Future Considerations

- If additional iOS-specific timer issues are discovered, consider implementing a more comprehensive platform-specific timer management system.
- Monitor for any performance impacts of the additional checks on iOS.
- Consider adding more sophisticated debouncing if needed.
