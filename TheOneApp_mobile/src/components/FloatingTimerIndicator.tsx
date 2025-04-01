/**
 * Simplified Floating Timer Indicator
 * 
 * A minimal component that displays a floating icon when a timer is running
 * on a different step than the one currently being viewed.
 * 
 * Features:
 * - Shows a small icon indicating an active timer on another step
 * - Allows navigation to the step with the active timer
 * - Persists visibility with a small delay to prevent flickering
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Easing,
  Text,
  View
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

interface FloatingTimerIndicatorProps {
  currentStepId: number;
  onNavigateToStep: (stepId: number) => void;
}

export const FloatingTimerIndicator: React.FC<FloatingTimerIndicatorProps> = ({
  currentStepId,
  onNavigateToStep
}) => {
  // Get active timer info from store
  const { 
    activeTimerStepId, 
    activeTimerEndTime,
    activeTimerDuration,
    activeTimerIsPaused
  } = useSettingsStore();
  
  // Local state to track visibility with a delay
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation value for pulsing effect
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Start pulsing animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulseAnim]);
  
  // State to store the formatted time string
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  
  // Calculate and update remaining time for display
  useEffect(() => {
    // Function to calculate and format the remaining time
    const updateRemainingTime = () => {
      if (!activeTimerEndTime) {
        setTimeDisplay('');
        return;
      }
      
      const now = Date.now();
      const remainingMs = Math.max(0, activeTimerEndTime - now);
      const remainingSecs = Math.floor(remainingMs / 1000);
      
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      setTimeDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    
    // Update immediately
    updateRemainingTime();
    
    // Set up interval to update every second
    const intervalId = setInterval(updateRemainingTime, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [activeTimerEndTime]);
  
  // Effect to handle visibility with a delay to prevent flickering
  useEffect(() => {
    // Check if there should be an active timer
    const shouldBeVisible = () => {
      // Check if there's an active timer (based on step ID and end time)
      if (!activeTimerStepId || !activeTimerEndTime) {
        return false;
      }
      
      // Only show if we're on a different step than the active timer
      if (activeTimerStepId === currentStepId) {
        return false;
      }
      
      // For paused timers, always show the indicator
      if (activeTimerIsPaused) {
        return true;
      }
      
      // For running timers, check if the timer is still active
      const now = Date.now();
      const isTimerActive = activeTimerEndTime > now;
      
      // If timer has expired, don't show
      if (!isTimerActive) {
        return false;
      }
      
      return true;
    };
    
    // Log the current state for debugging
    console.log('[TIMER INDICATOR] Checking visibility:', {
      activeTimerStepId,
      currentStepId,
      activeTimerEndTime,
      activeTimerIsPaused,
      now: Date.now(),
      shouldShow: shouldBeVisible()
    });
    
    // Set visibility with a small delay to prevent flickering
    const timeoutId = setTimeout(() => {
      setIsVisible(shouldBeVisible());
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [activeTimerStepId, activeTimerEndTime, activeTimerIsPaused, currentStepId]);
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.iconButton,
          activeTimerIsPaused && styles.pausedIconButton
        ]}
        onPress={() => activeTimerStepId !== null && onNavigateToStep(activeTimerStepId)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={activeTimerIsPaused ? "pause" : "timer"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.stepText}>Step {activeTimerStepId}</Text>
          <Text style={styles.timerText}>
            {activeTimerIsPaused ? "Paused" : timeDisplay}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  iconButton: {
    backgroundColor: '#1DB954', // Spotify green
    width: 120,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pausedIconButton: {
    backgroundColor: '#FF9800', // Orange color to match the pause button
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  }
});

export default FloatingTimerIndicator;
