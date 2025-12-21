import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import { useAuth } from '../context/authContext';

const PhoneLoginScreen = ({ navigation }: any) => {
  const { signInWithPhone } = useAuth();

  const [countryCode, setCountryCode] = useState<CountryCode>('TH');
  const [callingCode, setCallingCode] = useState('66');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = async () => {
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง');
      return;
    }

    const fullPhone = `+${callingCode}${phoneNumber}`;
    await signInWithPhone(fullPhone);
    navigation.replace('OTPVerify');
  };

  return (
    <View style={styles.container}>
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ยืนยันหมายเลขโทรศัพท์</Text>
          <Text style={styles.subtitle}>
            เรากำลังส่งรหัสยืนยัน จะไม่เรียกเก็บค่าธรรมเนียมใดๆ
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.phoneRow}>
          <View style={styles.countryPicker}>
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              onSelect={(country: Country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
              }}
            />
            <Text style={styles.callingCode}>+{callingCode}</Text>
          </View>

          <TextInput
            style={styles.phoneInput}
            placeholder="ใส่หมายเลขโทรศัพท์ของคุณ"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.btn} onPress={handleSendOTP}>
        <Text style={styles.btnText}>ถัดไป</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PhoneLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#1E3A8A',
    justifyContent: 'space-between',
  },

  header: {
    marginTop: 40,
    marginBottom: 30,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 8,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 8,
    height: 48,
  },

  callingCode: {
    fontSize: 16,
    marginLeft: 6,
  },

  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
  },

  btn: {
    backgroundColor: '#F5C45E',
    borderRadius: 40,
    marginHorizontal: 40,
    marginBottom: 60,
    elevation: 4,
  },

  btnText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
  },
});

