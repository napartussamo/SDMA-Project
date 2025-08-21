import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/authContext';
import { checkIsDefaultSmsApp } from '../native/SmsDefaultModule';

const OTPVerifyScreen = ({ navigation }: any) => {
  const [code, setCode] = useState('');
  const { verifyOTP } = useAuth();

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาใส่ OTP 6 หลัก');
      return;
    }

    try {
      await verifyOTP(code);
      const isDefault = await checkIsDefaultSmsApp();
      if (isDefault) {
        navigation.replace('Home');
      } else {
        navigation.replace('PermSetUp');
      }
    } catch {
      // error handle ไปแล้วใน context
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="กรอกรหัส OTP"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        style={styles.input}
      />
      <Button title="ยืนยัน OTP" onPress={handleVerify} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 16,
  },
});

export default OTPVerifyScreen;
