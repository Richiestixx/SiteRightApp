/**
 * CompletionModal.js
 *
 * A modal that allows users to mark a log item as complete and add notes.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';

const CompletionModal = ({ log, isVisible, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(log.id, notes);
    setNotes(''); // Reset for next time
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Complete Item</Text>
          <Text style={styles.modalText}>
            Add any final notes for this task, such as additional hours or materials used.
          </Text>
          
          <Text style={styles.label}>Completion Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Required 2 additional hours."
            multiline
          />

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonCancel, pressed && { opacity: 0.8 }]}
              onPress={onClose}
            >
              <Text style={styles.textCancel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonConfirm, pressed && { opacity: 0.8 }]}
              onPress={handleConfirm}
            >
              <Text style={styles.textConfirm}>Confirm Completion</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#6b7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    marginLeft: 10,
  },
  buttonCancel: {
    backgroundColor: '#e5e7eb',
  },
  buttonConfirm: {
    backgroundColor: '#16a34a',
  },
  textCancel: {
    color: '#374151',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textConfirm: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CompletionModal;
