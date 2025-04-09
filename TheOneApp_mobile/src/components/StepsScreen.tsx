/**
 * Steps Screen
 * 
 * Main screen for displaying and interacting with steps.
 * Features:
 * - Step selection and navigation
 * - Step instructions display
 * - Practice timer with start, pause, and stop controls
 * - Practice completion tracking
 * - Hourly notification indicator
 * - Daily step advancement
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSimpleTimer } from '../hooks/useSimpleTimer';
import { useSettingsStore } from '../store/settingsStore';
import stepService, { Step } from '../services/stepService';
import { StepSelector } from './StepSelector';
import FloatingTimerIndicator from './FloatingTimerIndicator';
import notificationService from '../services/notificationService';

// Maximum step ID for advancement
const MAX_STEP_ID = 365; // Assuming 365 steps maximum

// Get screen dimensions for responsive layout
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate practice item height (for 3 items plus padding)
const PRACTICE_ITEM_HEIGHT = 45; // Height of a single practice item
const PRACTICE_CONTROLS_HEIGHT = 90; // Height of timer controls
const PRACTICE_CONTAINER_HEIGHT = (PRACTICE_ITEM_HEIGHT * 3) + PRACTICE_CONTROLS_HEIGHT;

// Steps screen with practices
const StepsScreen = () => {
  const { theme, isDark } = useTheme();
  
  // Refs to track loading state
  const initialLoadDoneRef = useRef(false);
  const lastLoadedStepIdRef = useRef<number | null>(null);
  
  // Get store access
  const { 
    practiceChecks, 
    setPracticeChecks, 
    setLastPracticeStartDate,
    currentStepId,
    startDate,
    lastAdvancementCheck,
    setCurrentStepId,
    setStartDate,
    setLastAdvancementCheck,
    // Timer persistence
    activeTimerStepId,
    activeTimerPracticeIndex,
    activeTimerEndTime,
    activeTimerDuration,
    activeTimerIsPaused,
    setActiveTimer,
    clearActiveTimer,
    updateActiveTimerEndTime,
    setActiveTimerPaused
  } = useSettingsStore();
  
  // Initialize with today's step, fallback to step 1
  const [stepId, setStepId] = useState<number>(currentStepId || 1);
  const [step, setStep] = useState<Step | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean[]>([]);
  
  // Track if the timer is paused (vs. stopped completely)
  const [isPaused, setIsPaused] = useState(false);
  
  // Store the remaining time when the timer is paused
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number>(0);
  
  // Forward reference for handleTimerComplete
  const handleTimerCompleteRef = useRef<() => void>(() => {});
  
  // Initialize timer hook with onComplete callback
  const {
    timeLeft,
    isRunning,
    progress,
    start,
    pause,
    reset,
    stop,
    resetAndStart,
    resumeFromTime,
    setDuration
  } = useSimpleTimer({
    initialDuration: 0,
    onComplete: () => handleTimerCompleteRef.current(),
    hapticFeedback: false, // Disable for now
    keepAwake: false, // Disable for web compatibility
  });
  
  // Check for daily advancement using epoch timestamps
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
      
      // Ensure currentStepId is valid
      if (!currentStepId || currentStepId < 1 || currentStepId > MAX_STEP_ID) {
        console.warn('[STEPS] Invalid currentStepId:', currentStepId);
        setCurrentStepId(1);
        setLastAdvancementCheck(todayTimestamp.toString());
        return;
      }
      
      // Parse the last advancement check timestamp with better fallback
      let lastCheckTimestamp;
      try {
        // Try to parse the stored timestamp
        lastCheckTimestamp = parseInt(lastAdvancementCheck || '0', 10);
        
        // Validate the timestamp is reasonable (not before 2020)
        const minValidTimestamp = new Date(2020, 0, 1).getTime();
        if (lastCheckTimestamp < minValidTimestamp || isNaN(lastCheckTimestamp)) {
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
      
      // Create a date object for the last check (at midnight)
      const lastCheckDate = new Date(lastCheckTimestamp);
      const lastCheckDay = new Date(
        lastCheckDate.getFullYear(),
        lastCheckDate.getMonth(),
        lastCheckDate.getDate()
      );
      
      console.log('[STEPS] Last check date:', {
        timestamp: lastCheckTimestamp,
        date: lastCheckDay.toISOString().split('T')[0]
      });
      
      // Check if it's past 3:00 AM and we haven't checked today
      if (now.getHours() >= 3 && todayTimestamp > lastCheckDay.getTime()) {
        // Calculate days since last check
        const daysSinceLastCheck = Math.floor(
          (todayTimestamp - lastCheckDay.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        console.log('[STEPS] Days since last check:', daysSinceLastCheck);
        
        if (daysSinceLastCheck > 0) {
          // Only advance by 1 step per day, regardless of days missed
          // This prevents large jumps in step numbers
          const newStepId = Math.min(currentStepId + 1, MAX_STEP_ID);
          
          console.log('[STEPS] Advancing step:', {
            from: currentStepId,
            to: newStepId,
            daysSinceLastCheck
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
  
  // Reference to track last hourly notification
  const lastHourlyNotificationRef = useRef<string | null>(null);
  
  // Check for hourly notifications
  const checkHourlyNotification = () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Only send hourly notifications exactly at xx:00
      if (currentMinute === 0) {
        // Create a key for the current hour
        const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentHour}`;
        
        // If we've already sent a notification for this hour, don't send another
        if (lastHourlyNotificationRef.current === hourKey) {
          return;
        }
        
        // Get the current step
        if (currentStepId) {
          const currentStep = stepService.getStepById(currentStepId);
          
          // Get the alwaysHourlyReminders setting
          const { alwaysHourlyReminders } = useSettingsStore.getState();
          
          // Send notification if step has hourly:true or alwaysHourlyReminders is true
          if (currentStep && (currentStep.hourly || alwaysHourlyReminders)) {
            notificationService.sendHourlyReminder(
              currentStep.id,
              currentStep.title
            );
            
            // Update the last notification hour
            lastHourlyNotificationRef.current = hourKey;
          }
        }
      }
    } catch (error) {
      console.error('[STEPS] Error checking hourly notification:', error);
    }
  };
  
  // Keep stepId in sync with currentStepId from store
  useEffect(() => {
    if (currentStepId) {
      setStepId(currentStepId);
    }
  }, [currentStepId]);
  
  // Check for advancement and hourly notifications when component mounts
  useEffect(() => {
    // Check for advancement on mount
    checkAndAdvanceStep();
    
    // Check for hourly notification on mount
    checkHourlyNotification();
    
    // Set up interval to check again if app remains open
    const checkTimer = setInterval(() => {
      checkAndAdvanceStep();
      checkHourlyNotification();
    }, 3600000); // Check every hour instead of every minute for better efficiency
    
    return () => clearInterval(checkTimer);
  }, []);
  
  // Load initial step
  useEffect(() => {
    const loadStep = async () => {
      try {
        const loadedStep = stepService.getStepById(stepId);
        if (loadedStep) {
          setStep(loadedStep);
        }
      } catch (error) {
        console.error('[STEPS] Error loading step:', error);
      }
    };
    
    loadStep();
  }, [stepId]);
  
  // Handle step change
  const handleStepChange = (newStepId: number) => {
    console.log('[STEPS] Handling step change from', stepId, 'to', newStepId);
    
    // If we're on a step with an active timer and navigating away, stop the local timer
    // but keep the global timer state
    if (isRunning) {
      console.log('[STEPS] Stopping local timer without clearing global timer state');
      // Just stop the local timer without clearing the global timer state
      stop();
    }
    
    // If we're navigating to a step with an active timer, prepare to restore it
    if (newStepId === activeTimerStepId && activeTimerEndTime !== null) {
      console.log('[STEPS] Navigating to step with active timer, will restore timer');
      
      // Calculate remaining time
      const now = Date.now();
      const remainingMs = Math.max(0, activeTimerEndTime - now);
      const remainingSecs = Math.floor(remainingMs / 1000);
      
      console.log('[STEPS] Timer restoration data:', {
        activeTimerStepId,
        activeTimerEndTime,
        now,
        remainingMs,
        remainingSecs,
        isPaused: activeTimerIsPaused
      });
      
      // Only restore if there's meaningful time left
      if (remainingSecs > 1 && activeTimerPracticeIndex !== null) {
        // Set the restoration flag to prevent other timer operations
        // IMPORTANT: Set this flag BEFORE changing currentIndex to prevent auto-start
        isRestoringTimerRef.current = true;
        
        // Set up timer restoration - but don't execute it yet
        // It will be executed in a separate useEffect
        shouldRestoreTimerRef.current = {
          shouldRestore: true,
          remainingSecs,
          practiceIndex: activeTimerPracticeIndex
        };
        
        // Set the current index to the active practice AFTER setting the restoration flag
        setTimeout(() => {
          setCurrentIndex(activeTimerPracticeIndex);
        }, 0);
        
        // If the timer was paused, set the local paused state
        if (activeTimerIsPaused) {
          setIsPaused(true);
          setPausedTimeLeft(remainingSecs);
        }
      } else {
        // If timer has expired, clear it
        console.log('[STEPS] Timer has expired, clearing timer state');
        clearActiveTimer();
      }
    } else {
      // If we're navigating to a step without an active timer, reset the current index
      setCurrentIndex(-1);
      
      // Only reset paused state if we're not navigating away from a paused timer
      // This preserves the paused state when navigating between steps
      if (!(activeTimerStepId === stepId && activeTimerIsPaused)) {
        setIsPaused(false);
        setActiveTimerPaused(false);
      }
    }
    
    // Reset the lastLoadedStepIdRef to force loading from store for the new step
    lastLoadedStepIdRef.current = null;
    
    // Update step ID
    setStepId(newStepId);
  };
  
  // Initialize completed state from store
  useEffect(() => {
    if (step) {
      try {
        // Only load from store if we haven't loaded yet or if step changed
        if (!initialLoadDoneRef.current || lastLoadedStepIdRef.current !== step.id) {
          if (practiceChecks && 
              practiceChecks[step.id] && 
              Array.isArray(practiceChecks[step.id]) && 
              practiceChecks[step.id].length === step.practices.length) {
            setCompleted([...practiceChecks[step.id]]);
          } else {
            // Default to all unchecked
            setCompleted(Array(step.practices.length).fill(false));
          }
          
          // Update refs to track that we've loaded this step
          initialLoadDoneRef.current = true;
          lastLoadedStepIdRef.current = step.id;
        }
      } catch (err) {
        setCompleted(Array(step.practices.length).fill(false));
      }
    }
  }, [step, practiceChecks]);
  
  // Save to store when completed changes
  useEffect(() => {
    try {
      // Only save if step is valid and array matches expected length
      if (step && step.id && completed.length === step.practices.length) {
        // Check if the state has actually changed before saving
        const currentStored = practiceChecks[step.id];
        if (!currentStored || 
            !Array.isArray(currentStored) || 
            currentStored.length !== completed.length ||
            currentStored.some((check, idx) => check !== completed[idx])) {
          setPracticeChecks(step.id, [...completed]);
        }
      }
    } catch (err) {
      console.error('[STEPS] Error saving state:', err);
    }
  }, [completed, step, setPracticeChecks]);
  
  // Handle timer completion
  const handleTimerComplete = async () => {
    if (currentIndex >= 0 && step) {
      try {
        // Use notification service for timer completion sound
        await notificationService.sendTimerCompletionSound();
      } catch (error) {
        console.error('[STEPS] Error playing completion sound:', error);
      }
      
      // Mark the practice as completed
      const newCompleted = [...completed];
      newCompleted[currentIndex] = true;
      setCompleted(newCompleted);
      
      // Reset active practice
      setCurrentIndex(-1);
      
      // Reset paused state
      setIsPaused(false);
      setActiveTimerPaused(false);
      
      // Clear the global timer state
      clearActiveTimer();
    }
  };
  
  // Update the ref when dependencies change
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [currentIndex, step, completed, clearActiveTimer]);
  
  // Reference to store the current duration for use in callbacks
  const currentDurationRef = useRef<number>(0);
  
  // Reference to track when the timer started (for iOS)
  const timerStartTimeRef = useRef<number>(0);
  
  // Track if we need to start a timer
  const shouldStartTimerRef = useRef<{
    shouldStart: boolean;
    duration: number;
    stepId: number | undefined;
    practiceIndex: number;
  }>({
    shouldStart: false,
    duration: 0,
    stepId: undefined,
    practiceIndex: -1
  });
  
  // Start timer automatically when currentIndex changes
  useEffect(() => {
    // Skip if we're in the process of restoring a timer
    if (isRestoringTimerRef.current) {
      console.log('[STEPS] Skipping auto-start because we are restoring a timer');
      return;
    }
    
    if (currentIndex >= 0 && step && step.durations[currentIndex]) {
      // Ensure we have a valid duration
      const duration = step.durations[currentIndex];
      
      console.log('[STEPS] Current index changed, preparing to start timer with duration:', duration);
      
      // Store the duration in the ref for use in the setTimeout callback
      currentDurationRef.current = duration;
      
      // Instead of directly calling resetAndStart, set the ref to indicate we should start
      shouldStartTimerRef.current = {
        shouldStart: true,
        duration,
        stepId: step.id,
        practiceIndex: currentIndex
      };
    }
  }, [currentIndex, step]);
  
  // Separate effect to actually start the timer
  useEffect(() => {
    // Check if we should start a timer
    if (shouldStartTimerRef.current.shouldStart) {
      const { duration, stepId, practiceIndex } = shouldStartTimerRef.current;
      
      // Reset the flag immediately to prevent multiple starts
      shouldStartTimerRef.current = {
        shouldStart: false,
        duration: 0,
        stepId: undefined,
        practiceIndex: -1
      };
      
      // Only start if we're not already restoring a timer
      if (!shouldRestoreTimerRef.current.shouldRestore) {
        console.log('[STEPS] Starting new timer with duration:', duration);
        
        // Record the timer start time for iOS
        if (Platform.OS === 'ios') {
          timerStartTimeRef.current = Date.now();
          console.log('[STEPS] iOS: Recording timer start time:', timerStartTimeRef.current);
        }
        
        // Use the combined resetAndStart function to avoid timing issues
        resetAndStart(duration);
        
        // Update the global timer state
        if (stepId) {
          setActiveTimer(stepId, practiceIndex, duration);
        }
      } else {
        console.log('[STEPS] Not starting new timer because we are restoring an existing timer');
      }
    }
  }, [resetAndStart, setActiveTimer]);
  
  // Update the global timer end time when the timer is running
  // Using a ref to track previous timeLeft to avoid unnecessary updates
  const prevTimeLeftRef = useRef<number>(timeLeft);
  const lastUpdateTimeRef = useRef<number>(0);
  const updatePendingRef = useRef<boolean>(false);
  
  // Use a proper useEffect hook to handle timer updates
  useEffect(() => {
    // Skip if timer is not running
    if (!isRunning) return;
    
    // Skip if no significant change in timeLeft
    if (timeLeft === prevTimeLeftRef.current) return;
    
    // Skip if an update is already pending
    if (updatePendingRef.current) return;
    
    // Mark that we're planning an update
    updatePendingRef.current = true;
    
    // Use setTimeout to debounce and break the render cycle
    const timeoutId = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // Only update if:
      // 1. The time has changed significantly (more than 1 second)
      // 2. It's been at least 5 seconds since the last update
      if (timeLeft > 0 && 
          Math.abs(prevTimeLeftRef.current - timeLeft) >= 1 && 
          timeSinceLastUpdate >= 5000) {
        
        // Calculate the end time based on the current time and timeLeft
        const endTime = now + (timeLeft * 1000);
        updateActiveTimerEndTime(endTime);
        
        // Update refs
        prevTimeLeftRef.current = timeLeft;
        lastUpdateTimeRef.current = now;
        
        console.log('[STEPS] Updated global timer end time, remaining:', timeLeft);
      }
      
      // Clear the pending flag
      updatePendingRef.current = false;
    }, 1000); // Debounce for 1 second
    
    // Clean up the timeout
    return () => {
      clearTimeout(timeoutId);
      updatePendingRef.current = false;
    };
  }, [isRunning, timeLeft, updateActiveTimerEndTime]);
  
  // Clear the global timer state when the timer completes or is stopped
  useEffect(() => {
    // Skip if we're in the process of restoring a timer
    if (isRestoringTimerRef.current) {
      return;
    }
    
    // Skip if the timer is paused - we want to preserve the timer state when paused
    if (isPaused || activeTimerIsPaused) {
      return;
    }
    
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
          console.log('[STEPS] iOS: Timer stopped and ran long enough, clearing global timer state', {
            timeSinceStart,
            hasRunLongEnough
          });
          clearActiveTimer();
        } else {
          console.log('[STEPS] iOS: Timer stopped too soon, preserving timer state', {
            timeSinceStart,
            hasRunLongEnough
          });
          // Don't clear the timer state on iOS if it hasn't run long enough
        }
      }
    } else {
      // Original Android code path - unchanged
      if (!isRunning && activeTimerStepId === stepId) {
        // Only clear if we're on the active timer step and the timer is not running
        // and we're not in the process of restoring a timer
        // and the timer is not paused
        console.log('[STEPS] Timer stopped, clearing global timer state');
        clearActiveTimer();
      }
    }
  }, [isRunning, activeTimerStepId, stepId, isPaused, activeTimerIsPaused, clearActiveTimer]);
  
  // Track if we need to restore a timer
  const shouldRestoreTimerRef = useRef<{
    shouldRestore: boolean;
    remainingSecs: number;
    practiceIndex: number;
  }>({
    shouldRestore: false,
    remainingSecs: 0,
    practiceIndex: -1
  });
  
  // Check for an active timer when loading the component
  // Using a ref to ensure this only runs once per component mount
  const timerRestorationAttemptedRef = useRef(false);
  
  useEffect(() => {
    // Skip if we've already attempted to restore the timer
    if (timerRestorationAttemptedRef.current) {
      return;
    }
    
    console.log('[STEPS] Checking for active timer on component mount');
    
    // Validate timer data before attempting to restore
    const isTimerDataValid = 
      activeTimerStepId !== null && 
      activeTimerPracticeIndex !== null && 
      activeTimerEndTime !== null && 
      activeTimerDuration !== null;
    
    if (!isTimerDataValid) {
      console.log('[STEPS] No valid timer data found, clearing any partial state');
      clearActiveTimer();
      timerRestorationAttemptedRef.current = true;
      return;
    }
    
    // Calculate if the timer is still valid
    const now = Date.now();
    const remainingMs = Math.max(0, activeTimerEndTime - now);
    const remainingSecs = Math.floor(remainingMs / 1000);
    
    console.log('[STEPS] Timer data:', {
      activeTimerStepId,
      stepId,
      activeTimerEndTime,
      now,
      remainingMs,
      remainingSecs
    });
    
    // Check if timer has expired or is too short to be meaningful
    if (remainingSecs <= 1) {
      console.log('[STEPS] Timer has expired or is too short, clearing timer state');
      clearActiveTimer();
      timerRestorationAttemptedRef.current = true;
      return;
    }
    
    // Only restore the timer if we're on the correct step
    if (activeTimerStepId === stepId) {
      console.log('[STEPS] Preparing to restore timer with', remainingSecs, 'seconds remaining');
      
      // Set the restoration flag BEFORE changing currentIndex to prevent auto-start
      isRestoringTimerRef.current = true;
      
      // Set up timer restoration - but don't execute it yet
      // It will be executed in a separate useEffect
      shouldRestoreTimerRef.current = {
        shouldRestore: true,
        remainingSecs,
        practiceIndex: activeTimerPracticeIndex
      };
      
      // Set the current index to the active practice AFTER setting the restoration flag
      setTimeout(() => {
        setCurrentIndex(activeTimerPracticeIndex);
      }, 0);
    } else {
      console.log('[STEPS] Active timer exists on step', activeTimerStepId, 'but current step is', stepId);
    }
    
    // Mark that we've attempted timer restoration
    timerRestorationAttemptedRef.current = true;
  }, [
    // Only include dependencies that won't change during normal component lifecycle
    // This ensures the effect only runs once on mount
    stepId,
    clearActiveTimer
  ]);
  
  // Reference to track if we're currently in the process of restoring a timer
  const isRestoringTimerRef = useRef(false);
  
  // Separate effect to actually restore the timer
  // This is a critical effect that handles timer restoration
  useEffect(() => {
    // Check if we should restore a timer
    if (shouldRestoreTimerRef.current.shouldRestore) {
      const { remainingSecs, practiceIndex } = shouldRestoreTimerRef.current;
      
      console.log('[STEPS] Restoring timer with', remainingSecs, 'seconds remaining');
      
      // Set the flag to indicate we're in the process of restoring a timer
      isRestoringTimerRef.current = true;
      
      // Reset the flag immediately to prevent multiple restorations
      shouldRestoreTimerRef.current = {
        shouldRestore: false,
        remainingSecs: 0,
        practiceIndex: -1
      };
      
      // Use setTimeout with a longer delay to ensure this happens after any other timer operations
      // and after any state updates have been processed
      setTimeout(() => {
        try {
          // CRITICAL: Update the global timer state with the current time + remaining seconds
          // This ensures the timer state is preserved even if the component unmounts
          const now = Date.now();
          const endTime = now + (remainingSecs * 1000);
          
          // Only update if we're still in the restoration process
          if (isRestoringTimerRef.current) {
            console.log('[STEPS] Updating timer end time during restoration:', {
              remainingSecs,
              endTime
            });
            
            // Update the global timer state BEFORE resuming the timer
            // This prevents the timer from being reset by other effects
            updateActiveTimerEndTime(endTime);
            
            // Also ensure the active timer is set correctly in the store
            // This is critical to prevent the timer from being reset
            if (activeTimerStepId === stepId && activeTimerPracticeIndex === practiceIndex) {
              console.log('[STEPS] Updating active timer during restoration');
              setActiveTimer(stepId, practiceIndex, remainingSecs);
            }
            
            // Resume the timer with the remaining time
            resumeFromTime(remainingSecs);
            
            // Wait a bit before clearing the restoration flag to ensure the timer is fully restored
            setTimeout(() => {
              // Only clear the flag if we're still in the restoration process
              if (isRestoringTimerRef.current) {
                console.log('[STEPS] Timer restoration complete');
                isRestoringTimerRef.current = false;
              }
            }, 1000);
          }
        } catch (err) {
          console.error('[STEPS] Error restoring timer:', err);
          isRestoringTimerRef.current = false;
        }
      }, 500); // Increased delay to ensure all other operations complete first
    }
  }, [resumeFromTime]);
  
  // Find the next unchecked practice
  const findNextUncheckedPractice = () => {
    try {
      // Find the first unchecked practice
      const nextIndex = completed.findIndex(check => !check);
      if (nextIndex !== -1) {
        return nextIndex;
      }
      // If all are checked, return -1
      return -1;
    } catch (err) {
      return -1;
    }
  };
  
  // Check if all durations are zero or null
  const allDurationsZero = () => {
    if (!step ||
