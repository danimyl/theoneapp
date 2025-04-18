/**
 * Book store for managing book state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookContent } from '../types/book';

interface BookState {
  // Currently selected items
  selectedVolumeId: string | null;
  selectedBookId: string | null;
  selectedChapterId: string | null;
  
  // Whether the book drawer is open
  isBookDrawerOpen: boolean;
  
  // Current content
  currentContent: BookContent | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Text size preference
  textSize: number;
  
  // Search query for chapter filtering
  searchQuery: string;
  
  // Actions
  setSelectedVolume: (volumeId: string) => void;
  setSelectedBook: (bookId: string) => void;
  setSelectedChapter: (chapterId: string) => void;
  toggleBookDrawer: () => void;
  openBookDrawer: () => void;
  closeBookDrawer: () => void;
  setCurrentContent: (content: BookContent) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTextSize: (size: number) => void;
  resetError: () => void;
  setSearchQuery: (query: string) => void;
}

const useBookStore = create<BookState>()(
  persist(
    (set) => ({
      // Initial state
      selectedVolumeId: null,
      selectedBookId: null,
      selectedChapterId: null,
      isBookDrawerOpen: false,
      currentContent: null,
      isLoading: false,
      error: null,
      textSize: 16, // Default text size in pixels
      searchQuery: '', // Initial empty search query
      
      // Actions
      setSelectedVolume: (volumeId) => 
        set({ 
          selectedVolumeId: volumeId,
          // Reset book and chapter selection when changing volume
          selectedBookId: null,
          selectedChapterId: null
        }),
      
      setSelectedBook: (bookId) => 
        set({ 
          selectedBookId: bookId,
          // Reset chapter selection when changing book
          selectedChapterId: null
        }),
      
      setSelectedChapter: (chapterId) => 
        set({ selectedChapterId: chapterId }),
      
      toggleBookDrawer: () => 
        set((state) => ({ isBookDrawerOpen: !state.isBookDrawerOpen })),
      
      openBookDrawer: () => 
        set({ isBookDrawerOpen: true }),
      
      closeBookDrawer: () => 
        set({ isBookDrawerOpen: false }),
      
      setCurrentContent: (content) => 
        set({ currentContent: content }),
      
      setIsLoading: (isLoading) => 
        set({ isLoading }),
      
      setError: (error) => 
        set({ error }),
        
      resetError: () => 
        set({ error: null }),
        
      setTextSize: (size) => 
        set({ textSize: size }),
      
      setSearchQuery: (query) =>
        set({ searchQuery: query }),
    }),
    {
      name: 'book-storage',
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

export default useBookStore;
