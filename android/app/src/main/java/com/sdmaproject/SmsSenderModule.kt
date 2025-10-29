package com.sdmaproject

import android.telephony.SmsManager
import android.util.Log
import com.facebook.react.bridge.*

class SmsSenderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsSenderModule"

    @ReactMethod
    fun sendSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            val smsManager = SmsManager.getDefault()
            smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            Log.d("SmsSender", "SMS sent to $phoneNumber: $message")
            promise.resolve("SMS sent successfully")
        } catch (e: Exception) {
            Log.e("SmsSender", "Error sending SMS", e)
            promise.reject("SMS_SEND_ERROR", e.message)
        }
    }
}