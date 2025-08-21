import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import { useAuth } from '../context/authContext';
import { firestore } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from '@react-native-firebase/firestore';
import { useSmsReceiver } from '../native/SmsReceiverModule';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Message = {
  id: string;
  body: string;
  direction: string;
  status: string;
  timestamp: number;
  contact: string;
};

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useSmsReceiver();

  useEffect(() => {
    if (!user) return;

    const contactsRef = collection(firestore, 'users', user.uid, 'contactPersons');

    // เก็บ unsubscribe ของ messages listener แต่ละ contact
    let messageListeners: (() => void)[] = [];

    const unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
      // ยกเลิก listener เดิมก่อน
      messageListeners.forEach(unsub => unsub());
      messageListeners = [];

      snapshot.forEach( (contactDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>) => {
        const contactId = contactDoc.id;
        const data = contactDoc.data();
        const messagesRef = collection(contactDoc.ref, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'));

        // ฟัง real-time messages ของแต่ละ contact
        const unsubscribeMessages = onSnapshot(q, (msgsSnapshot) => {
          if (!msgsSnapshot.empty) {
            const latest = msgsSnapshot.docs[0].data() as any;

            // อัปเดต state โดย merge หรือแทนค่าเฉพาะ contact นั้น
            setMessages(prev => {
              const others = prev.filter(m => m.id !== contactId);
              return [
                {
                  id: contactId,
                  body: latest.body,
                  direction: latest.direction,
                  status: latest.status,
                  timestamp: latest.timestamp,
                  contact: data.phoneNumber,
                },
                ...others,
              ].sort((a, b) => b.timestamp - a.timestamp);
            });
          }
        });

        messageListeners.push(unsubscribeMessages);
      });
    });

    return () => {
      unsubscribeContacts();
      messageListeners.forEach(unsub => unsub());
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('PhoneLogin');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome {user?.user_phone_number || 'User'}!
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <Text style={styles.contactText}>{item.contact}</Text>
            <Text>{item.body}</Text>
            <Text style={styles.metaText}>
              {item.direction} • {item.status}
            </Text>
          </View>
        )}
      />

      <View style={styles.button}>
        <Button title="Logout" onPress={handleLogout} color="#cc0000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  messageItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  contactText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    marginTop: 16,
  },
});

export default HomeScreen;
