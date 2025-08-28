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
  risk_score: number;
};
/*const Drawer = createDrawerNavigator();*/

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useSmsReceiver();

  useEffect(() => {
    if (!user) return;

    const contactsRef = collection(firestore, 'users', user.uid, 'contactPersons');
    let messageListeners: (() => void)[] = [];

    const unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
      // clear listeners เก่า
      messageListeners.forEach(unsub => unsub());
      messageListeners = [];

      snapshot.forEach((contactDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>) => {
        const contactId = contactDoc.id;
        const data = contactDoc.data();
        const messagesRef = collection(contactDoc.ref, 'messages');
        const q = query(messagesRef, orderBy('msg_timestamp', 'desc'));

        const unsubscribeMessages = onSnapshot(q, (msgsSnapshot) => {
          if (!msgsSnapshot.empty) {
            const latestMsg = msgsSnapshot.docs[0];
            const latest = latestMsg.data() as any;

            // set message ล่าสุดก่อน (risk_score = 0 ชั่วคราว)
            setMessages(prev => {
              const others = prev.filter(m => m.id !== contactId);
              return [
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
            });

            // 👇 ฟัง riskScore subcollection ของ message ล่าสุด
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
                  return [
                    { ...target, risk_score },
                    ...others,
                  ].sort((a, b) => b.timestamp - a.timestamp);
                });
              }
            });

            messageListeners.push(unsubRisk);
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

  const getRiskColor = (score: number) => {
    if (score >= 0 && score <= 29) return '#4CAF50';   // Safe = เขียว
    if (score >= 30 && score <= 59) return '#FFEB3B';   // Spam = เหลือง
    return '#F44336';                                   // Scam = แดง
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
            <View style={styles.row}>
              {/* วงกลม risk score */}
              <View
                style={[
                  styles.riskCircle,
                  { backgroundColor: getRiskColor(item.risk_score) },
                ]}
              >
                <Text style={styles.riskText}>{item.risk_score}</Text>
              </View>

              {/* ข้อมูล contact + ข้อความ */}
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

      <View style={styles.button}>
        <Button title="Logout" onPress={handleLogout} color="#cc0000" />
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  welcomeText: { fontSize: 20, marginVertical: 36, textAlign: 'center' },
  messageItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  row: { flexDirection: 'row', alignItems: 'center' },
  riskCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  riskText: { color: '#000', fontWeight: 'bold' },
  contactText: { fontWeight: 'bold', marginBottom: 4 },
  metaText: { fontSize: 12, color: '#666', marginTop: 4 },
  button: { marginTop: 16 },
});

export default HomeScreen;
