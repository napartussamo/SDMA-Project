import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/authContext';
import { firestore } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from '@react-native-firebase/firestore';
import { useSmsReceiver } from '../native/SmsReceiverModule';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Message = {
  id: string;
  body: string;
  direction: string;
  status: string;
  timestamp: number;
  contact: string;
  risk_score: number;
};

type TabType = 'All' | 'Safe' | 'Spam' | 'Scam';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<TabType>('All');
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useSmsReceiver();

  useEffect(() => {
    if (!user) return;

    const contactsRef = collection(firestore, 'users', user.uid, 'contactPersons');
    let messageListeners: (() => void)[] = [];

    const unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
      messageListeners.forEach(unsub => unsub());
      messageListeners = [];

      snapshot.forEach(
        (contactDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>) => {
          const contactId = contactDoc.id;
          const data = contactDoc.data();
          const messagesRef = collection(contactDoc.ref, 'messages');
          const q = query(messagesRef, orderBy('msg_timestamp', 'desc'));

          const unsubscribeMessages = onSnapshot(q, (msgsSnapshot) => {
            if (!msgsSnapshot.empty) {
              const latestMsg = msgsSnapshot.docs[0];
              const latest = latestMsg.data() as any;

              setMessages(prev => {
                const others = prev.filter(m => m.id !== contactId);
                const updated = [
                  {
                    id: contactId,
                    body: latest.msg_content,
                    direction: latest.msg_direction,
                    status: latest.msg_status,
                    timestamp: latest.msg_timestamp,
                    contact: data.contact_person_phone_number,
                    risk_score: 0,
                  },
                  ...others,
                ].sort((a, b) => b.timestamp - a.timestamp);
                setFilteredMessages(applyFilter(updated, searchText, selectedTab));
                return updated;
              });

              const riskScoreRef = collection(
                firestore,
                'users',
                user.uid,
                'contactPersons',
                contactId,
                'messages',
                latestMsg.id,
                'riskScore'
              );

              const unsubRisk = onSnapshot(riskScoreRef, (riskSnap) => {
                if (!riskSnap.empty) {
                  const riskData = riskSnap.docs[0].data();
                  const risk_score = Number(riskData.risk_score) || 0;

                  setMessages(prev => {
                    const others = prev.filter(m => m.id !== contactId);
                    const target = prev.find(m => m.id === contactId);
                    if (!target) return prev;

                    const updated = [
                      { ...target, risk_score },
                      ...others,
                    ].sort((a, b) => b.timestamp - a.timestamp);
                    setFilteredMessages(applyFilter(updated, searchText, selectedTab));
                    return updated;
                  });
                }
              });

              messageListeners.push(unsubRisk);
            }
          });

          messageListeners.push(unsubscribeMessages);
        }
      );
    });

    return () => {
      unsubscribeContacts();
      messageListeners.forEach(unsub => unsub());
    };
  }, [user, searchText, selectedTab]);

  const applyFilter = (list: Message[], text: string, tab: TabType) => {
    let filtered = list;

    if (text.trim()) {
      const lower = text.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.contact.toLowerCase().includes(lower) ||
          m.body.toLowerCase().includes(lower)
      );
    }

    if (tab === 'Safe') {
      filtered = filtered.filter(m => m.risk_score >= 0 && m.risk_score <= 29);
    } else if (tab === 'Spam') {
      filtered = filtered.filter(m => m.risk_score >= 30 && m.risk_score <= 59);
    } else if (tab === 'Scam') {
      filtered = filtered.filter(m => m.risk_score >= 60);
    }

    return filtered;
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setFilteredMessages(applyFilter(messages, text, selectedTab));
  };

  const getRiskColor = (score: number) => {
    if (score >= 0 && score <= 29) return '#4CAF50';   // Safe
    if (score >= 30 && score <= 59) return '#FFEB3B';  // Spam
    return '#F7695F';                                  // Scam
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SDMA</Text>
      </View>
      {/* 🔍 Search Bar */}
      <TextInput
        style={styles.searchbar}
        placeholder="Search"
        placeholderTextColor="#fff"
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* 📂 Tabs */}
      <View style={styles.tabs}>
        {(['All', 'Safe', 'Spam', 'Scam'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => {
              setSelectedTab(tab);
              setFilteredMessages(applyFilter(messages, searchText, tab));
            }}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📩 Messages */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <View style={styles.row}>
              <View style={[styles.riskCircle, { backgroundColor: getRiskColor(item.risk_score) }]}>
                <Text style={styles.riskText}>{item.risk_score}</Text>
              </View>
              <View>
                <Text style={styles.contactText}>{item.contact}</Text>
                <Text numberOfLines={1}>{item.body}</Text>
                <Text style={styles.metaText}>
                  {item.direction} • {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  searchbar: {
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderColor: '#1E3A8A',
    borderWidth: 1,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    color: '#fff',
    marginBottom: 12,
  },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
},
headerTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginLeft: 12,
  color: '#000',
},
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  activeTab: {
    backgroundColor: '#1E3A8A',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  messageItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  riskCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riskText: { color: '#000', fontWeight: 'bold' },
  contactText: { fontWeight: 'bold', marginBottom: 4 },
  metaText: { fontSize: 12, color: '#666', marginTop: 4 },
});

export default HomeScreen;
