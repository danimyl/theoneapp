/**
 * Book Screen Component
 * 
 * Main screen for the book feature that uses a simple modal-based navigation
 * approach instead of drawer navigation to avoid dependency issues with React Native Reanimated.
 */

import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  TextInput,
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BookNavigationTree } from './BookNavigationTree';
import { BookContentScreen } from './BookContentScreen';
import useBookStore from '../store/bookStore';

export const BookScreen = () => {
  const { theme, isDark } = useTheme();
  const [isNavigationVisible, setNavigationVisible] = useState(false);
  const { closeBookDrawer, searchQuery, setSearchQuery } = useBookStore();
  
  const openNavigation = () => {
    setNavigationVisible(true);
  };
  
  const closeNavigation = () => {
    setNavigationVisible(false);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      {/* Status bar with proper configuration */}
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgPrimary}
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.navigationContainer, { 
            backgroundColor: theme.bgCard,
            borderRightColor: theme.borderColor 
          }]}>
            <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
              <TouchableOpacity onPress={closeNavigation} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.textPrimary }]}>✕</Text>
              </TouchableOpacity>
              <View style={[styles.searchContainer, { backgroundColor: theme.bgInput }]}>
                <MaterialIcons name="search" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary }]}
                  placeholder="Search chapters..."
                  placeholderTextColor={theme.textDisabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <MaterialIcons name="clear" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <BookNavigationTree 
              onChapterSelect={closeNavigation} 
              searchQuery={searchQuery}
            />
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
