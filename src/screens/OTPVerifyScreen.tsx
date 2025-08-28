import React, {useRef,useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/authContext';
import { checkIsDefaultSmsApp } from '../native/SmsDefaultModule';

const OTPVerifyScreen = ({ navigation }: any) => {
  const [code, setCode] = useState(Array(6).fill(""));
  const inputs = useRef<Array<TextInput | null>>([]);
  const { verifyOTP } = useAuth();

const handleChange = (index: number, value: string) => {
  const newCode = [...code];

  if (value) {
    // ถ้ามีการกรอกเลข → ใส่ค่าแล้วเลื่อนไปช่องถัดไป
    newCode[index] = value;
    setCode(newCode);

    if (index < 5) {
      inputs.current[index + 1]?.focus();
    }
  } else {
    // ถ้าเคลียร์ค่า (Backspace)
    newCode[index] = "";
    setCode(newCode);

    // ย้าย focus กลับไปช่องก่อนหน้า
    if (index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }
};

//ยังบัคอยู่


  const handleVerify = async () => {
    const otp = code.join("");
    if (otp.length !== 6) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาใส่ OTP 6 หลัก');
      return;
    }

    try {
      await verifyOTP(otp);
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
        <View style={styles.otpRow}>
          {code.map((value, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref }}
              value={value}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(val) => handleChange(index, val)}
              style={styles.input}
            />
          ))}
        </View>
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
  input: {borderWidth: 1, borderColor: '#ccc', width: 40, height: 50,
    textAlign: 'center', fontSize: 18, borderRadius: 8, backgroundColor: '#fff'},
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  btn: { backgroundColor: "#F5C45E", borderRadius: 42, marginHorizontal:50, marginBottom: 80, elevation: 5},
  btnText: { fontSize:16, color:'#000', textAlign: 'center', paddingVertical:10, paddingHorizontal:20}
});

export default OTPVerifyScreen;
