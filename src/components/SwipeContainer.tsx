import React, { useRef } from 'react';
import { View, PanResponder, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeContainer({ children, onSwipeLeft, onSwipeRight }: SwipeContainerProps) {
  const translateX = useSharedValue(0);
  const isNavigatingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        if (!isNavigatingRef.current) {
          translateX.value = 0;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isNavigatingRef.current && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          translateX.value = gestureState.dx;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isNavigatingRef.current) {
          return;
        }

        const threshold = SCREEN_WIDTH * 0.25;
        const swipeDistance = gestureState.dx;

        if (Math.abs(swipeDistance) > threshold) {
          isNavigatingRef.current = true;
          
          if (swipeDistance > 0) {
            // Swipe right - previous day
            onSwipeRight();
          } else {
            // Swipe left - next day
            onSwipeLeft();
          }

          // Reset and allow next gesture
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 }, () => {
            'worklet';
            isNavigatingRef.current = false;
          });
        } else {
          // Not enough swipe - spring back
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      },
      onPanResponderTerminate: () => {
        if (!isNavigatingRef.current) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}

