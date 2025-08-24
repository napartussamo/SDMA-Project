import { useCallback, useEffect, useRef } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import { firestore } from "../firebase/firebaseConfig";
import { useAuth } from "../context/authContext";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "@react-native-firebase/firestore";
import { analyzeSmsRiskScore } from "../services/SmsRiskScore";

const { SmsReceiverModule } = NativeModules;
console.log("🟡 NativeModules =", NativeModules);

type SmsEvent = {
  sender: string;
  body: string;
  timestamp?: number;
  direction?: string;
  status?: string;
};


type PendingSms = {
  messages: string[];
  lastTimestamp: number;
};

export function useSmsReceiver() {
  const { user } = useAuth();

  // ใช้ useRef เก็บ pending SMS ของแต่ละ sender
  const pendingSmsRef = useRef<Record<string, PendingSms>>({});

  const saveFullSmsToFirestore = useCallback(async (fullMsg: string, sender: string) => {
    if (!user) {
      console.log("❌ User not available, cannot save SMS");
      return;
    }

    console.log(`💾 Attempting to save message: "${fullMsg}" from ${sender}`);

    try {
      const userRef = doc(firestore, "users", user.uid);
      console.log("✅ User reference created for:", user.uid);

      const contactsCol = collection(userRef, "contactPersons");
      console.log("📞 Contacts collection reference created");

      const q = query(contactsCol, where("contact_person_phone_number", "==", sender));
      const snapshot = await getDocs(q);
      console.log(`🔍 Found ${snapshot.size} existing contacts for ${sender}`);

      let contactRef;
      if (snapshot.empty) {
        console.log("👤 Creating new contact");
        contactRef = doc(contactsCol);
        await setDoc(contactRef, {
          contact_person_phone_number: sender,
          contact_person_name: sender,
          //created_at: serverTimestamp(),
        });
        console.log("✅ New contact created");
      } else {
        contactRef = snapshot.docs[0].ref;
        console.log("✅ Using existing contact:", contactRef.id);
      }

      const messagesRef = collection(contactRef, "messages");
      console.log("📨 Adding message to messages collection");

      const newMsgRef = await addDoc(messagesRef, {
        msg_content: fullMsg,
        msg_direction: "incoming",
        msg_status: "unread",
        msg_timestamp: serverTimestamp(),
        //received_at: serverTimestamp(),
      });

      console.log("✅ SMS saved successfully with ID:", newMsgRef.id);

      // Analyze risk score
      console.log("🔍 Analyzing SMS risk score...");
      await analyzeSmsRiskScore(user.uid, contactRef.id, newMsgRef.id, fullMsg);
      console.log("✅ Risk analysis completed");

    } catch (error) {
      console.error("❌ Error saving SMS to Firestore:", error);
    }
  }, [user]);

  useEffect(() => {
    console.log("📡 [SmsReceiver] Hook mounted, user =", user?.uid);

    if (!user) {
      console.warn("⚠️ User not ready, skip saving SMS");
      return;
    }

    if (!SmsReceiverModule) {
      console.log("❌ [SmsReceiver] Native module not found");
      return;
    }

    const eventEmitter = new NativeEventEmitter(SmsReceiverModule);
    console.log("📡 [SmsReceiver] EventEmitter created");

    const subscription = eventEmitter.addListener(
      "onSmsReceived",
      async (sms: SmsEvent) => {
        console.log("📩 [SmsReceiver] Event received from Native:", sms);
        console.log(`⏰ Current time: ${Date.now()}, SMS time: ${sms.timestamp}`);

        try {
          const key = sms.sender;
          const currentTime = Date.now(); 
          //const smsTimestamp = sms.timestamp || currentTime;

          console.log(`🔍 Processing SMS from ${key}`);

          // ตัวเลือก 1: บันทึกทันทีโดยไม่รอ merge (แนะนำ)
          //console.log("🚀 Saving SMS immediately without waiting for merge");
          //await saveFullSmsToFirestore(sms.body, sms.sender);

          
          // ตัวเลือก 2: ใช้ logic merge แบบเดิม (ถ้าต้องการ)
          const pending = pendingSmsRef.current[key];
          console.log(`📊 Pending state for ${key}:`, pending);

          if (pending && currentTime - pending.lastTimestamp < 5000) {
            console.log(`🔄 Merging with existing pending messages`);
            pending.messages.push(sms.body);
            pending.lastTimestamp = currentTime; // อัปเดตเป็นเวลาปัจจุบัน
            console.log(`📦 Updated pending:`, pending.messages);
        } else {
            console.log(`📦 Creating new pending batch or saving previous`);
          if (pending) {
            const fullMsg = pending.messages.join("");
            console.log(`💾 Saving previous merged message: ${fullMsg}`);
            await saveFullSmsToFirestore(fullMsg, key);
          }
          // ใช้ currentTime แทน sms.timestamp
          pendingSmsRef.current[key] = { 
            messages: [sms.body], 
            lastTimestamp: currentTime 
          };
          console.log(`🆕 New pending created:`, pendingSmsRef.current[key]);
        }

          // กำหนด timeout สำหรับ pending SMS
        setTimeout(async () => {
            console.log(`⏰ Timeout check for ${key}`);
            const pendingNow = pendingSmsRef.current[key];
            if (pendingNow) {
              const fullMsg = pendingNow.messages.join("");
              console.log(`💾 Timeout - Saving merged message: ${fullMsg}`);
              await saveFullSmsToFirestore(fullMsg, key);
              delete pendingSmsRef.current[key];
              console.log(`🧹 Cleared pending for ${key}`);
            }
          }, 5500);

        } catch (error) {
          console.error("❌ [SmsReceiver] Error Handling SMS:", error);
        }
      }
    );

    console.log("📡 [SmsReceiver] Listener registered");

    return () => {
      console.log("🧹 [SmsReceiver] Listener removed");
      subscription.remove();
    };
  }, [user, saveFullSmsToFirestore]);
}