# Book Feature Migration

This document outlines the implementation of the book feature in the mobile app, migrated from the web app.

## Overview

The book feature allows users to browse and read content from "The One Book" in a hierarchical navigation structure:
- Volumes
- Books
- Chapters

## Implementation Details

### Data Structure

- **Navigation**: Hierarchical structure defined in `src/data/book/navigation.json`
- **Content**: Individual chapter content stored in `src/data/book/content/*.json` files
- **Types**: TypeScript interfaces defined in `src/types/book.d.ts`

### Components

1. **BookScreen**: Main container with modal-based navigation (simplified approach)
2. **BookNavigationTree**: Hierarchical navigation menu in the modal
3. **BookContentScreen**: Content display with text size controls

### State Management

- **bookStore.ts**: Zustand store for managing book state
- **bookService.ts**: Service for loading and managing book data

### Navigation Approach

We've implemented a simplified modal-based navigation approach instead of using drawer navigation to avoid dependency issues with React Native Reanimated. This approach:

1. Uses React Native's built-in Modal component instead of drawer navigation
2. Properly respects device safe areas and status bar
3. Ensures the menu button is always accessible in all states (welcome, loading, error, content)
4. Provides consistent navigation experience across the app

```javascript
export const BookScreen = () => {
  const [isNavigationVisible, setNavigationVisible] = useState(false);
  
  const openNavigation = () => {
    setNavigationVisible(true);
  };
  
  const closeNavigation = () => {
    setNavigationVisible(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar with proper configuration */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#121212"
        translucent={false}
      />
      
      {/* Main Content */}
      <BookContentScreen openDrawer={openNavigation} />
      
      {/* Navigation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isNavigationVisible}
        onRequestClose={closeNavigation}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.navigationContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={closeNavigation} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Book Navigation</Text>
            </View>
            <BookNavigationTree onChapterSelect={closeNavigation} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
```

### UI Improvements

We've made several UI improvements to ensure a better user experience:

1. **Consistent Headers**: Added headers to all states (welcome, loading, error, content) to ensure the menu button is always accessible
2. **Safe Area Handling**: Properly implemented SafeAreaView to respect device notch and status bar areas
3. **Improved Menu Button**: Enhanced visibility and accessibility of the menu button
4. **Platform-Specific Styling**: Added platform-specific styles to ensure consistent appearance across iOS and Android

## Current Limitations

1. **Content Loading**: Now supports loading all content files dynamically using Expo's FileSystem API. The bookService attempts to load content files from the app's document directory, with fallbacks to specific known chapters that are bundled with the app.

2. **Dynamic Imports**: React Native doesn't support dynamic imports with template literals. We've completely removed dynamic require statements and instead use:
   - Static imports for a few key chapters
   - FileSystem API for reading files from the document directory
   - Graceful fallbacks with placeholder content when files aren't available

3. **Data Synchronization**: The sync-book-data.mjs script copies all book content files from the web app to the mobile app's bundle. At runtime, these files are accessed from the app's document directory.

4. **Simplified Build Configuration**: The project uses the default Expo/React Native build configuration without any custom Babel plugins or presets. This simplifies the build process and avoids dependency conflicts.

## Future Improvements

1. **Content Loading Strategy**:
   - Implement a more scalable approach for loading content files
   - Consider using a content registry or manifest file

2. **Reading Position Memory**:
   - Save and restore reading position for each chapter
   - Implement "continue reading" functionality

3. **Audio Support**:
   - Add audio playback for chapters with audio content
   - Implement playback controls and progress tracking

4. **Search Functionality**:
   - Add ability to search across all book content
   - Implement search results highlighting

5. **Offline Support**:
   - Improve caching for offline reading
   - Add download management for content

## Usage Instructions

1. **Data Synchronization**:
   ```
   cd ..
   node sync-data.mjs
   ```

2. **Running the App**:
   ```
   cd TheOneApp
   npm start
   ```

3. **Accessing the Book Feature**:
   - Tap the "Book" tab in the bottom navigation
   - Tap the menu button to open the navigation modal
   - Navigate through volumes, books, and chapters in the modal
   - Tap on a chapter to view its content

## Dependencies

- @react-navigation/native: For navigation infrastructure
- react-native-safe-area-context: For safe area handling
- react-native-screens: For screen management
- react-native-render-html: For rendering HTML content
