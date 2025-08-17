import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { navigate } from '../navigation';
import { useTranslation } from 'react-i18next';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [firstName, setFirstName] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile?.full_name) {
        setFirstName('');
        return;
      }

      const first = (profile.full_name || '').trim().split(' ')[0] || '';
      setFirstName(first);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        Alert.alert(
          t('auth.session_expired_title', { defaultValue: 'Sessão expirada' }),
          t('auth.session_expired_msg', { defaultValue: 'Faça login novamente.' })
        );
        setFirstName('');
        navigate('Login');
      } else {
        fetchUser();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [t]);

  return (
    <UserContext.Provider value={{ firstName }}>
      {children}
    </UserContext.Provider>
  );
}
