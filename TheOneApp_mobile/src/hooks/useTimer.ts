/**
 * Timer Hook
 * 
 * A custom React hook for managing countdown timers with support for:
 * - Starting, pausing, stopping, and resetting the timer
 * - Background time tracking when app is minimized
 * - Haptic feedback on completion
 * - Screen wake lock during active timers
 * - Progress tracking
 * - Singleton pattern to prevent multiple timers
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Static reference to track the active timer instance
// This ensures only one timer can run at a time across the app
let activeTimerInstance: symbol | null = null;

// Import modules with try/catch to handle potential issues
let KeepAwake: any = { activate: () => {}, deactivate: () => {} };
let Haptics: any = { 
  notificationAsync: () => Promise.resolve(),
  NotificationFeedbackType: { Success: null } 
};

try {
  KeepAwake = require('expo-keep-awake');
} catch (error) {
  console.warn('[TIMER] expo-keep-awake not available');
}

try {
  Haptics = require('expo-haptics');
} catch (error) {
  console.warn('[TIMER] expo-haptics not available');
}

interface UseTimerOptions {
  initialDuration: number;
  onComplete?: () => void;
  hapticFeedback?: boolean;
  keepAwake?: boolean;
}

export function useTimer({
  initialDuration,
  onComplete,
  hapticFeedback = true,
  keepAwake = true,
}: UseTimerOptions) {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Create a unique identifier for this timer instance
  const instanceId = useRef(Symbol('timer-instance')).current;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<Date | null>(null);
  
  // Clean up this timer instance when component unmounts
  useEffect(() => {
    return () => {
      // If this is the active timer, clear the global reference
      if (activeTimerInstance === instanceId) {
        console.log('[TIMER] Unmounting active timer instance, clearing global reference');
        activeTimerInstance = null;
      }
    };
  }, [instanceId]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (isRunning) {
        if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
          // App is going to background
          backgroundTimeRef.current = new Date();
        } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
          // App is coming to foreground
          if (backgroundTimeRef.current) {
            const now = new Date();
            const elapsedSeconds = Math.floor(
              (now.getTime() - backgroundTimeRef.current.getTime()) / 1000
            );
            
            // Update timer based on elapsed time
            setTimeLeft(prev => {
              const newTime = Math.max(0, prev - elapsedSeconds);
              if (newTime === 0 && onComplete) {
                setIsComplete(true);
                setIsRunning(false);
                onComplete();
              }
              return newTime;
            });
            
            backgroundTimeRef.current = null;
          }
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isRunning, onComplete]);

  // Timer logic with more precise timing
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Keep screen awake while timer is running
      if (keepAwake) {
        KeepAwake.activate();
      }
      
      // Record the start time for more accurate timing
      const startTime = Date.now();
      
      timerRef.current = setTimeout(() => {
        // Calculate actual elapsed time (should be close to 1000ms)
        const elapsedTime = Date.now() - startTime;
        
        // Adjust the decrement based on actual elapsed time
        // This helps prevent the timer from running too fast
        const adjustedDecrement = Math.round(elapsedTime / 1000);
        
        setTimeLeft(prev => {
          // Ensure we don't decrement by more than the actual time left
          const newTimeLeft = Math.max(0, prev - adjustedDecrement);
          
          if (newTimeLeft <= 0) {
            // Timer complete
            setIsRunning(false);
            setIsComplete(true);
            
            // Clear the active timer instance if this is the active one
            if (activeTimerInstance === instanceId) {
              console.log('[TIMER] Timer completed, clearing active instance');
              activeTimerInstance = null;
            }
            
            // Provide haptic feedback on completion
            if (hapticFeedback) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch(() => {});
            }
            
            // Call onComplete callback
            if (onComplete) {
              onComplete();
            }
            
            // Release keep awake
            if (keepAwake) {
              KeepAwake.deactivate();
            }
            
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000); // Still aim for 1 second intervals
    } else if (!isRunning && keepAwake) {
      // Release keep awake when timer is not running
      KeepAwake.deactivate();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timeLeft, onComplete, hapticFeedback, keepAwake]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (keepAwake) {
        KeepAwake.deactivate();
      }
    };
  }, [keepAwake]);

  // Start the timer
  const start = () => {
    // Check both timeLeft and duration to ensure we have a valid time
    if (timeLeft > 0 || duration > 0) {
      // If there's already an active timer that's not this one, don't start
      if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
        console.log('[TIMER] Cannot start timer, another timer is already running');
        return;
      }
      
      // If timeLeft is 0 but duration is set, use duration as a fallback
      if (timeLeft === 0 && duration > 0) {
        setTimeLeft(duration);
      }
      
      // Set this as the active timer instance
      activeTimerInstance = instanceId;
      console.log('[TIMER] Starting timer, setting as active instance');
      
      setIsRunning(true);
      setIsComplete(false);
    }
  };

  // Pause the timer
  const pause = () => {
    if (isRunning) {
      console.log('[TIMER] Pausing timer');
      setIsRunning(false);
      // Keep this as the active instance so it can be resumed
    }
  };

  // Stop the timer and reset to 0
  const stop = () => {
    console.log('[TIMER] Stopping timer');
    setIsRunning(false);
    setTimeLeft(0);
    setIsComplete(false);
    
    // Clear the active timer instance if this is the active one
    if (activeTimerInstance === instanceId) {
      console.log('[TIMER] Clearing active timer instance');
      activeTimerInstance = null;
    }
  };

  // Reset the timer to initial or specified duration
  const reset = (newDuration?: number) => {
    console.log('[TIMER] Resetting timer');
    setIsRunning(false);
    const resetDuration = newDuration !== undefined ? newDuration : duration;
    setTimeLeft(resetDuration);
    setIsComplete(false);
    
    // Clear the active timer instance if this is the active one
    if (activeTimerInstance === instanceId) {
      console.log('[TIMER] Clearing active timer instance on reset');
      activeTimerInstance = null;
    }
  };

  // Reset and start in one operation to avoid timing issues
  // Using a debounce mechanism to prevent rapid consecutive calls
  const lastResetTimeRef = useRef<number>(0);
  const resetAndStart = (newDuration: number) => {
    // Debounce: only allow one call every 500ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      console.log('[TIMER] Debouncing resetAndStart call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER] Reset and start with duration:', newDuration);
    
    // If there's already an active timer that's not this one, don't start
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot reset and start timer, another timer is already running');
      return;
    }
    
    // First stop any running timer
    if (isRunning) {
      setIsRunning(false);
    }
    
    // Set the duration and timeLeft
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsComplete(false);
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    console.log('[TIMER] Setting as active instance');
    
    // Start the timer immediately, but use setTimeout to break the render cycle
    setTimeout(() => {
      setIsRunning(true);
    }, 0);
  };
  
  // Resume timer from a specific time value
  // Using the same debounce mechanism as resetAndStart
  const resumeFromTime = (remainingTime: number) => {
    // Debounce: only allow one call every 500ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      console.log('[TIMER] Debouncing resumeFromTime call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER] Resume from time:', remainingTime);
    
    // If there's already an active timer that's not this one, don't resume
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot resume timer, another timer is already running');
      return;
    }
    
    // First stop any running timer
    if (isRunning) {
      setIsRunning(false);
    }
    
    // Set the timeLeft directly
    setTimeLeft(remainingTime);
    setIsComplete(false);
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    console.log('[TIMER] Setting as active instance for resume');
    
    // Start the timer immediately, but use setTimeout to break the render cycle
    setTimeout(() => {
      setIsRunning(true);
    }, 0);
  };

  return {
    timeLeft,
    isRunning,
    isComplete,
    progress: 1 - timeLeft / (duration || 1), // Avoid division by zero
    start,
    pause,
    stop,
    reset,
    resetAndStart,
    resumeFromTime,
    setDuration: (newDuration: number) => {
      setDuration(newDuration);
      if (!isRunning) {
        setTimeLeft(newDuration);
      }
    },
  };
}
