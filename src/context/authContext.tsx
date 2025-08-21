import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth, firestore } from '../firebase/firebaseConfig';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  FirebaseAuthTypes
} from '@react-native-firebase/auth';
import { collection, doc, getDoc, setDoc } from '@react-native-firebase/firestore';

type User = {
  uid: string;
  user_phone_number: string | null;
};

type AuthContextType = {
  user: User | null;
  confirm: FirebaseAuthTypes.ConfirmationResult | null;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  loadingUser: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [loadingUser, setLoadingUser] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setLoadingUser(true);

    try {
      if (firebaseUser) {
        const userDocRef = doc(collection(firestore, 'user'), firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          setUser({
            uid: firebaseUser.uid,
            user_phone_number: data?.user_phone_number || null,
          });
        } else {
          await setDoc(userDocRef, {
            user_phone_number: firebaseUser.phoneNumber,
          });
          setUser({
            uid: firebaseUser.uid,
            user_phone_number: firebaseUser.phoneNumber,
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth error:', error);
      await signOut(auth);
      setUser(null);
    } finally {
      // ✅ ต้องอยู่ใน finally เพื่อให้ไม่ค้าง
      setLoadingUser(false);
    }

    console.log('[authContext] user =', firebaseUser);
  });

  return unsubscribe;
}, []);



  const signInWithPhone = async (phone: string) => {
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone);
      setConfirm(confirmation);
    } catch (error: any) {
      console.error('SignIn Error:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถส่ง OTP ได้');
    }
  };

   const verifyOTP = async (code: string) => {
    try {
      if (!confirm) throw new Error('ไม่พบข้อมูลการยืนยัน OTP');
      await confirm.confirm(code); // ทำให้ onAuthStateChanged ทำงาน
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'OTP ไม่ถูกต้อง');
      throw error;
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout Error:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ออกจากระบบไม่สำเร็จ');
    }
  };

  return (
    <AuthContext.Provider value={{ user, confirm, signInWithPhone, verifyOTP, logout, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  return context;
};
