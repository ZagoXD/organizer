import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabase';

export const InviteContext = createContext();

export const InviteProvider = ({ children }) => {
  const [pendingInvites, setPendingInvites] = useState([]);

  const checkPendingInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('environment_shares')
      .select(`
        id,
        environment_id,
        status,
        shared_with_user_email,
        environments (name)
      `)
      .eq('shared_with_user_email', user.email)
      .eq('status', 'pending');

    if (error) {
      console.error('Erro ao buscar convites:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const newInvites = data.filter(invite => 
        !pendingInvites.some(p => p.id === invite.id)
      );
      setPendingInvites(data);

      newInvites.forEach(invite => {
        Alert.alert(
          'Convite de Compartilhamento',
          `Você foi convidado para o ambiente: ${invite.environments?.name || 'Sem nome'}. Aceitar convite?`,
          [
            {
              text: 'Recusar',
              onPress: () => declineInvite(invite.id),
              style: 'cancel'
            },
            {
              text: 'Aceitar',
              onPress: () => acceptInvite(invite.id)
            }
          ],
          { cancelable: true }
        );
      });
    }
  };

  useEffect(() => {
    checkPendingInvites();

    const subscription = supabase
      .channel('environment_shares_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'environment_shares',
      }, async (payload) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (payload.new.shared_with_user_email === user.email && payload.new.status === 'pending') {
          checkPendingInvites();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [pendingInvites]);

  const acceptInvite = async (inviteId) => {
    const { error } = await supabase
      .from('environment_shares')
      .update({ status: 'accepted' })
      .eq('id', inviteId);
    if (error) console.error('Erro ao aceitar convite:', error.message);
    else setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const declineInvite = async (inviteId) => {
    const { error } = await supabase
      .from('environment_shares')
      .delete()
      .eq('id', inviteId);
    if (error) console.error('Erro ao recusar convite:', error.message);
    else setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  return (
    <InviteContext.Provider value={{ pendingInvites, acceptInvite, declineInvite, checkPendingInvites }}>
      {children}
    </InviteContext.Provider>
  );
};
