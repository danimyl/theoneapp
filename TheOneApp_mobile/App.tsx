/**
 * The One App - Mobile Version
 * 
 * Main application component that handles navigation, state management,
 * and core app functionality.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Components
import StepsScreen from './src/components/StepsScreen';
import { BookScreen } from './src/components/BookScreen';
import SettingsScreen from './src/components/SettingsScreen';
import SecretModal from './src/components/SecretModal';

// Services and stores
import { useSettingsStore } from './src/store/settingsStore';
import stepService from './src/services/stepService';
import notificationService from './src/services/notificationService';
import secrets from './src/data/secrets.json';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

export default function App() {
  // State for the secret modal
  const [isSecretModalVisible, setIsSecretModalVisible] = useState(false);
  const [currentSecret, setCurrentSecret] = useState('');
  
  // Get settings from store
  const { 
    appOpenCountToday,
    lastAppOpenDate,
    lastSecretShownDate,
    setAppOpenCountToday,
    setLastAppOpenDate,
    setLastSecretShownDate
  } = useSettingsStore();
  
  // Track app opens and show secret on second open of the day
  // Use a ref to ensure we only track app open once per app launch
  const hasTrackedAppOpenRef = useRef(false);
  
  useEffect(() => {
    // Only track app open once per app launch
    if (hasTrackedAppOpenRef.current) {
      return;
    }
    
    const trackAppOpen = () => {
      // Mark that we've tracked this app open
      hasTrackedAppOpenRef.current = true;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if it's a new day
      if (lastAppOpenDate !== today) {
        // Reset counter for new day
        setLastAppOpenDate(today);
        setAppOpenCountToday(1);
        console.log('[SECRET] New day, app open count reset to 1');
      } else {
        // Increment counter for same day
        const newCount = appOpenCountToday + 1;
        setAppOpenCountToday(newCount);
        console.log(`[SECRET] App opened ${newCount} times today`);
        
        // Show secret on second open of the day
        if (newCount === 2 && lastSecretShownDate !== today) {
          showRandomSecret();
          setLastSecretShownDate(today);
        }
      }
    };
    
    // Small delay to ensure store is loaded
    const timer = setTimeout(trackAppOpen, 500);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once on mount
  
  // Check for practice reminder
  useEffect(() => {
    // Function to check if practices are complete and send reminder if needed
    const checkPracticeReminder = () => {
      try {
        // Get settings from store
        const { 
          practiceReminderEnabled, 
          practiceReminderTime,
          currentStepId,
          practiceChecks
        } = useSettingsStore.getState();
        
        // If reminder is disabled, do nothing
        if (!practiceReminderEnabled) {
          return;
        }
        
        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Parse reminder time
        const [reminderHour, reminderMinute] = practiceReminderTime.split(':').map(Number);
        
        // Check if it's time for the reminder
        if (currentHour === reminderHour && currentMinute === reminderMinute) {
          console.log('[REMINDER] Checking practice completion status');
          
          // Get current step
          const currentStep = stepService.getStepById(currentStepId);
          if (!currentStep) {
            console.log('[REMINDER] No current step found');
            return;
          }
          
          // Get practice checks for current step
          const stepChecks = practiceChecks[currentStepId] || [];
          
          // If no checks exist or length doesn't match, create default array
          const checks = stepChecks.length === currentStep.practices.length
            ? stepChecks
            : Array(currentStep.practices.length).fill(false);
          
          // Send reminder notification
          notificationService.sendPracticeReminder(
            currentStepId,
            currentStep.title,
            checks
          );
        }
      } catch (error) {
        console.error('[REMINDER] Error checking practice reminder:', error);
      }
    };
    
    // Check immediately on mount
    checkPracticeReminder();
    
    // Set up interval to check every minute
    const intervalId = setInterval(checkPracticeReminder, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to show a random secret
  const showRandomSecret = () => {
    // Get a random secret from the secrets.json file
    const randomIndex = Math.floor(Math.random() * secrets.length);
    const randomSecret = secrets[randomIndex].secret;
    
    // Set the current secret and show the modal
    setCurrentSecret(randomSecret);
    setIsSecretModalVisible(true);
    
    console.log('[SECRET] Showing secret modal');
  };
  
  // Handle closing the secret modal
  const handleCloseSecretModal = () => {
    setIsSecretModalVisible(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#1E1E1E',
              borderTopColor: '#333333',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#1DB954', // Spotify green
            tabBarInactiveTintColor: '#CCCCCC',
            headerStyle: {
              backgroundColor: '#1E1E1E',
              borderBottomColor: '#333333',
              borderBottomWidth: 1,
              elevation: 0, // Remove shadow on Android
              shadowOpacity: 0, // Remove shadow on iOS
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Tab.Screen 
            name="Steps" 
            component={StepsScreen} 
            options={{
              headerShown: false, // Hide the header completely
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <FontAwesome5 name="shoe-prints" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="Book" 
            component={BookScreen}
            options={{
              headerShown: false, // Hide the header completely
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="book" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialIcons name="settings" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      
      {/* Secret Modal */}
      <SecretModal
        isVisible={isSecretModalVisible}
        onClose={handleCloseSecretModal}
        secretText={currentSecret}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
