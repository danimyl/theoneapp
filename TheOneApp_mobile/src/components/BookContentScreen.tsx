/**
 * Book Content Screen Component
 * 
 * Displays the content of a selected book chapter with controls
 * for text size adjustment and navigation.
 * Includes an audio player in the header when audio is available.
 */

import React, { useState, useMemo } from 'react';
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
import bookService from '../services/bookService';
import AudioPlayer from './audio/AudioPlayer';
import CustomHtmlRenderer from './CustomHtmlRenderer';

interface BookContentScreenProps {
  openDrawer: () => void;
}

export const BookContentScreen: React.FC<BookContentScreenProps> = ({ openDrawer }) => {
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
  
  // If no content is selected, show a welcome message
  if (!currentContent) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with app title and menu button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to The One Book</Text>
          <Text style={styles.welcomeText}>
            Select a chapter from the menu to begin reading.
          </Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openDrawer}
            accessibilityLabel="Open book navigation"
            accessibilityHint="Opens the book navigation menu to select chapters"
          >
            <MaterialIcons name="menu" size={20} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Open Book Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with app title and menu button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If there's an error, show an error message
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with app title and menu button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>The One Book</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openDrawer}
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens the book navigation menu"
            >
              <MaterialIcons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with chapter title and controls */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
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
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Text size and audio controls */}
      <View style={styles.textSizeControls}>
        <View style={styles.leftControls}>
          <MaterialIcons name="format-size" size={20} color="#CCCCCC" />
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.max(12, textSize - 2))}
          >
            <MaterialIcons name="remove" size={20} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.min(24, textSize + 2))}
          >
            <MaterialIcons name="add" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
        
        {/* Audio player - only shown when audio is available */}
        {currentContent.audioUrl && (
          <View style={styles.audioContainer}>
            <AudioPlayer audioUrl={currentContent.audioUrl} />
          </View>
        )}
      </View>
      
      {/* Content */}
      <ScrollView style={styles.contentScroll}>
        <View style={styles.contentContainer}>
          <CustomHtmlRenderer
            html={currentContent.content}
            textSize={textSize}
            onLinkPress={handleLinkPress}
          />
          
          {/* Source Link - only shown when sourceUrl is available */}
          {currentContent.sourceUrl && (
            <Text 
              style={styles.sourceLink}
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
  },
  audioContainer: {
    marginLeft: 'auto',
    paddingRight: 16, // Add more right-side padding
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
