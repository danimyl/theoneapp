# Timer Persistence Fixes

## Overview

This document outlines the fixes implemented to address timer persistence issues in the mobile app. The primary issue was that when a timer was paused and the user navigated to a different step, the paused state was not properly preserved, causing the timer to be reset when the user returned to the step.

## Issues Fixed

1. **Paused Timer State Loss**: When a timer was paused and the user navigated to a different step, the paused state was reset, causing the timer to be lost.

2. **Floating Timer Indicator**: The floating timer indicator did not properly show for paused timers on other steps.

3. **Timer State Clearing**: The timer state was being cleared when navigating away from a step with a paused timer.

## Implementation Details

### 1. StepsScreen.tsx Changes

#### Preserving Paused State During Navigation

Modified the `handleStepChange` function to:
- Not reset the paused state when navigating away from a step with a paused timer
- Properly restore the paused state when navigating back to a step with a paused timer

```typescript
// Only reset paused state if we're not navigating away from a paused timer
// This preserves the paused state when navigating between steps
if (!(activeTimerStepId === stepId && activeTimerIsPaused)) {
  setIsPaused(false);
  setActiveTimerPaused(false);
}
```

#### Preventing Timer State Clearing for Paused Timers

Modified the timer state clearing logic to skip clearing the timer state when the timer is paused:

```typescript
// Skip if the timer is paused - we want to preserve the timer state when paused
if (isPaused || activeTimerIsPaused) {
  return;
}
```

### 2. FloatingTimerIndicator.tsx Changes

#### Improved Visibility Logic for Paused Timers

Updated the `shouldBeVisible` function to always show the indicator for paused timers on other steps:

```typescript
// For paused timers, always show the indicator
if (activeTimerIsPaused) {
  return true;
}
```

#### Visual Indication for Paused Timers

Added visual cues to indicate when a timer is paused:
- Changed the icon to a pause icon
- Changed the text to "Paused"
- Changed the background color to orange to match the pause button

```typescript
<MaterialIcons 
  name={activeTimerIsPaused ? "pause" : "timer"} 
  size={24} 
  color="#fff" 
/>
<Text style={styles.stepText}>Step {activeTimerStepId}</Text>
<Text style={styles.timerText}>
  {activeTimerIsPaused ? "Paused" : timeDisplay}
</Text>
```

## Testing

To test these fixes:

1. Start a timer on a step
2. Pause the timer
3. Navigate to a different step
4. Verify that the floating timer indicator shows with a pause icon
5. Navigate back to the original step
6. Verify that the timer is still paused with the correct remaining time
7. Resume the timer and verify it continues from where it was paused

## Future Considerations

- Consider adding a notification when a timer is paused for an extended period
- Add a visual indication in the step selector to show which step has an active or paused timer
- Implement a global timer management system to handle multiple timers across different steps
