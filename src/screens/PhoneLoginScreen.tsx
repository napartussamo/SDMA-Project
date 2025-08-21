import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/authContext';

const PhoneLoginScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('');
  const { signInWithPhone } = useAuth();

  const handleSendOTP = async () => {
    if (!/^\+66\d{9}$/.test(phone)) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาใส่เบอร์โทรในรูปแบบ +66XXXXXXXXX');
      return;
    }
    await signInWithPhone(phone);
    navigation.replace('OTPVerify');
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="+66XXXXXXXXX"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <Button title="ส่ง OTP" onPress={handleSendOTP} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 16,
  },
});

export default PhoneLoginScreen;