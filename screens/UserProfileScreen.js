import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';
import { useTranslation } from 'react-i18next';

export default function UserProfileScreen() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert(t('common.error'), t('userProfile.errors.user_not_found'));
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        Alert.alert(t('common.error'), t('userProfile.errors.load_failed'));
        console.error(profileError.message);
        setLoading(false);
        return;
      }

      setProfile({
        name: profileData.full_name,
        email: user.email,
        phone: profileData.phone
      });
      setLoading(false);
    };

    fetchUserProfile();
  }, [t]);

  const handlePasswordReset = async () => {
    if (!profile?.email) return;

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: 'https://reset-password-organizer.vercel.app/'
      });
      if (error) {
        Alert.alert(t('common.error'), t('auth.reset.error'));
        console.error(error.message);
      } else {
        Alert.alert(t('common.success'), t('auth.reset.success'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('common.unexpected', { defaultValue: 'Ocorreu um erro inesperado.' }));
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5db55b" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('userProfile.errors.load_failed')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <Text style={styles.title}>{t('userProfile.title')}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('userProfile.fields.name')}:</Text>
            <Text style={styles.value}>{profile.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('userProfile.fields.email')}:</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('userProfile.fields.phone')}:</Text>
            <Text style={styles.value}>{profile.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handlePasswordReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('userProfile.actions.change_password')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  infoRow: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  value: {
    fontSize: 16, color: '#333', backgroundColor: '#fff',
    padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd'
  },
  button: { backgroundColor: '#5db55b', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center' }
});
