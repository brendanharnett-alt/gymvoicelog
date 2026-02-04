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
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const isRecordingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const pressStartTimeRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPressActiveRef = useRef(false);
  const currentPressIdRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
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
    // Generate unique press ID for this press
    const pressId = ++currentPressIdRef.current;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:55',message:'onPressIn fired - DO NOT START RECORDING',data:{pressId,isRecordingRef:isRecordingRef.current,isPressActive:isPressActiveRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // Mark press as active and store start time - DO NOT start recording
    isPressActiveRef.current = true;
    pressStartTimeRef.current = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:62',message:'Setting long press timeout',data:{pressId,pressStartTime:pressStartTimeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // Start timer - only start recording if held for minimum duration AND still active
    longPressTimeoutRef.current = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:67',message:'Long press timeout elapsed - checking if still active',data:{pressId,currentPressId:currentPressIdRef.current,isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current,elapsed:pressStartTimeRef.current?Date.now()-pressStartTimeRef.current:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      // CRITICAL: Only start if this is still the current press AND press is still active
      if (pressId === currentPressIdRef.current && isPressActiveRef.current && longPressTimeoutRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:71',message:'Press still active - calling handleStartRecording',data:{pressId},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        handleStartRecording(pressId);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:75',message:'Press no longer active - NOT starting recording',data:{pressId,currentPressId:currentPressIdRef.current,isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      }
    }, 150);
  };

  const handleStartRecording = async (expectedPressId?: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:88',message:'handleStartRecording called',data:{expectedPressId,currentPressId:currentPressIdRef.current,isRecordingRef:isRecordingRef.current,isTransitioning:isTransitioningRef.current,isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    // CRITICAL: Double-check press is still active and this is still the current press
    if (expectedPressId !== undefined && expectedPressId !== currentPressIdRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:92',message:'handleStartRecording BLOCKED - press ID mismatch',data:{expectedPressId,currentPressId:currentPressIdRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      return;
    }
    if (!isPressActiveRef.current || !longPressTimeoutRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:97',message:'handleStartRecording BLOCKED - press not active',data:{isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      return;
    }
    // Guard against duplicate start calls and transitions
    if (isRecordingRef.current || isTransitioningRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:91',message:'handleStartRecording early return',data:{reason:isRecordingRef.current?'already recording':'transitioning'},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      return;
    }

    isTransitioningRef.current = true;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:103',message:'Starting recording setup',data:{isPressActive:isPressActiveRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // CRITICAL: Check again AFTER async operations - press might have been released
      if (expectedPressId !== undefined && expectedPressId !== currentPressIdRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:115',message:'Press ID mismatch during async setup - ABORTING',data:{expectedPressId,currentPressId:currentPressIdRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        isTransitioningRef.current = false;
        return;
      }
      if (!isPressActiveRef.current || !longPressTimeoutRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:121',message:'Press released during async setup - ABORTING',data:{isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        isTransitioningRef.current = false;
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // CRITICAL: Check ONE MORE TIME before actually starting
      if (expectedPressId !== undefined && expectedPressId !== currentPressIdRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:129',message:'Press ID mismatch after recording created - ABORTING',data:{expectedPressId,currentPressId:currentPressIdRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        try {
          await recording.stopAndUnloadAsync();
        } catch {}
        isTransitioningRef.current = false;
        return;
      }
      if (!isPressActiveRef.current || !longPressTimeoutRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:137',message:'Press released after recording created - ABORTING',data:{isPressActive:isPressActiveRef.current,hasTimeout:!!longPressTimeoutRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        try {
          await recording.stopAndUnloadAsync();
        } catch {}
        isTransitioningRef.current = false;
        return;
      }

      recordingRef.current = recording;
      recordingStartTimeRef.current = Date.now();

      isRecordingRef.current = true;
      setIsRecording(true);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:135',message:'Recording started - state set',data:{recordingStartTime:recordingStartTimeRef.current,isPressActive:isPressActiveRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      scale.value = withSpring(1.15);
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1000 }),
        -1,
        true
      );
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:143',message:'Recording start error',data:{error:String(err),isPressActive:isPressActiveRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      console.error('Failed to start recording', err);
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const handlePressOut = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:125',message:'onPressOut fired',data:{hasLongPressTimeout:!!longPressTimeoutRef.current,isRecordingRef:isRecordingRef.current,isPressActive:isPressActiveRef.current,pressStartTimeRef:pressStartTimeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    // CRITICAL: Mark press as inactive FIRST and increment press ID to invalidate any pending timeout
    isPressActiveRef.current = false;
    currentPressIdRef.current++; // Invalidate any pending timeout callbacks
    
    // Clear the long press timeout if recording hasn't started yet
    if (longPressTimeoutRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:132',message:'Clearing long press timeout - tap detected',data:{elapsed:pressStartTimeRef.current?Date.now()-pressStartTimeRef.current:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
      pressStartTimeRef.current = null;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:138',message:'Early return - recording never started (tap)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      return; // Tap detected - recording never started
    }

    // If we get here, recording was started, so stop it
    await handleStopRecording();
  };

  const handleStopRecording = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:140',message:'handleStopRecording called',data:{isRecordingRef:isRecordingRef.current,isTransitioning:isTransitioningRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    // Guard against duplicate stop calls and transitions
    if (!isRecordingRef.current || isTransitioningRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:145',message:'handleStopRecording early return',data:{reason:!isRecordingRef.current?'not recording':'transitioning'},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      return;
    }

    const duration = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 0;
    const isCancel = duration < 400;

    isRecordingRef.current = false;
    setIsRecording(false);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:157',message:'Stopping recording - state cleared',data:{duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    scale.value = withSpring(1);
    cancelAnimation(pulseScale);
    pulseScale.value = 1;
    recordingStartTimeRef.current = null;
    pressStartTimeRef.current = null;
    isPressActiveRef.current = false;

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
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:250',message:'About to call onRecordingComplete',data:{hasTranscript:!!result.transcript,transcriptLength:result.transcript?.length||0,duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'I'})}).catch(()=>{});
            // #endregion
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
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RecordButton.tsx:245',message:'onPress event fired (tap - should be no-op)',data:{isRecording},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
            // #endregion
            // Tap does nothing - recording only starts after hold delay
          }}
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

