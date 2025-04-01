/**
 * TEST FILE: Step Selector Component
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import stepService, { Step, StepTitle } from '../services/stepService';
import { useTestSettingsStore } from './TEST_settingsStore_TIMER';

interface StepSelectorProps {
  currentStepId: number;
  onStepChange: (stepId: number) => void;
}

export const TestStepSelector: React.FC<StepSelectorProps> = ({ 
  currentStepId, 
  onStepChange 
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [stepNumberInput, setStepNumberInput] = useState('');
  
  // Get settings store for daily advancement
  const { 
    currentStepId: todayStepId, 
    setCurrentStepId, 
    setStartDate, 
    setLastAdvancementCheck 
  } = useTestSettingsStore();
  
  // Get all available steps
  const steps = useMemo(() => {
    const allSteps = stepService.getAllStepTitles();
    console.log('[TEST_STEP_SELECTOR] Loaded steps from service:', allSteps.length);
    return allSteps;
  }, []);
  
  // Find the current step
  const currentStep = useMemo(() => {
    const stepTitle = steps.find(step => step.id === currentStepId);
    if (stepTitle) {
      return stepTitle;
    }
    // Default to first step if current ID not found
    return steps.length > 0 ? steps[0] : { id: 1, title: 'Loading...', hourly: false };
  }, [steps, currentStepId]);
  
  // Toggle dropdown visibility
  const toggleDropdown = useCallback(() => {
    setDropdownVisible(prev => !prev);
    // Reset step number input when opening modal
    setStepNumberInput('');
  }, []);
  
  // Handle step selection
  const handleSelectStep = useCallback((stepId: number) => {
    onStepChange(stepId);
    setDropdownVisible(false);
  }, [onStepChange]);
  
  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = steps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      onStepChange(steps[currentIndex - 1].id);
    }
  }, [steps, currentStepId, onStepChange]);
  
  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const currentIndex = steps.findIndex(step => step.id === currentStepId);
    if (currentIndex < steps.length - 1) {
      onStepChange(steps[currentIndex + 1].id);
    }
  }, [steps, currentStepId, onStepChange]);
  
  // Set current step as today's step
  const setAsToday = useCallback(() => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // If this is the first time setting a step as today
    if (!useTestSettingsStore.getState().startDate) {
      setStartDate(today);
    }
    
    // Update the current step ID and last advancement check
    setCurrentStepId(currentStepId);
    setLastAdvancementCheck(today);
    
    // Show confirmation to user
    Alert.alert(
      "Step Set As Today",
      `Step ${currentStepId} has been set as today's step.`,
      [{ text: "OK" }]
    );
  }, [currentStepId, setCurrentStepId, setStartDate, setLastAdvancementCheck]);
  
  // Handle direct step number input
  const handleGoToStep = useCallback(() => {
    const stepNumber = parseInt(stepNumberInput, 10);
    
    // Validate input
    if (isNaN(stepNumber)) {
      Alert.alert('Invalid Input', 'Please enter a valid step number');
      return;
    }
    
    // Check if step exists
    if (stepNumber < 1 || stepNumber > steps.length) {
      Alert.alert('Invalid Step', `Please enter a step number between 1 and ${steps.length}`);
      return;
    }
    
    // Navigate to the step
    handleSelectStep(stepNumber);
  }, [stepNumberInput, steps.length, handleSelectStep]);
  
  // Render a step item in the dropdown
  const renderStepItem = useCallback(({ item }: { item: StepTitle }) => (
    <Pressable
      style={[
        styles.dropdownItem,
        item.id === currentStepId && styles.dropdownItemSelected
      ]}
      onPress={() => handleSelectStep(item.id)}
    >
      <Text 
        style={[
          styles.dropdownItemText,
          item.id === currentStepId && styles.dropdownItemTextSelected
        ]}
        numberOfLines={1}
      >
        {item.id}. {item.title}
      </Text>
    </Pressable>
  ), [currentStepId, handleSelectStep]);
  
  // Optimize list rendering with a key extractor
  const keyExtractor = useCallback((item: StepTitle) => `step-${item.id}`, []);
  
  // Debug: Log steps data
  console.log('[TEST_STEP_SELECTOR] Steps data:', steps.length, 'items');
  
  return (
    <View style={styles.container}>
      {/* Step Selector Dropdown */}
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={toggleDropdown}
      >
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {currentStep.id}. {currentStep.title}
        </Text>
        <MaterialIcons 
          name={dropdownVisible ? "arrow-drop-up" : "arrow-drop-down"} 
          size={24} 
          color="#ffffff" 
        />
      </TouchableOpacity>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={[
            styles.navButton,
            currentStepId <= 1 && styles.navButtonDisabled
          ]}
          onPress={goToPreviousStep}
          disabled={currentStepId <= 1}
        >
          <MaterialIcons name="chevron-left" size={20} color="#ffffff" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        {/* Set As Today Button */}
        <TouchableOpacity 
          style={[
            styles.todayButton,
            currentStepId === todayStepId && styles.todayButtonActive
          ]}
          onPress={setAsToday}
          disabled={currentStepId === todayStepId}
        >
          <MaterialIcons 
            name="today" 
            size={18} 
            color={currentStepId === todayStepId ? "#1DB954" : "#ffffff"} 
          />
          <Text style={[
            styles.todayButtonText,
            currentStepId === todayStepId && styles.todayButtonTextActive
          ]}>
            {currentStepId === todayStepId ? "Today's Step" : "Set As Today"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.navButton,
            currentStepId >= steps.length && styles.navButtonDisabled
          ]}
          onPress={goToNextStep}
          disabled={currentStepId >= steps.length}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <MaterialIcons name="chevron-right" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
          />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>Select Step</Text>
                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              {/* Step Number Input */}
              <View style={styles.stepNumberInputContainer}>
                <TextInput
                  style={styles.stepNumberInput}
                  placeholder="Enter step #"
                  placeholderTextColor="#999999"
                  keyboardType="number-pad"
                  value={stepNumberInput}
                  onChangeText={setStepNumberInput}
                  maxLength={3}
                />
                <TouchableOpacity 
                  style={styles.goButton}
                  onPress={handleGoToStep}
                >
                  <Text style={styles.goButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
              
              {/* Step List */}
              <FlatList
                data={steps}
                renderItem={renderStepItem}
                keyExtractor={keyExtractor}
                style={styles.dropdownList}
                contentContainerStyle={styles.dropdownListContent}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginTop: 40, // Add padding to avoid notification area
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  dropdownButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#222222',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginHorizontal: 4,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 6,
  },
  todayButtonTextActive: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40, // Add padding to avoid notification area
  },
  keyboardAvoidingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  dropdownContainer: {
    width: '95%',
    height: '85%',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dropdownHeaderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepNumberInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#2a2a2a',
  },
  stepNumberInput: {
    flex: 1,
    backgroundColor: '#333333',
    color: '#ffffff',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
  },
  goButton: {
    backgroundColor: '#1DB954', // Spotify green
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownList: {
    flex: 1,
    backgroundColor: '#2a2a2a',
  },
  dropdownListContent: {
    paddingBottom: 20,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dropdownItemSelected: {
    backgroundColor: '#1DB954', // Spotify green
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
  },
});
