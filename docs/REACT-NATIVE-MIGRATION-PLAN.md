# TheOneApp: React Native Migration Plan

This document outlines a structured approach to migrating TheOneApp from React web to React Native using Expo.

## Phase 1: Environment Setup

### 1.1 Create New Expo Project
```bash
# Install Expo CLI if not already installed
npm install -g expo-cli

# Create a new Expo project with TypeScript template
npx create-expo-app TheOneApp-Mobile --template expo-template-blank-typescript

# Navigate to project directory
cd TheOneApp-Mobile
```

### 1.2 Configure Dependencies
```bash
# Install core dependencies
npm install react@18.2.0 react-native@0.73.2

# Install state management
npm install zustand@5.0.3

# Install navigation
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Install storage
npm install @react-native-async-storage/async-storage

# Install UI components
npm install react-native-vector-icons @expo/vector-icons

# Install notifications
npm install expo-notifications

# Install audio support
npm install expo-av

# Install other required Expo modules
npm install expo-file-system expo-document-picker expo-sharing
```

### 1.3 Configure TypeScript
Update `tsconfig.json` to ensure compatibility with React Native:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Phase 2: Project Structure Setup

### 2.1 Create Directory Structure
```bash
# Create core directories
mkdir -p src/components
mkdir -p src/services
mkdir -p src/store
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/data
mkdir -p src/theme
mkdir -p src/utils
mkdir -p assets/audio
```

### 2.2 Copy Data Files
```bash
# Copy JSON data files
cp ../theoneapp/src/data/steps.json src/data/
cp ../theoneapp/src/data/secrets.json src/data/
cp ../theoneapp/src/data/practice-reminders.json src/data/
cp -r ../theoneapp/src/data/book src/data/

# Copy audio files
cp ../theoneapp/aud/bell.mp3 assets/audio/
```

### 2.3 Create Theme Configuration
Create `src/theme/index.ts` with theme variables:

```typescript
// Theme colors based on Spotify theme
export const colors = {
  spotifyBlack: '#121212',
  spotifyDarker: '#080808',
  spotifyCard: '#181818',
  spotifyCardHover: '#282828',
  spotifyGreen: '#1DB954',
  spotifyGreenHover: '#1ED760',
  primaryText: '#FFFFFF',
  secondaryText: '#B3B3B3',
  tertiaryText: '#6A6A6A',
  secondaryButton500: '#535353',
  secondaryButton600: '#636363',
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

## Phase 3: Core Infrastructure

### 3.1 Type Definitions
Create `src/types/step.ts`:

```typescript
export interface Step {
  id: number;
  title: string;
  instructions: string;
  practices: string[];
  durations: number[];
  hourly: boolean;
}

export interface StepTitle {
  id: number;
  title: string;
  hourly: boolean;
}
```

### 3.2 State Management
Create `src/store/settingsStore.ts`:

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  alwaysHourlyReminders: boolean;
  setAlwaysHourlyReminders: (value: boolean) => void;
  sleepStart: string;
  setSleepStart: (time: string) => void;
  sleepEnd: string;
  setSleepEnd: (time: string) => void;
  stepForToday: number | null;
  setStepForToday: (stepId: number | null) => void;
  practiceChecks: Record<number, boolean[]>;
  setPracticeChecks: (stepId: number, checks: boolean[]) => void;
  lastPracticeStartDate: string | null;
  setLastPracticeStartDate: (date: string | null) => void;
  lastStepAdvanceDate: string | null;
  setLastStepAdvanceDate: (date: string | null) => void;
  lastSecretShownDate: string | null;
  setLastSecretShownDate: (date: string | null) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      alwaysHourlyReminders: false,
      setAlwaysHourlyReminders: (value) =>
        set({ alwaysHourlyReminders: value }),
      sleepStart: "22:00",
      setSleepStart: (time) => set({ sleepStart: time }),
      sleepEnd: "07:00",
      setSleepEnd: (time) => set({ sleepEnd: time }),
      stepForToday: null,
      setStepForToday: (stepId) => set({ stepForToday: stepId }),
      practiceChecks: {},
      setPracticeChecks: (stepId, checks) =>
        set((state) => ({
          practiceChecks: {
            ...state.practiceChecks,
            [stepId]: checks,
          },
        })),
      lastPracticeStartDate: null,
      setLastPracticeStartDate: (date) => set({ lastPracticeStartDate: date }),
      lastStepAdvanceDate: null,
      setLastStepAdvanceDate: (date) => set({ lastStepAdvanceDate: date }),
      lastSecretShownDate: null,
      setLastSecretShownDate: (date) => set({ lastSecretShownDate: date }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSettingsStore;
```

### 3.3 Services
Create `src/services/stepService.ts`:

```typescript
import allStepsData from '../data/steps.json';
import { Step, StepTitle } from '../types/step';

// Extract minimal data for all steps (just titles and IDs for dropdown)
const stepTitles: StepTitle[] = allStepsData.steps.map(step => ({
  id: step.id,
  title: step.title,
  hourly: step.hourly || false
}));

// Store for full step data that's already been loaded
const loadedStepsCache = new Map<number, Step>();

/**
 * Service to manage step data with lazy loading
 */
const stepService = {
  /**
   * Get minimal data for all steps (for dropdown)
   * @returns Array of objects with id and title
   */
  getAllStepTitles: (): StepTitle[] => {
    return stepTitles;
  },

  /**
   * Get the total number of steps
   * @returns Total steps count
   */
  getTotalStepsCount: (): number => {
    return stepTitles.length;
  },

  /**
   * Get full data for a specific step by ID
   * This will load from cache if available or fetch the complete data if needed
   * @param stepId The ID of the step to get
   * @returns The complete step data
   */
  getStepById: (stepId: number): Step | undefined => {
    // Check if we already have this step in cache
    if (loadedStepsCache.has(stepId)) {
      return loadedStepsCache.get(stepId);
    }

    // Not in cache, get the full data from the imported data
    const fullStepData = allStepsData.steps.find(step => step.id === stepId);
    
    // Store in cache for future use
    if (fullStepData) {
      loadedStepsCache.set(stepId, fullStepData as Step);
    }
    
    return fullStepData as Step | undefined;
  },

  /**
   * Preload the next step into cache (for smoother experience)
   * @param currentStepId The current step ID
   */
  preloadNextStep: (currentStepId: number): void => {
    const nextStepId = currentStepId + 1;
    if (nextStepId <= stepTitles.length && !loadedStepsCache.has(nextStepId)) {
      // Load into cache but don't return
      stepService.getStepById(nextStepId);
    }
  },

  /**
   * Clear the cache to free memory (optional utility)
   * @param exceptStepId Optional step ID to keep in cache
   */
  clearCache: (exceptStepId: number | null = null): void => {
    if (exceptStepId !== null) {
      // Keep only the specified step
      const stepToKeep = loadedStepsCache.get(exceptStepId);
      loadedStepsCache.clear();
      if (stepToKeep) {
        loadedStepsCache.set(exceptStepId, stepToKeep);
      }
    } else {
      // Clear everything
      loadedStepsCache.clear();
    }
  }
};

export default stepService;
```

Create `src/services/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import useSettingsStore from '../store/settingsStore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // We'll handle sound separately
    shouldSetBadge: false,
  }),
});

/**
 * Service to handle mobile notifications
 */
const notificationService = {
  /**
   * Request notification permissions
   * @returns Promise<boolean> True if permissions granted
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  /**
   * Check if current time is within sleep hours
   * @returns boolean True if current time is within sleep hours
   */
  isWithinSleepHours(): boolean {
    const { sleepStart, sleepEnd } = useSettingsStore.getState();
    
    // Parse sleep times
    const [startHour, startMinute] = sleepStart.split(':').map(Number);
    const [endHour, endMinute] = sleepEnd.split(':').map(Number);
    
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert all times to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const sleepStartInMinutes = startHour * 60 + startMinute;
    const sleepEndInMinutes = endHour * 60 + endMinute;
    
    // Handle the case where sleep time crosses midnight
    if (sleepStartInMinutes > sleepEndInMinutes) {
      // If current time is after sleep start OR before sleep end, it's within sleep hours
      return currentTimeInMinutes >= sleepStartInMinutes || currentTimeInMinutes <= sleepEndInMinutes;
    } else {
      // If current time is between sleep start and sleep end, it's within sleep hours
      return currentTimeInMinutes >= sleepStartInMinutes && currentTimeInMinutes <= sleepEndInMinutes;
    }
  },

  /**
   * Play notification sound
   */
  async playNotificationSound(): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/bell.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  },

  /**
   * Send a notification
   * @param title The notification title
   * @param body The notification body
   * @param playSound Whether to play a sound with the notification
   * @returns Promise<string | null> Notification ID if sent, null otherwise
   */
  async sendNotification(
    title: string, 
    body: string, 
    playSound: boolean = false
  ): Promise<string | null> {
    try {
      // Check if we're in sleep hours
      if (this.isWithinSleepHours()) {
        console.log(`[NOTIFICATION SKIPPED - QUIET HOURS] ${title}`);
        return null;
      }
      
      // Ensure we have permissions
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.log(`[NOTIFICATION PERMISSION DENIED] ${title}`);
        return null;
      }

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { data: 'goes here' },
        },
        trigger: null, // Send immediately
      });

      // Play sound if requested
      if (playSound) {
        await this.playNotificationSound();
      }

      return notificationId;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  },

  /**
   * Send a reminder notification for a step
   * @param stepId Step ID
   * @param stepTitle Step title
   * @param forceNotify Whether to force the notification regardless of settings
   * @returns Promise<string | null> Notification ID if sent, null otherwise
   */
  async sendStepReminder(
    stepId: number, 
    stepTitle: string, 
    forceNotify: boolean = false
  ): Promise<string | null> {
    // If we're in sleep hours, don't send notification
    if (this.isWithinSleepHours() && !forceNotify) {
      console.log(`[HOURLY REMINDER SKIPPED - QUIET HOURS] Step ${stepId}: ${stepTitle}`);
      return null;
    }
    
    return this.sendNotification(
      `Hourly Reminder: Step ${stepId}`,
      stepTitle,
      true // Play sound with hourly reminders
    );
  }
};

export default notificationService;
```

### 3.4 Custom Hooks
Create `src/hooks/useTimer.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const TIMER_TASK = 'TIMER_TASK';

// Register background task
TaskManager.defineTask(TIMER_TASK, async () => {
  // This would be where we handle background timer updates
  // For now, we'll just return success
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

interface UseTimerProps {
  initialTime: number;
  onComplete?: () => void;
}

export default function useTimer({ initialTime, onComplete }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<Date | null>(null);

  // Register background fetch
  useEffect(() => {
    const registerBackgroundFetch = async () => {
      await BackgroundFetch.registerTaskAsync(TIMER_TASK, {
        minimumInterval: 60, // 1 minute minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });
    };

    registerBackgroundFetch();

    return () => {
      BackgroundFetch.unregisterTaskAsync(TIMER_TASK);
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (isRunning) {
        if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
          // App is going to background
          backgroundTimeRef.current = new Date();
        } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
          // App is coming to foreground
          if (backgroundTimeRef.current) {
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - backgroundTimeRef.current.getTime()) / 1000);
            
            // Update timer based on elapsed time
            setTimeLeft(prev => {
              const newTime = Math.max(0, prev - elapsedSeconds);
              if (newTime === 0 && onComplete) {
                onComplete();
              }
              return newTime;
            });
            
            backgroundTimeRef.current = null;
          }
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isRunning, onComplete]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (onComplete) {
              onComplete();
            }
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, timeLeft, onComplete]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = (newTime = initialTime) => {
    setIsRunning(false);
    setTimeLeft(newTime);
  };

  return {
    timeLeft,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimeLeft,
  };
}
```

## Phase 4: Component Migration

### 4.1 Navigation Setup
Create `App.tsx`:

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme';

// Import screens
import StepsScreen from './src/screens/StepsScreen';
import BookScreen from './src/screens/BookScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Create tab navigator
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.spotifyDarker,
            borderTopColor: '#333',
          },
          tabBarActiveTintColor: colors.spotifyGreen,
          tabBarInactiveTintColor: colors.secondaryText,
          headerStyle: {
            backgroundColor: colors.spotifyDarker,
          },
          headerTintColor: colors.primaryText,
        }}
      >
        <Tab.Screen
          name="Steps"
          component={StepsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="footsteps-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Book"
          component={BookScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### 4.2 Core Components
Create `src/components/StepDisplay/index.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import useSettingsStore from '../../store/settingsStore';
import { Step } from '../../types/step';
import { colors, spacing, typography } from '../../theme';

interface StepDisplayProps {
  step: Step;
  stepForToday: number | null;
}

const StepDisplay: React.FC<StepDisplayProps> = ({ step, stepForToday }) => {
  // Safely access step properties with defaults
  const stepId = step?.id || 0;
  const stepTitle = step?.title || 'Loading...';
  const stepInstructions = step?.instructions || '';
  const practices = step?.practices || [];
  const durations = step?.durations || practices.map(() => 0);
  
  // Get store access
  const { 
    practiceChecks, 
    setPracticeChecks, 
    setLastPracticeStartDate
  } = useSettingsStore();
  
  // State for timer
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Timer ref for cleanup
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Get completion state for this step (with fallback)
  const [completed, setCompleted] = useState(() => {
    try {
      // If valid saved state exists, use it
      if (practiceChecks && 
          practiceChecks[stepId] && 
          Array.isArray(practiceChecks[stepId]) && 
          practiceChecks[stepId].length === practices.length) {
        return [...practiceChecks[stepId]];
      }
    } catch (err) {
      console.log('Error loading saved state');
    }
    
    // Default to all unchecked
    return Array(practices.length).fill(false);
  });
  
  // Save to store when completed changes
  useEffect(() => {
    try {
      // Only save if step is valid and array matches expected length
      if (stepId && completed.length === practices.length) {
        setPracticeChecks(stepId, [...completed]);
      }
    } catch (err) {
      console.log('Error saving state');
    }
  }, [completed, stepId, practices.length, setPracticeChecks]);
  
  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          // At 0, mark as complete and stop timer
          if (prev <= 1) {
            try {
              // Create a new array for immutability
              const newCompleted = [...completed];
              newCompleted[currentIndex] = true;
              setCompleted(newCompleted);
              
              // Play bell sound when timer completes
              try {
                playCompletionSound();
              } catch (e) {
                console.error('Failed to play timer completion sound:', e);
              }
              
              // After marking the practice as complete, stop the timer
              setIsTimerRunning(false);
            } catch (err) {
              console.log('Error updating completion');
              setIsTimerRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timeLeft, currentIndex, completed]);
  
  // Play completion sound
  const playCompletionSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/audio/bell.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  };
  
  // When step changes, reset timer state
  useEffect(() => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setCurrentIndex(0);
    
    // Initialize completed state for new step
    try {
      if (practiceChecks && 
          practiceChecks[stepId] && 
          Array.isArray(practiceChecks[stepId]) && 
          practiceChecks[stepId].length === practices.length) {
        setCompleted([...practiceChecks[stepId]]);
      } else {
        setCompleted(Array(practices.length).fill(false));
      }
    } catch (err) {
      setCompleted(Array(practices.length).fill(false));
    }
  }, [stepId, practices.length, practiceChecks]);
  
  // Handle practice selection
  const handleSelectPractice = (index: number) => {
    try {
      if (index >= 0 && index < practices.length) {
        setCurrentIndex(index);
        setTimeLeft(durations[index] || 0);
      }
    } catch (err) {
      console.log('Error selecting practice');
    }
  };
  
  // Find the next unchecked practice
  const findNextUncheckedPractice = () => {
    try {
      // Find the first unchecked practice
      const nextIndex = completed.findIndex(check => !check);
      if (nextIndex !== -1) {
        return nextIndex;
      }
      // If all are checked, return the current index
      return currentIndex;
    } catch (err) {
      console.log('Error finding next unchecked practice');
      return currentIndex;
    }
  };
  
  // Toggle timer running state
  const handleToggleTimer = () => {
    try {
      if (!isTimerRunning) {
        // Find the next unchecked practice when starting
        const nextIndex = findNextUncheckedPractice();
        setCurrentIndex(nextIndex);
        
        // If timer is at 0, initialize it
        if (timeLeft <= 0 && durations[nextIndex]) {
          setTimeLeft(durations[nextIndex]);
        }
        setIsTimerRunning(true);
        
        // Record that practice was started today
        setLastPracticeStartDate(new Date().toISOString().split('T')[0]);
      } else {
        setIsTimerRunning(false);
      }
    } catch (err) {
      console.log('Error toggling timer');
    }
  };
  
  // Stop timer
  const handleStopTimer = () => {
    try {
      setIsTimerRunning(false);
      setTimeLeft(0);
    } catch (err) {
      console.log('Error stopping timer');
    }
  };
  
  // Toggle completion state
  const handleToggleComplete = (index: number) => {
    try {
      if (index >= 0 && index < completed.length) {
        const newCompleted = [...completed];
        newCompleted[index] = !newCompleted[index];
        setCompleted(newCompleted);
      }
    } catch (err) {
      console.log('Error toggling completion');
    }
  };
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    try {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch (err) {
      return '0:00';
    }
  };
  
  // Check if any practice has a non-zero duration
  const hasNonZeroDuration = durations.some(duration => duration > 0);
  
  // Prevent rendering if step data is invalid
  if (!step || !stepId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Zone 1: Step Selector - Top section with title and badges */}
      <View style={styles.headerCard}>
        {stepForToday === stepId && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>TODAY'S STEP</Text>
          </View>
        )}
        
        <Text style={styles.title}>{stepTitle}</Text>
      </View>
      
      {/* Zone 2: Step Instructions - Middle scrollable section */}
      <View style={styles.instructionsCard}>
        <ScrollView style={styles.instructionsScroll}>
          <Text style={styles.instructionsText}>{stepInstructions}</Text>
        </ScrollView>
      </View>
      
      {/* Zone 3: Practice Functions - Bottom section */}
      <View style={styles.practicesCard}>
        {/* Timer controls */}
        <View style={styles.timerControls}>
          {!isTimerRunning ? (
            hasNonZeroDuration ? (
              <TouchableOpacity
                onPress={handleToggleTimer}
                style={styles.primaryButton}
              >
                <Ionicons name="play" size={16} color={colors.primaryText} />
                <Text style={styles.primaryButtonText}>Start Practices</Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <View style={styles.timerControlsRow}>
              <TouchableOpacity
                onPress={handleToggleTimer}
                style={styles.primaryButton}
              >
                <Ionicons name="pause" size={16} color={colors.primaryText} />
                <Text
