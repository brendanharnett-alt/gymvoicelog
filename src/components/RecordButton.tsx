import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

interface RecordButtonProps {
  onRecordingComplete: (result: { transcript: string; summary?: string | null; extractedLifts?: any[] | null }) => void;
}

const BACKEND_URL  = 'http://192.168.1.97:3001/transcribe';


export function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const isRecordingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

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
    // Guard against duplicate start calls and transitions
    if (isRecordingRef.current || isTransitioningRef.current) {
      return;
    }

    isTransitioningRef.current = true;
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
      recordingStartTimeRef.current = Date.now();

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
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const handleStopRecording = async () => {
    // Guard against duplicate stop calls and transitions
    if (!isRecordingRef.current || isTransitioningRef.current) {
      return;
    }

    const duration = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 0;
    const isCancel = duration < 400;

    isRecordingRef.current = false;
    setIsRecording(false);
    scale.value = withSpring(1);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;
    recordingStartTimeRef.current = null;

    isTransitioningRef.current = true;
    try {
      if (isCancel) {
        // Cancel short recordings without logging or error
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch {
            // Silently ignore errors for cancelled recordings
          }
          recordingRef.current = null;
        }
        return;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          try {
            const formData = new FormData();
            formData.append('audio', {
              uri,
              type: 'audio/m4a',
              name: 'recording.m4a',
            } as any);

            const response = await fetch(BACKEND_URL, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();
            if (result.transcript) {
              // Pass the full result object instead of just transcript
              onRecordingComplete(result);
            }
          } catch (err) {
            console.error('Failed to upload/transcribe audio', err);
          } finally {
            try {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch {
              // Silently ignore deletion errors
            }
          }
        }
      }
    } catch (err: any) {
      // Gracefully catch "no valid audio data" and similar errors
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('no valid audio data') || 
          errorMessage.includes('audio data')) {
        // Silently handle invalid audio data errors
        return;
      }
      console.error('Failed to stop recording', err);
    } finally {
      isTransitioningRef.current = false;
    }
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

