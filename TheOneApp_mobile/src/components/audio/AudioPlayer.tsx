/**
 * Audio Player Component
 * 
 * Handles audio playback for book content using Expo AV.
 * This component manages the audio playback state and controls.
 */

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import useAudioStore from '../../store/audioStore';

// Utility function to round values to 3 decimal places
const roundToThreeDecimals = (value: number): number => {
  return Math.round(value * 1000) / 1000;
};

// Debounce function to prevent multiple rapid calls
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

// Memoized slider component to prevent unnecessary re-renders
const MemoizedSlider = memo(({ 
  value, 
  onValueChange, 
  onSlidingComplete 
}: {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
}) => {
  // Add render logging with rounded value for cleaner logs
  console.log('MemoizedSlider rendering, value:', roundToThreeDecimals(value));
  
  return (
    <Slider
      style={styles.slider}
      value={value}
      onValueChange={onValueChange}
      onSlidingComplete={onSlidingComplete}
      minimumValue={0}
      maximumValue={1}
      minimumTrackTintColor="#1DB954"
      maximumTrackTintColor="#555555"
      thumbTintColor="#1DB954"
      // Note: Enhanced touch properties removed due to type compatibility issues
    />
  );
});

interface AudioPlayerProps {
  audioUrl: string | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  // Add render logging
  console.log('AudioPlayer rendering, audioUrl:', audioUrl?.substring(0, 50) + '...');
  
  // Use selective subscription to audio store to prevent unnecessary re-renders
  const isAudioPlaying = useAudioStore(state => state.isAudioPlaying);
  const isAudioLoading = useAudioStore(state => state.isAudioLoading);
  const audioProgress = useAudioStore(state => state.audioProgress);
  const setIsAudioPlaying = useAudioStore(state => state.setIsAudioPlaying);
  const setIsAudioLoading = useAudioStore(state => state.setIsAudioLoading);
  const setAudioProgress = useAudioStore(state => state.setAudioProgress);
  const resetAudioState = useAudioStore(state => state.resetAudioState);

  // Reference to the sound object
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load and set up the audio when the component mounts or audioUrl changes
  useEffect(() => {
    let isMounted = true;
    
    // Function to load the audio
    const loadAudio = async () => {
      if (!audioUrl) {
        return;
      }
      
      try {
        // Reset previous audio state
        resetAudioState();
        setIsAudioLoading(true);
        
        // Unload any existing sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }
        
        // Configure audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        
        // Create and load the sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        
        soundRef.current = sound;
        
        if (isMounted) {
          setIsAudioLoading(false);
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        if (isMounted) {
          setIsAudioLoading(false);
        }
      }
    };
    
    loadAudio();
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      // Unload the sound when the component unmounts
      const cleanup = async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch (error) {
            console.error('Error unloading sound:', error);
          }
        }
      };
      
      cleanup();
    };
  }, [audioUrl, resetAudioState, setIsAudioLoading]);
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      // Handle error or unloaded state
      if (status.error) {
        console.error(`Audio playback error: ${status.error}`);
      }
      return;
    }
    
    // Update playback state
    setIsAudioPlaying(status.isPlaying);
    
    // Update progress if playing AND not dragging
    if (status.isPlaying && status.durationMillis && !isDraggingRef.current) {
      // Round to 3 decimal places for efficiency
      const progress = roundToThreeDecimals(status.positionMillis / status.durationMillis);
      setAudioProgress(progress);
    }
    
    // Handle playback completion
    if (status.didJustFinish) {
      setIsAudioPlaying(false);
      setAudioProgress(0);
    }
  };
  
  // Refs for tracking slider position and dragging state
  const sliderValueRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDragTimeRef = useRef(0); // Track last drag time to prevent duplicate events
  const lastPositionRef = useRef(0); // Track last known good position
  
  // State for tracking dragging (used for component rendering logic)
  const [isDragging, setIsDragging] = useState(false);
  
  // Update slider value ref when audio progress changes (if not dragging)
  useEffect(() => {
    if (!isDragging) {
      // Store rounded value in ref
      const roundedProgress = roundToThreeDecimals(audioProgress);
      sliderValueRef.current = roundedProgress;
      lastPositionRef.current = roundedProgress; // Keep track of last known good position
    }
  }, [audioProgress, isDragging]);
  
  // Ensure slider value is always valid
  useEffect(() => {
    // Initialize with current progress when component mounts
    if (sliderValueRef.current === 0 && audioProgress > 0) {
      const roundedProgress = roundToThreeDecimals(audioProgress);
      sliderValueRef.current = roundedProgress;
      lastPositionRef.current = roundedProgress;
    }
  }, [audioProgress]);

  // Toggle play/pause
  const togglePlayback = async () => {
    if (!soundRef.current) return;
    
    try {
      if (isAudioPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };
  
  // Memoized handler for slider value change (during dragging)
  const handleSliderValueChange = useCallback((value: number) => {
    // Round the value to 3 decimal places
    const roundedValue = roundToThreeDecimals(value);
    
    // Handle the start of a new drag
    if (!isDragging) {
      const now = Date.now();
      // Only process drag start if it's been at least 300ms since the last one
      if (now - lastDragTimeRef.current > 300) {
        // ALWAYS use the last known position as the initial value for a new drag
        // This ensures consistency and prevents the slider from jumping incorrectly
        if (lastPositionRef.current > 0) {
          // If we have a valid last position, use it
          console.log('Using last known position for drag start:', lastPositionRef.current);
          sliderValueRef.current = lastPositionRef.current;
        } else {
          // Otherwise use the current audio progress or the provided value
          sliderValueRef.current = audioProgress > 0 ? audioProgress : roundedValue;
        }
        
        console.log('Starting drag, corrected initial value:', sliderValueRef.current);
        lastDragTimeRef.current = now;
        setIsDragging(true);
        isDraggingRef.current = true; // Update ref for use in onPlaybackStatusUpdate
      }
      return; // Skip the first value update to ensure we start from the correct position
    }
    
    // For subsequent drag events, update the position normally
    sliderValueRef.current = roundedValue;
  }, [isDragging, audioProgress]);
  
  // Memoized handler for sliding complete with debounce to prevent multiple rapid calls
  const handleSlidingComplete = useCallback(
    debounce(async (value: number) => {
      // Round the value to 3 decimal places
      const roundedValue = roundToThreeDecimals(value);
      console.log('Sliding complete, final value:', roundedValue);
      
      // Validate the value to ensure it's reasonable
      const validValue = Number.isFinite(roundedValue) && roundedValue >= 0 && roundedValue <= 1 
        ? roundedValue 
        : roundToThreeDecimals(audioProgress); // Fall back to current progress if value is invalid
      
      // Store the final position for future reference
      lastPositionRef.current = validValue;
      
      // Update the global state immediately for visual feedback
      setAudioProgress(validValue);
      
      if (!soundRef.current) return;
      
      try {
        // Get current status - we only need durationMillis
        const { durationMillis } = await soundRef.current.getStatusAsync();
        
        if (durationMillis) {
          // Calculate position and seek
          const position = validValue * durationMillis;
          
          // Make the seek operation more reliable by awaiting it
          // This ensures the audio position is updated before we reset the dragging state
          await soundRef.current.setPositionAsync(position);
          
          // Add a small delay before resetting the dragging state
          // This ensures the seek operation completes and the UI updates properly
          setTimeout(() => {
            setIsDragging(false);
            isDraggingRef.current = false;
          }, 100);
        }
      } catch (error) {
        console.error('Error getting audio status:', error);
        // Reset dragging state even if there's an error
        setIsDragging(false);
        isDraggingRef.current = false;
      }
    }, 50), // 50ms debounce time
    [setAudioProgress, audioProgress]
  );
  
  // If no audio URL is provided, don't render anything
  if (!audioUrl) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {isAudioLoading ? (
        <ActivityIndicator size="small" color="#1DB954" />
      ) : (
        <>
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayback}
            accessibilityLabel={isAudioPlaying ? "Pause audio" : "Play audio"}
            accessibilityHint={isAudioPlaying ? "Pauses the audio playback" : "Starts playing the audio"}
          >
            <MaterialIcons
              name={isAudioPlaying ? "pause" : "play-arrow"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          
          <View style={styles.sliderContainer}>
            <MemoizedSlider
              // Always use the most reliable value source, prioritizing:
              // 1. Current slider value during dragging
              // 2. Last known good position as fallback
              // 3. Current audio progress as final fallback
              value={isDragging ? sliderValueRef.current : (sliderValueRef.current || lastPositionRef.current || audioProgress)}
              onValueChange={handleSliderValueChange}
              onSlidingComplete={handleSlidingComplete}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    width: 240, // Doubled from 120px to 240px for longer slider
  },
  playButton: {
    width: 30, // Slightly reduced from 32px
    height: 30, // Slightly reduced from 32px
    borderRadius: 15,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    height: 20,
    width: '100%',
  },
  sliderThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sliderTrack: {
    height: 2,
  },
  label: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
  }
});

export default AudioPlayer;
