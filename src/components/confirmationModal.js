import React from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';
import CustomButton from './button';
import colors from '../utils/colors';

const ConfirmationModal = ({ visible, onConfirm, onCancel, data }) => {
  return (
    <Modal transparent={true} visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Delete item</Text>
          <Text style={styles.modalText}>
            Are you sure you want to delete {data}? This action cannot be undone.
          </Text>
          <View style={styles.buttonContainer}>
            <CustomButton
              buttonStyle={styles.buttonCancel}
              underlayColor="#777"
              onPress={onCancel}
              title="Cancel"
            />
            <CustomButton buttonStyle={styles.button} onPress={onConfirm} title="Delete" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: colors.black,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  modalText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 20,
    marginHorizontal: 16,
    lineHeight: 25,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: colors.gray,
  },
});

export default ConfirmationModal;
