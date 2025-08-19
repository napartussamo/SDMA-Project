/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import RNBootSplash from "react-native-bootsplash";

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    RNBootSplash.hide({ fade: true }); // ซ่อน splash ตอนแอปโหลดเสร็จ
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NewAppScreen templateFileName="App.js" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
