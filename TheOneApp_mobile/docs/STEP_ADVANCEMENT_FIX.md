# Step Advancement Fix

## Problem

The daily step advancement feature was not working correctly in the mobile app. The app was stuck on step 10 from several days ago, and the automatic advancement at 3:00 AM was not happening.

## Root Cause

The issue was related to date handling and comparison in the step advancement logic:

1. **Date String Format Issues**: The app was using date strings (e.g., "2025-03-31") for date storage and comparison, which can be problematic due to:
   - Inconsistent formatting
   - Timezone differences
   - String comparison issues

2. **Date Comparison Logic**: The comparison between the current date and the last advancement check date was using string equality, which is fragile and prone to errors.

## Solution

The solution was to switch to using epoch timestamps (milliseconds since 1970) for all date handling:

1. **Timestamp-Based Date Storage**:
   - Store dates as timestamp strings in AsyncStorage
   - Parse timestamps to Date objects for comparison
   - Use midnight timestamps to eliminate time component issues

2. **Robust Date Comparison**:
   - Compare dates using numeric timestamp values
   - Calculate days difference using proper date math
   - Normalize dates to midnight to ensure consistent comparison

3. **Improved Logging**:
   - Added detailed logging to track the advancement process
   - Log key values like current step, timestamps, and calculation results
   - This helps with debugging and understanding the advancement logic

4. **Timestamp Validation and Fallback** (Added April 1, 2025):
   - Added validation to ensure timestamps are within a reasonable range
   - Implemented fallback logic to handle invalid timestamps
   - Prevents the "20,000+ days" issue when comparing to epoch 0
   - Automatically repairs invalid timestamp values in storage

## Implementation Details

### 1. Updated `settingsStore.ts`

Modified the store to handle timestamp strings instead of date strings:

```typescript
interface SettingsState {
  // Daily advancement tracking
  currentStepId: number;
  startDate: string | null; // Now stores timestamp as string
  lastAdvancementCheck: string | null; // Now stores timestamp as string
  
  // Other properties...
}
```

### 2. Rewrote `checkAndAdvanceStep` function in `StepsScreen.tsx`

The new implementation:

```typescript
const checkAndAdvanceStep = () => {
  try {
    // Get current date and time
    const now = new Date();
    
    // Create a date object for today at midnight (no time component)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTimestamp = today.getTime();
    
    // Log for debugging
    console.log('[STEPS] Checking advancement:', {
      currentStepId,
      lastAdvancementCheck,
      todayTimestamp,
      hour: now.getHours()
    });
    
    // If first time using the app, set up initial state
    if (!startDate) {
      setStartDate(todayTimestamp.toString());
      setCurrentStepId(1);
      setLastAdvancementCheck(todayTimestamp.toString());
      console.log('[STEPS] First time setup complete');
      return;
    }
    
    // Parse the last advancement check timestamp
    const lastCheckTimestamp = parseInt(lastAdvancementCheck || '0', 10);
    
    // Create a date object for the last check (at midnight)
    const lastCheckDate = new Date(lastCheckTimestamp);
    const lastCheckDay = new Date(
      lastCheckDate.getFullYear(),
      lastCheckDate.getMonth(),
      lastCheckDate.getDate()
    );
    
    // Check if it's past 3:00 AM and we haven't checked today
    if (now.getHours() >= 3 && todayTimestamp > lastCheckDay.getTime()) {
      // Calculate days since last check
      const daysSinceLastCheck = Math.floor(
        (todayTimestamp - lastCheckDay.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      console.log('[STEPS] Days since last check:', daysSinceLastCheck);
      
      if (daysSinceLastCheck > 0) {
        // Advance step by the number of days passed, but don't exceed MAX_STEP_ID
        const newStepId = Math.min(currentStepId + daysSinceLastCheck, MAX_STEP_ID);
        
        console.log('[STEPS] Advancing step:', {
          from: currentStepId,
          to: newStepId,
          days: daysSinceLastCheck
        });
        
        setCurrentStepId(newStepId);
        setLastAdvancementCheck(todayTimestamp.toString());
        
        // If we're viewing the current step, update the view
        if (stepId === currentStepId) {
          setStepId(newStepId);
        }
        
        // Show notification to user
        Alert.alert(
          "Step Advanced",
          `You've advanced to Step ${newStepId}.`,
          [{ text: "OK" }]
        );
      } else {
        // Just update the last check date
        console.log('[STEPS] Updating last check date without advancing');
        setLastAdvancementCheck(todayTimestamp.toString());
      }
    } else {
      console.log('[STEPS] No advancement needed:', {
        isPastThreeAM: now.getHours() >= 3,
        isSameDay: todayTimestamp <= lastCheckDay.getTime()
      });
    }
  } catch (err) {
    console.error('[STEPS] Error in daily advancement check:', err);
  }
};
```

### 3. Updated `handleStartPractices` function

Modified to use timestamp-based date storage:

```typescript
// If this is the first time starting practices, set the start date
if (!startDate) {
  // Create a date object for today at midnight (no time component)
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayTimestamp = todayMidnight.getTime();
  
  console.log('[STEPS] Setting initial dates with timestamp:', todayTimestamp);
  setStartDate(todayTimestamp.toString());
  setLastAdvancementCheck(todayTimestamp.toString());
}
```

### 4. Added Timestamp Validation and Fallback Logic

Added validation to ensure timestamps are within a reasonable range and implemented fallback logic:

```typescript
// Parse the last advancement check timestamp with better fallback
let lastCheckTimestamp;
try {
  // Try to parse the stored timestamp
  lastCheckTimestamp = parseInt(lastAdvancementCheck || '0', 10);
  
  // Validate the timestamp is reasonable (not before 2020)
  const minValidTimestamp = new Date(2020, 0, 1).getTime();
  if (lastCheckTimestamp < minValidTimestamp) {
    console.warn('[STEPS] Invalid lastAdvancementCheck timestamp:', lastCheckTimestamp);
    // Use startDate as fallback if available, otherwise use today
    lastCheckTimestamp = startDate ? parseInt(startDate, 10) : todayTimestamp;
    
    // Update the stored value to prevent future issues
    setLastAdvancementCheck(lastCheckTimestamp.toString());
    
    console.log('[STEPS] Using fallback timestamp:', lastCheckTimestamp);
  }
} catch (err) {
  console.error('[STEPS] Error parsing lastAdvancementCheck:', err);
  // Use today's timestamp as fallback
  lastCheckTimestamp = todayTimestamp;
  
  // Update the stored value to prevent future issues
  setLastAdvancementCheck(todayTimestamp.toString());
}

// Added additional logging to help with debugging
console.log('[STEPS] Last check date:', {
  timestamp: lastCheckTimestamp,
  date: lastCheckDay.toISOString().split('T')[0]
});
```

### 5. Changed Check Interval

Changed the check interval from every minute to every hour for better efficiency:

```typescript
// Set up interval to check again if app remains open
const checkTimer = setInterval(() => {
  checkAndAdvanceStep();
  checkHourlyNotification();
}, 3600000); // Check every hour instead of every minute
```

## Testing

The fix has been tested by:

1. Verifying that the app correctly identifies the current date
2. Checking that the advancement logic correctly calculates days difference
3. Confirming that the step advances when the conditions are met
4. Ensuring that the advancement state is properly saved to AsyncStorage

## Conclusion

By switching to epoch timestamps for date handling, we've made the step advancement logic more robust and reliable. The key improvements are:

1. **Consistent Date Representation**: Using timestamps eliminates formatting and timezone issues
2. **Accurate Date Comparison**: Comparing numeric values is more reliable than string comparison
3. **Better Debugging**: Detailed logging helps identify and fix any remaining issues

These changes ensure that the step advancement feature works correctly and reliably, advancing the step every day at 3:00 AM as intended.
