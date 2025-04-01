# Timer Persistence Across Steps

## Overview

This feature allows the practice timer to continue running when a user navigates between different steps. Previously, changing steps would stop any active timer, interrupting the practice session. Now, users can browse other steps while a timer is running, with a visual indicator showing which step has an active timer.

## Implementation Details

### 1. Global Timer State

The timer state is now stored globally in the `settingsStore` with these properties:

- `activeTimerStepId`: The step ID that has an active timer
- `activeTimerPracticeIndex`: The practice index within that step
- `activeTimerEndTime`: Timestamp when the timer will end
- `activeTimerDuration`: Original duration in seconds

### 2. Timer Persistence Actions

New actions were added to the store:

- `setActiveTimer`: Sets the active timer information
- `clearActiveTimer`: Clears the active timer state
- `updateActiveTimerEndTime`: Updates the end time when the timer is paused/resumed

### 3. Floating Timer Indicator

A new component `FloatingTimerIndicator` displays when viewing a different step than the one with the active timer. It shows:

- Which step has an active timer
- The practice name
- Remaining time
- Quick actions (go to active step, stop timer)

### 4. Modified Step Navigation

The `handleStepChange` function was updated to:
- Not stop the timer when changing steps
- Only reset local state if not on the active timer step

### 5. Timer State Synchronization

Several effects were added to:
- Update the global timer state when a timer starts
- Update the end time when the timer is running
- Clear the global state when the timer completes or is stopped
- Check for an active timer when loading the component

## User Experience

Users will now see:

1. **Continuous Timing**: The timer continues to run when navigating between steps
2. **Visual Indicator**: A floating indicator appears when viewing other steps
3. **Quick Navigation**: Easy access to return to the active timer step
4. **Timer Control**: Ability to stop the timer from any step

## Technical Notes

- The timer state is persisted using Zustand's persist middleware
- Time calculations account for background time using timestamps
- The floating indicator uses animation for better visibility
- Timer state is synchronized across component instances

## Testing

To test this feature:

1. Start a timer on any step
2. Navigate to a different step
3. Verify the floating indicator appears
4. Navigate back to the original step
5. Verify the timer is still running
6. Try stopping the timer from a different step
7. Verify the timer stops and the indicator disappears
