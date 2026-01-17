/**
 * PagedNavigator - Kindle-style horizontal page navigation component
 * 
 * Features:
 * - Discrete page navigation (page 0...N)
 * - Only one page visible at a time
 * - No vertical scrolling
 * - Tap zones: Left 30% (prev), Center 40% (toggle UI), Right 30% (next)
 * - Horizontal swipe for ±1 page navigation
 * - Double-tap center to enter fast navigation mode
 * - Fast navigation: drag distance maps to page delta
 * 
 * @example
 * ```tsx
 * <GestureHandlerRootView style={{ flex: 1 }}>
 *   <PagedNavigator
 *     pages={[<Page1 />, <Page2 />, <Page3 />]}
 *     currentPage={1}
 *     onPageChange={(page) => setCurrentPage(page)}
 *     onToggleUI={() => console.log('UI toggled')}
 *   />
 * </GestureHandlerRootView>
 * ```
 */

import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tap zone boundaries
const LEFT_ZONE_WIDTH = SCREEN_WIDTH * 0.3;
const CENTER_ZONE_WIDTH = SCREEN_WIDTH * 0.4;
const RIGHT_ZONE_START = SCREEN_WIDTH * 0.7;

// Fast navigation constants
// Drag 1 full screen width = 1 page jump
// Smaller drags = proportionally fewer pages
const FAST_NAV_SENSITIVITY = 1.0; // 1 screen width = 1 page
const MIN_DRAG_FOR_FAST_NAV = 20; // Minimum pixels to trigger fast nav

type GestureMode = 'normal' | 'fastNavigation';

interface PagedNavigatorProps {
  pages: React.ReactNode[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onToggleUI?: () => void; // Called when center zone is tapped
}

export function PagedNavigator({
  pages,
  currentPage,
  onPageChange,
  onToggleUI,
}: PagedNavigatorProps) {
  // Use shared value for gesture mode so it's accessible in worklets
  const gestureMode = useSharedValue<GestureMode>('normal');
  const [gestureModeState, setGestureModeState] = useState<GestureMode>('normal');
  
  // Animation values
  const translateX = useSharedValue(0);
  const targetPage = useSharedValue(currentPage);
  
  // Gesture tracking
  const lastTapTime = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300;
  const fastNavStartX = useSharedValue(0);
  const fastNavStartPage = useSharedValue(currentPage);

  // Clamp page to valid range
  const clampPage = useCallback((page: number): number => {
    return Math.max(0, Math.min(page, pages.length - 1));
  }, [pages.length]);

  // Navigate to page with animation
  const navigateToPage = useCallback((page: number) => {
    const clampedPage = clampPage(page);
    targetPage.value = clampedPage;
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    onPageChange(clampedPage);
  }, [clampPage, onPageChange]);

  // Determine tap zone from x coordinate
  const getTapZone = useCallback((x: number): 'left' | 'center' | 'right' => {
    if (x < LEFT_ZONE_WIDTH) return 'left';
    if (x < RIGHT_ZONE_START) return 'center';
    return 'right';
  }, []);

  // Handle tap gesture
  const handleTap = useCallback((x: number) => {
    const zone = getTapZone(x);
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    if (zone === 'center') {
      // Check for double tap
      if (timeSinceLastTap < DOUBLE_TAP_DELAY && lastTapTime.current > 0) {
        // Double tap detected - enter fast navigation mode
        gestureMode.value = 'fastNavigation';
        setGestureModeState('fastNavigation');
        fastNavStartPage.value = currentPage;
        fastNavStartX.value = x;
        lastTapTime.current = 0; // Reset to prevent triple tap
      } else {
        // Single tap - toggle UI
        lastTapTime.current = now;
        onToggleUI?.();
      }
    } else if (zone === 'left') {
      // Navigate to previous page
      lastTapTime.current = 0; // Reset double tap timer
      navigateToPage(currentPage - 1);
    } else if (zone === 'right') {
      // Navigate to next page
      lastTapTime.current = 0; // Reset double tap timer
      navigateToPage(currentPage + 1);
    }
  }, [currentPage, getTapZone, navigateToPage, onToggleUI, gestureMode, fastNavStartPage, fastNavStartX]);

  // Handle pan gesture for swipes
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      if (gestureMode.value === 'fastNavigation') {
        fastNavStartX.value = event.x;
        fastNavStartPage.value = currentPage;
      } else {
        translateX.value = 0;
      }
    })
    .onUpdate((event) => {
      'worklet';
      if (gestureMode.value === 'fastNavigation') {
        // Fast navigation mode - map drag distance to page delta
        const dragDelta = event.x - fastNavStartX.value;
        const pageDelta = (dragDelta / SCREEN_WIDTH) * FAST_NAV_SENSITIVITY;
        const newPage = fastNavStartPage.value - pageDelta; // Negative because drag right = previous pages
        
        // Visual feedback - show continuous translation scaled for smooth animation
        translateX.value = -dragDelta * 0.5; // Scale down for smoother visual feedback
      } else {
        // Normal mode - only allow ±1 page movement
        const maxTranslate = SCREEN_WIDTH;
        translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, event.translationX));
      }
    })
    .onEnd((event) => {
      'worklet';
      if (gestureMode.value === 'fastNavigation') {
        // Calculate final page from drag distance
        const dragDelta = event.x - fastNavStartX.value;
        const pageDelta = (dragDelta / SCREEN_WIDTH) * FAST_NAV_SENSITIVITY;
        const newPage = fastNavStartPage.value - pageDelta;
        
        // Exit fast navigation mode
        gestureMode.value = 'normal';
        runOnJS(setGestureModeState)('normal');
        
        // Navigate to calculated page (snap to nearest integer page)
        const targetPageNum = Math.round(newPage);
        runOnJS(navigateToPage)(targetPageNum);
      } else {
        // Normal mode - snap to page based on swipe distance
        const threshold = SCREEN_WIDTH * 0.25;
        const swipeDistance = event.translationX;
        const velocity = event.velocityX;

        let newPage = currentPage;

        if (Math.abs(swipeDistance) > threshold || Math.abs(velocity) > 500) {
          if (swipeDistance > 0 || velocity > 0) {
            // Swipe right - previous page
            newPage = currentPage - 1;
          } else {
            // Swipe left - next page
            newPage = currentPage + 1;
          }
        }

        runOnJS(navigateToPage)(newPage);
      }
    });

  // Handle tap gesture
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      'worklet';
      runOnJS(handleTap)(event.x);
    });

  // Compose gestures - tap and pan work together
  // Tap fires on quick taps, pan handles drags
  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  // Update target page when currentPage prop changes and reset animation
  React.useEffect(() => {
    targetPage.value = currentPage;
    translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, [currentPage, targetPage, translateX]);

  // Animated style for page container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Render current page - use currentPage prop for rendering, translateX for animation
  const renderCurrentPage = () => {
    if (pages.length === 0) return null;
    const clampedIndex = clampPage(currentPage);
    return pages[clampedIndex];
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.pageContainer}>
          {renderCurrentPage()}
        </View>
        
        {/* Visual indicator for fast navigation mode */}
        {gestureModeState === 'fastNavigation' && (
          <View style={styles.fastNavIndicator}>
            <View style={styles.fastNavBadge} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  pageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  fastNavIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  fastNavBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    opacity: 0.8,
  },
});

