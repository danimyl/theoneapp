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

export const SettingsScreen: React.FC = () => {
  const { 
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
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {/* Hourly Reminders Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="notifications" size={24} color="#1DB954" style={styles.icon} />
              <Text style={styles.settingLabel}>Always Show Hourly Reminders</Text>
            </View>
            <Switch
              value={alwaysHourlyReminders}
              onValueChange={setAlwaysHourlyReminders}
              trackColor={{ false: '#767577', true: '#1DB954' }}
              thumbColor={Platform.OS === 'ios' ? undefined : (alwaysHourlyReminders ? '#ffffff' : '#f4f3f4')}
            />
          </View>
          
          <Text style={styles.settingDescription}>
            When enabled, hourly reminders will be shown for all steps, not just those marked as hourly.
          </Text>
        </View>
        
        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.settingDescription}>
            Notifications will be silenced during these hours
          </Text>
          
          {/* Sleep Start Time */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={openStartTimePicker}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="bedtime" size={24} color="#1DB954" style={styles.icon} />
              <Text style={styles.settingLabel}>Start Time</Text>
            </View>
            <Text style={styles.timeText}>{sleepStart}</Text>
          </TouchableOpacity>
          
          {/* Sleep End Time */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={openEndTimePicker}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="wb-sunny" size={24} color="#1DB954" style={styles.icon} />
              <Text style={styles.settingLabel}>End Time</Text>
            </View>
            <Text style={styles.timeText}>{sleepEnd}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Practice Reminder Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Reminder</Text>
          <Text style={styles.settingDescription}>
            Get a reminder if your practices are not completed by the specified time
          </Text>
          
          {/* Practice Reminder Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="notifications-active" size={24} color="#1DB954" style={styles.icon} />
              <Text style={styles.settingLabel}>Enable Practice Reminder</Text>
            </View>
            <Switch
              value={practiceReminderEnabled}
              onValueChange={setPracticeReminderEnabled}
              trackColor={{ false: '#767577', true: '#1DB954' }}
              thumbColor={Platform.OS === 'ios' ? undefined : (practiceReminderEnabled ? '#ffffff' : '#f4f3f4')}
            />
          </View>
          
          {/* Practice Reminder Time */}
          <TouchableOpacity 
            style={[
              styles.settingRow,
              !practiceReminderEnabled && styles.settingRowDisabled
            ]}
            onPress={openReminderTimePicker}
            disabled={!practiceReminderEnabled}
          >
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="access-time" size={24} color="#1DB954" style={styles.icon} />
              <Text style={[
                styles.settingLabel,
                !practiceReminderEnabled && styles.settingLabelDisabled
              ]}>Reminder Time</Text>
            </View>
            <Text style={[
              styles.timeText,
              !practiceReminderEnabled && styles.timeTextDisabled
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Start Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
                
                <Text style={styles.timeSeparator}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveStartTime}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set End Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
                
                <Text style={styles.timeSeparator}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveEndTime}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempHours}
                    onChangeText={setTempHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
                
                <Text style={styles.timeSeparator}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowReminderPicker(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveReminderTime}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
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
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
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
    color: '#ffffff',
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 16,
    color: '#1DB954',
    fontWeight: 'bold',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingLabelDisabled: {
    color: '#999999',
  },
  timeTextDisabled: {
    color: '#999999',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
    color: '#999999',
    fontSize: 14,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#ffffff',
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
  cancelButton: {
    backgroundColor: '#555555',
  },
  saveButton: {
    backgroundColor: '#1DB954',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
