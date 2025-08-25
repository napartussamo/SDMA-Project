import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Button, Alert, StyleSheet, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import { requestDefaultSmsApp, checkIsDefaultSmsApp, setupSmsRoleListener } from '../native/SmsDefaultModule';

const PermSetUpScreen = ({ navigation }: any) => {
    const [appState, setAppState] = useState(AppState.currentState);
    const appStateRef = useRef(appState);
    appStateRef.current = appState;

    const checkAndNavigate = useCallback(async () => {
        const isDefault = await checkIsDefaultSmsApp();
        if (isDefault) {
            navigation.replace('Home');
        }
    }, [navigation]);

    useEffect(() => {
        // ตรวจสอบเมื่อแอปเปิดครั้งแรก
        checkAndNavigate();

        // ตั้งค่าตัวตรวจสอบเมื่อแอปกลับมาทำงาน
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                await checkAndNavigate();
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [checkAndNavigate]);

    useEffect(() => {
        // ตั้งค่าตัวรับฟังเหตุการณ์จาก Native
        const unsubscribe = setupSmsRoleListener((isSuccess) => {
            if (isSuccess) {
                checkAndNavigate();
            }
        });

        return () => {
            unsubscribe?.();
        };
    }, [checkAndNavigate]);

    const handleSetDefaultSms = async () => {
        try {
            const success = await requestDefaultSmsApp();
            if (success) {
                // สำเร็จทันที (บางอุปกรณ์)
                navigation.replace('Home');
            } else {
                Alert.alert('เสร็จสิ้น', 'กลับมาในแอปเพื่อดำเนินการต่อ', [
                    {
                        text: 'ตกลง',
                        onPress: () => checkAndNavigate()
                    }
                ]);
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('ผิดพลาด', 'ไม่สามารถขอสิทธิ์ได้');
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <View style={styles.header}>
                    <Text style={styles.title}>โปรดให้สิทธิต่อไปนี้ เพื่อการบริการเต็มรูปแบบ</Text>
                </View>
                <View style={styles.box}>
                    <Text style={styles.boxTitle}>แอปหมายเลขผู้โทรและแสปมเริ่มต้น</Text>
                    <Text style={styles.boxSubtitle}>โปรดให้สิทธิ์นี้เพื่อเข้าถึงระบุผู้โทรและฟังก์ชันการบล็อก</Text>
                </View>
                <View style={styles.box}>
                    <Text style={styles.boxTitle}>แอป SMS เริ่มต้น</Text>
                    <Text style={styles.boxSubtitle}>โปรดให้สิทธิ์นี้เพื่อเข้าถึงระบุผู้โทรและฟังก์ชันรับ SMS, รูปภาพได้อย่างเต็มที่</Text>
                </View>
                <View style={styles.box}>
                    <Text style={styles.boxTitle}>แสดงทับแอปอื่น</Text>
                    <Text style={styles.boxSubtitle}>โปรดให้สิทธิ์นี้เพื่อเข้าถึงฟังก์ชันการระบุผู้ส่ง</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSetDefaultSms}>
                <Text style={styles.btnText}>รับทราบ</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex:1, padding: 24, backgroundColor:'#1E3A8A', justifyContent: 'space-between'},
    header: {marginVertical:36},
    title: {fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#fff', lineHeight: 32},
    btn: {backgroundColor: "#F5C45E", borderRadius: 42, marginHorizontal:50, marginBottom: 80, elevation: 5},
    btnText: {fontSize:16, color:'#000', textAlign: 'center', paddingVertical:10, paddingHorizontal:20},
    box: {backgroundColor: '#fff',borderRadius: 14, borderColor: '#E6E6E6',marginBottom:15},
    boxTitle: {fontSize: 16, fontWeight: 'bold', textAlign: 'center',paddingVertical: 10},
    boxSubtitle: {fontSize: 16, textAlign: 'center', paddingBottom: 10, marginHorizontal:40, lineHeight:24}
});

export default PermSetUpScreen;