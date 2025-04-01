/**
 * Book Navigation Tree Component
 * 
 * Displays a hierarchical navigation tree for the book content
 * with expandable volumes, books, and selectable chapters.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useBookStore from '../store/bookStore';
import bookService from '../services/bookService';

interface BookNavigationTreeProps {
  onChapterSelect: () => void;
}

export const BookNavigationTree: React.FC<BookNavigationTreeProps> = ({ onChapterSelect }) => {
  const {
    selectedVolumeId,
    selectedBookId,
    selectedChapterId,
    setSelectedVolume,
    setSelectedBook,
    setSelectedChapter,
    setCurrentContent,
    setIsLoading,
    setError
  } = useBookStore();

  // Local state for expanded items
  const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  
  // Get navigation data and log for debugging
  const navigation = bookService.getNavigation();
  
  // Log navigation data for debugging
  useEffect(() => {
    console.log('BookNavigationTree - Navigation data:', 
      `Volumes: ${navigation.length}, ` +
      `First volume books: ${navigation[0]?.books?.length || 0}`
    );
  }, [navigation]);
  
  // Initialize expanded state
  useEffect(() => {
    // Auto-expand the first volume if none is selected
    if (navigation.length > 0 && !selectedVolumeId) {
      setExpandedVolumes(prev => ({
        ...prev,
        [navigation[0].id]: true
      }));
    }
    
    // Auto-expand selected items
    if (selectedVolumeId) {
      setExpandedVolumes(prev => ({
        ...prev,
        [selectedVolumeId]: true
      }));
    }
    
    if (selectedBookId) {
      setExpandedBooks(prev => ({
        ...prev,
        [selectedBookId]: true
      }));
    }
  }, [selectedVolumeId, selectedBookId, navigation]);

  // Toggle volume expansion
  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes(prev => ({
      ...prev,
      [volumeId]: !prev[volumeId]
    }));
  };

  // Toggle book expansion
  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => ({
      ...prev,
      [bookId]: !prev[bookId]
    }));
  };

  // Handle volume selection
  const handleVolumeSelect = (volumeId: string) => {
    setSelectedVolume(volumeId);
    toggleVolume(volumeId);
  };

  // Handle book selection
  const handleBookSelect = (bookId: string) => {
    setSelectedBook(bookId);
    toggleBook(bookId);
  };

  // Handle chapter selection with debounce to prevent rapid multiple selections
  const [isSelecting, setIsSelecting] = useState(false);
  
  const handleChapterSelect = async (volumeId: string, bookId: string, chapterId: string) => {
    // Prevent multiple rapid selections
    if (isSelecting) {
      console.log('Selection in progress, ignoring request');
      return;
    }
    
    // Set selection state
    setIsSelecting(true);
    setSelectedChapter(chapterId);
    setIsLoading(true);
    
    try {
      // First close the drawer to reduce UI pressure
      onChapterSelect();
      
      // Small delay to allow UI to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Load the content
      const content = await bookService.getChapterContent(volumeId, bookId, chapterId);
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      // Set content and clear errors
      setCurrentContent(content);
      setError(null);
    } catch (error) {
      console.error('Error loading chapter content:', error);
      setError('Failed to load chapter content. Please try again.');
    } finally {
      setIsLoading(false);
      
      // Reset selection state after a delay
      setTimeout(() => {
        setIsSelecting(false);
      }, 300);
    }
  };

  // Clean title (remove any unwanted text and format properly)
  const cleanTitle = (title: string) => {
    // Remove "Expand" text if present (common in volume titles)
    let cleanedTitle = title.replace(/Expand$/i, '').trim();
    
    // Remove any trailing pipe characters and trim
    cleanedTitle = cleanedTitle.replace(/\s*\|\s*$/, '').trim();
    
    // Remove "Print Book" or "eBook" suffixes that might be in chapter titles
    cleanedTitle = cleanedTitle.replace(/\s*\|\s*(Print Book|eBook)$/, '').trim();
    
    // For debugging
    if (title !== cleanedTitle) {
      console.log(`Cleaned title: "${title}" -> "${cleanedTitle}"`);
    }
    
    return cleanedTitle;
  };

  // Extract chapter ID from URL
  const extractIdFromUrl = (url: string): string => {
    // URLs in scraped-navigation.json are in the format:
    // https://www.newmessage.org/the-message/volume-1/god-spoken-again/the-proclamation/
    
    try {
      // Extract the last part of the URL (the chapter ID)
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      return pathParts[pathParts.length - 1] || '';
    } catch (error) {
      // Fallback for invalid URLs
      console.warn(`Invalid URL format: ${url}`);
      const parts = url.split('/').filter(part => part.length > 0);
      return parts[parts.length - 1] || '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>The One Book</Text>
      
      {navigation.length > 0 ? (
        navigation.map(volume => (
          <View key={volume.id} style={styles.volumeContainer}>
            {/* Volume header */}
            <TouchableOpacity 
              style={[
                styles.volumeHeader,
                selectedVolumeId === volume.id && styles.selectedItem
              ]}
              onPress={() => handleVolumeSelect(volume.id)}
            >
              <Text style={styles.volumeTitle}>{cleanTitle(volume.title)}</Text>
              <MaterialIcons 
                name={expandedVolumes[volume.id] ? "expand-less" : "expand-more"} 
                size={24} 
                color="#999999" 
              />
            </TouchableOpacity>
            
            {/* Books within volume */}
            {expandedVolumes[volume.id] && (
              <View style={styles.booksContainer}>
                {volume.books.map(book => (
                  <View key={book.id}>
                    {/* Book header */}
                    <TouchableOpacity 
                      style={[
                        styles.bookHeader,
                        selectedBookId === book.id && styles.selectedItem
                      ]}
                      onPress={() => handleBookSelect(book.id)}
                    >
                      <Text style={styles.bookTitle}>{cleanTitle(book.title)}</Text>
                      <MaterialIcons 
                        name={expandedBooks[book.id] ? "expand-less" : "expand-more"} 
                        size={20} 
                        color="#999999" 
                      />
                    </TouchableOpacity>
                    
                    {/* Chapters within book */}
                    {expandedBooks[book.id] && (
                      <View style={styles.chaptersContainer}>
                        {book.chapters.map(chapter => (
                          <TouchableOpacity 
                            key={chapter.id}
                            style={[
                              styles.chapterItem,
                              selectedChapterId === chapter.id && styles.selectedChapter
                            ]}
                            onPress={() => handleChapterSelect(volume.id, book.id, chapter.id)}
                          >
                            <Text 
                              style={[
                                styles.chapterTitle,
                                selectedChapterId === chapter.id && styles.selectedChapterText
                              ]}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {cleanTitle(chapter.title)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No book data available. Please run the sync-book-data.mjs script to populate book content.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  volumeContainer: {
    marginBottom: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  volumeTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  booksContainer: {
    marginLeft: 16,
    marginTop: 8,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    marginTop: 4,
  },
  bookTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  chaptersContainer: {
    marginLeft: 16,
    marginTop: 4,
  },
  chapterItem: {
    padding: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginTop: 4,
  },
  chapterTitle: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  selectedItem: {
    backgroundColor: '#333333',
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  selectedChapter: {
    backgroundColor: '#333333',
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
  },
  selectedChapterText: {
    color: '#1DB954',
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontSize: 16,
  },
});
