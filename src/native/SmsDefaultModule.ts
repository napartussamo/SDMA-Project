import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

interface SmsDefaultModuleInterface {
    requestDefaultSmsApp: () => Promise<boolean>;
    getPackageName: () => Promise<string>;
    getDefaultSmsPackage: () => Promise<string>;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
}

const { SmsDefaultModule } = NativeModules as { SmsDefaultModule: SmsDefaultModuleInterface };

export const setupSmsRoleListener = (callback: (isSuccess: boolean) => void) => {
    if (Platform.OS !== 'android') return;

    const eventEmitter = new NativeEventEmitter(SmsDefaultModule);
    const eventListener = eventEmitter.addListener(
        'onSmsRoleChanged',
        (event: boolean) => {
            callback(event);
        }
    );

    return () => {
        eventListener.remove();
    };
};

export const requestDefaultSmsApp = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
        const result = await SmsDefaultModule.requestDefaultSmsApp();
        return result;
    } catch (error) {
        console.error("Error requesting SMS role:", error);
        throw error;
    }
};

export const checkIsDefaultSmsApp = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
        const myPackage = await SmsDefaultModule.getPackageName();
        const defaultPackage = await SmsDefaultModule.getDefaultSmsPackage();
        return myPackage === defaultPackage;
    } catch (error) {
        console.error("Error checking default SMS app:", error);
        return false;
    }
};