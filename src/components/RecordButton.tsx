import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { WorkoutInputModal } from './WorkoutInputModal';

interface RecordButtonProps {
  onRecordingComplete: (transcript: string) => void;
}

export function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const handlePress = () => {
    if (isRecording) {
      // Stop recording and show input modal
      setIsRecording(false);
      scale.value = withSpring(1);
      pulseScale.value = 1;
      setShowInputModal(true);
    } else {
      // Start recording
      setIsRecording(true);
      scale.value = withSpring(1.1);
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    }
  };

  const handleSave = (text: string) => {
    onRecordingComplete(text);
    setShowInputModal(false);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: isRecording ? 0.3 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseRing, pulseStyle]} />
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.button, isRecording && styles.buttonRecording]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={42}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label}>
        {isRecording ? 'Recording...' : 'Tap to record'}
      </Text>
      
      <WorkoutInputModal
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  buttonRecording: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  label: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '400',
  },
});

