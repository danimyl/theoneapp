/**
 * Audio store for managing audio playback state
 * 
 * This store is separate from the bookStore to prevent unnecessary re-renders
 * when audio state changes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioState {
  // Audio playback state
  isAudioPlaying: boolean;
  isAudioLoading: boolean;
  audioProgress: number;
  
  // Audio control actions
  setIsAudioPlaying: (isPlaying: boolean) => void;
  setIsAudioLoading: (isLoading: boolean) => void;
  setAudioProgress: (progress: number) => void;
  resetAudioState: () => void;
}

const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      // Audio state
      isAudioPlaying: false,
      isAudioLoading: false,
      audioProgress: 0,
      
      // Audio control actions
      setIsAudioPlaying: (isPlaying) => 
        set({ isAudioPlaying: isPlaying }),
        
      setIsAudioLoading: (isLoading) => 
        set({ isAudioLoading: isLoading }),
        
      setAudioProgress: (progress) => 
        set({ audioProgress: progress }),
        
      resetAudioState: () => 
        set({ 
          isAudioPlaying: false, 
          isAudioLoading: false, 
          audioProgress: 0 
        }),
    }),
    {
      name: 'audio-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

export default useAudioStore;
