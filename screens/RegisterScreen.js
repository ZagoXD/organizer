import React, { useRef, useState } from 'react';
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
import PhoneInput from 'react-native-phone-input';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phoneRef = useRef(null);
  const [phone, setPhone] = useState('');

  // Supabase -> chaves i18n
  const errorKeyMap = {
    'User already registered': 'auth.errors.user_registered',
    'Email already registered': 'auth.errors.email_registered',
    'Password should be at least 6 characters': 'auth.errors.password_min',
    'Password should be at least 6 characters.': 'auth.errors.password_min',
  };

  const handlePhoneChange = (number) => setPhone(number);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('register.errors.passwords_not_match'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone }
        }
      });

      if (error) {
        setIsLoading(false);
        const key = errorKeyMap[error.message];
        const msg = key ? t(key) : error.message;
        Alert.alert(t('common.error'), msg);
        return;
      }

      const userId = data?.user?.id;
      const userEmail = (data?.user?.email || email || '').toLowerCase();
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: userId, full_name: fullName, phone, email: userEmail }]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError.message);
          Alert.alert(t('common.error'), t('register.errors.profile_create'));
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      Alert.alert(t('common.success'), t('register.success'));
      navigation.navigate('Login');
    } catch (err) {
      setIsLoading(false);
      console.error('Erro inesperado:', err.message);
      Alert.alert(t('common.error'), t('register.errors.unexpected'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('register.title')}</Text>
      <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

      <View style={styles.inputContainer}>
        <Icon name="person" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('register.placeholders.full_name')}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="phone" size={24} color="#555" style={styles.inputIcon} />
        <PhoneInput
          ref={phoneRef}
          initialCountry="br"
          onChangePhoneNumber={handlePhoneChange}
          textProps={{
            placeholder: t('register.placeholders.phone'),
            placeholderTextColor: '#888'
          }}
          style={styles.phoneInput}
          textStyle={{ color: '#000' }}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="email" size={24} color="#555" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('register.placeholders.email')}
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
          placeholder={t('register.placeholders.password')}
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
          placeholder={t('register.placeholders.confirm_password')}
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
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>{t('register.cta')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginLinkText}>
          {t('register.have_account')}{' '}
          <Text style={styles.loginLinkHighlight}>{t('register.sign_in')}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, backgroundColor: '#fff' },

  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 18, color: '#777', marginBottom: 30, textAlign: 'center' },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 10,
    marginBottom: 20, height: 55, borderWidth: 1, borderColor: '#ccc'
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#333' },

  registerButton: { backgroundColor: '#5db55b', paddingVertical: 15, borderRadius: 10, alignItems: 'center', elevation: 2, marginBottom: 20 },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  loginLink: { alignItems: 'center' },
  loginLinkText: { color: '#555', fontSize: 16 },
  loginLinkHighlight: { color: '#5db55b', fontWeight: 'bold' }
});
