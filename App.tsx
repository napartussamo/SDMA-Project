import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/authContext';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OTPVerifyScreen from './src/screens/OTPVerifyScreen';
import HomeScreen from './src/screens/HomeScreen';
import PermSetUpScreen from './src/screens/PermSetUpScreen';
import PreLoadScreen from './src/screens/PreLoadScreen';  
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';



const Stack = createNativeStackNavigator();

const AppNavigator = () => {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PreLoad" component={PreLoadScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="PermSetUp" component={PermSetUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} options={{statusBarStyle: "dark", }} />
      <Stack.Screen name="Chat" component={ChatScreen}/>
      <Stack.Screen name="Profile" component={ProfileScreen}/>
    </Stack.Navigator>
  );
};



const App = () => (
  <AuthProvider>
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </AuthProvider>
);

export default App;
