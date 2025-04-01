This migration guide provides a comprehensive approach to converting TheOneApp from a React web application to a cross-platform React Native mobile app using Expo. By following these instructions, you can maintain the core functionality while adapting to mobile-specific requirements and user experience patterns.
# TheOneApp: React Native Migration Instructions

This document provides comprehensive instructions for migrating TheOneApp from a React web application to a cross-platform React Native mobile application using Expo. These instructions are designed to establish a stable development environment and migration path while avoiding the version conflicts encountered in previous attempts.

## Development Environment Setup

### Core Environment Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 20.12.0 LTS | Long-term support version for stability |
| npm | 10.5.0 | Compatible with Node.js 20.12.0 |
| Git | Latest | For version control |

### Project Initialization

```bash
# Create a new Expo project with TypeScript template
npx create-expo-app@latest TheOneApp --template expo-template-blank-typescript

# Navigate to project directory
cd TheOneApp
```

## Dependency Configuration

### Core Dependencies

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2",
    "expo": "~52.0.40",
    "expo-status-bar": "~1.11.0",
    "typescript": "5.3.3"
  }
}
```

### Existing React Native Dependencies

Leverage the React Native dependencies that have already been added to the project:

```bash
# Install existing React Native dependencies
npx expo install @expo/vector-icons@14.0.4 \
  @react-native-async-storage/async-storage@2.1.2 \
  @react-navigation/bottom-tabs@7.3.2 \
  @react-navigation/native@7.0.18 \
  expo-av@15.0.2 \
  expo-document-picker@13.0.3 \
  expo-file-system@18.0.12 \
  expo-notifications@0.29.14 \
  expo-sharing@13.0.1 \
  react-native-render-html@6.3.4 \
  react-native-safe-area-context@5.3.0 \
  react-native-screens@4.9.2 \
  react-native-vector-icons@10.2.0
```

### Additional Required Dependencies

```bash
# Install additional dependencies needed for feature parity
npx expo install zustand@5.0.3 \
  expo-keep-awake@12.4.0 \
  expo-background-fetch@11.4.0 \
  expo-task-manager@11.3.0 \
  expo-haptics@12.6.0 \
  expo-system-ui@2.9.0 \
  expo-updates@0.24.0 \
  react-native-reanimated@3.6.0 \
  react-native-gesture-handler@2.14.0
```

### Development Dependencies

```bash
# Install development dependencies
npm install --save-dev @babel/core@7.23.5 \
  eslint@9.21.0 \
  jest@29.7.0 \
  jest-expo@54.0.0 \
  @testing-library/react-native@12.4.0
```

## Application Setup

### 1. Configure Project Structure

Create a project structure that mirrors the web application:

```bash
# Create directory structure
mkdir -p src/{assets,components,data/{book},hooks,services,store}

# Copy data files from web app
cp -r [web-app-path]/src/data/* ./src/data/
```

### 2. Configure TypeScript

Create a tsconfig.json file:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### 3. Configure Navigation

Set up React Navigation in App.tsx:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen 
            name="Steps" 
            component={StepScreenPlaceholder} 
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="directions-walk" color={color} size={size} />
              )
            }}
          />
          <Tab.Screen 
            name="Book" 
            component={BookScreenPlaceholder} 
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="book" color={color} size={size} />
              )
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreenPlaceholder} 
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="settings" color={color} size={size} />
              )
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Placeholder components to be replaced with actual screens
const StepScreenPlaceholder = () => <View style={{ flex: 1 }}><Text>Steps</Text></View>;
const BookScreenPlaceholder = () => <View style={{ flex: 1 }}><Text>Book</Text></View>;
const SettingsScreenPlaceholder = () => <View style={{ flex: 1 }}><Text>Settings</Text></View>;
```

## Migration Process

### Phase 1: State Management Migration

1. **Migrate Zustand Stores**

   ```typescript
   // src/store/settingsStore.ts
   import { create } from 'zustand';
   import { createJSONStorage, persist } from 'zustand/middleware';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   interface SettingsState {
     theme: 'dark' | 'light';
     currentStep: number;
     notificationsEnabled: boolean;
     // Add other state properties from web app
     
     // Actions
     setTheme: (theme: 'dark' | 'light') => void;
     setCurrentStep: (step: number) => void;
     toggleNotifications: () => void;
     // Add other actions from web app
   }

   export const useSettingsStore = create<SettingsState>()(
     persist(
       (set) => ({
         theme: 'dark',
         currentStep: 1,
         notificationsEnabled: true,
         
         setTheme: (theme) => set({ theme }),
         setCurrentStep: (step) => set({ currentStep: step }),
         toggleNotifications: () => set((state) => ({ 
           notificationsEnabled: !state.notificationsEnabled 
         })),
         // Implement other actions
       }),
       {
         name: 'settings-storage',
         storage: createJSONStorage(() => AsyncStorage),
       }
     )
   );
   ```

2. **Migrate Book Store**

   ```typescript
   // src/store/bookStore.ts
   import { create } from 'zustand';

   interface BookState {
     currentSection: string;
     menuOpen: boolean;
     // Add other state properties from web app
     
     // Actions
     setCurrentSection: (section: string) => void;
     toggleMenu: () => void;
     // Add other actions from web app
   }

   export const useBookStore = create<BookState>()((set) => ({
     currentSection: 'introduction',
     menuOpen: false,
     
     setCurrentSection: (section) => set({ currentSection: section }),
     toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
     // Implement other actions
   }));
   ```

### Phase 2: Service Layer Migration

1. **Step Service**

   ```typescript
   // src/services/stepService.ts
   import { Asset } from 'expo-asset';
   import * as FileSystem from 'expo-file-system';
   
   // Define types based on your data structure
   interface Step {
     id: number;
     title: string;
     instructions: string;
     practices: Practice[];
     // Add other properties
   }
   
   interface Practice {
     id: number;
     title: string;
     duration: number;
     // Add other properties
   }
   
   // Cache for loaded steps
   let stepsCache: Step[] = [];
   
   export const stepService = {
     async getSteps(): Promise<Step[]> {
       if (stepsCache.length > 0) {
         return stepsCache;
       }
       
       try {
         // Method 1: If steps.json is bundled with the app
         const stepsModule = require('../data/steps.json');
         stepsCache = stepsModule.default || stepsModule;
         
         // Method 2: If steps.json is in FileSystem
         // const fileUri = FileSystem.documentDirectory + 'steps.json';
         // const fileContent = await FileSystem.readAsStringAsync(fileUri);
         // stepsCache = JSON.parse(fileContent);
         
         return stepsCache;
       } catch (error) {
         console.error('Error loading steps:', error);
         return [];
       }
     },
     
     async getStepById(id: number): Promise<Step | undefined> {
       const steps = await this.getSteps();
       return steps.find(step => step.id === id);
     },
     
     // Add other methods from web app
   };
   ```

2. **Notification Service**

   ```typescript
   // src/services/notificationService.ts
   import * as Notifications from 'expo-notifications';
   import * as Device from 'expo-device';
   import { Platform } from 'react-native';
   import { useSettingsStore } from '../store/settingsStore';
   
   export const notificationService = {
     async requestPermissions() {
       if (Platform.OS === 'android') {
         await Notifications.setNotificationChannelAsync('default', {
           name: 'Default',
           importance: Notifications.AndroidImportance.DEFAULT,
           vibrationPattern: [0, 250, 250, 250],
           lightColor: '#FF231F7C',
         });
       }
   
       if (Device.isDevice) {
         const { status: existingStatus } = await Notifications.getPermissionsAsync();
         let finalStatus = existingStatus;
         
         if (existingStatus !== 'granted') {
           const { status } = await Notifications.requestPermissionsAsync();
           finalStatus = status;
         }
         
         return finalStatus === 'granted';
       }
       
       return false;
     },
     
     async scheduleStepReminder(stepTitle: string, body: string) {
       const settings = useSettingsStore.getState();
       if (!settings.notificationsEnabled) return;
       
       // Check if within quiet hours
       const now = new Date();
       const hour = now.getHours();
       // Replace with your quiet hours logic from web app
       const isQuietHour = hour >= 22 || hour < 8;
       if (isQuietHour) return;
       
       return await Notifications.scheduleNotificationAsync({
         content: {
           title: stepTitle,
           body: body,
           sound: true,
         },
         trigger: null, // Immediate notification
       });
     },
     
     async scheduleHourlyReminders(stepId: number, stepTitle: string) {
       const settings = useSettingsStore.getState();
       if (!settings.notificationsEnabled) return;
       
       // Cancel any existing hourly reminders
       await this.cancelAllScheduledNotifications();
       
       // Schedule reminders for each hour (modify based on your requirements)
       for (let hour = 8; hour <= 21; hour++) {
         await Notifications.scheduleNotificationAsync({
           content: {
             title: `Remember Step ${stepId}`,
             body: stepTitle,
             sound: true,
           },
           trigger: {
             hour,
             minute: 0,
             repeats: true,
           },
         });
       }
     },
     
     async cancelAllScheduledNotifications() {
       await Notifications.cancelAllScheduledNotificationsAsync();
     },
     
     // Add other methods from web app
   };
   
   // Setup notification handler
   export const setupNotifications = () => {
     Notifications.setNotificationHandler({
       handleNotification: async () => ({
         shouldShowAlert: true,
         shouldPlaySound: true,
         shouldSetBadge: false,
       }),
     });
   };
   ```

3. **Book Service**

   ```typescript
   // src/services/bookService.ts
   import * as FileSystem from 'expo-file-system';
   
   // Define types based on your data structure
   interface BookSection {
     id: string;
     title: string;
     content: string;
     related: string[];
     // Add other properties
   }
   
   // Cache for loaded book sections
   const sectionCache: Record<string, BookSection> = {};
   
   export const bookService = {
     async getSectionById(id: string): Promise<BookSection | null> {
       // Return from cache if available
       if (sectionCache[id]) {
         return sectionCache[id];
       }
       
       try {
         // Method 1: If book content is bundled with the app
         const sectionModule = require(`../data/book/${id}.json`);
         const section = sectionModule.default || sectionModule;
         sectionCache[id] = section;
         
         // Method 2: If book content is in FileSystem
         // const fileUri = `${FileSystem.documentDirectory}book/${id}.json`;
         // const fileContent = await FileSystem.readAsStringAsync(fileUri);
         // const section = JSON.parse(fileContent);
         // sectionCache[id] = section;
         
         return section;
       } catch (error) {
         console.error(`Error loading book section ${id}:`, error);
         return null;
       }
     },
     
     async getAllSectionIds(): Promise<string[]> {
       try {
         // This will need to be adapted based on how your book content is organized
         // For bundled content, you might need a separate index file
         const indexModule = require(`../data/book/index.json`);
         return indexModule.default || indexModule;
         
         // For FileSystem:
         // const dirUri = `${FileSystem.documentDirectory}book/`;
         // const files = await FileSystem.readDirectoryAsync(dirUri);
         // return files.map(file => file.replace('.json', ''));
       } catch (error) {
         console.error('Error loading section IDs:', error);
         return [];
       }
     },
     
     // Add other methods from web app
   };
   ```

### Phase 3: Custom Hooks Migration

1. **Timer Hook**

   ```typescript
   // src/hooks/useTimer.ts
   import { useState, useEffect, useRef } from 'react';
   import * as KeepAwake from 'expo-keep-awake';
   import * as Haptics from 'expo-haptics';
   
   interface TimerOptions {
     initialDuration: number;
     autoStart?: boolean;
     onComplete?: () => void;
     hapticFeedback?: boolean;
     keepAwake?: boolean;
   }
   
   export function useTimer({
     initialDuration,
     autoStart = false,
     onComplete,
     hapticFeedback = true,
     keepAwake = true,
   }: TimerOptions) {
     const [duration, setDuration] = useState(initialDuration);
     const [timeLeft, setTimeLeft] = useState(initialDuration);
     const [isRunning, setIsRunning] = useState(autoStart);
     const [isComplete, setIsComplete] = useState(false);
     const intervalRef = useRef<NodeJS.Timeout | null>(null);
     
     // Start the timer
     const start = () => {
       if (!isRunning && timeLeft > 0) {
         setIsRunning(true);
         if (keepAwake) {
           KeepAwake.activate();
         }
       }
     };
     
     // Pause the timer
     const pause = () => {
       if (isRunning) {
         setIsRunning(false);
         if (keepAwake) {
           KeepAwake.deactivate();
         }
       }
     };
     
     // Reset the timer
     const reset = (newDuration?: number) => {
       pause();
       setTimeLeft(newDuration !== undefined ? newDuration : duration);
       setIsComplete(false);
     };
     
     // Update timer logic
     useEffect(() => {
       if (isRunning) {
         intervalRef.current = setInterval(() => {
           setTimeLeft((prevTime) => {
             if (prevTime <= 1) {
               // Timer complete
               clearInterval(intervalRef.current as NodeJS.Timeout);
               setIsRunning(false);
               setIsComplete(true);
               
               // Provide haptic feedback on completion
               if (hapticFeedback) {
                 Haptics.notificationAsync(
                   Haptics.NotificationFeedbackType.Success
                 );
               }
               
               // Call onComplete callback
               if (onComplete) {
                 onComplete();
               }
               
               // Release keep awake
               if (keepAwake) {
                 KeepAwake.deactivate();
               }
               
               return 0;
             }
             return prevTime - 1;
           });
         }, 1000);
       }
       
       return () => {
         if (intervalRef.current) {
           clearInterval(intervalRef.current);
         }
       };
     }, [isRunning, hapticFeedback, onComplete, keepAwake]);
     
     // Clean up on unmount
     useEffect(() => {
       return () => {
         if (intervalRef.current) {
           clearInterval(intervalRef.current);
         }
         if (keepAwake) {
           KeepAwake.deactivate();
         }
       };
     }, [keepAwake]);
     
     return {
       timeLeft,
       isRunning,
       isComplete,
       progress: 1 - timeLeft / duration,
       start,
       pause,
       reset,
       setDuration: (newDuration: number) => {
         setDuration(newDuration);
         reset(newDuration);
       },
     };
   }
   ```

### Phase 4: Core Component Migration

1. **StepDisplay Component**

   ```tsx
   // src/components/StepDisplay.tsx
   import React, { useEffect, useState } from 'react';
   import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
   import { MaterialIcons } from '@expo/vector-icons';
   import { useTimer } from '../hooks/useTimer';
   import { stepService } from '../services/stepService';
   import { notificationService } from '../services/notificationService';
   import { useSettingsStore } from '../store/settingsStore';
   
   interface Step {
     id: number;
     title: string;
     instructions: string;
     practices: Practice[];
   }
   
   interface Practice {
     id: number;
     title: string;
     duration: number; // in seconds
     completed?: boolean;
   }
   
   export const StepDisplay = () => {
     const { currentStep, theme } = useSettingsStore();
     const [step, setStep] = useState<Step | null>(null);
     const [activeIndex, setActiveIndex] = useState<number>(-1);
     const [practices, setPractices] = useState<Practice[]>([]);
     
     const {
       timeLeft,
       isRunning,
       progress,
       start,
       pause,
       reset
     } = useTimer({
       initialDuration: 0,
       onComplete: handleTimerComplete,
       hapticFeedback: true,
       keepAwake: true,
     });
     
     // Load step data
     useEffect(() => {
       const loadStep = async () => {
         const stepData = await stepService.getStepById(currentStep);
         if (stepData) {
           setStep(stepData);
           
           // Initialize practices with completion status from storage
           const storedPractices = [...stepData.practices].map(practice => ({
             ...practice,
             completed: false, // This would be retrieved from your state management
           }));
           
           setPractices(storedPractices);
           
           // Schedule notifications for this step
           notificationService.scheduleHourlyReminders(stepData.id, stepData.title);
         }
       };
       
       loadStep();
     }, [currentStep]);
     
     // Select a practice to start
     const selectPractice = (index: number) => {
       if (activeIndex === index) {
         // If already selected, toggle timer
         if (isRunning) {
           pause();
         } else {
           start();
         }
       } else {
         // Select new practice
         setActiveIndex(index);
         reset(practices[index].duration);
       }
     };
     
     // Handle timer completion
     function handleTimerComplete() {
       if (activeIndex >= 0) {
         // Mark the practice as completed
         const updatedPractices = [...practices];
         updatedPractices[activeIndex].completed = true;
         setPractices(updatedPractices);
         
         // Update store (update your state management here)
         
         // Reset active practice
         setActiveIndex(-1);
       }
     }
     
     // Format time display (MM:SS)
     const formatTime = (seconds: number) => {
       const mins = Math.floor(seconds / 60);
       const secs = seconds % 60;
       return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
     };
     
     if (!step) {
       return (
         <View style={styles.container}>
           <Text>Loading...</Text>
         </View>
       );
     }
     
     return (
       <View style={[
         styles.container, 
         { backgroundColor: theme === 'dark' ? '#121212' : '#ffffff' }
       ]}>
         <ScrollView>
           {/* Step Title */}
           <Text style={[
             styles.title,
             { color: theme === 'dark' ? '#ffffff' : '#121212' }
           ]}>
             Step {step.id}: {step.title}
           </Text>
           
           {/* Step Instructions */}
           <Text style={[
             styles.instructions,
             { color: theme === 'dark' ? '#e0e0e0' : '#333333' }
           ]}>
             {step.instructions}
           </Text>
           
           {/* Practices */}
           <Text style={[
             styles.sectionTitle,
             { color: theme === 'dark' ? '#ffffff' : '#121212' }
           ]}>
             Practices
           </Text>
           
           {practices.map((practice, index) => (
             <TouchableOpacity
               key={practice.id}
               style={[
                 styles.practiceItem,
                 { 
                   backgroundColor: 
                     practice.completed ? '#2e7d32' : 
                     activeIndex === index ? '#1976d2' : 
                     theme === 'dark' ? '#333333' : '#f5f5f5'
                 }
               ]}
               onPress={() => selectPractice(index)}
             >
               <View style={styles.practiceHeader}>
                 <Text style={[
                   styles.practiceTitle,
                   { 
                     color: 
                       activeIndex === index || practice.completed ? '#ffffff' : 
                       theme === 'dark' ? '#ffffff' : '#121212'
                   }
                 ]}>
                   {practice.title}
                 </Text>
                 
                 {practice.completed && (
                   <MaterialIcons name="check-circle" size={24} color="#ffffff" />
                 )}
               </View>
               
               {activeIndex === index && (
                 <View style={styles.timerContainer}>
                   <Text style={styles.timerText}>
                     {formatTime(timeLeft)}
                   </Text>
                   
                   <TouchableOpacity
                     style={styles.timerButton}
                     onPress={isRunning ? pause : start}
                   >
                     <MaterialIcons
                       name={isRunning ? 'pause' : 'play-arrow'}
                       size={24}
                       color="#ffffff"
                     />
                   </TouchableOpacity>
                   
                   <TouchableOpacity
                     style={styles.timerButton}
                     onPress={() => reset()}
                   >
                     <MaterialIcons
                       name="refresh"
                       size={24}
                       color="#ffffff"
                     />
                   </TouchableOpacity>
                   
                   {/* Progress bar */}
                   <View style={styles.progressContainer}>
                     <View 
                       style={[
                         styles.progressBar, 
                         { width: `${progress * 100}%` }
                       ]} 
                     />
                   </View>
                 </View>
               )}
               
               {activeIndex !== index && (
                 <Text style={[
                   styles.practiceDuration,
                   { 
                     color: 
                       practice.completed ? '#ffffff' : 
                       theme === 'dark' ? '#cccccc' : '#666666'
                   }
                 ]}>
                   {formatTime(practice.duration)}
                 </Text>
               )}
             </TouchableOpacity>
           ))}
         </ScrollView>
       </View>
     );
   };
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: 16,
     },
     title: {
       fontSize: 24,
       fontWeight: 'bold',
       marginBottom: 16,
     },
     instructions: {
       fontSize: 16,
       marginBottom: 24,
       lineHeight: 24,
     },
     sectionTitle: {
       fontSize: 20,
       fontWeight: 'bold',
       marginBottom: 16,
     },
     practiceItem: {
       borderRadius: 8,
       padding: 16,
       marginBottom: 12,
     },
     practiceHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
     },
     practiceTitle: {
       fontSize: 18,
       fontWeight: '500',
     },
     practiceDuration: {
       marginTop: 8,
       fontSize: 14,
     },
     timerContainer: {
       marginTop: 12,
     },
     timerText: {
       fontSize: 32,
       color: '#ffffff',
       textAlign: 'center',
       marginBottom: 8,
     },
     timerButton: {
       backgroundColor: 'rgba(255, 255, 255, 0.2)',
       borderRadius: 20,
       width: 40,
       height: 40,
       justifyContent: 'center',
       alignItems: 'center',
       marginHorizontal: 4,
     },
     progressContainer: {
       height: 4,
       backgroundColor: 'rgba(255, 255, 255, 0.2)',
       borderRadius: 2,
       marginTop: 8,
     },
     progressBar: {
       height: 4,
       backgroundColor: '#ffffff',
       borderRadius: 2,
     },
   });
   ```

2. **BookDisplay Component**

   ```tsx
   // src/components/BookDisplay.tsx
   import React, { useEffect, useState } from 'react';
   import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
   import { MaterialIcons } from '@expo/vector-icons';
   import RenderHtml from 'react-native-render-html';
   import { useWindowDimensions } from 'react-native';
   import { bookService } from '../services/bookService';
   import { useBookStore } from '../store/bookStore';
   import { useSettingsStore } from '../store/settingsStore';
   
   interface BookSection {
     id: string;
     title: string;
     content: string;
     related: string[];
   }
   
   export const BookDisplay = () => {
     const { width } = useWindowDimensions();
     const { currentSection, menuOpen, setCurrentSection, toggleMenu } = useBookStore();
     const { theme } = useSettingsStore();
     const [section, setSection] = useState<BookSection | null>(null);
     const [relatedSections, setRelatedSections] = useState<BookSection[]>([]);
     
     // Load current section
     useEffect(() => {
       const loadSection = async () => {
         const sectionData = await bookService.getSectionById(currentSection);
         if (sectionData) {
           setSection(sectionData);
           
           // Load related sections
           const related = await Promise.all(
             sectionData.related.map(id => bookService.getSectionById(id))
           );
           setRelatedSections(related.filter(Boolean) as BookSection[]);
         }
       };
       
       loadSection();
     }, [currentSection]);
     
     // Format HTML content for mobile
     const formatContentForMobile = (content: string) => {
       // Add your content formatting logic here if needed
       return content;
     };
     
     if (!section) {
       return (
         <View style={styles.container}>
           <Text>Loading...</Text>
         </View>
       );
     }
     
     return (
       <View style={[
         styles.container,
         { backgroundColor: theme === 'dark' ? '#121212' : '#ffffff' }
       ]}>
         {/* Section header */}
         <View style={styles.header}>
           <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
             <MaterialIcons 
               name={menuOpen ? 'close' : 'menu'} 
               size={24} 
               color={theme === 'dark' ? '#ffffff' : '#121212'} 
             />
           </TouchableOpacity>
           <Text style={[
             styles.title,
             { color: theme === 'dark' ? '#ffffff' : '#121212' }
           ]}>
             {section.title}
           </Text>
         </View>
         
         {/* Book content */}
         <ScrollView style={styles.content}>
           <RenderHtml
             contentWidth={width - 32}
             source={{ html: formatContentForMobile(section.content) }}
             tagsStyles={{
               body: {
                 color: theme === 'dark' ? '#e0e0e0' : '#333333',
                 fontSize: 16,
                 lineHeight: 24,
               },
               h1: {
                 color: theme === 'dark' ? '#ffffff' : '#121212',
                 fontSize: 22,
                 marginBottom: 16,
               },
               h2: {
                 color: theme === 'dark' ? '#ffffff' : '#121212',
                 fontSize: 20,
                 marginBottom: 12,
               },
               p: {
                 marginBottom: 16,
               },
               a: {
                 color: '#1976d2',
                 textDecorationLine: 'none',
               },
             }}
           />
           
           {/* Related sections */}
           {relatedSections.length > 0 && (
             <View style={styles.relatedContainer}>
               <Text style={[
                 styles.relatedTitle,
                 { color: theme === 'dark' ? '#ffffff' : '#121212' }
               ]}>
                 Related Content
               </Text>
               
               {relatedSections.map((related) => (
                 <TouchableOpacity
                   key={related.id}
                   style={[
                     styles.relatedItem,
                     { 
                       backgroundColor: theme === 'dark' ? '#333333' : '#f5f5f5',
                       borderColor: theme === 'dark' ? '#444444' : '#e0e0e0',
                     }
                   ]}
                   onPress={() => setCurrentSection(related.id)}
                 >
                   <Text style={[
                     styles.relatedItemText,
                     { color: theme === 'dark' ? '#ffffff' : '#121212' }
                   ]}>
                     {related.title}
                   </Text>
                   <MaterialIcons 
                     name="chevron-right" 
                     size={18} 
                     color={theme === 'dark' ? '#cccccc' : '#666666'} 
                   />
                 </TouchableOpacity>
               ))}
             </View>
           )}
         </ScrollView>
       </View>
     );
   };
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
     },
     header: {
       flexDirection: 'row',
       alignItems: 'center',
       padding: 16,
       borderBottomWidth: 1,
       borderBottomColor: 'rgba(0, 0, 0, 0.1)',
     },
     menuButton: {
       marginRight: 16,
     },
     title: {
       fontSize: 20,
       fontWeight: 'bold',
       flex: 1,
     },
     content: {
       flex: 1,
       padding: 16,
     },
     relatedContainer: {
       marginTop: 24,
       marginBottom: 24,
     },
     relatedTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       marginBottom: 12,
     },
     relatedItem: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       padding: 12,
       borderRadius: 8,
       marginBottom: 8,
       borderWidth: 1,
     },
     relatedItemText: {
       fontSize: 16,
     },
   });
   ```

3. **SettingsMenu Component**

   ```tsx
   // src/components/SettingsMenu.tsx
   import React, { useState, useEffect } from 'react';
   import { 
     View, 
     Text, 
     StyleSheet, 
     Switch, 
     TouchableOpacity, 
     ScrollView,
     Alert
   } from 'react-native';
   import { MaterialIcons } from '@expo/vector-icons';
   import { useSettingsStore } from '../store/settingsStore';
   import { notificationService } from '../services/notificationService';
   
   export const SettingsMenu = () => {
     const { 
       theme, 
       setTheme, 
       notificationsEnabled, 
       toggleNotifications,
       // Add other settings from your store
     } = useSettingsStore();
     
     const [hasPermission, setHasPermission] = useState(false);
     
     // Check notification permissions on load
     useEffect(() => {
       const checkPermissions = async () => {
         const permissionGranted = await notificationService.requestPermissions();
         setHasPermission(permissionGranted);
       };
       
       checkPermissions();
     }, []);
     
     // Handle theme toggle
     const handleThemeToggle = () => {
       setTheme(theme === 'dark' ? 'light' : 'dark');
     };
     
     // Handle notification toggle
     const handleNotificationToggle = async () => {
       if (!notificationsEnabled && !hasPermission) {
         // Request permissions if enabling notifications
         const permissionGranted = await notificationService.requestPermissions();
         setHasPermission(permissionGranted);
         
         if (!permissionGranted) {
           Alert.alert(
             "Permission Required",
             "Notifications require permission. Please enable notifications in your device settings.",
             [{ text: "OK" }]
           );
           return;
         }
       }
       
       toggleNotifications();
     };
     
     return (
       <View style={[
         styles.container,
         { backgroundColor: theme === 'dark' ? '#121212' : '#ffffff' }
       ]}>
         <Text style={[
           styles.title,
           { color: theme === 'dark' ? '#ffffff' : '#121212' }
         ]}>
           Settings
         </Text>
         
         <ScrollView>
           {/* Theme Setting */}
           <View style={styles.settingItem}>
             <View style={styles.settingLabelContainer}>
               <MaterialIcons 
                 name={theme === 'dark' ? 'dark-mode' : 'light-mode'} 
                 size={24} 
                 color={theme === 'dark' ? '#ffffff' : '#121212'} 
               />
               <Text style={[
                 styles.settingLabel,
                 { color: theme === 'dark' ? '#ffffff' : '#121212' }
               ]}>
                 Dark Theme
               </Text>
             </View>
             <Switch
               value={theme === 'dark'}
               onValueChange={handleThemeToggle}
               trackColor={{ false: '#767577', true: '#1976d2' }}
               thumbColor={theme === 'dark' ? '#ffffff' : '#f4f3f4'}
             />
           </View>
           
           {/* Notifications Setting */}
           <View style={styles.settingItem}>
             <View style={styles.settingLabelContainer}>
               <MaterialIcons 
                 name={notificationsEnabled ? 'notifications-active' : 'notifications-off'} 
                 size={24} 
                 color={theme === 'dark' ? '#ffffff' : '#121212'} 
               />
               <Text style={[
                 styles.settingLabel,
                 { color: theme === 'dark' ? '#ffffff' : '#121212' }
               ]}>
                 Notifications
               </Text>
             </View>
             <Switch
               value={notificationsEnabled}
               onValueChange={handleNotificationToggle}
               trackColor={{ false: '#767577', true: '#1976d2' }}
               thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
             />
           </View>
           
           {/* Add more settings as needed */}
         </ScrollView>
       </View>
     );
   };
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: 16,
     },
     title: {
       fontSize: 24,
       fontWeight: 'bold',
       marginBottom: 24,
     },
     settingItem: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingVertical: 16,
       borderBottomWidth: 1,
       borderBottomColor: 'rgba(0, 0, 0, 0.1)',
     },
     settingLabelContainer: {
       flexDirection: 'row',
       alignItems: 'center',
     },
     settingLabel: {
       fontSize: 16,
       marginLeft: 12,
     },
4. **Secret Modal Component**

   ```tsx
   // src/components/SecretModal.tsx
   import React, { useEffect, useState } from 'react';
   import { 
     View, 
     Text, 
     StyleSheet, 
     TouchableOpacity, 
     Modal,
     Dimensions
   } from 'react-native';
   import { MaterialIcons } from '@expo/vector-icons';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { useSettingsStore } from '../store/settingsStore';
   
   interface Secret {
     id: number;
     text: string;
   }
   
   export const SecretModal = () => {
     const { theme } = useSettingsStore();
     const [visible, setVisible] = useState(false);
     const [secret, setSecret] = useState<Secret | null>(null);
     
     // Check if we should show the secret (once per day)
     useEffect(() => {
       const checkDailySecret = async () => {
         try {
           // Load secrets
           const secretsModule = require('../data/secrets.json');
           const secrets: Secret[] = secretsModule.default || secretsModule;
           
           // Logic to determine if we should show a secret today
           const today = new Date().toDateString();
           const lastShown = await AsyncStorage.getItem('lastSecretShown');
           
           if (lastShown !== today && secrets.length > 0) {
             // Select a random secret
             const randomIndex = Math.floor(Math.random() * secrets.length);
             setSecret(secrets[randomIndex]);
             setVisible(true);
             
             // Save today's date
             await AsyncStorage.setItem('lastSecretShown', today);
           }
         } catch (error) {
           console.error('Error loading daily secret:', error);
         }
       };
       
       checkDailySecret();
     }, []);
     
     const closeModal = () => {
       setVisible(false);
     };
     
     if (!secret) {
       return null;
     }
     
     return (
       <Modal
         animationType="fade"
         transparent={true}
         visible={visible}
         onRequestClose={closeModal}
       >
         <View style={styles.centeredView}>
           <View style={[
             styles.modalView,
             { backgroundColor: theme === 'dark' ? '#212121' : '#ffffff' }
           ]}>
             <View style={styles.modalHeader}>
               <Text style={[
                 styles.modalTitle,
                 { color: theme === 'dark' ? '#ffffff' : '#121212' }
               ]}>
                 Daily Inspiration
               </Text>
               <TouchableOpacity
                 style={styles.closeButton}
                 onPress={closeModal}
               >
                 <MaterialIcons 
                   name="close" 
                   size={24} 
                   color={theme === 'dark' ? '#ffffff' : '#121212'} 
                 />
               </TouchableOpacity>
             </View>
             
             <Text style={[
               styles.secretText,
               { color: theme === 'dark' ? '#e0e0e0' : '#333333' }
             ]}>
               {secret.text}
             </Text>
           </View>
         </View>
       </Modal>
     );
   };
   
   const styles = StyleSheet.create({
     centeredView: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: 'rgba(0, 0, 0, 0.5)',
     },
     modalView: {
       width: Dimensions.get('window').width * 0.85,
       borderRadius: 12,
       padding: 24,
       shadowColor: '#000',
       shadowOffset: {
         width: 0,
         height: 2,
       },
       shadowOpacity: 0.25,
       shadowRadius: 4,
       elevation: 5,
     },
     modalHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 16,
     },
     modalTitle: {
       fontSize: 20,
       fontWeight: 'bold',
     },
     closeButton: {
       padding: 4,
     },
     secretText: {
       fontSize: 18,
       lineHeight: 28,
       textAlign: 'center',
     },
   });
   ```

### Phase 5: Final Integration

1. **Main App Component**

   ```tsx
   // src/App.tsx
   import React, { useEffect } from 'react';
   import { StatusBar } from 'expo-status-bar';
   import { NavigationContainer } from '@react-navigation/native';
   import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
   import { SafeAreaProvider } from 'react-native-safe-area-context';
   import { MaterialIcons } from '@expo/vector-icons';
   import { StepDisplay } from './components/StepDisplay';
   import { BookDisplay } from './components/BookDisplay';
   import { SettingsMenu } from './components/SettingsMenu';
   import { SecretModal } from './components/SecretModal';
   import { setupNotifications } from './services/notificationService';
   import { useSettingsStore } from './store/settingsStore';
   
   const Tab = createBottomTabNavigator();
   
   export default function App() {
     const { theme } = useSettingsStore();
     
     // Set up notifications
     useEffect(() => {
       setupNotifications();
     }, []);
     
     return (
       <SafeAreaProvider>
         <NavigationContainer>
           <Tab.Navigator
             screenOptions={{
               tabBarActiveTintColor: '#1976d2',
               tabBarInactiveTintColor: theme === 'dark' ? '#cccccc' : '#666666',
               tabBarStyle: {
                 backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
                 borderTopColor: theme === 'dark' ? '#333333' : '#e0e0e0',
               },
               headerStyle: {
                 backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
                 borderBottomColor: theme === 'dark' ? '#333333' : '#e0e0e0',
                 borderBottomWidth: 1,
               },
               headerTintColor: theme === 'dark' ? '#ffffff' : '#121212',
             }}
           >
             <Tab.Screen 
               name="Steps" 
               component={StepDisplay} 
               options={{
                 tabBarIcon: ({ color, size }) => (
                   <MaterialIcons name="directions-walk" color={color} size={size} />
                 ),
                 title: "Today's Step"
               }}
             />
             <Tab.Screen 
               name="Book" 
               component={BookDisplay} 
               options={{
                 tabBarIcon: ({ color, size }) => (
                   <MaterialIcons name="book" color={color} size={size} />
                 ),
                 title: "Reference"
               }}
             />
             <Tab.Screen 
               name="Settings" 
               component={SettingsMenu} 
               options={{
                 tabBarIcon: ({ color, size }) => (
                   <MaterialIcons name="settings" color={color} size={size} />
                 )
               }}
             />
           </Tab.Navigator>
           
           {/* Daily secret modal */}
           <SecretModal />
           
           <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
         </NavigationContainer>
       </SafeAreaProvider>
     );
   }
   ```

## App Configuration

1. **expo.config.js**

   ```javascript
   import 'dotenv/config';

   export default {
     name: 'TheOneApp',
     slug: 'theoneapp',
     version: '1.0.0',
     orientation: 'portrait',
     icon: './assets/icon.png',
     userInterfaceStyle: 'automatic',
     splash: {
       image: './assets/splash.png',
       resizeMode: 'contain',
       backgroundColor: '#121212'
     },
     updates: {
       fallbackToCacheTimeout: 0
     },
     assetBundlePatterns: [
       '**/*'
     ],
     ios: {
       supportsTablet: true,
       bundleIdentifier: 'com.yourcompany.theoneapp'
     },
     android: {
       adaptiveIcon: {
         foregroundImage: './assets/adaptive-icon.png',
         backgroundColor: '#121212'
       },
       package: 'com.yourcompany.theoneapp'
     },
     web: {
       favicon: './assets/favicon.png'
     },
     plugins: [
       [
         'expo-notifications',
         {
           icon: './assets/notification-icon.png',
           color: '#ffffff',
           sounds: ['./assets/notification.wav']
         }
       ]
     ],
     extra: {
       eas: {
         projectId: 'your-project-id'
       }
     }
   };
   ```

## Migration Testing Checklist

Use this checklist to verify each component of the migration:

1. **State Management**
   - [ ] Zustand stores initialize correctly
   - [ ] AsyncStorage persistence works
   - [ ] State updates and UI responds appropriately

2. **Core Functionality**
   - [ ] Step navigation
   - [ ] Practice selection and completion
   - [ ] Timer functionality (foreground and background)
   - [ ] Book content display and navigation

3. **UI Components**
   - [ ] Theme switching (dark/light)
   - [ ] Layout adapts to different screen sizes
   - [ ] Navigation works correctly

4. **Platform-Specific Features**
   - [ ] Notifications work on both iOS and Android
   - [ ] Haptic feedback (on supported devices)
   - [ ] Background operation respects battery optimization

5. **Performance**
   - [ ] App loads quickly
   - [ ] Smooth transitions between screens
   - [ ] Minimal memory usage

## Common Pitfalls and Solutions

1. **React Version Issues**
   - **Problem**: React Native requires React 18.2.0 specifically
   - **Solution**: Ensure package.json specifies exact version (not ^18.2.0)

2. **Notification Permissions**
   - **Problem**: Different permission handling on iOS vs Android
   - **Solution**: Use platform-specific code in notificationService

3. **Styling Differences**
   - **Problem**: Tailwind CSS doesn't work in React Native
   - **Solution**: Use StyleSheet with theme-aware styles

4. **Background Timer**
   - **Problem**: Timers may pause when app goes to background
   - **Solution**: Use expo-background-fetch and expo-task-manager

5. **JSON Data Loading**
   - **Problem**: Different approaches to loading JSON in React Native
   - **Solution**: Use require() for bundled data or FileSystem for external data

## Final Production Steps

1. **Icon and Splash Screen**
   - Create app icons for iOS and Android (use the Expo documentation for size requirements)
   - Design a splash screen matching your app's theme

2. **App Configuration**
   - Update app.json/app.config.js with your app's details
   - Configure build settings for both platforms

3. **Testing**
   - Test on real iOS and Android devices
   - Verify all features work in various conditions (background, low battery, etc.)

4. **Building for Distribution**
   - Use EAS Build to create production builds
   ```bash
   npx eas build --platform ios
   npx eas build --platform android
   ```

5. **Deployment**
   - Submit to App Store and Google Play
   - Set up EAS Update for over-the-air updates
   ```bash
   npx eas update --channel production
   ```


   });
   ```