import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBookStore = create(
  persist(
    (set) => ({
      // Currently selected items
      selectedVolumeId: null,
      selectedBookId: null,
      selectedChapterId: null,
      
      // Whether the book menu is open
      isBookMenuOpen: false,
      
      // Set selected volume
      setSelectedVolume: (volumeId) => 
        set({ 
          selectedVolumeId: volumeId,
          // Reset book and chapter selection when changing volume
          selectedBookId: null,
          selectedChapterId: null
        }),
      
      // Set selected book
      setSelectedBook: (bookId) => 
        set({ 
          selectedBookId: bookId,
          // Reset chapter selection when changing book
          selectedChapterId: null
        }),
      
      // Set selected chapter
      setSelectedChapter: (chapterId) => 
        set({ selectedChapterId: chapterId }),
      
      // Toggle book menu
      toggleBookMenu: () => 
        set((state) => ({ isBookMenuOpen: !state.isBookMenuOpen })),
      
      // Open book menu
      openBookMenu: () => 
        set({ isBookMenuOpen: true }),
      
      // Close book menu
      closeBookMenu: () => 
        set({ isBookMenuOpen: false }),
        
      // Current content
      currentContent: null,
      
      // Set current content
      setCurrentContent: (content) => 
        set({ currentContent: content }),
        
      // Loading state
      isLoading: false,
      
      // Set loading state
      setIsLoading: (isLoading) => 
        set({ isLoading }),
        
      // Error state
      error: null,
      
      // Set error state
      setError: (error) => 
        set({ error }),
        
      // Reset error state
      resetError: () => 
        set({ error: null }),
        
      // Last visited path (for history)
      lastVisitedPath: null,
      
      // Set last visited path
      setLastVisitedPath: (path) => 
        set({ lastVisitedPath: path }),
    }),
    {
      name: 'book-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useBookStore;
