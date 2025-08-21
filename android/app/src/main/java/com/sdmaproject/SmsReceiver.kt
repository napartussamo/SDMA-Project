package com.sdmaproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (Telephony.Sms.Intents.SMS_DELIVER_ACTION == intent.action) {
            Log.d("SmsReceiver", "SMS received")
            // กระบวนการรับ SMS ที่นี่
        }
    }
}