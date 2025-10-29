import { NativeModules } from 'react-native';
const { SmsSenderModule } = NativeModules;

export const sendSms = async (phoneNumber: string, message: string) => {
  return await SmsSenderModule.sendSms(phoneNumber, message);
};
