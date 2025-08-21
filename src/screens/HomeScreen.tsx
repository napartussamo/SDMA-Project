import React from 'react';
import { View, Text, Button, StyleSheet} from 'react-native';
import { useAuth } from '../context/authContext';

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('PhoneLogin');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome {user?.user_phone_number || 'User'}!
      </Text>

      <View style={styles.button}>
        <Button
          title="Logout"
          onPress={handleLogout}
          color="#cc0000"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 30
  },
  button: {
    width: '100%',
    maxWidth: 250,
    marginBottom: 16
  }
});

export default HomeScreen;
