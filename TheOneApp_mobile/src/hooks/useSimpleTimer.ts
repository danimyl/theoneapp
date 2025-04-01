/**
 * useSimpleTimer Hook
 * 
 * A simple React hook for countdown timers that uses basic React patterns.
 * This hook avoids complex state management and focuses on reliability.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Singleton pattern to ensure only one timer can run at a time
let activeTimerInstance: symbol | null = null;

interface UseSimpleTimerOptions {
  initialDuration?: number;
  onComplete?: () => void;
  hapticFeedback?: boolean;
  keepAwake?: boolean;
}

export function useSimpleTimer({
  initialDuration = 0,
  onComplete = () => {},
  hapticFeedback = false,
  keepAwake = false,
}: UseSimpleTimerOptions = {}) {
  // Create a unique identifier for this timer instance
  const instanceId = useRef(Symbol('timer-instance')).current;
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Refs for internal state that shouldn't trigger re-renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  
  // Try to import haptics and keep-awake modules
  const haptics = useRef<any>(null);
  const keepAwakeModule = useRef<any>(null);
  
  // Initialize modules
  useEffect(() => {
    const initModules = async () => {
      if (hapticFeedback) {
        try {
          haptics.current = await import('expo-haptics');
        } catch (error) {
          console.warn('[TIMER] expo-haptics not available');
        }
      }
      
      if (keepAwake) {
        try {
          keepAwakeModule.current = await import('expo-keep-awake');
        } catch (error) {
          console.warn('[TIMER] expo-keep-awake not available');
        }
      }
    };
    
    initModules();
  }, [hapticFeedback, keepAwake]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clear the active timer instance if this is the active one
      if (activeTimerInstance === instanceId) {
        activeTimerInstance = null;
      }
      
      // Release keep awake
      if (keepAwake && keepAwakeModule.current) {
        keepAwakeModule.current.deactivate();
      }
    };
  }, [instanceId, keepAwake]);
  
  // Start the timer
  const start = useCallback((duration: number) => {
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot start timer, another timer is already running');
      return;
    }
    
    console.log('[TIMER] Starting timer with duration:', duration);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Set the end time
    const now = Date.now();
    endTimeRef.current = now + (duration * 1000);
    
    // Set initial state
    setTimeLeft(duration);
    setIsRunning(true);
    setIsPaused(false);
    
    // Start the interval
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        // Timer complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Clear the active timer instance
        if (activeTimerInstance === instanceId) {
          activeTimerInstance = null;
        }
        
        // Update state
        setIsRunning(false);
        setTimeLeft(0);
        
        // Provide haptic feedback
        if (hapticFeedback && haptics.current) {
          haptics.current.notificationAsync(
            haptics.current.NotificationFeedbackType.Success
          ).catch(() => {});
        }
        
        // Release keep awake
        if (keepAwake && keepAwakeModule.current) {
          keepAwakeModule.current.deactivate();
        }
        
        // Call the onComplete callback
        onComplete();
      }
    }, 500); // Update every 500ms for smoother countdown
  }, [instanceId, keepAwake, onComplete, hapticFeedback]);
  
  // Pause the timer
  const pause = useCallback(() => {
    if (!isRunning || !endTimeRef.current) return;
    
    console.log('[TIMER] Pausing timer');
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Calculate the time remaining
    const now = Date.now();
    const remaining = Math.max(0, endTimeRef.current - now);
    const remainingSeconds = Math.ceil(remaining / 1000);
    
    // Update state
    setTimeLeft(remainingSeconds);
    setIsRunning(false);
    setIsPaused(true);
    
    // Release keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.deactivate();
    }
  }, [isRunning, keepAwake]);
  
  // Resume the timer
  const resume = useCallback(() => {
    if (!isPaused || timeLeft <= 0) return;
    
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot resume timer, another timer is already running');
      return;
    }
    
    console.log('[TIMER] Resuming timer with', timeLeft, 'seconds remaining');
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Set the end time
    const now = Date.now();
    endTimeRef.current = now + (timeLeft * 1000);
    
    // Update state
    setIsRunning(true);
    setIsPaused(false);
    
    // Start the interval
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        // Timer complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Clear the active timer instance
        if (activeTimerInstance === instanceId) {
          activeTimerInstance = null;
        }
        
        // Update state
        setIsRunning(false);
        setTimeLeft(0);
        
        // Provide haptic feedback
        if (hapticFeedback && haptics.current) {
          haptics.current.notificationAsync(
            haptics.current.NotificationFeedbackType.Success
          ).catch(() => {});
        }
        
        // Release keep awake
        if (keepAwake && keepAwakeModule.current) {
          keepAwakeModule.current.deactivate();
        }
        
        // Call the onComplete callback
        onComplete();
      }
    }, 500); // Update every 500ms for smoother countdown
  }, [instanceId, isPaused, timeLeft, keepAwake, onComplete, hapticFeedback]);
  
  // Stop the timer
  const stop = useCallback(() => {
    console.log('[TIMER] Stopping timer');
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear the end time
    endTimeRef.current = null;
    
    // Update state
    setTimeLeft(0);
    setIsRunning(false);
    setIsPaused(false);
    
    // Clear the active timer instance if this is the active one
    if (activeTimerInstance === instanceId) {
      activeTimerInstance = null;
    }
    
    // Release keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.deactivate();
    }
  }, [instanceId, keepAwake]);
  
  // Reset the timer
  const reset = useCallback((newDuration?: number) => {
    console.log('[TIMER] Resetting timer');
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear the end time
    endTimeRef.current = null;
    
    // Update state
    setTimeLeft(newDuration !== undefined ? newDuration : initialDuration);
    setIsRunning(false);
    setIsPaused(false);
    
    // Clear the active timer instance if this is the active one
    if (activeTimerInstance === instanceId) {
      activeTimerInstance = null;
    }
    
    // Release keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.deactivate();
    }
  }, [instanceId, initialDuration, keepAwake]);
  
  // Reset and start in one operation
  const lastResetTimeRef = useRef<number>(0);
  const resetAndStart = useCallback((duration: number) => {
    // Debounce: only allow one call every 1000ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 1000) {
      console.log('[TIMER] Debouncing resetAndStart call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER] Reset and start with duration:', duration);
    
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot reset and start timer, another timer is already running');
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Set the end time
    endTimeRef.current = now + (duration * 1000);
    
    // Set initial state
    setTimeLeft(duration);
    setIsRunning(true);
    setIsPaused(false);
    
    // Start the interval
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      
      const currentTime = Date.now();
      const remaining = Math.max(0, endTimeRef.current - currentTime);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        // Timer complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Clear the active timer instance
        if (activeTimerInstance === instanceId) {
          activeTimerInstance = null;
        }
        
        // Update state
        setIsRunning(false);
        setTimeLeft(0);
        
        // Provide haptic feedback
        if (hapticFeedback && haptics.current) {
          haptics.current.notificationAsync(
            haptics.current.NotificationFeedbackType.Success
          ).catch(() => {});
        }
        
        // Release keep awake
        if (keepAwake && keepAwakeModule.current) {
          keepAwakeModule.current.deactivate();
        }
        
        // Call the onComplete callback
        onComplete();
      }
    }, 500); // Update every 500ms for smoother countdown
  }, [instanceId, keepAwake, onComplete, hapticFeedback]);
  
  // Resume from a specific time
  const resumeFromTime = useCallback((remainingSeconds: number) => {
    // Debounce: only allow one call every 1000ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 1000) {
      console.log('[TIMER] Debouncing resumeFromTime call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER] Resume from time:', remainingSeconds);
    
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER] Cannot resume timer, another timer is already running');
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Set the end time
    endTimeRef.current = now + (remainingSeconds * 1000);
    
    // Set initial state
    setTimeLeft(remainingSeconds);
    setIsRunning(true);
    setIsPaused(false);
    
    // Start the interval
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      
      const currentTime = Date.now();
      const remaining = Math.max(0, endTimeRef.current - currentTime);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        // Timer complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Clear the active timer instance
        if (activeTimerInstance === instanceId) {
          activeTimerInstance = null;
        }
        
        // Update state
        setIsRunning(false);
        setTimeLeft(0);
        
        // Provide haptic feedback
        if (hapticFeedback && haptics.current) {
          haptics.current.notificationAsync(
            haptics.current.NotificationFeedbackType.Success
          ).catch(() => {});
        }
        
        // Release keep awake
        if (keepAwake && keepAwakeModule.current) {
          keepAwakeModule.current.deactivate();
        }
        
        // Call the onComplete callback
        onComplete();
      }
    }, 500); // Update every 500ms for smoother countdown
  }, [instanceId, keepAwake, onComplete, hapticFeedback]);
  
  // Calculate progress (0 to 1)
  const progress = initialDuration > 0 ? 1 - (timeLeft / initialDuration) : 0;
  
  // Set a new duration
  const setDuration = useCallback((newDuration: number) => {
    if (!isRunning) {
      setTimeLeft(newDuration);
    }
  }, [isRunning]);
  
  return {
    timeLeft,
    progress,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
    resetAndStart,
    resumeFromTime,
    setDuration,
  };
}
