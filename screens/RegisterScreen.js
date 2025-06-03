import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../supabase';  
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorMessages = {
    "User already registered": "usuario já registrado",
    "Password should be at least 6 characters.": "A senha deve ter pelo menos 6 caracteres",
    "Passwords do not match": "As senhas não coincidem",
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: `${username}@myapp.com`,
      password,
      options: {
        data: {
          username: username 
        }
      }
    });
  
    if (error) {
      const translatedMessage = errorMessages[error.message] || error.message;
      Alert.alert('Erro', translatedMessage);
    } else {
      Alert.alert('Sucesso', 'Usuário registrado com sucesso!');
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Nome de Usuário"
          value={username}
          onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}  
          placeholderTextColor="#555" 
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#555" 
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#555"
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <View style={styles.confirmregisterButton}><Button title="Registrar" onPress={handleRegister} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmregisterButton: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '80%',
    height: 60,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 30,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
