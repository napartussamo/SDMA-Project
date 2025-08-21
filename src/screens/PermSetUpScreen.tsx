import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Button, Alert, StyleSheet, AppState, AppStateStatus } from 'react-native';
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
            <Text>กรุณาตั้งแอปนี้ให้เป็นแอป SMS หลักก่อนใช้งาน</Text>
            <Button title="ตั้งเป็นแอป SMS หลัก" onPress={handleSetDefaultSms} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16 },
});

export default PermSetUpScreen;