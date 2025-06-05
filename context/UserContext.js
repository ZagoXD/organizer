import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Alert } from 'react-native';
import { navigate } from '../navigation'; // Importa a função navigate

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) return;

      const nameParts = profile.full_name.split(' ');
      const first = nameParts.length > 0 ? nameParts[0] : '';
      setFirstName(first);
    };

    fetchUser();

    // 🚨 Adiciona o listener de sessão
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        navigate('Login'); // Usa a função global navigate
      } else {
        fetchUser(); // Recarrega o usuário para manter o estado atualizado
      }
    });

    // Remove o listener ao desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ firstName }}>
      {children}
    </UserContext.Provider>
  );
}
