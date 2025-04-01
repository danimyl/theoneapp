/**
 * Secret Modal Component
 * 
 * Displays a modal with a secret message.
 * This modal appears on the second time the app is opened on any given day.
 */

import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SecretModalProps {
  isVisible: boolean;
  onClose: () => void;
  secretText: string;
}

const { width } = Dimensions.get('window');

const SecretModal: React.FC<SecretModalProps> = ({ isVisible, onClose, secretText }) => {
  if (!isVisible || !secretText) {
    return null;
  }
  
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Daily Secret</Text>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.content}>
                <Text style={styles.secretText}>
                  {secretText}
                </Text>
              </View>
              
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.closeTextButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeTextButtonText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    // Note: backdropFilter is not supported in React Native
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  secretText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeTextButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeTextButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1DB954', // Spotify green
    letterSpacing: 1,
  },
});

export default SecretModal;
