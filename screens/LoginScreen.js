import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InviteContext } from '../context/InviteContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const { checkPendingInvites } = useContext(InviteContext);


  const errorMessages = {
    "Invalid login credentials": "Credenciais de login inválidas",
    "Email already registered": "E-mail já registrado",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
    "User not confirmed": "Usuário não confirmado",
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const remember = await AsyncStorage.getItem('rememberMe');
      if (session && remember === 'true') {
        navigation.navigate('Environments');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setIsLoading(false);
    if (error) {
      const translatedMessage = errorMessages[error.message] || error.message;
      Alert.alert('Erro', translatedMessage);
    } else {
      await AsyncStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      checkPendingInvites();
      navigation.navigate('Environments');
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Erro', 'Por favor, insira um e-mail.');
      return;
    }

    setIsSendingResetEmail(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://reset-password-organizer.vercel.app/'
    });
    setIsSendingResetEmail(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição de senha.');
      console.error(error.message);
    } else {
      Alert.alert('Sucesso', 'E-mail de redefinição de senha enviado!');
      setShowResetModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo</Text>
      <Text style={styles.subtitle}>Acesse sua conta</Text>

      <View style={styles.inputContainer}>
        <Icon name="email" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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
          <Icon name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
          <Icon
            name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color="#5db55b"
          />
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Manter-me logado</Text>
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerButtonText}>
          Não tem uma conta?{' '}
          <Text style={styles.registerLink}>Registre-se</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => setShowResetModal(true)}
      >
        <Text style={styles.resetButtonText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recuperar Senha</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite seu e-mail"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleResetPassword}
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Enviar E-mail</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowResetModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loginButton: {
    backgroundColor: '#5db55b',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#555',
    fontSize: 16,
  },
  registerLink: {
    color: '#5db55b',
    fontWeight: 'bold',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#5db55b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#5db55b',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#5db55b',
    fontSize: 16,
  },
});
