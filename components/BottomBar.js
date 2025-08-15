import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BottomBar() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza de que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('rememberMe');
            navigation.navigate('Login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Environments')}
        >
          <Icon name="home" size={30} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('UserProfile')}
        >
          <Icon name="account-circle" size={30} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('search')}
        >
          <Icon name="search" size={30} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogout}
        >
          <Icon name="logout" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#e8e8e8',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
