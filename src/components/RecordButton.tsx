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
  onRecordingComplete: (result: {
    transcript: string;
    summary?: string | null;
    extractedLifts?: any[] | null;
  }) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const BACKEND_URL = 'https://gymvoicelog-stt-production.up.railway.app/transcribe';

// --- Tunables ---
// Hold threshold: how long the finger must stay down before we start recording.
// This is the key to "tap can never start recording".
const HOLD_TO_START_MS = 250;

// Hard safety stop: prevents runaway recordings even if events get missed.
const MAX_RECORDING_MS = 90_000; // 90s (change to 120_000 if you want 2 minutes)

// Polling interval: how often to check if button is still being pressed
const POLLING_INTERVAL_MS = 100; // Check every 100ms if button is still pressed

export function RecordButton({ onRecordingComplete, onRecordingStateChange }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Refs for correctness under async/timing edge cases
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isRecordingRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Press/gesture gating
  const isPressingRef = useRef(false);
  const pendingStartRef = useRef(false);

  // Timers
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingStartRef.current = false;
  };

  const clearMaxTimer = () => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  };

  const startPolling = () => {
    // Clear any existing polling
    stopPolling();
    
    pollingIntervalRef.current = setInterval(() => {
      // If recording but not pressing, stop recording
      if (isRecordingRef.current && !isPressingRef.current) {
        handleStopRecording().catch(() => {});
      }
    }, POLLING_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

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
        // Will retry when starting recording
        console.error('Failed to prepare audio', err);
      }
    };
    prepareAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHoldTimer();
      clearMaxTimer();
      stopPolling(); // Stop polling on unmount

      isPressingRef.current = false;
      pendingStartRef.current = false;

      if (isRecordingRef.current) {
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

  const startRecording = async () => {
    // Hard guards
    if (isTranscribing) return;
    if (!isPressingRef.current) return;            // must still be holding
    if (isRecordingRef.current) return;
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;

    try {
      // Retry permissions/audio mode (safe even if already set)
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (permErr) {
        console.error('Audio setup retry', permErr);
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      isRecordingRef.current = true;
      setIsRecording(true);
      if (onRecordingStateChange) {
        onRecordingStateChange(true);
      }

      // Animate into recording state
      scale.value = withSpring(1.15);
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1000 }),
        -1,
        true
      );

      // Safety: force-stop after max duration no matter what
      clearMaxTimer();
      maxTimerRef.current = setTimeout(() => {
        // If still recording, stop it. This prevents runaway.
        if (isRecordingRef.current) {
          handleStopRecording().catch(() => {});
        }
      }, MAX_RECORDING_MS);

      // Ensure polling is still active while recording
      if (!pollingIntervalRef.current) {
        startPolling();
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      // If start failed, reset UI state
      stopPolling(); // Stop polling on error
      isRecordingRef.current = false;
      setIsRecording(false);
      if (onRecordingStateChange) {
        onRecordingStateChange(false);
      }
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
      scale.value = withSpring(1);
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const handleStopRecording = async () => {
    // Stop polling immediately
    stopPolling();
    
    // Stop if recording is active (even if transitioning)
    if (!isRecordingRef.current) {
      return;
    }

    // Immediately flip state so UI cannot get stuck
    isRecordingRef.current = false;
    setIsRecording(false);
    if (onRecordingStateChange) {
      onRecordingStateChange(false);
    }

    // Clear timers & animations
    clearMaxTimer();
    clearHoldTimer();

    scale.value = withSpring(1);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;

    isTransitioningRef.current = true;

    try {
      const rec = recordingRef.current;
      if (rec) {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        recordingRef.current = null;

        if (!uri) return;

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
          if (result?.transcript) {
            onRecordingComplete(result);
          }
        } catch (err) {
          console.error('Failed to upload/transcribe audio', err);
        } finally {
          setIsTranscribing(false);
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch {
            // ignore deletion errors
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      // Gracefully ignore common "no valid audio data" failures
      if (
        errorMessage.includes('no valid audio data') ||
        errorMessage.includes('audio data')
      ) {
        return;
      }
      console.error('Failed to stop recording', err);
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const handlePressIn = () => {
    if (isTranscribing) return;
    if (isRecordingRef.current) return;

    isPressingRef.current = true;
    startPolling(); // Start polling when press begins

    // Instant feedback (no recording yet)
    scale.value = withSpring(1.05);

    // Schedule start after hold threshold.
    // This is the "tap can't start recording" guarantee.
    clearHoldTimer();
    pendingStartRef.current = true;

    holdTimerRef.current = setTimeout(() => {
      pendingStartRef.current = false;
      // Only start if still pressing (true hold)
      if (isPressingRef.current) {
        startRecording().catch(() => {});
      }
    }, HOLD_TO_START_MS);
  };

  const handlePressOut = async () => {
    // Finger is up => cancel any pending start
    isPressingRef.current = false;
    stopPolling(); // Stop polling when press ends
    clearHoldTimer();

    // If not recording, just reset visuals
    if (!isRecordingRef.current) {
      scale.value = withSpring(1);
      return;
    }

    // If recording, stop
    await handleStopRecording();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
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
            onPressOut={handlePressOut}
            disabled={isTranscribing}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={42}
              color={isTranscribing ? '#666666' : '#FFBF00'}
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
          : `Hold to record`}
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
    borderColor: '#FFBF00', // Amber yellow to match headers and buttons
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FFBF00', // Amber yellow shadow to match
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
