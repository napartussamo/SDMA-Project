package com.sdmaproject

import android.app.role.RoleManager
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.widget.Toast
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.app.Activity
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsDefaultModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "SmsDefaultModule"
        const val REQUEST_CODE_SMS_ROLE = 1234
        const val EVENT_SMS_ROLE_CHANGED = "onSmsRoleChanged"
    }

    override fun getName() = "SmsDefaultModule"

    private var promise: Promise? = null

    @ReactMethod
    fun requestDefaultSmsApp(promise: Promise) {
        this.promise = promise
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                requestWithRoleManager(activity)
            } else {
                requestLegacyMethod(activity)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun onActivityResult(requestCode: Int, resultCode: Int) {
        if (requestCode == REQUEST_CODE_SMS_ROLE) {
            val isSuccess = resultCode == Activity.RESULT_OK
            if (isSuccess) {
                checkAndSendDefaultStatus()
            }
            
            promise?.resolve(isSuccess)
            promise = null
            
            sendEvent(isSuccess)
        }
    }

    private fun sendEvent(isSuccess: Boolean) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_SMS_ROLE_CHANGED, isSuccess)
    }

    private fun checkAndSendDefaultStatus() {
        try {
            val defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(reactContext)
            val isDefault = defaultSmsPackage == reactContext.packageName
            sendEvent(isDefault)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking default SMS package: ${e.message}")
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun requestWithRoleManager(activity: Activity) {
        val roleManager = activity.getSystemService(RoleManager::class.java) ?: run {
            promise?.reject("ROLE_MANAGER_UNAVAILABLE", "RoleManager not available")
            return
        }

        if (!roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
            promise?.reject("SMS_ROLE_UNAVAILABLE", "SMS role not available")
            return
        }

        val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
        activity.startActivityForResult(intent, REQUEST_CODE_SMS_ROLE)
    }

    private fun requestLegacyMethod(activity: Activity) {
        val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
            putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, reactContext.packageName)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_SMS_ROLE)
    }

    @ReactMethod
    fun getPackageName(promise: Promise) {
        promise.resolve(reactContext.packageName)
    }

    @ReactMethod
    fun getDefaultSmsPackage(promise: Promise) {
        try {
            val defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(reactContext)
            promise.resolve(defaultSmsPackage)
        } catch (e: Exception) {
            promise.reject("GET_DEFAULT_SMS_ERROR", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // จำเป็นสำหรับ Android
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // จำเป็นสำหรับ Android
    }
}