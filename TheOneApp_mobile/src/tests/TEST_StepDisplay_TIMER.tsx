/**
 * TEST FILE: Step Display Timer Component
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTestTimer } from './TEST_useTimer_HOOK';
import { useTestSettingsStore } from './TEST_settingsStore_TIMER';
import { Step, getTestStep } from './TEST_steps_data';

export const TestStepDisplay = () => {
  // Get the first step for testing
  const [step, setStep] = useState<Step | undefined>(getTestStep(1));
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean[]>([]);
  
  // Get store access
  const { 
    practiceChecks, 
    setPracticeChecks, 
    setLastPracticeStartDate 
  } = useTestSettingsStore();
  
  // Initialize timer hook
  const {
    timeLeft,
    isRunning,
    isComplete,
    progress,
    start,
    pause,
    stop,
    reset,
    setDuration
  } = useTestTimer({
    initialDuration: 0,
    onComplete: handleTimerComplete,
    hapticFeedback: true,
    keepAwake: true,
  });
  
  // Sound reference
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Load sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        console.log('[TEST_TIMER] Loading sound...');
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/bell.mp3')
        );
        setSound(sound);
        console.log('[TEST_TIMER] Sound loaded successfully');
      } catch (error) {
        console.error('[TEST_TIMER] Error loading sound:', error);
      }
    };
    
    loadSound();
    
    return () => {
      if (sound) {
        console.log('[TEST_TIMER] Unloading sound');
        sound.unloadAsync();
      }
    };
  }, []);
  
  // Play completion sound
  const playCompletionSound = async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        console.log('[TEST_TIMER] Playing completion sound');
      }
    } catch (error) {
      console.error('[TEST_TIMER] Error playing sound:', error);
    }
  };
  
  // Initialize completed state from store
  useEffect(() => {
    if (step) {
      try {
        // If valid saved state exists, use it
        if (practiceChecks && 
            practiceChecks[step.id] && 
            Array.isArray(practiceChecks[step.id]) && 
            practiceChecks[step.id].length === step.practices.length) {
          setCompleted([...practiceChecks[step.id]]);
        } else {
          // Default to all unchecked
          setCompleted(Array(step.practices.length).fill(false));
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
        setPracticeChecks(step.id, [...completed]);
      }
    } catch (err) {
      console.log('[TEST_TIMER] Error saving state');
    }
  }, [completed, step, setPracticeChecks]);
  
  // Handle timer completion
  function handleTimerComplete() {
    if (currentIndex >= 0 && step) {
      // Play completion sound
      playCompletionSound();
      
      // Mark the practice as completed
      const newCompleted = [...completed];
      newCompleted[currentIndex] = true;
      setCompleted(newCompleted);
      
      // Reset active practice
      setCurrentIndex(-1);
      
      // Show alert
      Alert.alert(
        "Practice Complete",
        `You've completed "${step.practices[currentIndex]}"`,
        [{ text: "OK" }]
      );
    }
  }
  
  // Handle practice selection
  const handleSelectPractice = (index: number) => {
    try {
      if (step && index >= 0 && index < step.practices.length) {
        setCurrentIndex(index);
        reset(step.durations[index] || 0);
      }
    } catch (err) {
      console.log('[TEST_TIMER] Error selecting practice');
    }
  };
  
  // Find the next unchecked practice
  const findNextUncheckedPractice = () => {
    try {
      // Find the first unchecked practice
      const nextIndex = completed.findIndex(check => !check);
      if (nextIndex !== -1) {
        return nextIndex;
      }
      // If all are checked, return the current index
      return currentIndex;
    } catch (err) {
      console.log('[TEST_TIMER] Error finding next unchecked practice');
      return currentIndex;
    }
  };
  
  // Toggle timer running state
  const handleToggleTimer = () => {
    try {
      if (!isRunning) {
        // Find the next unchecked practice when starting
        const nextIndex = findNextUncheckedPractice();
        setCurrentIndex(nextIndex);
        
        // If timer is at 0, initialize it
        if (timeLeft <= 0 && step && step.durations[nextIndex]) {
          setDuration(step.durations[nextIndex]);
          reset(step.durations[nextIndex]);
        }
        
        start();
        
        // Record that practice was started today
        setLastPracticeStartDate(new Date().toISOString().split('T')[0]);
      } else {
        pause();
      }
    } catch (err) {
      console.log('[TEST_TIMER] Error toggling timer');
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
  
  // Reset all practice checks
  const handleResetAll = () => {
    if (step) {
      setCompleted(Array(step.practices.length).fill(false));
      stop();
      setCurrentIndex(-1);
      Alert.alert("Reset", "All practices have been reset");
    }
  };
  
  // Switch to a different step
  const handleSwitchStep = () => {
    // For testing, we'll just cycle through steps 1-3
    if (step) {
      const nextId = (step.id % 3) + 1;
      const nextStep = getTestStep(nextId);
      setStep(nextStep);
      stop();
      setCurrentIndex(-1);
    }
  };
  
  // Check if any practice has a non-zero duration
  const hasNonZeroDuration = step?.durations.some(duration => duration > 0) || false;
  
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
      <ScrollView>
        {/* Step Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Step {step.id}: {step.title}</Text>
          
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={handleSwitchStep}
          >
            <Text style={styles.switchButtonText}>Switch Step</Text>
          </TouchableOpacity>
        </View>
        
        {/* Step Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{step.instructions}</Text>
        </View>
        
        {/* Timer Controls */}
        <View style={styles.timerControlsContainer}>
          {!isRunning ? (
            hasNonZeroDuration ? (
              <TouchableOpacity
                onPress={handleToggleTimer}
                style={styles.startButton}
              >
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={styles.buttonText}>Start Practices</Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <View style={styles.timerControlsRow}>
              <TouchableOpacity
                onPress={handleToggleTimer}
                style={styles.pauseButton}
              >
                <MaterialIcons name="pause" size={24} color="#fff" />
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={stop}
                style={styles.stopButton}
              >
                <MaterialIcons name="stop" size={24} color="#fff" />
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
              
              {timeLeft > 0 && (
                <Text style={styles.timeRemainingText}>
                  {formatTime(timeLeft)} remaining
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Practices */}
        <View style={styles.practicesContainer}>
          <View style={styles.practicesHeader}>
            <Text style={styles.practicesTitle}>Practices</Text>
            
            <TouchableOpacity
              onPress={handleResetAll}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
          </View>
          
          {step.practices.map((practice, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.practiceItem,
                currentIndex === index && isRunning && styles.activePracticeItem
              ]}
              onPress={() => handleSelectPractice(index)}
            >
              <View style={styles.practiceRow}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    completed[index] && styles.checkboxChecked
                  ]}
                  onPress={() => handleToggleComplete(index)}
                >
                  {completed[index] && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
                
                <View style={styles.practiceContent}>
                  <Text style={[
                    styles.practiceText,
                    completed[index] && styles.practiceTextCompleted
                  ]}>
                    {practice}
                  </Text>
                  
                  <Text style={styles.durationText}>
                    {index === currentIndex && timeLeft > 0 
                      ? formatTime(timeLeft) 
                      : formatTime(step.durations[index] || 0)}
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
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  switchButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  switchButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  instructionsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  instructions: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },
  timerControlsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  startButton: {
    backgroundColor: '#1DB954', // Spotify green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pauseButton: {
    backgroundColor: '#1DB954', // Spotify green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#E74C3C', // Red
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeRemainingText: {
    color: '#e0e0e0',
    marginLeft: 16,
  },
  practicesContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
  },
  practicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  practicesTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  resetButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  practiceItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activePracticeItem: {
    backgroundColor: '#333333',
    borderLeftWidth: 4,
    borderLeftColor: '#1DB954',
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 12,
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
    fontSize: 16,
    marginBottom: 4,
  },
  practiceTextCompleted: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },
  durationText: {
    color: '#888888',
    fontSize: 14,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#444444',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1DB954',
  },
});
