# Audio Player Implementation

This document describes the implementation of the audio player feature for book content in TheOneApp mobile application.

## Overview

The audio player allows users to listen to audio recordings of book chapters while reading the text. The player is integrated into the book content screen and appears in the header when audio is available for the current chapter.

## Components

### 1. Audio State Management

The audio playback state is managed in the BookStore using Zustand:

```typescript
// In bookStore.ts
interface BookState {
  // ... other state properties ...
  
  // Audio playback state
  isAudioPlaying: boolean;
  isAudioLoading: boolean;
  audioProgress: number;
  
  // ... other actions ...
  
  // Audio control actions
  setIsAudioPlaying: (isPlaying: boolean) => void;
  setIsAudioLoading: (isLoading: boolean) => void;
  setAudioProgress: (progress: number) => void;
  resetAudioState: () => void;
}
```

This state is initialized with default values and updated as the audio playback status changes:

```typescript
// Initial audio state
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
```

### 2. AudioPlayer Component

The `AudioPlayer` component (`src/components/audio/AudioPlayer.tsx`) handles the audio playback functionality using the Expo AV library:

- It receives an `audioUrl` prop from the parent component
- It manages the audio playback lifecycle (loading, playing, pausing, cleanup)
- It updates the global audio state in the BookStore
- It renders play/pause controls in the header

Key features:
- Audio is loaded asynchronously when the component mounts
- Audio playback state is tracked and updated in real-time
- Audio is properly unloaded when the component unmounts
- The player only appears when audio is available

### 3. Integration with BookContentScreen

The `BookContentScreen` component integrates the AudioPlayer in the header when audio is available:

```tsx
<View style={styles.controls}>
  {/* Audio player - only shown when audio is available */}
  {currentContent.audioUrl && (
    <AudioPlayer audioUrl={currentContent.audioUrl} />
  )}
  
  <TouchableOpacity
    style={styles.iconButton}
    onPress={openDrawer}
    accessibilityLabel="Open navigation menu"
    accessibilityHint="Opens the book navigation menu"
  >
    <MaterialIcons name="menu" size={24} color="#FFFFFF" />
  </TouchableOpacity>
</View>
```

## Audio Playback Lifecycle

1. **Loading**: When a chapter with audio is selected, the AudioPlayer component initializes and begins loading the audio file.
2. **Ready**: Once loaded, the play button is displayed in the header.
3. **Playing**: When the user taps play, the audio begins playback and the button changes to a pause icon.
4. **Pausing**: The user can pause playback at any time by tapping the pause button.
5. **Completion**: When the audio finishes playing, the player automatically resets to the beginning.
6. **Cleanup**: When navigating away from a chapter, the audio is properly unloaded to free up resources.

## Technical Implementation Details

### Audio Configuration

The audio player is configured with the following settings:

```typescript
await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
});
```

These settings ensure:
- Audio plays even when the device is in silent mode (iOS)
- Audio continues playing when the app is in the background
- Audio volume is reduced when other apps play sounds (Android)

### Error Handling

The implementation includes robust error handling:
- Errors during audio loading are caught and logged
- Playback errors are detected and reported
- Resources are properly cleaned up even if errors occur

## Future Improvements

Potential enhancements for the audio player:

1. **Progress Bar**: Add a visual progress indicator showing the current position in the audio.
2. **Playback Speed**: Allow users to adjust the playback speed (0.5x, 1x, 1.5x, 2x).
3. **Skip Controls**: Add buttons to skip forward/backward by 15 seconds.
4. **Background Playback**: Enhance background playback with lock screen controls.
5. **Offline Support**: Add the ability to download audio for offline listening.
