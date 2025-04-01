/**
 * Audio Player Component
 * 
 * Handles audio playback for book content using Expo AV.
 * This component manages the audio playback state and controls.
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import useBookStore from '../../store/bookStore';

interface AudioPlayerProps {
  audioUrl: string | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const {
    isAudioPlaying,
    isAudioLoading,
    audioProgress,
    setIsAudioPlaying,
    setIsAudioLoading,
    setAudioProgress,
    resetAudioState
  } = useBookStore();

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
    
    // Update progress if playing
    if (status.isPlaying && status.durationMillis) {
      const progress = status.positionMillis / status.durationMillis;
      setAudioProgress(progress);
    }
    
    // Handle playback completion
    if (status.didJustFinish) {
      setIsAudioPlaying(false);
      setAudioProgress(0);
    }
  };
  
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
  
  // If no audio URL is provided, don't render anything
  if (!audioUrl) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {isAudioLoading ? (
        <ActivityIndicator size="small" color="#1DB954" />
      ) : (
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
      )}
      
      {/* Optional: Add a text label */}
      <Text style={styles.label}>
        {isAudioPlaying ? "Pause" : "Listen"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
  }
});

export default AudioPlayer;
