/**
 * useTimerEngine Hook
 * 
 * A React hook that provides a timer interface using the TimerEngine class.
 * This hook separates the timer logic from React's rendering cycle to avoid
 * infinite update loops and other issues.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerEngine } from './TimerEngine';

// Singleton pattern to ensure only one timer can run at a time
let activeTimerInstance: symbol | null = null;

interface UseTimerEngineOptions {
  initialDuration?: number;
  onComplete?: () => void;
  hapticFeedback?: boolean;
  keepAwake?: boolean;
}

export function useTimerEngine({
  initialDuration = 0,
  onComplete = () => {},
  hapticFeedback = false,
  keepAwake = false,
}: UseTimerEngineOptions = {}) {
  // Create a unique identifier for this timer instance
  const instanceId = useRef(Symbol('timer-instance')).current;
  
  // Use refs for values that shouldn't trigger re-renders
  const engineRef = useRef<TimerEngine | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const tickIntervalRef = useRef<number>(500); // Update UI every 500ms by default
  
  // State for UI updates
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [progress, setProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
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
          console.warn('[TIMER_ENGINE] expo-haptics not available');
        }
      }
      
      if (keepAwake) {
        try {
          keepAwakeModule.current = await import('expo-keep-awake');
        } catch (error) {
          console.warn('[TIMER_ENGINE] expo-keep-awake not available');
        }
      }
    };
    
    initModules();
  }, [hapticFeedback, keepAwake]);
  
  // Initialize the timer engine
  useEffect(() => {
    // Create the timer engine
    engineRef.current = new TimerEngine(
      // onTick callback - throttle updates to prevent too many re-renders
      (newTimeLeftSeconds, newProgress) => {
        const now = Date.now();
        if (now - lastTickTimeRef.current >= tickIntervalRef.current) {
          setTimeLeft(newTimeLeftSeconds); // Already in seconds
          setProgress(newProgress);
          lastTickTimeRef.current = now;
        }
      },
      // onComplete callback
      () => {
        // Clear the active timer instance
        if (activeTimerInstance === instanceId) {
          activeTimerInstance = null;
        }
        
        // Update state
        setIsRunning(false);
        setIsPaused(false);
        setTimeLeft(0);
        setProgress(1);
        
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
        
        // Call the user's onComplete callback
        onComplete();
      }
    );
    
    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
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
  }, [instanceId, onComplete, hapticFeedback, keepAwake]);
  
  // Start the timer with a new duration
  const start = useCallback((duration: number) => {
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER_ENGINE] Cannot start timer, another timer is already running');
      return;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Start the timer
    if (engineRef.current) {
      engineRef.current.start(duration); // Already in seconds
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [instanceId, keepAwake]);
  
  // Pause the timer
  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsRunning(false);
      setIsPaused(true);
      
      // Release keep awake
      if (keepAwake && keepAwakeModule.current) {
        keepAwakeModule.current.deactivate();
      }
    }
  }, [keepAwake]);
  
  // Resume the timer
  const resume = useCallback(() => {
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER_ENGINE] Cannot resume timer, another timer is already running');
      return;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Resume the timer
    if (engineRef.current) {
      engineRef.current.resume();
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [instanceId, keepAwake]);
  
  // Stop the timer
  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      setTimeLeft(0);
      setProgress(0);
      
      // Clear the active timer instance if this is the active one
      if (activeTimerInstance === instanceId) {
        activeTimerInstance = null;
      }
      
      // Release keep awake
      if (keepAwake && keepAwakeModule.current) {
        keepAwakeModule.current.deactivate();
      }
    }
  }, [instanceId, keepAwake]);
  
  // Reset the timer
  const reset = useCallback((newDuration?: number) => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      setTimeLeft(newDuration || initialDuration);
      setProgress(0);
      
      // Clear the active timer instance if this is the active one
      if (activeTimerInstance === instanceId) {
        activeTimerInstance = null;
      }
      
      // Release keep awake
      if (keepAwake && keepAwakeModule.current) {
        keepAwakeModule.current.deactivate();
      }
    }
  }, [initialDuration, instanceId, keepAwake]);
  
  // Reset and start in one operation
  const lastResetTimeRef = useRef<number>(0);
  const resetAndStart = useCallback((duration: number) => {
    // Debounce: only allow one call every 500ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      console.log('[TIMER_ENGINE] Debouncing resetAndStart call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER_ENGINE] Reset and start with duration:', duration);
    
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER_ENGINE] Cannot reset and start timer, another timer is already running');
      return;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Reset and start the timer
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.start(duration); // Already in seconds
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [instanceId, keepAwake]);
  
  // Resume from a specific time
  const resumeFromTime = useCallback((remainingSeconds: number) => {
    // Debounce: only allow one call every 500ms
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      console.log('[TIMER_ENGINE] Debouncing resumeFromTime call');
      return;
    }
    lastResetTimeRef.current = now;
    
    console.log('[TIMER_ENGINE] Resume from time:', remainingSeconds);
    
    // Check if there's already an active timer
    if (activeTimerInstance !== null && activeTimerInstance !== instanceId) {
      console.log('[TIMER_ENGINE] Cannot resume timer, another timer is already running');
      return;
    }
    
    // Set this as the active timer instance
    activeTimerInstance = instanceId;
    
    // Activate keep awake
    if (keepAwake && keepAwakeModule.current) {
      keepAwakeModule.current.activate();
    }
    
    // Resume from the specified time
    if (engineRef.current) {
      engineRef.current.resumeFromTime(remainingSeconds); // Already in seconds
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [instanceId, keepAwake]);
  
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
