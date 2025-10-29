import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/authContext';
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
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Message = {
  id: string;
  msg_content: string;
  msg_direction: string;
  msg_status: string;
  msg_timestamp: number;
};

export default function ChatScreen({ route }: any) {
  const navigation = useNavigation();
  const { contactId, contactPhone, contactName } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
      const msgs: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });

    return () => unsub();
  }, [user, contactId]);

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isOutgoing = item.msg_direction === 'outgoing';
    return (
      <View
        style={[
          styles.messageBubble,
          isOutgoing ? styles.outgoing : styles.incoming,
        ]}
      >
        <Text style={styles.messageText}>{item.msg_content}</Text>
        <Text style={styles.timestamp}>
          {item.msg_timestamp
            ? new Date(item.msg_timestamp).toLocaleTimeString()
            : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header Bar */}
      <View style={[styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{contactPhone}</Text>
        <TouchableOpacity onPress={() => console.log('Delete chat')}>
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => console.log('Image picker')}
        >
          <Ionicons name="image-outline" size={24} color="#555" />
        </TouchableOpacity>
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
  incoming: { alignSelf: 'flex-start', backgroundColor: '#cce5ff' },
  outgoing: { alignSelf: 'flex-end', backgroundColor: '#e5e5e5' },
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
