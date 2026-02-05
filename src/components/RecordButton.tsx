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

const BACKEND_URL  = 'https://gymvoicelog-stt-production.up.railway.app/transcribe';


export function RecordButton({ onRecordingComplete }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const isRecordingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isTransitioningRef = useRef(false);

  // Pre-request permissions and set audio mode on mount for faster recording start
  useEffect(() => {
    const prepareAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (err) {
        // Silently handle permission errors - will retry on recording start
        console.error('Failed to prepare audio', err);
      }
    };
    prepareAudio();
  }, []);

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

  const handlePressIn = () => {
    // Prevent interaction during transcription
    if (isTranscribing) {
      return;
    }
    // Provide immediate visual feedback on press (but don't start recording)
    if (!isRecordingRef.current) {
      scale.value = withSpring(1.05);
    }
  };

  const handleLongPress = () => {
    // Prevent interaction during transcription
    if (isTranscribing) {
      return;
    }
    // If already recording, ignore this long press - user should release to stop
    if (isRecordingRef.current) {
      return;
    }

    // Start recording on long press
    handleStartRecording();
  };

  const handleStartRecording = async () => {
    // Guard against duplicate start calls and transitions
    if (isRecordingRef.current || isTransitioningRef.current) {
      return;
    }

    isTransitioningRef.current = true;
    try {
      // Permissions and audio mode should already be set, but retry if needed
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (permErr) {
        // If pre-setup failed, try again
        console.error('Audio setup retry', permErr);
      }

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
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const handlePressOut = async () => {
    // Reset visual feedback if not recording
    if (!isRecordingRef.current) {
      scale.value = withSpring(1);
    }

    // Stop recording if it's active
    if (isRecordingRef.current) {
      await handleStopRecording();
    }
  };

  const handleStopRecording = async () => {
    // Always stop if recording is active, even if transitioning
    // This prevents the button from getting stuck
    if (!isRecordingRef.current) {
      return;
    }

    // Set state to false IMMEDIATELY to prevent stuck UI
    isRecordingRef.current = false;
    setIsRecording(false);
    isTransitioningRef.current = true;
    
    scale.value = withSpring(1);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          // Set transcribing state to show indicator and disable button
          setIsTranscribing(true);
          
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
            // Clear transcribing state
            setIsTranscribing(false);
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
        <View style={styles.buttonWrapper}>
          <Pressable
            style={[
              styles.button,
              isRecording && styles.buttonRecording,
              isTranscribing && styles.buttonDisabled,
            ]}
            onPressIn={handlePressIn}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
            delayLongPress={100}
            disabled={isTranscribing}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={42}
              color={isTranscribing ? '#666666' : '#FFFFFF'}
            />
          </Pressable>
          {isTranscribing && (
            <View style={styles.transcriptionOverlay}>
              <View style={styles.transcriptionIndicator}>
                <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
                <Text style={styles.transcriptionText}>Transcribing...</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
      <Text style={styles.label}>
        {isTranscribing
          ? 'Transcribing...'
          : isRecording
          ? 'Recording...'
          : 'Hold to record'}
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonWrapper: {
    position: 'relative',
  },
  transcriptionOverlay: {
    position: 'absolute',
    top: -50,
    left: -30,
    right: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  transcriptionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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

