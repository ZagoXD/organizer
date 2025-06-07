import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const InviteContext = createContext();

export const InviteProvider = ({ children }) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);

  const checkPendingInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

   const { data, error } = await supabase
  .from('environment_shares_with_names')
  .select('*')
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

      if (newInvites.length > 0) {
        const firstInvite = newInvites[0];
        console.log(`Solicitação de compartilhamento do ambiente: ${firstInvite.environment_name || 'Sem nome'}`);

        setSelectedInvite(firstInvite);
        setShowInviteModal(true);
      }
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
          // Busca o nome do ambiente explicitamente
          const { data: envData, error: envError } = await supabase
            .from('environments')
            .select('name')
            .eq('id', payload.new.environment_id)
            .single();

          if (envError) {
            console.error('Erro ao buscar nome do ambiente:', envError.message);
          } else {
            console.log(`🚨 Novo convite inserido via Realtime para o ambiente: ${envData.name}`);
          }

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
    if (error) {
      console.error('Erro ao aceitar convite:', error.message);
    } else {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      setShowInviteModal(false);
      setSelectedInvite(null);
    }
  };

  const declineInvite = async (inviteId) => {
    const { error } = await supabase
      .from('environment_shares')
      .delete()
      .eq('id', inviteId);
    if (error) {
      console.error('Erro ao recusar convite:', error.message);
    } else {
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      setShowInviteModal(false);
      setSelectedInvite(null);
    }
  };

  return (
    <InviteContext.Provider
      value={{
        pendingInvites,
        selectedInvite,
        showInviteModal,
        setShowInviteModal,
        acceptInvite,
        declineInvite,
        checkPendingInvites
      }}
    >
      {children}
    </InviteContext.Provider>
  );
};
