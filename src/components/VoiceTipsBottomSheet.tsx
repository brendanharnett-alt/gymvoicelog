import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceTipsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function VoiceTipsBottomSheet({ visible, onClose }: VoiceTipsBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContent}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.title}>Voice Tips</Text>
            
            <Text style={styles.bodyText}>
              LiftVoice works best when you say the exercise name, weight, and sets together in one clear phrase.
            </Text>
            
            <Text style={styles.sectionTitle}>Examples:</Text>
            <View style={styles.examplesContainer}>
              <Text style={styles.exampleItem}>• Bench press 225 for two sets of 8</Text>
              <Text style={styles.exampleItem}>• Then 225 for 1 set of 6</Text>
              <Text style={styles.exampleItem}>• Lat pulldown 210 for 3 sets of 10</Text>
              <Text style={styles.exampleItem}>• Dumbbell curl 40 for 8</Text>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    height: Dimensions.get('window').height * 0.75,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  exampleItem: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
});

