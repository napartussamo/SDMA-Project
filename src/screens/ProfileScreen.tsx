// ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/authContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topView}>
        <View style={styles.header}>
          <Text style={styles.title}>โปรไฟล์ของฉัน</Text>
          <Text>เบอร์โทรศัพท์ {user?.user_phone_number || '******XXX'}</Text>
        </View>
        <View style={styles.details}>
          <Text>รายชื่อบล็อก</Text>
          <Text>ขนาดัวอักษร</Text>
          <Text style={styles.link} onPress={() => navigation.navigate('Home')}>กลับไปหน้าหลัก</Text>
        </View>
      </View>


      <Text
        style={styles.logout}
        onPress={async () => {
          await logout();
          navigation.replace('PhoneLogin');
        }}
      >
        ออกจากระบบ
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 , justifyContent: 'space-around', flexDirection:'column'},
  topView: {},
  header: {marginBottom: 20},
  details:{paddingVertical:20,  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  link: { color: 'blue',  },
  logout: { color: 'black',},
});
