import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../context/authContext';
import Toast from 'react-native-toast-message';
import { firestore } from '../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { sendSms } from '../native/SmsSenderModule';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { blockedContactService } from '../native/blockedContactService';

type Message = {
  id: string;
  msg_content: string;
  msg_direction: string;
  msg_status: string;
  msg_timestamp: number;
  risk_score: number;
};

export default function ChatScreen({ route }: any) {
  const navigation = useNavigation();
  const { contactId, contactPhone } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [isBlocked, setIsBlocked] = useState(false);

  // ✅ โหลดข้อความทั้งหมดจาก Firestore
  useEffect(() => {
    if (!user || !contactId) return;

    const msgsRef = collection(
      firestore,
      'users',
      user.uid,
      'contactPersons',
      contactId,
      'messages',
    );
    const q = query(msgsRef, orderBy('msg_timestamp', 'asc'));

    const unsub = onSnapshot(q, snapshot => {
      const msgs: Message[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        risk_score: 0,
      })) as Message[];

      // ตรวจจับข้อความใหม่
      if (msgs.length > messages.length) {
        const latestMsg = msgs[msgs.length - 1];
        fetchRiskScore(latestMsg);
      }

      setMessages(msgs);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });

    return () => unsub();
  }, [user, contactId, messages.length]);

  // ✅ ดึง risk_score จาก Firestore และแสดง Toast
  const fetchRiskScore = (latestMsg: Message) => {
    if (!user) return;

    const riskRef = collection(
      firestore,
      'users',
      user.uid,
      'contactPersons',
      contactId,
      'messages',
      latestMsg.id,
      'riskScore',
    );

    const unsubRisk = onSnapshot(riskRef, snapshot => {
      if (!snapshot.empty) {
        const riskData = snapshot.docs[0].data();
        const risk_score = Number(riskData.risk_score) || 0;

        // อัปเดต message ใน state
        setMessages(prev =>
          prev.map(m => (m.id === latestMsg.id ? { ...m, risk_score } : m)),
        );

        // แสดง Toast ตามระดับความเสี่ยง
        if (risk_score >= 60) {
          Toast.show({
            type: 'riskError',
            text1: 'ขอแนะนำ "อย่าคลิก" ลิงก์ใดๆในข้อความนี้',
            position: 'bottom',
          });
        } else if (risk_score >= 30 && risk_score < 60) {
          Toast.show({
            type: 'riskWarning',
            text1: 'ขอแนะนำ ตรวจสอบก่อนเชื่อข้อความนี้!',
            position: 'bottom',
          });
        }
      }
    });

    return unsubRisk;
  };

  // ✅ ส่งข้อความ
  const handleSend = async () => {
    if (!input.trim() || !user) return;

    try {
      await sendSms(contactPhone, input);
      const msgRef = collection(
        firestore,
        'users',
        user.uid,
        'contactPersons',
        contactId,
        'messages',
      );
      await addDoc(msgRef, {
        msg_content: input,
        msg_direction: 'outgoing',
        msg_status: 'sent',
        msg_timestamp: serverTimestamp(),
      });
      console.log('✅ SMS sent and message saved.');
      setInput('');
    } catch (err) {
      console.error('Error sending SMS:', err);
    }
  };

  // ✅ แสดงแต่ละข้อความ
  const renderMessage = ({ item }: { item: Message }) => {
    const isOutgoing = item.msg_direction === 'outgoing';
    const bubbleColor =
      item.risk_score >= 60
        ? '#F7695F'
        : item.risk_score >= 30
        ? '#FFEB3B'
        : '#cce5ff';

    return (
      <SafeAreaView>
        <View
          style={[
            styles.messageBubble,
            isOutgoing ? styles.outgoing : styles.incoming,
            { backgroundColor: isOutgoing ? '#e5e5e5' : bubbleColor },
          ]}
        >
          <Text style={styles.messageText}>{item.msg_content}</Text>
          <Text style={styles.timestamp}>
            {item.msg_timestamp
              ? new Date(item.msg_timestamp).toLocaleTimeString()
              : ''}
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  useEffect(() => {
    if (user && contactPhone) {
      blockedContactService
        .isBlocked(user.uid, contactPhone)
        .then(setIsBlocked)
        .catch(console.error);
    }
  }, [user, contactPhone]);

  // Add block/unblock handler
  const handleBlockToggle = async () => {
    if (!user) return;

    try {
      if (isBlocked) {
        await blockedContactService.unblockNumber(user.uid, contactPhone);
        setIsBlocked(false);
        Alert.alert('Success', 'Contact unblocked');
      } else {
        Alert.alert(
          'Block Contact',
          `Block ${contactPhone}? You will no longer receive messages from this number.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockedContactService.blockNumber(user.uid, contactPhone);
                setIsBlocked(true);
                Alert.alert('Success', 'Contact blocked');
              },
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update block status');
      console.error(error);
    }
  };

  // ✅ UI หลัก
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{contactPhone}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={handleBlockToggle}>
            <Ionicons
              name={isBlocked ? 'ban' : 'ban'}
              size={24}
              color={isBlocked ? 'red' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Delete chat')}>
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="พิมพ์ข้อความที่นี่..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 2,
  },
  listContainer: { padding: 10 },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 10,
    marginVertical: 4,
  },
  incoming: { alignSelf: 'flex-start' },
  outgoing: { alignSelf: 'flex-end' },
  messageText: { fontSize: 16 },
  timestamp: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  iconButton: { padding: 6 },
});
