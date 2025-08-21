package com.sdmaproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver(private val reactContext: ReactApplicationContext? = null) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {
            val smsMessages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            for (smsMessage: SmsMessage in smsMessages) {
                val sender = smsMessage.originatingAddress ?: "unknown"
                val body = smsMessage.messageBody ?: ""
                val timestamp = smsMessage.timestampMillis

                Log.d("SmsReceiver", "📩 New SMS from $sender: $body")

                // ส่ง event ไป RN
                val params = Arguments.createMap().apply {
                    putString("sender", sender)
                    putString("body", body)
                    putDouble("timestamp", timestamp.toDouble())
                }
                
                Log.d("SmsReceiver", "🚀 Emitting to JS: sender=$sender body=$body")

                reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onSmsReceived", params)

            }
        }
    }
}
