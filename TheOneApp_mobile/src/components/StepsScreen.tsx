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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Audio } from 'expo-av';
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

// Steps screen with practices and sound
export const StepsScreen = () => {
  const { theme, isDark } = useTheme();
  // Sound reference
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundLoadedRef = useRef(false);
  
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
  
  // Create a mock sound object for fallback
  const createMockSound = () => ({
    playAsync: () => Promise.resolve({}),
    unloadAsync: () => Promise.resolve({}),
    setPositionAsync: () => Promise.resolve({})
  });
  
  // Load sound on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadSound = async () => {
      try {
        // Unload any existing sound
        if (sound) {
          await sound.unloadAsync();
        }
        
        // Import the Asset module
        const { Asset } = await import('expo-asset');
        
        // Load the asset
        const soundAsset = await Asset.loadAsync(require('../../assets/bell.mp3'));
        
        if (!soundAsset || soundAsset.length === 0 || !soundAsset[0].uri) {
          throw new Error('Failed to load sound asset');
        }
        
        // Create and load the sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: soundAsset[0].uri },
          { shouldPlay: false },
          onSoundStatusUpdate
        );
        
        if (isMounted) {
          setSound(newSound);
          soundLoadedRef.current = true;
        }
      } catch (error) {
        console.error('[STEPS] Error loading sound:', error);
        soundLoadedRef.current = false;
        
        // Set a mock sound object so the app can continue without sound
        if (isMounted) {
          setSound(createMockSound() as unknown as Audio.Sound);
        }
      }
    };
    
    // Set audio mode for better compatibility
    const setupAudio = async () => {
      try {
        // Only try to set audio mode on native platforms
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          });
        }
      } catch (error) {
        console.error('[STEPS] Error setting audio mode:', error);
      }
    };
    
    setupAudio().then(loadSound);
    
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync().catch(err => 
          console.error('[STEPS] Error unloading sound:', err)
        );
      }
    };
  }, []);
  
  // Monitor sound status
  const onSoundStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle unloaded status
    }
  };
  
  // Play completion sound with fallback
  const playCompletionSound = async () => {
    if (!sound) {
      return;
    }
    
    if (!soundLoadedRef.current) {
      // Just continue without sound
      return;
    }
    
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error('[STEPS] Error playing sound:', error);
      // Continue without sound
    }
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
        // Send a notification sound that works when device is locked
        // This also plays the sound directly when app is in foreground
        await notificationService.sendTimerCompletionSound();
        
        // No need to call playCompletionSound() separately as it's already called
        // inside sendTimerCompletionSound()
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
  
  // Start timer for the next unchecked practice or resume paused timer
  const handleStartPractices = () => {
    try {
      // If the timer is paused, resume the current practice
      if (isPaused && currentIndex >= 0 && pausedTimeLeft > 0) {
        console.log('[STEPS] Resuming paused timer with', pausedTimeLeft, 'seconds remaining');
        
        // Reset paused state
        setIsPaused(false);
        setActiveTimerPaused(false);
        
        // Calculate the end time based on the current time and pausedTimeLeft
        const now = Date.now();
        const endTime = now + (pausedTimeLeft * 1000);
        
        // Record the timer start time for iOS
        if (Platform.OS === 'ios') {
          timerStartTimeRef.current = now;
          console.log('[STEPS] iOS: Recording timer resume time:', timerStartTimeRef.current);
        }
        
        // Update the global timer state with the current step ID
        setActiveTimer(stepId, currentIndex, pausedTimeLeft);
        updateActiveTimerEndTime(endTime);
        
        // Resume the timer with the remaining time
        resumeFromTime(pausedTimeLeft);
        
        return;
      }
      
      // Check if all durations are zero or null
      if (allDurationsZero()) {
        Alert.alert(
          "No Practice Durations",
          "This step doesn't have any practice durations set.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // Otherwise, find the next unchecked practice
      const nextIndex = findNextUncheckedPractice();
      
      // If all practices are completed, do nothing
      if (nextIndex === -1) {
        Alert.alert(
          "All Practices Completed",
          "All practices for this step have been completed.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // Set the current index - the useEffect will handle the timer setup and start
      setCurrentIndex(nextIndex);
      
      // Reset paused state
      setIsPaused(false);
      
      // Record that practice was started today
      setLastPracticeStartDate(new Date().toISOString().split('T')[0]);
      
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
    } catch (err) {
      console.error('[STEPS] Error starting practices:', err);
    }
  };
  
  // Toggle completion state
  const handleToggleComplete = (index: number) => {
    try {
      if (index >= 0 && index < completed.length) {
        const newCompleted = [...completed];
        newCompleted[index] = !newCompleted[index];
        setCompleted(newCompleted);
      }
    } catch (err) {
      console.error('[STEPS] Error toggling completion:', err);
    }
  };
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    try {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch (err) {
      return '0:00';
    }
  };
  
  // Check if all practices are completed
  const allPracticesCompleted = completed.every(check => check);
  
  // Check if all durations are zero or null
  const allDurationsZero = () => {
    if (!step || !step.durations || step.durations.length === 0) {
      return true;
    }
    return step.durations.every(duration => !duration || duration === 0);
  };
  
  // Combined condition for disabling the start button
  // Now also checks if there's an active timer on another step
  const disableStartButton = 
    allPracticesCompleted || 
    allDurationsZero() || 
    (activeTimerStepId !== null && activeTimerStepId !== stepId);
  
  // Prevent rendering if step data is invalid
  if (!step) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  // Calculate a safe progress value when the hook's progress is invalid
  const safeProgress = isRunning && currentIndex >= 0 && step?.durations[currentIndex] > 0
    ? isNaN(progress) ? 1 - (timeLeft / step.durations[currentIndex]) : progress
    : 0;
  
  // Get all available steps for navigation
  const allSteps = stepService.getAllStepTitles();
  const currentStepIndex = allSteps.findIndex(s => s.id === stepId);
  
  // Set up swipe gesture handling
  const translateX = useSharedValue(0);
  
  // Function to navigate to previous step
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      handleStepChange(allSteps[currentStepIndex - 1].id);
    }
  };
  
  // Function to navigate to next step
  const goToNextStep = () => {
    if (currentStepIndex < allSteps.length - 1) {
      handleStepChange(allSteps[currentStepIndex + 1].id);
    }
  };
  
  // Create swipe gesture handler
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow horizontal swiping
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      // Determine if swipe was significant enough to trigger navigation
      const SWIPE_THRESHOLD = 100; // Minimum distance to trigger navigation
      
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - go to previous step
        runOnJS(goToPreviousStep)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - go to next step
        runOnJS(goToNextStep)();
      }
      
      // Reset translation with animation
      translateX.value = withTiming(0, { duration: 300 });
    });
  
  // Create animated style for content container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
    
  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      {/* Step Selector */}
      <StepSelector 
        currentStepId={stepId}
        onStepChange={handleStepChange}
      />
      
      {/* Simplified Floating Timer Indicator */}
      <FloatingTimerIndicator
        currentStepId={stepId}
        onNavigateToStep={handleStepChange}
      />
      
      {/* Main content area with flex layout - wrapped with gesture detector */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {/* Step Instructions - Expandable scrollable section */}
          <View style={[styles.instructionsContainer, { 
            borderColor: theme.borderColor,
            backgroundColor: theme.bgCard
          }]}>
            <ScrollView 
              style={styles.instructionsScroll}
              contentContainerStyle={styles.instructionsScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Add heading with step ID and title */}
              <Text style={[styles.instructionsHeading, { color: theme.textPrimary }]}>
                STEP {step.id}: {step.title}
              </Text>
              
              <Text style={[styles.instructionsText, { color: theme.textPrimary }]}>
                {step.instructions || 'No instructions available for this step.'}
              </Text>
              
              {/* Hourly indicator */}
              <View style={[styles.hourlyIndicatorContainer, { borderTopColor: theme.borderColor }]}>
                <MaterialIcons 
                  name={step.hourly ? "notifications-active" : "notifications-off"} 
                  size={18} 
                  color={step.hourly ? theme.accent : theme.textDisabled} 
                />
                <Text style={[
                  styles.hourlyIndicatorText,
                  { color: step.hourly ? theme.accent : theme.textDisabled }
                ]}>
                  Hourly Reminders: {step.hourly ? "ON" : "OFF"}
                </Text>
              </View>
            </ScrollView>
          </View>
          
          {/* Timer Section - Fixed height for practices */}
          <View style={[styles.timerSection, {
            borderColor: theme.borderColor,
            backgroundColor: theme.bgCard
          }]}>
            {/* Progress Bar - Thinner */}
            <View style={[styles.progressContainer, { backgroundColor: theme.borderColor }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${safeProgress * 100}%`, backgroundColor: theme.buttonAccent }
                ]} 
              />
            </View>
            
            {/* Controls with inline timer */}
            <View style={styles.controlsRow}>
              <View style={styles.controlsContainer}>
                {isRunning ? (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.warning }]}
                    onPress={() => {
                      // Save the current timeLeft value before pausing
                      setPausedTimeLeft(timeLeft);
                      pause();
                      // Set isPaused to true so we know to resume the same practice
                      setIsPaused(true);
                      // Also save the paused state to the global store
                      setActiveTimerPaused(true);
                    }}
                  >
                    <MaterialIcons name="pause" size={18} color={isDark ? '#fff' : '#333333'} />
                    <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#333333' }]}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: theme.buttonAccent },
                        disableStartButton && { 
                          backgroundColor: theme.buttonSecondary,
                          opacity: 0.5 
                        }
                      ]}
                      onPress={handleStartPractices}
                      disabled={disableStartButton}
                    >
                      <MaterialIcons name="play-arrow" size={18} color={isDark ? '#fff' : '#333333'} />
                      <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#333333' }]}>
                        Start Practices
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Show message when button is disabled due to active timer on another step */}
                    {activeTimerStepId !== null && activeTimerStepId !== stepId && (
                      <Text style={styles.timerActiveMessage}>
                        Timer active on Step {activeTimerStepId}
                      </Text>
                    )}
                  </>
                )}
                
                {isRunning && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.buttonSecondary }]}
                    onPress={() => {
                      // Custom handler for stop to ensure proper state reset
                      stop();
                      // Reset the current index to prepare for next start
                      setCurrentIndex(-1);
                      // Reset paused state
                      setIsPaused(false);
                      // Clear the global timer state
                      clearActiveTimer();
                    }}
                  >
                    <MaterialIcons name="stop" size={18} color={theme.textPrimary} />
                    <Text style={[styles.buttonText, { color: theme.textPrimary }]}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Only show timer when running */}
              {isRunning && (
                <Text style={styles.inlineTimerText}>
                  {formatTime(timeLeft)} remaining
                </Text>
              )}
            </View>
            
            {/* Practices List - More compact */}
            <View style={[styles.practicesContainer, { backgroundColor: theme.bgCard }]}>
              <View style={styles.practicesList}>
                {step.practices.map((practice, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.practiceItem,
                      { backgroundColor: theme.bgInput },
                      currentIndex === index && isRunning && {
                        backgroundColor: theme.bgCardHover,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.accent
                      }
                    ]}
                  >
                    <View style={styles.practiceRow}>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          { borderColor: theme.borderColor },
                          // Make unchecked checkbox more visible in dark mode
                          isDark && !completed[index] && { 
                            borderColor: '#AAAAAA', // Much brighter border for dark mode
                            borderWidth: 2 // Slightly thicker border for better visibility
                          },
                          completed[index] && {
                            backgroundColor: theme.buttonAccent,
                            borderColor: theme.buttonAccent
                          }
                        ]}
                        onPress={() => handleToggleComplete(index)}
                      >
                        {completed[index] && (
                          <MaterialIcons name="check" size={15} color={isDark ? '#fff' : '#333333'} />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.practiceContent}>
                        <Text style={[
                          styles.practiceText,
                          { color: theme.textPrimary },
                          completed[index] && { 
                            color: theme.textDisabled,
                            textDecorationLine: 'line-through'
                          }
                        ]} numberOfLines={1} ellipsizeMode="tail">
                          {practice}
                        </Text>
                      </View>
                      
                      <View style={styles.durationContainer}>
                        <MaterialIcons name="access-time" size={15} color={theme.textDisabled} />
                        <Text style={[styles.durationText, { color: theme.textDisabled }]}>
                          {formatTime(step.durations[index] || 0)}
                        </Text>
                      </View>
                    </View>
                    
                    {currentIndex === index && isRunning && (
                      <View style={[styles.progressBarContainer, { backgroundColor: theme.borderColor }]}>
                        <View 
                          style={[
                            styles.progressBar,
                            { 
                              width: `${safeProgress * 100}%`,
                              backgroundColor: theme.buttonAccent
                            }
                          ]} 
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 12,
    paddingTop: 0, // Remove top padding to eliminate blank space
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
  },
  instructionsContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    overflow: 'hidden',
    marginBottom: 12,
  },
  instructionsScroll: {
    padding: 12,
  },
  instructionsScrollContent: {
    paddingBottom: 20,
  },
  instructionsHeading: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#CCCCCC',
    fontSize: 18,
    lineHeight: 26,
  },
  hourlyIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  hourlyIndicatorText: {
    fontSize: 14,
    marginLeft: 6,
  },
  hourlyIndicatorActive: {
    color: '#1DB954',
  },
  hourlyIndicatorInactive: {
    color: '#888888',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  timerSection: {
    height: PRACTICE_CONTAINER_HEIGHT,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#1e1e1e',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    height: 45,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  startButton: {
    backgroundColor: '#1DB954',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resetButton: {
    backgroundColor: '#555555',
  },
  disabledButton: {
    backgroundColor: '#555555',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  inlineTimerText: {
    color: '#999999',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  practicesContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  practicesList: {
    flex: 1,
  },
  practiceItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
    height: PRACTICE_ITEM_HEIGHT,
  },
  activePracticeItem: {
    backgroundColor: '#333333',
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    height: PRACTICE_ITEM_HEIGHT,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#666666',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  practiceContent: {
    flex: 1,
  },
  practiceText: {
    color: '#ffffff',
    fontSize: 15,
  },
  practiceTextCompleted: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  durationText: {
    color: '#888888',
    fontSize: 15,
    marginLeft: 2,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: '#444444',
    width: '100%',
  },
  timerActiveMessage: {
    color: '#FF9800', // Orange color to match the pause button
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  }
});

export default StepsScreen;
