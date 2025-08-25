import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>ยืนยันหมายเลขโทรศัพท์</Text>
            <Text style={styles.subtitle}>เรากำลังส่งรหัสยืนยัน จะไม่เรียกเก็บค่าธรรมเนียมใดๆ</Text>
          </View>
          <TextInput
            placeholder="+66XXXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSendOTP}>
          <Text style={styles.btnText}>ส่ง OTP</Text>
        </TouchableOpacity>
      </View>
      
  );
};

const styles = StyleSheet.create({
  container: {flex:1, padding: 24, backgroundColor:'#1E3A8A', justifyContent: 'space-between' },
  input: {
    borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 16,
  },
  
  header: {marginVertical:36},
  title: {fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#fff',lineHeight: 32},
  subtitle: {fontSize: 16, textAlign: 'center', color: '#fff',lineHeight: 32,},
  btn: { backgroundColor: "#F5C45E", borderRadius: 42, marginHorizontal:50, marginBottom: 80, elevation: 5},
  btnText: { fontSize:16, color:'#000', textAlign: 'center', paddingVertical:10, paddingHorizontal:20}
  
});

export default PhoneLoginScreen;