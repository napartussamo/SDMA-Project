package com.sdmaproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.firestore.FirebaseFirestore

class SmsReceiver(private val reactContext: ReactApplicationContext? = null) : BroadcastReceiver() {

    private val firestore = FirebaseFirestore.getInstance()

    override fun onReceive(context: Context, intent: Intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {
            val smsMessages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            for (smsMessage: SmsMessage in smsMessages) {
                val sender = smsMessage.originatingAddress ?: "unknown"
                val body = smsMessage.messageBody ?: ""
                val timestamp = smsMessage.timestampMillis

                Log.d("SmsReceiver", "📩 New SMS from $sender: $body")

                // Get userId from SharedPreferences
                val sharedPrefs: SharedPreferences = context.getSharedPreferences("SmsAppPrefs", Context.MODE_PRIVATE)
                val userId = sharedPrefs.getString("userId", null)

                if (userId != null) {
                    // Check if number is blocked before processing
                    checkIfBlockedAndProcess(userId, sender, body, timestamp)
                } else {
                    // If no userId, process normally (fallback for safety)
                    Log.w("SmsReceiver", "⚠️ No userId found, processing SMS without block check")
                    sendToReactNative(sender, body, timestamp)
                }
            }
        }
    }

    private fun checkIfBlockedAndProcess(userId: String, sender: String, body: String, timestamp: Long) {
        val normalizedSender = normalizePhoneNumber(sender)

        firestore.collection("users")
            .document(userId)
            .collection("blockedContact")
            .whereEqualTo("blocked_phone_number", normalizedSender)
            .get()
            .addOnSuccessListener { documents ->
                if (documents.isEmpty) {
                    // Number is NOT blocked, process normally
                    Log.d("SmsReceiver", "✅ Number $sender is not blocked, processing...")
                    sendToReactNative(sender, body, timestamp)
                } else {
                    // Number IS blocked, ignore the SMS
                    Log.d("SmsReceiver", "🚫 Number $sender is BLOCKED, SMS ignored!")
                }
            }
            .addOnFailureListener { e ->
                // On error, process the SMS (fail-safe)
                Log.e("SmsReceiver", "⚠️ Error checking blocked status, processing SMS anyway", e)
                sendToReactNative(sender, body, timestamp)
            }
    }

    private fun sendToReactNative(sender: String, body: String, timestamp: Long) {
        val params = Arguments.createMap().apply {
            putString("sender", sender)
            putString("body", body)
            putDouble("timestamp", timestamp.toDouble())
        }

        Log.d("SmsReceiver", "🚀 Emitting to JS: sender=$sender body=$body")

        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onSmsReceived", params)
    }

    private fun normalizePhoneNumber(phoneNumber: String): String {
        return phoneNumber.replace(Regex("[^0-9+]"), "")
    }
}