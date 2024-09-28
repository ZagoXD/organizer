import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorMessages = {
    "Invalid login credentials": "Credenciais de login inválidas",
    "Email already registered": "E-mail já registrado",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
    "User not confirmed": "Usuário não confirmado",
    //
  };

    // Verifica se há uma sessão ativa ao montar o componente
    useEffect(() => {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
  
        if (session) {
          navigation.navigate('Home');
        }
      };
  
      checkSession()
    }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@myapp.com`,
      password
    });

    if (error) {
      const translatedMessage = errorMessages[error.message] || error.message;
      Alert.alert('Erro', translatedMessage);
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

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

      <Button style={styles.btnLogin} title="Entrar" onPress={handleLogin} />

      <View style={styles.registerButton}>
        <Button
          title="Não tem uma conta? Registre-se"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '80%',
    height: 60,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  registerButton: {
    marginTop: 20,
  },
  title: {
    fontSize: 30,
    marginBottom: 20,
  },
});
