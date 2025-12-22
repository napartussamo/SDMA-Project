import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/authContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Platform, StatusBar } from 'react-native';



export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>โปรไฟล์ของฉัน</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Ionicons name="person-circle-outline" size={70} color="#1E3A8A" />
      </View>

      {/* List */}
      <View style={styles.list}>
        {/* Phone */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="call-outline" size={22} />
            <Text style={styles.rowText}>เบอร์โทรศัพท์</Text>
          </View>
          <Text style={styles.valueText}>
            {user?.user_phone_number || '******XXX'}
          </Text>
        </View>

        {/* Blocked */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Blocked')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="ban-outline" size={22} />
            <Text style={styles.rowText}>รายชื่อบล็อก</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          await logout();
          navigation.replace('PhoneLogin');
        }}
      >
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
        <Ionicons name="chevron-forward" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: {
    fontSize: 17,
    color: '#007AFF',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
    marginLeft: 8,
    color: '#1E3A8A'
  },

  avatarWrapper: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  list: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowText: {
    marginLeft: 12,
    fontSize: 12,
  },

  valueText: {
    fontSize: 12,
    color: '#999',
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: '#e5e5e5',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logoutText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
