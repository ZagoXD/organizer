import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const fetchUserProfile = async (userId) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
        return;
      }

      const nameParts = profile.full_name.split(' ');
      const first = nameParts.length > 0 ? nameParts[0] : '';
      setFirstName(first);
    };

    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setFirstName('');
        return;
      }
      fetchUserProfile(user.id);
    };

    getCurrentUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setFirstName('');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ firstName }}>
      {children}
    </UserContext.Provider>
  );
}
