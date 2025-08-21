package com.sdmaproject

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.provider.Telephony
import android.telephony.TelephonyManager


class MainActivity : ReactActivity() {
    private var smsModule: SmsDefaultModule? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val reactInstanceManager = reactNativeHost.reactInstanceManager
        
        reactInstanceManager.addReactInstanceEventListener(
            object : ReactInstanceManager.ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    smsModule = context.catalystInstance.getNativeModule(SmsDefaultModule::class.java)
                }
            }
        )
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
    
        if (requestCode == SmsDefaultModule.REQUEST_CODE_SMS_ROLE) {
            if (resultCode == Activity.RESULT_OK) {
                // สำเร็จ - ตรวจสอบอีกครั้งเพื่อความแน่ใจ
                val isDefault = Telephony.Sms.getDefaultSmsPackage(this) == packageName
                if (isDefault) {
                    Toast.makeText(this, "ตั้งค่าเป็น Default SMS App สำเร็จ", Toast.LENGTH_SHORT).show()
                    // ส่ง event ไปยัง React Native ว่าเป็น default แล้ว
                } else {
                    Toast.makeText(this, "ยังไม่ได้ตั้งค่าเป็น Default SMS App", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "ผู้ใช้ปฏิเสธการตั้งค่าเป็น Default SMS App", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun getMainComponentName(): String = "SDMAProject"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}