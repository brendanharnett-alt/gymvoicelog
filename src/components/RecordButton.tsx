import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
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
  const isRecordingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        // Stop any ongoing recording if component unmounts mid-press
        isRecordingRef.current = false;
        cancelAnimation(pulseScale);
        scale.value = 1;
        pulseScale.value = 1;
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, [scale, pulseScale]);

  const handleStartRecording = async () => {
    // Guard against duplicate start calls
    if (isRecordingRef.current) {
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      isRecordingRef.current = true;
      setIsRecording(true);
      scale.value = withSpring(1.15);
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1000 }),
        -1,
        true
      );
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handleStopRecording = async () => {
    // Guard against duplicate stop calls
    if (!isRecordingRef.current) {
      return;
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    scale.value = withSpring(1);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        if (uri) {
          console.log('Audio recording saved at:', uri);
          // Log the URI - transcription/upload will be added later
        }
        recordingRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }

    setShowInputModal(true);
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
        <Pressable
          style={[styles.button, isRecording && styles.buttonRecording]}
          onPressIn={handleStartRecording}
          onPressOut={handleStopRecording}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={42}
            color="#FFFFFF"
          />
        </Pressable>
      </Animated.View>
      <Text style={styles.label}>
        {isRecording ? 'Recording...' : 'Hold to record'}
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

