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
  getDocs,
} from "@react-native-firebase/firestore";
import { analyzeSmsRiskScore } from "../services/SmsRiskScore";

const { SmsReceiverModule } = NativeModules;
console.log("🟡 NativeModules =", NativeModules);

type SmsEvent = {
  sender: string;
  body: string;
  timestamp?: number;
};

type PendingSms = {
  messages: string[];
  lastTimestamp: number;
  timeoutId?: ReturnType<typeof setTimeout>;
};

export function useSmsReceiver() {
  const { user } = useAuth();
  const pendingSmsRef = useRef<Record<string, PendingSms>>({});

  const saveFullSmsToFirestore = useCallback(
    async (fullMsg: string, sender: string) => {
      if (!user) {
        console.log("❌ User not available, cannot save SMS");
        return;
      }

      console.log(`💾 Attempting to save message: "${fullMsg}" from ${sender}`);

      try {
        const userRef = doc(firestore, "users", user.uid);
        const contactsCol = collection(userRef, "contactPersons");

        // หา contact ถ้าไม่มีให้สร้างใหม่
        const q = query(
          contactsCol,
          where("contact_person_phone_number", "==", sender)
        );
        const snapshot = await getDocs(q);

        let contactRef;
        if (snapshot.empty) {
          contactRef = doc(contactsCol);
          await setDoc(contactRef, {
            contact_person_phone_number: sender,
            contact_person_name: sender,
          });
          console.log("👤 New contact created");
        } else {
          contactRef = snapshot.docs[0].ref;
        }

        // บันทึก message
        const messagesRef = collection(contactRef, "messages");
        const newMsgRef = await addDoc(messagesRef, {
          msg_content: fullMsg,
          msg_direction: "incoming",
          msg_status: "unread",
          msg_timestamp: serverTimestamp(),
        });

        console.log("✅ SMS saved with ID:", newMsgRef.id);

        // วิเคราะห์ความเสี่ยง
        await analyzeSmsRiskScore(
          user.uid,
          contactRef.id,
          newMsgRef.id,
          fullMsg
        );
        console.log("✅ Risk analysis completed");
      } catch (error) {
        console.error("❌ Error saving SMS:", error);
      }
    },
    [user]
  );

  useEffect(() => {
    console.log("📡 [SmsReceiver] Hook mounted, user =", user?.uid);

    if (!user) return;
    if (!SmsReceiverModule) {
      console.log("❌ [SmsReceiver] Native module not found");
      return;
    }

    const eventEmitter = new NativeEventEmitter(SmsReceiverModule);

    const subscription = eventEmitter.addListener(
      "onSmsReceived",
      async (sms: SmsEvent) => {
        console.log("📩 [SmsReceiver] Received:", sms);

        try {
          const key = sms.sender;
          const currentTime = Date.now();
          const pending = pendingSmsRef.current[key];

          if (pending && currentTime - pending.lastTimestamp < 5000) {
            // รวมกับข้อความที่รออยู่
            pending.messages.push(sms.body);
            pending.lastTimestamp = currentTime;
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.timeoutId = setTimeout(async () => {
              const fullMsg = pending.messages.join("");
              await saveFullSmsToFirestore(fullMsg, key);
              delete pendingSmsRef.current[key];
            }, 5500);
          } else {
            // เริ่ม batch ใหม่
            if (pending?.timeoutId) clearTimeout(pending.timeoutId);

            pendingSmsRef.current[key] = {
              messages: [sms.body],
              lastTimestamp: currentTime,
              timeoutId: setTimeout(async () => {
                const fullMsg =
                  pendingSmsRef.current[key]?.messages.join("") || "";
                await saveFullSmsToFirestore(fullMsg, key);
                delete pendingSmsRef.current[key];
              }, 5500),
            };
          }
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
