import { firestore } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
} from "@react-native-firebase/firestore";

const FASTAPI_URL = "https://fastapi-sdma-classifier.onrender.com/predict_risk_score"; 

// risk category 
const getRiskCategory = (score: number): "safe" | "spam" | "scam" => {
  if (score >= 0 && score <= 29) return "safe";
  if (score >= 30 && score <= 59) return "spam";
  return "scam"; 
};

export const analyzeSmsRiskScore = async (
  userId: string,
  contactId: string,
  msgId: string,  
  message: string
) => {
  try {
    // เรียก FastAPI
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_text: message }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json();
    const risk_score: number = data.risk_score;
    const risk_category = getRiskCategory(risk_score);

    console.log(`[SmsRiskScore] score=${risk_score}, category=${risk_category}`);

    // สร้าง subcollection riskScore ของ message
    const riskScoreRef = collection(
      firestore,
      "users",
      userId,
      "contactPersons",
      contactId,
      "messages",
      msgId,
      "riskScore"
    );

    await addDoc(riskScoreRef, {
      risk_score,
      risk_category,
    });

    console.log("✅ [SmsRiskScore] Risk score saved to Firestore subcollection");
  } catch (error) {
    console.error("❌ [SmsRiskScore] Error analyzing message:", error);
  }
};
