package com.sdmaproject

import android.content.IntentFilter
import android.provider.Telephony
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

class SmsReceiverModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val smsReceiver = SmsReceiver(reactContext)

    init {
        Log.d("SmsReceiverModule", "🚀 Module initialized with context: $reactContext")
        // register broadcast receiver ตอน module ถูกสร้าง
        val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        reactContext.registerReceiver(smsReceiver, filter)
    }

    override fun getName(): String {
        return "SmsReceiverModule"
    }

    @ReactMethod
    fun ping(promise: Promise) {
        promise.resolve("📡 SmsReceiverModule active")
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        // unregister เวลา instance react ถูก destroy
        reactContext.unregisterReceiver(smsReceiver)
    }
}