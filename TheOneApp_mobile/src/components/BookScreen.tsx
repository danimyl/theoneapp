/**
 * Book Screen Component
 * 
 * Main screen for the book feature that uses a simple modal-based navigation
 * approach instead of drawer navigation to avoid dependency issues with React Native Reanimated.
 */

import React, { useState } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { BookNavigationTree } from './BookNavigationTree';
import { BookContentScreen } from './BookContentScreen';
import useBookStore from '../store/bookStore';

export const BookScreen = () => {
  const [isNavigationVisible, setNavigationVisible] = useState(false);
  const { closeBookDrawer } = useBookStore();
  
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    // Ensure proper padding on iOS
    ...(Platform.OS === 'ios' ? { paddingTop: 0 } : {}),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  navigationContainer: {
    width: '85%',
    height: '100%',
    backgroundColor: '#121212',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
