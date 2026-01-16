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

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Scrollable list area */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Empty for now - will contain workout logs */}
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
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>
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
    paddingBottom: 100, // Space for the button
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
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#FF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  micIcon: {
    fontSize: 40,
  },
});


