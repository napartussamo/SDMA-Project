package com.sdmaproject

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.*
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.*

class BlockedContactManager(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val firestore = FirebaseFirestore.getInstance()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName() = "BlockedContactManager"

    // Save userId to SharedPreferences
    @ReactMethod
    fun setUserId(userId: String, promise: Promise) {
        try {
            val sharedPrefs = reactContext.getSharedPreferences("SmsAppPrefs", Context.MODE_PRIVATE)
            sharedPrefs.edit().putString("userId", userId).apply()
            Log.d("BlockedContactManager", "✅ UserId saved: $userId")
            promise.resolve("UserId saved successfully")
        } catch (e: Exception) {
            Log.e("BlockedContactManager", "Error saving userId", e)
            promise.reject("SAVE_USERID_ERROR", e.message)
        }
    }

    // Check if a phone number is blocked
    @ReactMethod
    fun isBlocked(userId: String, phoneNumber: String, promise: Promise) {
        scope.launch {
            try {
                val normalizedNumber = normalizePhoneNumber(phoneNumber)
                
                firestore.collection("users")
                    .document(userId)
                    .collection("blockedContact")
                    .whereEqualTo("blocked_phone_number", normalizedNumber)
                    .get()
                    .addOnSuccessListener { documents ->
                        val isBlocked = !documents.isEmpty
                        Log.d("BlockedContactManager", "Phone $normalizedNumber blocked: $isBlocked")
                        promise.resolve(isBlocked)
                    }
                    .addOnFailureListener { e ->
                        Log.e("BlockedContactManager", "Error checking blocked status", e)
                        promise.reject("CHECK_BLOCKED_ERROR", e.message)
                    }
            } catch (e: Exception) {
                Log.e("BlockedContactManager", "Error in isBlocked", e)
                promise.reject("CHECK_BLOCKED_ERROR", e.message)
            }
        }
    }

    // Block a phone number
    @ReactMethod
    fun blockNumber(userId: String, phoneNumber: String, promise: Promise) {
        scope.launch {
            try {
                val normalizedNumber = normalizePhoneNumber(phoneNumber)
                
                // Check if already blocked
                firestore.collection("users")
                    .document(userId)
                    .collection("blockedContact")
                    .whereEqualTo("blocked_phone_number", normalizedNumber)
                    .get()
                    .addOnSuccessListener { documents ->
                        if (!documents.isEmpty) {
                            promise.resolve("Number already blocked")
                            return@addOnSuccessListener
                        }

                        // Add to blocked list
                        val data = hashMapOf(
                            "blocked_phone_number" to normalizedNumber,
                            "blocked_at" to System.currentTimeMillis()
                        )

                        firestore.collection("users")
                            .document(userId)
                            .collection("blockedContact")
                            .add(data)
                            .addOnSuccessListener { documentReference ->
                                Log.d("BlockedContactManager", "🚫 Blocked $normalizedNumber with ID: ${documentReference.id}")
                                promise.resolve("Number blocked successfully")
                            }
                            .addOnFailureListener { e ->
                                Log.e("BlockedContactManager", "Error blocking number", e)
                                promise.reject("BLOCK_ERROR", e.message)
                            }
                    }
                    .addOnFailureListener { e ->
                        Log.e("BlockedContactManager", "Error checking existing block", e)
                        promise.reject("BLOCK_ERROR", e.message)
                    }
            } catch (e: Exception) {
                Log.e("BlockedContactManager", "Error in blockNumber", e)
                promise.reject("BLOCK_ERROR", e.message)
            }
        }
    }

    // Unblock a phone number
    @ReactMethod
    fun unblockNumber(userId: String, phoneNumber: String, promise: Promise) {
        scope.launch {
            try {
                val normalizedNumber = normalizePhoneNumber(phoneNumber)
                
                firestore.collection("users")
                    .document(userId)
                    .collection("blockedContact")
                    .whereEqualTo("blocked_phone_number", normalizedNumber)
                    .get()
                    .addOnSuccessListener { documents ->
                        if (documents.isEmpty) {
                            promise.resolve("Number not in blocked list")
                            return@addOnSuccessListener
                        }

                        for (document in documents) {
                            document.reference.delete()
                        }
                        Log.d("BlockedContactManager", "✅ Unblocked $normalizedNumber")
                        promise.resolve("Number unblocked successfully")
                    }
                    .addOnFailureListener { e ->
                        Log.e("BlockedContactManager", "Error unblocking number", e)
                        promise.reject("UNBLOCK_ERROR", e.message)
                    }
            } catch (e: Exception) {
                Log.e("BlockedContactManager", "Error in unblockNumber", e)
                promise.reject("UNBLOCK_ERROR", e.message)
            }
        }
    }

    // Get all blocked numbers
    @ReactMethod
    fun getBlockedNumbers(userId: String, promise: Promise) {
        scope.launch {
            try {
                firestore.collection("users")
                    .document(userId)
                    .collection("blockedContact")
                    .get()
                    .addOnSuccessListener { documents ->
                        val blockedNumbers = Arguments.createArray()
                        for (document in documents) {
                            val map = Arguments.createMap()
                            map.putString("id", document.id)
                            map.putString("phoneNumber", document.getString("blocked_phone_number"))
                            map.putDouble("blockedAt", (document.getLong("blocked_at") ?: 0).toDouble())
                            blockedNumbers.pushMap(map)
                        }
                        promise.resolve(blockedNumbers)
                    }
                    .addOnFailureListener { e ->
                        Log.e("BlockedContactManager", "Error getting blocked numbers", e)
                        promise.reject("GET_BLOCKED_ERROR", e.message)
                    }
            } catch (e: Exception) {
                Log.e("BlockedContactManager", "Error in getBlockedNumbers", e)
                promise.reject("GET_BLOCKED_ERROR", e.message)
            }
        }
    }

    // Normalize phone number for consistent comparison
    private fun normalizePhoneNumber(phoneNumber: String): String {
        // Remove all non-digit characters except +
        return phoneNumber.replace(Regex("[^0-9+]"), "")
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
    }
}