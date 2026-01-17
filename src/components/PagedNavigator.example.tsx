/**
 * Example usage of PagedNavigator component
 * 
 * This demonstrates how to use the PagedNavigator with your workout app
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PagedNavigator } from './PagedNavigator';

// Example: Convert dates to pages
export function DatePagedNavigator() {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Generate pages for dates (e.g., -30 to +30 days from today)
  const generateDatePages = () => {
    const pages = [];
    const today = new Date();
    
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      pages.push(
        <View key={i} style={styles.page}>
          <Text style={styles.pageText}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      );
    }
    
    return pages;
  };

  const pages = generateDatePages();
  const actualPageIndex = currentPage + 30; // Offset to account for negative indices

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PagedNavigator
        pages={pages}
        currentPage={actualPageIndex}
        onPageChange={(page) => {
          setCurrentPage(page - 30); // Convert back to date offset
        }}
        onToggleUI={() => {
          console.log('UI toggled');
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  pageText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

