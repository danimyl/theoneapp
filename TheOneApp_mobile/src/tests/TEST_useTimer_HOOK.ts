/**
 * TEST FILE: Timer Hook for Testing
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

// Import modules with try/catch to handle potential issues
let KeepAwake: any = { activate: () => {}, deactivate: () => {} };
let Haptics: any = { 
  notificationAsync: () => Promise.resolve(),
  NotificationFeedbackType: { Success: null } 
};

try {
  KeepAwake = require('expo-keep-awake');
} catch (error) {
  console.warn('[TEST_TIMER] expo-keep-awake not available:', error);
}

try {
  Haptics = require('expo-haptics');
} catch (error) {
  console.warn('[TEST_TIMER] expo-haptics not available:', error);
}

interface UseTimerOptions {
  initialDuration: number;
  onComplete?: () => void;
  hapticFeedback?: boolean;
  keepAwake?: boolean;
}

export function useTestTimer({
  initialDuration,
  onComplete,
  hapticFeedback = true,
  keepAwake = true,
}: UseTimerOptions) {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<Date | null>(null);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (isRunning) {
        if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
          // App is going to background
          backgroundTimeRef.current = new Date();
          console.log('[TEST_TIMER] App going to background, saving time');
        } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
          // App is coming to foreground
          if (backgroundTimeRef.current) {
            const now = new Date();
            const elapsedSeconds = Math.floor(
              (now.getTime() - backgroundTimeRef.current.getTime()) / 1000
            );
            
            console.log(`[TEST_TIMER] App returning to foreground, ${elapsedSeconds}s elapsed`);
            
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

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Keep screen awake while timer is running
      if (keepAwake) {
        KeepAwake.activate();
      }
      
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer complete
            setIsRunning(false);
            setIsComplete(true);
            
            // Provide haptic feedback on completion
            if (hapticFeedback) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch((err: Error) => console.log('[TEST_TIMER] Haptic error:', err));
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
          return prev - 1;
        });
      }, 1000);
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
    console.log('[TEST_TIMER_HOOK] start() called, timeLeft:', timeLeft, 'isRunning:', isRunning, 'duration:', duration);
    // Check both timeLeft and duration to ensure we have a valid time
    if (timeLeft > 0 || duration > 0) {
      // If timeLeft is 0 but duration is set, use duration as a fallback
      if (timeLeft === 0 && duration > 0) {
        console.log('[TEST_TIMER_HOOK] timeLeft is 0, using duration as fallback:', duration);
        setTimeLeft(duration);
      }
      setIsRunning(true);
      setIsComplete(false);
      console.log('[TEST_TIMER_HOOK] Timer started, isRunning set to true');
    } else {
      console.log('[TEST_TIMER_HOOK] Cannot start timer, both timeLeft and duration are 0');
    }
  };

  // Pause the timer
  const pause = () => {
    console.log('[TEST_TIMER_HOOK] pause() called, isRunning:', isRunning);
    if (isRunning) {
      setIsRunning(false);
      console.log('[TEST_TIMER_HOOK] Timer paused, isRunning set to false');
    } else {
      console.log('[TEST_TIMER_HOOK] Cannot pause timer, not running');
    }
  };

  // Stop the timer and reset to 0
  const stop = () => {
    console.log('[TEST_TIMER_HOOK] stop() called, isRunning:', isRunning, 'timeLeft:', timeLeft);
    setIsRunning(false);
    setTimeLeft(0);
    setIsComplete(false);
    console.log('[TEST_TIMER_HOOK] Timer stopped, isRunning set to false, timeLeft set to 0');
  };

  // Reset the timer to initial or specified duration
  const reset = (newDuration?: number) => {
    console.log('[TEST_TIMER_HOOK] reset() called, newDuration:', newDuration, 'duration:', duration);
    setIsRunning(false);
    const resetDuration = newDuration !== undefined ? newDuration : duration;
    setTimeLeft(resetDuration);
    setIsComplete(false);
    console.log('[TEST_TIMER_HOOK] Timer reset, timeLeft set to:', resetDuration);
  };

  // Reset and start in one operation to avoid timing issues
  const resetAndStart = (newDuration: number) => {
    console.log('[TEST_TIMER_HOOK] resetAndStart() called with duration:', newDuration);
    // First stop any running timer
    if (isRunning) {
      setIsRunning(false);
    }
    
    // Set the duration and timeLeft
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsComplete(false);
    
    // Start the timer immediately
    setIsRunning(true);
    console.log('[TEST_TIMER_HOOK] Timer reset and started with duration:', newDuration);
  };
  
  // Resume timer from a specific time value
  const resumeFromTime = (remainingTime: number) => {
    console.log('[TEST_TIMER_HOOK] resumeFromTime() called with remainingTime:', remainingTime);
    // First stop any running timer
    if (isRunning) {
      setIsRunning(false);
    }
    
    // Set the timeLeft directly
    setTimeLeft(remainingTime);
    setIsComplete(false);
    
    // Start the timer immediately
    setIsRunning(true);
    console.log('[TEST_TIMER_HOOK] Timer resumed from time:', remainingTime);
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
    resetAndStart, // New combined function
    resumeFromTime, // Function to resume from a specific time
    setDuration: (newDuration: number) => {
      console.log('[TEST_TIMER_HOOK] setDuration() called, newDuration:', newDuration, 'isRunning:', isRunning);
      setDuration(newDuration);
      if (!isRunning) {
        setTimeLeft(newDuration);
        console.log('[TEST_TIMER_HOOK] timeLeft updated to:', newDuration);
      } else {
        console.log('[TEST_TIMER_HOOK] Timer running, timeLeft not updated');
      }
    },
  };
}
