import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/authContext';
import {
  blockedContactService,
  BlockedContact,
} from '../native/blockedContactService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Platform, StatusBar } from 'react-native';

export default function BlockedContactScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedContacts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const contacts = await blockedContactService.getBlockedNumbers(user.uid);
      setBlockedContacts(contacts);
    } catch (error) {
      console.error('Error loading blocked contacts:', error);
      Alert.alert('Error', 'Failed to load blocked contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBlockedContacts();
  }, [loadBlockedContacts]);

  const handleUnblock = (phoneNumber: string) => {
    if (!user) return;

    Alert.alert('Unblock Contact', `Unblock ${phoneNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await blockedContactService.unblockNumber(user.uid, phoneNumber);
            setBlockedContacts(prev =>
              prev.filter(c => c.phoneNumber !== phoneNumber),
            );
            Alert.alert('Success', 'Contact unblocked');
          } catch (error) {
            Alert.alert('Error', 'Failed to unblock contact');
            console.error(error);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BlockedContact }) => (
    <View style={styles.contactItem}>
      <View style={styles.iconContainer}>
        <Ionicons name="person-circle-outline" size={45} color="#000" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
        <Text style={styles.blockedDate}>
          Blocked: {new Date(item.blockedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.phoneNumber)}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายชื่อบล็อก</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : blockedContacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="ban" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No blocked contacts</Text>
          <Text style={styles.emptySubtext}>
            Block contacts from chat to prevent receiving their messages
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedContacts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
  },
  headerTitle: { color: '#1E3A8A', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: { padding: 16 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    //borderWidth: 1,
    //borderColor: '#e0e0e0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: { flex: 1 },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  blockedDate: { fontSize: 12, color: '#666' },
  unblockButton: {
    backgroundColor: '#FFEB3B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockText: { color: '#000', fontSize: 14, fontWeight: '600' },
});
