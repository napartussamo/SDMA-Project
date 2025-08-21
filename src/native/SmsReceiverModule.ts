import { useEffect } from "react";
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

const { SmsReceiverModule } = NativeModules;
console.log("🟡 NativeModules =", NativeModules);

type SmsEvent = {
  sender: string;
  body: string;
  timestamp?: number;
};

export function useSmsReceiver() {
  const { user } = useAuth();

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

        try {
          const userRef = doc(firestore, "users", user.uid);
          const contactsCol = collection(userRef, "contactPersons");

        // 1️⃣ ค้นหา contact ตาม phoneNumber
        const q = query(contactsCol, where("phoneNumber", "==", sms.sender));
        const snapshot = await getDocs(q);

        let contactRef;
        if (snapshot.empty) {
          // ถ้าไม่เจอ สร้างใหม่
          contactRef = doc(contactsCol); // AutoID
          await setDoc(contactRef, {
            phoneNumber: sms.sender,
            name: sms.sender,
          });
        } else {
          // ใช้ contact เดิม
          contactRef = snapshot.docs[0].ref;
        }

          const messagesRef = collection(contactRef, "messages");
          await addDoc(messagesRef, {
            body: sms.body,
            direction: "incoming",
            status: "unread",
            timestamp: sms.timestamp || Date.now(),
            createdAt: serverTimestamp(),
          });
          console.log("✅ [SmsReceiver] SMS saved to Firestore");
        } catch (error) {
          console.error("❌ [SmsReceiver] Error saving SMS:", error);
        }
      }
    );

    console.log("📡 [SmsReceiver] Listener registered");

    return () => {
      console.log("🧹 [SmsReceiver] Listener removed");
      subscription.remove();
    };
  }, [user]);
}
