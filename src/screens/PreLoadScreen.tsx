import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/authContext';
import NetInfo from '@react-native-community/netinfo';
import {checkIsDefaultSmsApp} from '../native/SmsDefaultModule';

const PreLoadScreen = ({ navigation }: any) => {
  const { user, loadingUser } = useAuth();

  useEffect(() => {
    const checkEverything = async () => {
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        Alert.alert('ไม่มีอินเทอร์เน็ต', 'กรุณาเชื่อมต่ออินเทอร์เน็ตก่อน');
        return;
      }

      if (loadingUser) return;

      if (!user) {
        navigation.replace('PhoneLogin');
        return;
      }

      const isDefault = await checkIsDefaultSmsApp();

      if (!isDefault) {
        navigation.replace('PermSetUp');
      } else {
        navigation.replace('Home');
      }
    };

    checkEverything();
  }, [navigation, user, loadingUser]);

  return null;
};

export default PreLoadScreen;
