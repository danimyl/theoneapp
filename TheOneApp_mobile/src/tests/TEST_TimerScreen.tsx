/**
 * TEST FILE: Timer Test Screen
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
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
  SafeAreaView,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTestTimer } from './TEST_useTimer_HOOK';
import { useTestSettingsStore } from './TEST_settingsStore_TIMER';
import stepService, { Step } from '../services/stepService';
import { TestStepSelector } from './TEST_StepSelector';
import testNotificationService from './TEST_notificationService';

// Maximum step ID for advancement
const MAX_STEP_ID = 365; // Assuming 365 steps maximum

// Get screen dimensions for responsive layout
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate practice item height (for 3 items plus padding)
const PRACTICE_ITEM_HEIGHT = 45; // Height of a single practice item (increased for larger text)
const PRACTICE_CONTROLS_HEIGHT = 90; // Height of timer controls (increased for larger text)
const PRACTICE_CONTAINER_HEIGHT = (PRACTICE_ITEM_HEIGHT * 3) + PRACTICE_CONTROLS_HEIGHT;

// Enhanced timer screen with practices and sound
export const TestTimerScreen = () => {
  // Get the first step for testing
  const [stepId, setStepId] = useState<number>(1);
  const [step, setStep] = useState<Step | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean[]>([]);
  
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
    setLastAdvancementCheck
  } = useTestSettingsStore();
  
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
  } = useTestTimer({
    initialDuration: 0,
    onComplete: () => handleTimerCompleteRef.current(),
    hapticFeedback: false, // Disable for now
    keepAwake: false, // Disable for web compatibility
  });
  
  // Check for daily advancement
  const checkAndAdvanceStep = () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // If first time using the app, set up initial state
      if (!startDate) {
        console.log('[TEST_TIMER] First time setup - setting start date and current step');
        setStartDate(today);
        setCurrentStepId(1);
        setLastAdvancementCheck(today);
        return;
      }
      
      // Check if it's past 3:00 AM and we haven't checked today
      if (now.getHours() >= 3 && lastAdvancementCheck !== today) {
        console.log('[TEST_TIMER] Checking for daily advancement');
        
        // Calculate days since last check
        const lastCheckDate = new Date(lastAdvancementCheck + 'T00:00:00');
        const daysSinceLastCheck = Math.floor((now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCheck > 0) {
          // Advance step by the number of days passed, but don't exceed MAX_STEP_ID
          const newStepId = Math.min(currentStepId + daysSinceLastCheck, MAX_STEP_ID);
          console.log(`[TEST_TIMER] Advancing step from ${currentStepId} to ${newStepId} (${daysSinceLastCheck} days passed)`);
          
          setCurrentStepId(newStepId);
          setLastAdvancementCheck(today);
          
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
          setLastAdvancementCheck(today);
        }
      }
    } catch (err) {
      console.error('[TEST_TIMER] Error in daily advancement check:', err);
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
          const { alwaysHourlyReminders } = useTestSettingsStore.getState();
          
          // Send notification if step has hourly:true or alwaysHourlyReminders is true
          if (currentStep && (currentStep.hourly || alwaysHourlyReminders)) {
            testNotificationService.sendHourlyReminder(
              currentStep.id,
              currentStep.title
            );
            
            // Update the last notification hour
            lastHourlyNotificationRef.current = hourKey;
            
            console.log(`[TEST_TIMER] Sent hourly notification for step ${currentStep.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[TEST_TIMER] Error checking hourly notification:', error);
    }
  };
  
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
    }, 60000); // Check every minute
    
    return () => clearInterval(checkTimer);
  }, []);
  
  // Load initial step
  useEffect(() => {
    const loadStep = async () => {
      try {
        const loadedStep = stepService.getStepById(stepId);
        if (loadedStep) {
          setStep(loadedStep);
          console.log(`[TEST_TIMER] Loaded step ${stepId} from service`);
        } else {
          console.error(`[TEST_TIMER] Failed to load step ${stepId}`);
        }
      } catch (error) {
        console.error('[TEST_TIMER] Error loading step:', error);
      }
    };
    
    loadStep();
  }, [stepId]);
  
  // Handle step change
  const handleStepChange = (newStepId: number) => {
    // Stop any running timer
    if (isRunning) {
      stop();
    }
    
    // Reset current index
    setCurrentIndex(-1);
    
    // Reset paused state
    setIsPaused(false);
    
    // Reset the lastLoadedStepIdRef to force loading from store for the new step
    lastLoadedStepIdRef.current = null;
    
    // Update step ID
    setStepId(newStepId);
    
    console.log(`[TEST_TIMER] Changed to step ${newStepId}`);
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
        console.log('[TEST_TIMER] Loading sound...');
        
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
          console.log('[TEST_TIMER] Sound loaded successfully');
        }
      } catch (error) {
        console.error('[TEST_TIMER] Error loading sound:', error);
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
        console.error('[TEST_TIMER] Error setting audio mode:', error);
      }
    };
    
    setupAudio().then(loadSound);
    
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync().catch(err => 
          console.error('[TEST_TIMER] Error unloading sound:', err)
        );
      }
    };
  }, []);
  
  // Monitor sound status
  const onSoundStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle unloaded status
      console.log('[TEST_TIMER] Sound status: not loaded');
    }
  };
  
  // Play completion sound with fallback
  const playCompletionSound = async () => {
    if (!sound) {
      console.log('[TEST_TIMER] No sound object available');
      return;
    }
    
    if (!soundLoadedRef.current) {
      console.log('[TEST_TIMER] Sound not properly loaded, using fallback');
      // Just continue without sound
      return;
    }
    
    try {
      console.log('[TEST_TIMER] Playing completion sound');
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error('[TEST_TIMER] Error playing sound:', error);
      // Continue without sound
    }
  };
  
  // Initialize completed state from store
  useEffect(() => {
    if (step) {
      try {
        // Only load from store if we haven't loaded yet or if step changed
        if (!initialLoadDoneRef.current || lastLoadedStepIdRef.current !== step.id) {
          console.log(`[TEST_TIMER] Loading completed state for step ${step.id}`);
          
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
        console.log('[TEST_TIMER] Error loading saved state');
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
      console.log('[TEST_TIMER] Error saving state');
    }
  }, [completed, step, setPracticeChecks]); // Removed practiceChecks from dependencies
  
  // Handle timer completion
  const handleTimerComplete = () => {
    if (currentIndex >= 0 && step) {
      // Play completion sound
      playCompletionSound();
      
      // Mark the practice as completed
      const newCompleted = [...completed];
      newCompleted[currentIndex] = true;
      setCompleted(newCompleted);
      
      // Reset active practice
      setCurrentIndex(-1);
      
      // Reset paused state
      setIsPaused(false);
      
      console.log('[TEST_TIMER] Timer completed, practice marked as completed, currentIndex reset, isPaused set to false');
    }
  };
  
  // Update the ref when dependencies change
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [currentIndex, step, completed]);
  
  // Reference to store the current duration for use in callbacks
  const currentDurationRef = useRef<number>(0);
  
  // Start timer automatically when currentIndex changes
  useEffect(() => {
    console.log('[TEST_TIMER] currentIndex changed to:', currentIndex);
    if (currentIndex >= 0 && step && step.durations[currentIndex]) {
      // Ensure we have a valid duration
      const duration = step.durations[currentIndex];
      console.log('[TEST_TIMER] Auto-starting timer with duration:', duration);
      
      // Store the duration in the ref for use in the setTimeout callback
      currentDurationRef.current = duration;
      
      // Use the combined resetAndStart function to avoid timing issues
      resetAndStart(duration);
    }
  }, [currentIndex]);
  
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
      console.log('[TEST_TIMER] Error finding next unchecked practice');
      return -1;
    }
  };
  
  // Track if the timer is paused (vs. stopped completely)
  const [isPaused, setIsPaused] = useState(false);
  
  // Store the remaining time when the timer is paused
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number>(0);
  
  // Start timer for the next unchecked practice or resume paused timer
  const handleStartPractices = () => {
    try {
      console.log('[TEST_TIMER] handleStartPractices called, isRunning:', isRunning, 'isPaused:', isPaused);
      
      // If the timer is paused, resume the current practice
      if (isPaused && currentIndex >= 0 && pausedTimeLeft > 0) {
        console.log('[TEST_TIMER] Resuming paused timer for practice:', currentIndex, 'with remaining time:', pausedTimeLeft);
        
        // Resume the timer from the saved time
        resumeFromTime(pausedTimeLeft);
        
        // Reset paused state
        setIsPaused(false);
        return;
      }
      
      // Otherwise, find the next unchecked practice
      const nextIndex = findNextUncheckedPractice();
      console.log('[TEST_TIMER] Next unchecked practice index:', nextIndex);
      
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
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setLastAdvancementCheck(today);
      }
    } catch (err) {
      console.log('[TEST_TIMER] Error starting practices:', err);
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
      console.log('[TEST_TIMER] Error toggling completion');
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
  
  // Prevent rendering if step data is invalid
  if (!step) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Step Selector */}
      <TestStepSelector 
        currentStepId={stepId}
        onStepChange={handleStepChange}
      />
      
      {/* Main content area with flex layout */}
      <View style={styles.contentContainer}>
        {/* Step Instructions - Expandable scrollable section */}
        <View style={styles.instructionsContainer}>
          <ScrollView 
            style={styles.instructionsScroll}
            contentContainerStyle={styles.instructionsScrollContent}
            showsVerticalScrollIndicator={true}
            contentInset={{ bottom: 20 }}
          >
            {/* Add heading with step ID and title */}
            <Text style={styles.instructionsHeading}>
              STEP {step.id}: {step.title}
            </Text>
            
            <Text style={styles.instructionsText}>
              {step.instructions || 'No instructions available for this step.'}
            </Text>
            
            {/* Hourly indicator */}
            <View style={styles.hourlyIndicatorContainer}>
              <MaterialIcons 
                name={step.hourly ? "notifications-active" : "notifications-off"} 
                size={18} 
                color={step.hourly ? "#1DB954" : "#888888"} 
              />
              <Text style={[
                styles.hourlyIndicatorText,
                step.hourly ? styles.hourlyIndicatorActive : styles.hourlyIndicatorInactive
              ]}>
                Hourly Reminders: {step.hourly ? "ON" : "OFF"}
              </Text>
            </View>
          </ScrollView>
        </View>
        
        {/* Timer Section - Fixed height for practices */}
        <View style={styles.timerSection}>
          {/* Progress Bar - Thinner */}
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progress * 100}%` }
              ]} 
            />
          </View>
          
          {/* Controls with inline timer */}
          <View style={styles.controlsRow}>
            <View style={styles.controlsContainer}>
              {isRunning ? (
                <TouchableOpacity
                  style={[styles.button, styles.pauseButton]}
                  onPress={() => {
                    console.log('[TEST_TIMER] Pause button pressed, timeLeft:', timeLeft);
                    // Save the current timeLeft value before pausing
                    setPausedTimeLeft(timeLeft);
                    pause();
                    // Set isPaused to true so we know to resume the same practice
                    setIsPaused(true);
                    console.log('[TEST_TIMER] Timer paused, timeLeft saved:', timeLeft, 'isPaused set to true');
                  }}
                >
                  <MaterialIcons name="pause" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.startButton,
                    allPracticesCompleted && styles.disabledButton
                  ]}
                  onPress={handleStartPractices}
                  disabled={allPracticesCompleted}
                >
                  <MaterialIcons name="play-arrow" size={18} color="#fff" />
                  <Text style={styles.buttonText}>
                    Start Practices
                  </Text>
                </TouchableOpacity>
              )}
              
              {isRunning && (
                <TouchableOpacity
                  style={[styles.button, styles.resetButton]}
                  onPress={() => {
                    console.log('[TEST_TIMER] Stop button pressed');
                    // Custom handler for stop to ensure proper state reset
                    stop();
                    // Reset the current index to prepare for next start
                    setCurrentIndex(-1);
                    // Reset paused state
                    setIsPaused(false);
                    console.log('[TEST_TIMER] Timer stopped, currentIndex reset, isPaused set to false');
                  }}
                >
                  <MaterialIcons name="stop" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Stop</Text>
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
          <View style={styles.practicesContainer}>
            <View style={styles.practicesList}>
              {step.practices.map((practice, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.practiceItem,
                    currentIndex === index && isRunning && styles.activePracticeItem
                  ]}
                >
                  <View style={styles.practiceRow}>
                    <Text style={styles.practiceNumber}>{index + 1}</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        completed[index] && styles.checkboxChecked
                      ]}
                      onPress={() => handleToggleComplete(index)}
                    >
                      {completed[index] && (
                        <MaterialIcons name="check" size={15} color="#fff" />
                      )}
                    </TouchableOpacity>
                    
                    <View style={styles.practiceContent}>
                      <Text style={[
                        styles.practiceText,
                        completed[index] && styles.practiceTextCompleted
                      ]} numberOfLines={1} ellipsizeMode="tail">
                        {practice}
                      </Text>
                    </View>
                    
                    <View style={styles.durationContainer}>
                      <MaterialIcons name="access-time" size={15} color="#888888" />
                      <Text style={styles.durationText}>
                        {formatTime(step.durations[index] || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  {currentIndex === index && isRunning && (
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { width: `${progress * 100}%` }
                        ]} 
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 12,
  },
  title: {
    fontSize: 20, // Keep title at 20px
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
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
    paddingBottom: 20, // Add extra padding at the bottom to prevent text from being cut off
  },
  instructionsHeading: {
    color: '#ffffff', // White color for better visibility
    fontSize: 20, // Slightly larger than instructions text
    fontWeight: 'bold', // Bold font weight for the entire heading
    marginBottom: 12, // Space between heading and instructions
  },
  instructionsText: {
    color: '#CCCCCC', // Updated from #999999 to be halfway between gray and white
    fontSize: 18, // Updated to 18px for better readability of instructions
    lineHeight: 26, // Increased line height for better readability with larger font
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
    backgroundColor: '#1DB954', // Spotify green
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    height: 45, // Increased for larger text
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
    backgroundColor: '#1DB954', // Spotify green
  },
  pauseButton: {
    backgroundColor: '#FF9800', // Orange
  },
  resetButton: {
    backgroundColor: '#555555', // Dark gray
  },
  disabledButton: {
    backgroundColor: '#555555',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15, // Updated to 15px
  },
  inlineTimerText: {
    color: '#999999',
    fontSize: 15, // Updated to 15px
    fontVariant: ['tabular-nums'],
  },
  practicesContainer: {
    flex: 1, // Take remaining space in timer section
    backgroundColor: '#1e1e1e',
  },
  practicesList: {
    flex: 1, // Take remaining space
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
  practiceNumber: {
    width: 16,
    textAlign: 'center',
    color: '#999999',
    fontSize: 15, // Updated to 15px
    marginRight: 4,
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
    fontSize: 15, // Updated to 15px
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
    fontSize: 15, // Updated to 15px
    marginLeft: 2,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: '#444444',
    width: '100%',
  },
  
  // Hourly indicator styles
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
    color: '#1DB954', // Spotify green for active
  },
  hourlyIndicatorInactive: {
    color: '#888888', // Gray for inactive
  },
});
