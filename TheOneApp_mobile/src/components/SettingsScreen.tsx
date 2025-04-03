/**
 * Settings Screen
 * 
 * Provides user interface for configuring application settings.
 * Features:
 * - Toggle for always showing hourly reminders
 * - Time pickers for setting quiet hours
 * - Custom time picker modals with intuitive UI
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../contexts/ThemeContext';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { 
    isDarkMode,
    setIsDarkMode,
    alwaysHourlyReminders, 
    setAlwaysHourlyReminders,
    sleepStart,
    setSleepStart,
    sleepEnd,
    setSleepEnd,
    practiceReminderEnabled,
    setPracticeReminderEnabled,
    practiceReminderTime,
    setPracticeReminderTime
  } = useSettingsStore();
  
  // State for time picker modals
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  
  // State for time inputs
  const [tempHours, setTempHours] = useState('');
  const [tempMinutes, setTempMinutes] = useState('');
  
  // Parse time string to hours and minutes
  const parseTimeString = (timeString: string): { hours: string, minutes: string } => {
    const [hours, minutes] = timeString.split(':');
    return { hours, minutes };
  };
  
  // Format hours and minutes to HH:MM
  const formatTimeString = (hours: string, minutes: string): string => {
    const parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes, 10);
    
    // Validate hours and minutes
    const validHours = isNaN(parsedHours) ? 0 : Math.min(Math.max(parsedHours, 0), 23);
    const validMinutes = isNaN(parsedMinutes) ? 0 : Math.min(Math.max(parsedMinutes, 0), 59);
    
    return `${String(validHours).padStart(2, '0')}:${String(validMinutes).padStart(2, '0')}`;
  };
  
  // Open start time picker
  const openStartTimePicker = () => {
    const { hours, minutes } = parseTimeString(sleepStart);
    setTempHours(hours);
    setTempMinutes(minutes);
    setShowStartPicker(true);
  };
  
  // Open end time picker
  const openEndTimePicker = () => {
    const { hours, minutes } = parseTimeString(sleepEnd);
    setTempHours(hours);
    setTempMinutes(minutes);
    setShowEndPicker(true);
  };
  
  // Save start time
  const saveStartTime = () => {
    setSleepStart(formatTimeString(tempHours, tempMinutes));
    setShowStartPicker(false);
  };
  
  // Save end time
  const saveEndTime = () => {
    setSleepEnd(formatTimeString(tempHours, tempMinutes));
    setShowEndPicker(false);
  };
  
  // Open reminder time picker
  const openReminderTimePicker = () => {
    if (!practiceReminderEnabled) return;
    
    // Reset temp values to current reminder time
    const { hours, minutes } = parseTimeString(practiceReminderTime);
    setTempHours(hours);
    setTempMinutes(minutes);
    
    // Show the picker
    setShowReminderPicker(true);
    
    console.log('[SETTINGS] Opening reminder time picker:', { hours, minutes });
  };
  
  // Save reminder time
  const saveReminderTime = () => {
    // Format and validate the time
    const formattedTime = formatTimeString(tempHours, tempMinutes);
    
    // Log the time being saved
    console.log('[SETTINGS] Saving reminder time:', { 
      tempHours, 
      tempMinutes, 
      formattedTime 
    });
    
    // Update the store
    setPracticeReminderTime(formattedTime);
    
    // Close the modal
    setShowReminderPicker(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.bgPrimary }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        
        {/* Appearance Settings Section */}
        <View style={[styles.section, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          
          {/* Theme Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons 
                name={isDarkMode ? "dark-mode" : "light-mode"} 
                size={24} 
                color={theme.accent} 
                style={styles.icon} 
              />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#767577', true: theme.buttonAccent }}
              thumbColor={Platform.OS === 'ios' ? undefined : (isDarkMode ? '#ffffff' : '#f4f3f4')}
            />
          </View>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Switch between dark and light themes
          </Text>
        </View>
        
        {/* Notification Settings Section */}
        <View style={[styles.section, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          
          {/* Hourly Reminders Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="notifications" size={24} color={theme.accent} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Always Show Hourly Reminders
              </Text>
            </View>
            <Switch
              value={alwaysHourlyReminders}
              onValueChange={setAlwaysHourlyReminders}
              trackColor={{ false: '#767577', true: theme.buttonAccent }}
              thumbColor={Platform.OS === 'ios' ? undefined : (alwaysHourlyReminders ? '#ffffff' : '#f4f3f4')}
            />
          </View>
          
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            When enabled, hourly reminders will be shown for all steps, not just those marked as hourly.
          </Text>
        </View>
        
        {/* Quiet Hours Section */}
        <View style={[styles.section, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quiet Hours</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Notifications will be silenced during these hours
          </Text>
          
          {/* Sleep Start Time */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.borderColor }]}
            onPress={openStartTimePicker}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="bedtime" size={24} color={theme.accent} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Start Time</Text>
            </View>
            <Text style={[styles.timeText, { color: theme.accent }]}>{sleepStart}</Text>
          </TouchableOpacity>
          
          {/* Sleep End Time */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.borderColor }]}
            onPress={openEndTimePicker}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="wb-sunny" size={24} color={theme.accent} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>End Time</Text>
            </View>
            <Text style={[styles.timeText, { color: theme.accent }]}>{sleepEnd}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Practice Reminder Section */}
        <View style={[styles.section, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Practice Reminder</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Get a reminder if your practices are not completed by the specified time
          </Text>
          
          {/* Practice Reminder Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.borderColor }]}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="notifications-active" size={24} color={theme.accent} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Enable Practice Reminder</Text>
            </View>
            <Switch
              value={practiceReminderEnabled}
              onValueChange={setPracticeReminderEnabled}
              trackColor={{ false: '#767577', true: theme.buttonAccent }}
              thumbColor={Platform.OS === 'ios' ? undefined : (practiceReminderEnabled ? '#ffffff' : '#f4f3f4')}
            />
          </View>
          
          {/* Practice Reminder Time */}
          <TouchableOpacity 
            style={[
              styles.settingRow,
              { borderBottomColor: theme.borderColor },
              !practiceReminderEnabled && { opacity: 0.5 }
            ]}
            onPress={openReminderTimePicker}
            disabled={!practiceReminderEnabled}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="access-time" size={24} color={theme.accent} style={styles.icon} />
              <Text style={[
                styles.settingLabel,
                { color: theme.textPrimary },
                !practiceReminderEnabled && { color: theme.textDisabled }
              ]}>Reminder Time</Text>
            </View>
            <Text style={[
              styles.timeText,
              { color: theme.accent },
              !practiceReminderEnabled && { color: theme.textDisabled }
            ]}>{practiceReminderTime}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Time Picker Modals */}
        <Modal
          visible={showStartPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStartPicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.bgModal }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Start Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Hours</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
                
                <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.buttonSecondary }]}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.buttonAccent }]}
                  onPress={saveStartTime}
                >
                  <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#333333' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        <Modal
          visible={showEndPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEndPicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.bgModal }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set End Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Hours</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
                
                <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.buttonSecondary }]}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.buttonAccent }]}
                  onPress={saveEndTime}
                >
                  <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#333333' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        <Modal
          visible={showReminderPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReminderPicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.bgModal }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Reminder Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Hours</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
                
                <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeInputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                  <TextInput
                    style={[styles.timeInput, { 
                      backgroundColor: theme.bgInput,
                      color: theme.textPrimary,
                      borderColor: theme.borderColor,
                      borderWidth: 1
                    }]}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textDisabled}
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.buttonSecondary }]}
                  onPress={() => setShowReminderPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.buttonAccent }]}
                  onPress={saveReminderTime}
                >
                  <Text style={[styles.modalButtonText, { color: isDarkMode ? '#ffffff' : '#333333' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeInput: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
