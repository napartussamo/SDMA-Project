import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
      <View>
        <View style={styles.header}>
          <Text style={styles.title}>ใส่รหัสยืนยัน</Text>
        </View>
        <TextInput
          placeholder="กรอกรหัส OTP"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleVerify}>
        <Text style={styles.btnText}>ยืนยัน OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding: 24, backgroundColor:'#1E3A8A', justifyContent: 'space-between' },
  header:{marginVertical:36},
  title: {fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#fff',lineHeight: 32},
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 16, backgroundColor: '#fff',
  },
  btn: { backgroundColor: "#F5C45E", borderRadius: 42, marginHorizontal:50, marginBottom: 80, elevation: 5},
  btnText: { fontSize:16, color:'#000', textAlign: 'center', paddingVertical:10, paddingHorizontal:20}
});

export default OTPVerifyScreen;
