import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const toastConfig = {
  riskError: ({ text1 }: any) => (
    <View style={[styles.toastBase, { backgroundColor: '#FF3B30' }]}>
      <Ionicons
        name="alert-circle"
        size={22}
        color="#fff"
        style={{ marginRight: 10 }}
      />
      <Text style={styles.toastText2}>{text1}</Text>
    </View>
  ),

  riskWarning: ({ text1 }: any) => (
    <View style={[styles.toastBase, { backgroundColor: '#FFCC00' }]}>
      <Ionicons
        name="warning"
        size={22}
        color="#000"
        style={{ marginRight: 10 }}
      />
      <Text style={styles.toastText1}>{text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastBase: {
    width: '90%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toastText1: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  toastText2: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
