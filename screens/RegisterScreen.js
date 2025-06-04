import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const errorMessages = {
    "User already registered": "Usuário já registrado",
    "Password should be at least 6 characters.": "A senha deve ter pelo menos 6 caracteres",
    "Passwords do not match": "As senhas não coincidem",
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: `${username}@myapp.com`,
      password,
      options: {
        data: {
          username: username
        }
      }
    });
    setIsLoading(false);

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
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Preencha os dados abaixo</Text>

      <View style={styles.inputContainer}>
        <Icon name="person" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Nome de Usuário"
          value={username}
          onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon
            name={passwordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon
            name={passwordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={isLoading}  // impede múltiplos cliques
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Registrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginLinkText}>
          Já tem uma conta?{' '}
          <Text style={styles.loginLinkHighlight}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#777',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#5db55b',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#555',
    fontSize: 16,
  },
  loginLinkHighlight: {
    color: '#5db55b',
    fontWeight: 'bold',
  },
});
