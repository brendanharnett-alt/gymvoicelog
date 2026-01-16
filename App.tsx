import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Scrollable list area */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Empty state */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No workouts yet</Text>
          <Text style={styles.emptyStateSubtitle}>Tap the mic to record your first exercise</Text>
        </View>
      </ScrollView>

      {/* Large circular microphone button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.micButton}
          activeOpacity={0.8}
          onPress={() => {
            // Audio functionality will be added later
            console.log('Microphone button pressed');
          }}
        >
          <Ionicons name="mic-outline" size={48} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.micButtonLabel}>Tap to record</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 160, // Space for the button
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  micButtonLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '400',
  },
});


