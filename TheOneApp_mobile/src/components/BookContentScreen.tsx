/**
 * Book Content Screen Component
 * 
 * Displays the content of a selected book chapter with controls
 * for text size adjustment and navigation.
 * Includes an audio player in the header when audio is available.
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useBookStore from '../store/bookStore';
import useAudioStore from '../store/audioStore';
import bookService from '../services/bookService';
import AudioPlayer from './audio/AudioPlayer';
import CustomHtmlRenderer from './CustomHtmlRenderer';

// Memoized AudioPlayer with custom comparison to prevent unnecessary re-renders
const MemoizedAudioPlayer = memo(AudioPlayer, (prevProps, nextProps) => {
  // Only re-render if audioUrl changes
  console.log('AudioPlayer props comparison:', 
    'prev:', prevProps.audioUrl, 
    'next:', nextProps.audioUrl, 
    'equal:', prevProps.audioUrl === nextProps.audioUrl);
  return prevProps.audioUrl === nextProps.audioUrl;
});

interface BookContentScreenProps {
  openDrawer: () => void;
}

export const BookContentScreen: React.FC<BookContentScreenProps> = ({ openDrawer }) => {
  const { theme, isDark } = useTheme();
  const {
    selectedVolumeId,
    selectedBookId,
    selectedChapterId,
    currentContent,
    isLoading,
    error,
    textSize,
    setTextSize
  } = useBookStore();
  
  // Get resetAudioState from audioStore to reset audio state when content changes
  const resetAudioState = useAudioStore(state => state.resetAudioState);
  
  const { width } = useWindowDimensions();
  
  // Get current chapter info for display
  const getCurrentChapterInfo = () => {
    if (!selectedVolumeId || !selectedBookId || !selectedChapterId) {
      return { volumeTitle: '', bookTitle: '', chapterTitle: '' };
    }

    const volume = bookService.getVolumeById(selectedVolumeId);
    const book = bookService.getBookById(selectedVolumeId, selectedBookId);
    const chapter = bookService.getChapterById(selectedVolumeId, selectedBookId, selectedChapterId);

    return {
      volumeTitle: volume?.title || '',
      bookTitle: book?.title || '',
      chapterTitle: chapter?.title || ''
    };
  };

  const { volumeTitle, bookTitle, chapterTitle } = getCurrentChapterInfo();
  
  // Reset audio state when content changes
  useEffect(() => {
    resetAudioState();
  }, [currentContent, resetAudioState]);
  
  // Memoize the renderersProps object to prevent unnecessary rerenders
  const renderersProps = useMemo(() => ({
    a: {
      onPress: (_: any, href: string) => {
        console.log('Link pressed:', href);
        // You could add logic here to handle link presses
      }
    }
  }), []); // Empty dependency array means this will only be created once
  
  // Handle link presses
  const handleLinkPress = (url: string) => {
    console.log('Link pressed:', url);
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };
  
  // Add render logging
  console.log('BookContentScreen rendering');
  
  // If no content is selected, show a welcome message
  if (!currentContent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        {/* Header with app title and menu button */}
        <View style={[styles.header, { 
          backgroundColor: theme.bgCard,
          borderBottomColor: theme.borderColor 
        }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.welcomeCard, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>Welcome to The One Book</Text>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
            Select a chapter from the menu to begin reading.
          </Text>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.buttonAccent }]}
            onPress={openDrawer}
            accessibilityLabel="Open book navigation"
            accessibilityHint="Opens the book navigation menu to select chapters"
          >
            <MaterialIcons name="menu" size={20} color={isDark ? '#FFFFFF' : '#333333'} />
            <Text style={[styles.menuButtonText, { color: isDark ? '#FFFFFF' : '#333333' }]}>Open Book Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        {/* Header with app title and menu button */}
        <View style={[styles.header, { 
          backgroundColor: theme.bgCard,
          borderBottomColor: theme.borderColor 
        }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.loadingContainer, { backgroundColor: theme.bgPrimary }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If there's an error, show an error message
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        {/* Header with app title and menu button */}
        <View style={[styles.header, { 
          backgroundColor: theme.bgCard,
          borderBottomColor: theme.borderColor 
        }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.errorContainer, { 
          backgroundColor: theme.bgCard,
          borderColor: theme.error 
        }]}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>Error</Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      {/* Header with chapter title and controls */}
      <View style={[styles.header, { 
        backgroundColor: theme.bgCard,
        borderBottomColor: theme.borderColor 
      }]}>
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.title, { color: theme.textPrimary }]} 
            numberOfLines={2} 
            ellipsizeMode="tail"
          >
            {currentContent.title || chapterTitle}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={openDrawer}
            accessibilityLabel="Open navigation menu"
            accessibilityHint="Opens the book navigation menu"
          >
            <MaterialIcons name="menu" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Text size and audio controls */}
      <View style={[styles.textSizeControls, { 
        backgroundColor: theme.bgCard,
        borderBottomColor: theme.borderColor 
      }]}>
        <View style={styles.leftControls}>
          <MaterialIcons name="format-size" size={20} color={theme.textSecondary} />
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.max(12, textSize - 2))}
          >
            <MaterialIcons name="remove" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.min(24, textSize + 2))}
          >
            <MaterialIcons name="add" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Audio player - only shown when audio is available */}
        {currentContent.audioUrl && (
          <View style={styles.audioContainer}>
            <MemoizedAudioPlayer audioUrl={currentContent.audioUrl} />
          </View>
        )}
      </View>
      
      {/* Content */}
      <ScrollView style={[styles.contentScroll, { backgroundColor: theme.bgPrimary }]}>
        <View style={[styles.contentContainer, { backgroundColor: theme.bgPrimary }]}>
          <CustomHtmlRenderer
            html={currentContent.content}
            textSize={textSize}
            onLinkPress={handleLinkPress}
          />
          
          {/* Source Link - only shown when sourceUrl is available */}
          {currentContent.sourceUrl && (
            <Text 
              style={[styles.sourceLink, { color: theme.accent }]}
              onPress={() => Linking.openURL(currentContent.sourceUrl)}
            >
              Read this Teaching on newmessage.org
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  textSizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.3, // Reduced from 40% to 30% of the space
  },
  audioContainer: {
    marginLeft: 'auto',
    paddingRight: 8,
    flex: 0.7, // Increased from 60% to 70% of the space for the audio player
  },
  sizeButton: {
    padding: 8,
    marginLeft: 8,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  welcomeCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#CCCCCC',
  },
  errorContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4D4F',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4D4F',
    marginBottom: 8,
  },
  errorText: {
    color: '#CCCCCC',
  },
  sourceLink: {
    color: '#0000FF',  // Standard hyperlink blue
    textDecorationLine: 'underline',
    marginTop: 24,
    marginBottom: 60,  // Add a lot of padding below the link
    textAlign: 'center',
  },
});
