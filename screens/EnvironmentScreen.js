import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { Icon } from 'react-native-elements';
import { useContext } from 'react';
import { BoxContext } from '../context/BoxContext';
import { useFocusEffect } from '@react-navigation/native';
import BottomBar from '../components/BottomBar';
import { useTranslation } from 'react-i18next';

export default function EnvironmentScreen({ navigation }) {
  const [environments, setEnvironments] = useState([]);
  const { boxes, fetchAllBoxes } = useContext(BoxContext);
  const [search, setSearch] = useState('');
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { removeEnvironment } = useContext(BoxContext);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareEnvironmentId, setShareEnvironmentId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchEnvironments();
    fetchAllBoxes();
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('environments_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'environments'
      }, payload => {
        console.log('Nova mudança de ambiente:', payload);
        fetchEnvironments();
        fetchAllBoxes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('environments_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'environment_shares'
      }, payload => {
        console.log('Nova mudança de ambiente compartilhado:', payload);
        fetchEnvironments();
        fetchAllBoxes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);


  // Caso retornar para a tela Ambiente
  useFocusEffect(
    React.useCallback(() => {
      fetchAllBoxes();
    }, [])
  );

  // Função para carregar os ambientes
  const fetchEnvironments = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      setUserId(user.id);

      // Ambientes próprios
      const { data: ownEnvironments, error: ownError } = await supabase
        .from('environments')
        .select('id, name, user_id')
        .eq('user_id', user.id);

      if (ownError) {
        console.error('Erro ao buscar ambientes próprios:', ownError.message);
      }

      // IDs de ambientes compartilhados
      const { data: sharedEnvIdsData, error: sharedEnvIdsError } = await supabase
        .from('environment_shares')
        .select('environment_id')
        .eq('shared_with_user_email', user.email)
        .eq('status', 'accepted');

      if (sharedEnvIdsError) {
        console.error('Erro ao buscar IDs de ambientes compartilhados:', sharedEnvIdsError.message);
      }

      const sharedEnvIds = (sharedEnvIdsData || []).map(record => record.environment_id);

      const { data: sharedEnvironments, error: sharedError } = await supabase
        .from('environments')
        .select('id, name, user_id')
        .in('id', sharedEnvIds);

      if (sharedError) {
        console.error('Erro ao buscar ambientes compartilhados:', sharedError.message);
      }

      const allEnvironments = [...(ownEnvironments || [])];

      (sharedEnvironments || []).forEach(sharedEnv => {
        if (!allEnvironments.find(env => env.id === sharedEnv.id)) {
          allEnvironments.push(sharedEnv);
        }
      });

      setEnvironments(allEnvironments);
    } catch (error) {
      console.error('Erro inesperado ao carregar ambientes:', error);
    }
  };

  // Função para adicionar um novo ambiente
  const addEnvironment = async () => {
    if (!newEnvironmentName.trim()) {
      Alert.alert(t('common.error'), t('environments.create_missing_name'));
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Erro ao obter o usuário:', userError.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('environments')
        .insert([{ name: newEnvironmentName, user_id: user.id }])
        .select(); //garante ambiente novo de ser carregado

      if (error) {
        console.error('Erro ao criar ambiente:', error.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const newEnvironment = data[0];
        setEnvironments([...environments, newEnvironment]);
      } else {
        console.error('Nenhum ambiente foi retornado após a inserção.');
      }

      setNewEnvironmentName('');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro inesperado ao adicionar ambiente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ambiente
  const filterEnvironmentsBySearch = () => {
    const term = search.trim().toLowerCase();
    if (!term) return environments;
    return environments.filter(env =>
      (env.name || '').toLowerCase().includes(term)
    );
  };

  const selectEnvironment = (environment) => {
    navigation.navigate('Home', { environmentId: environment.id });
  };

  //Deleta Ambiente
  const handleDeleteEnvironment = (environmentId) => {
    Alert.alert(
      t('environments.delete_confirm_title'),
      t('environments.delete_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                const success = await removeEnvironment(environmentId);
                if (success) {
                  setEnvironments(prev => prev.filter(env => env.id !== environmentId));
                }
              } catch (error) {
                console.error("Erro ao tentar remover o ambiente:", error);
              }
            })();
          }
        }
      ]
    );
  };

  //Compartilhar Ambiente
  const handleShareEnvironment = async () => {
    const raw = (shareEmail || '').trim();
    const fullEmail = raw.toLowerCase();

    const bail = (title, msg) => {
      setIsSharing(false);
      Alert.alert(title, msg);
    };

    if (!raw) return bail(t('common.error'), t('share.errors.need_email'));

    setIsSharing(true);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail);
    if (!emailOk) return bail(t('common.error'), t('share.errors.invalid_email'));

    try {
      const { data: { user: me }, error: meErr } = await supabase.auth.getUser();
      if (meErr || !me) return bail(t('common.error'), t('share.errors.unauthenticated'));

      if (fullEmail === (me.email || '').toLowerCase()) {
        return bail(t('common.error'), t('share.errors.self_share'));
      }

      const { data: targetProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', fullEmail)
        .maybeSingle();

      if (profileErr) {
        console.log('[share] lookup profiles error:', profileErr);
        return bail(t('common.error'), t('share.errors.lookup_fail'));
      }
      if (!targetProfile) {
        return bail(t('share.errors.user_not_found_title'), t('share.errors.user_not_found_msg'));
      }

      const { data: existing, error: existErr } = await supabase
        .from('environment_shares')
        .select('id, status')
        .eq('environment_id', shareEnvironmentId)
        .ilike('shared_with_user_email', fullEmail);

      if (existErr) {
        console.log('[share] check existing error:', existErr);
        return bail(t('common.error'), t('share.errors.existing_check_fail'));
      }
      if (existing?.length) {
        const status = existing[0].status;
        return bail(
          t('common.attention'),
          status === 'accepted'
            ? t('share.errors.already_shared')
            : t('share.errors.invite_pending')
        );
      }

      const { data: envData, error: envError } = await supabase
        .from('environments')
        .select('name')
        .eq('id', shareEnvironmentId)
        .single();

      if (envError || !envData) {
        return bail(t('common.error'), t('share.errors.env_not_found'));
      }

      const { error: insertErr } = await supabase
        .from('environment_shares')
        .insert([{
          environment_id: shareEnvironmentId,
          shared_with_user_email: fullEmail,
          status: 'pending',
        }]);

      if (insertErr) {
        console.log('[share] insert error:', insertErr);
        return bail(t('common.error'), t('share.errors.insert_fail'));
      }

      Alert.alert(
        t('common.success'),
        t('share.success', { env: envData.name, email: raw })
      );
      setShareModalVisible(false);
      setShareEmail('');
      fetchAccessList(shareEnvironmentId);
    } catch (err) {
      console.log('[share] unexpected error:', err);
      Alert.alert(t('common.error'), t('share.errors.unexpected'));
    } finally {
      setIsSharing(false);
    }
  };

  // Color
  const getColorForEnvironment = (environmentId) => {
    const colors = ['#FFC4B6', '#D1B6FF'];
    const index = environmentId % colors.length;
    return colors[index];
  };

  const fetchAccessList = async (envId) => {
    if (!envId) return;
    setIsAccessLoading(true);
    try {
      const { data: shares, error } = await supabase
        .from('environment_shares')
        .select('id, shared_with_user_email, status, created_at')
        .eq('environment_id', envId)
        .order('status', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const emails = (shares || []).map(s => (s.shared_with_user_email || '').toLowerCase());
      let byEmail = {};
      if (emails.length) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('email', emails);

        if (!profErr && profs) {
          byEmail = Object.fromEntries(
            profs.map(p => [(p.email || '').toLowerCase(), p])
          );
        }
      }

      const list = (shares || []).map(s => ({
        id: s.id,
        email: s.shared_with_user_email,
        full_name: byEmail[(s.shared_with_user_email || '').toLowerCase()]?.full_name || null,
        status: s.status,
      }));

      setAccessList(list);
    } catch (e) {
      console.error('Erro ao carregar acessos:', e);
      Alert.alert('Erro', 'Não foi possível carregar a lista de acessos.');
    } finally {
      setIsAccessLoading(false);
    }
  };

  const handleRevokeAccess = (shareId, email) => {
    Alert.alert(
      'Remover acesso',
      `Tem certeza que deseja remover o acesso de ${email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setRevokingId(shareId);
            try {
              const { data, error } = await supabase
                .from('environment_shares')
                .delete()
                .match({ id: shareId, environment_id: shareEnvironmentId })
                .select('id');

              if (error) {
                console.error('[revoke] delete error:', error);
                Alert.alert('Erro', 'Não foi possível remover o acesso.');
                return;
              }

              if (!data || data.length === 0) {
                Alert.alert('Atenção', 'Nada foi removido (verifique permissões).');
                return;
              }

              setAccessList(prev => prev.filter(s => s.id !== shareId));
              Alert.alert('Pronto', `Acesso de ${email} removido.`);
            } catch (e) {
              console.error('[revoke] unexpected:', e);
              Alert.alert('Erro', 'Não foi possível remover o acesso.');
            } finally {
              setRevokingId(null);
            }
          }
        }
      ]
    );
  };

  const renderEnvironment = ({ item }) => {
    const isOwner = item.user_id === userId;
    const isShared = !isOwner;
    const backgroundColor = getColorForEnvironment(item.id);

    return (
      <View style={[styles.environmentItemContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={styles.environmentItem}
          onPress={() => selectEnvironment(item)}
        >
          <View style={styles.environmentTitleRow}>
            <Icon name="home" size={20} color="#000" style={styles.iconHome} />
            <Text style={styles.environmentName}>
              {item.name} {isShared && <Text style={{ fontSize: 14, color: '#555' }}>{t('environments.shared_suffix')}</Text>}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.itemActions}>
          {isOwner && (
            <TouchableOpacity onPress={() => {
              setShareEnvironmentId(item.id);
              setShareModalVisible(true);
              fetchAccessList(item.id)
            }}>
              <Icon name="share" size={24} color="blue" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDeleteEnvironment(item.id)}>
            <Icon name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.TopBarContainer}>
          <View style={styles.topBarRow}>
            <View style={[styles.searchContainer, { flex: 1, marginVertical: 0 }]}>
              <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('environments.search_ph')}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#aaa"
              />
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.floatingButton}
            >
              <Icon name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filterEnvironmentsBySearch()}
          renderItem={renderEnvironment}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text>{t('environments.list_empty')}</Text>}
        />

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{t('environments.create_title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('environments.create_name_ph')}
                value={newEnvironmentName}
                onChangeText={setNewEnvironmentName}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={addEnvironment}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? t('environments.creating') : t('environments.create_cta')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={shareModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{t('share.title')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('share.invite_ph')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={shareEmail}
                onChangeText={setShareEmail}
                editable={!isSharing}
                placeholderTextColor="#888"
              />

              <TouchableOpacity
                style={[styles.modalButton, isSharing && { opacity: 0.7 }]}
                onPress={handleShareEnvironment}
                disabled={isSharing}
              >
                {isSharing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalButtonText}>{t('share.send_invite')}</Text>
                }
              </TouchableOpacity>

              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <Text style={styles.sectionTitle}>{t('share.access_title')}</Text>
                <Text style={styles.sectionHint}>{t('share.access_hint_owner')}</Text>
              </View>

              {isAccessLoading ? (
                <ActivityIndicator size="small" color="#5db55b" />
              ) : accessList.length === 0 ? (
                <Text style={styles.emptySharesText}>{t('share.none')}</Text>
              ) : (
                <FlatList
                  data={accessList}
                  keyExtractor={(s) => s.id.toString()}
                  style={{ maxHeight: 220, marginTop: 6 }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  renderItem={({ item }) => {
                    const isBusy = revokingId === item.id;
                    const isAccepted = item.status === 'accepted';

                    const initial =
                      (item.full_name || item.email || '?').trim().charAt(0).toUpperCase() || '?';

                    return (
                      <View style={styles.shareRow}>
                        {/* Avatar */}
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>

                        {/* Nome + Email (1 linha cada) */}
                        <View style={styles.shareInfo}>
                          <Text
                            style={styles.shareName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.full_name || item.email}
                          </Text>
                          {item.full_name && (
                            <Text
                              style={styles.shareEmail}
                              numberOfLines={1}
                              ellipsizeMode="middle"
                            >
                              {item.email}
                            </Text>
                          )}
                        </View>

                        {/* Coluna de ações (ícones empilhados) */}
                        <View style={styles.actionsCol}>
                          <View
                            style={[
                              styles.statusIconWrap,
                              isAccepted ? styles.statusOkBg : styles.statusPendingBg,
                            ]}
                          >
                            <Icon
                              name={isAccepted ? 'check-circle' : 'hourglass-empty'}
                              type="material"
                              size={18}
                              color={isAccepted ? '#2e7d32' : '#8a5100'}
                            />
                          </View>

                          <TouchableOpacity
                            style={styles.iconButtonCircle}
                            onPress={() => handleRevokeAccess(item.id, item.email)}
                            disabled={isBusy}
                            hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
                            activeOpacity={0.85}
                          >
                            {isBusy ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Icon name="delete" type="material" size={18} color="#fff" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShareModalVisible(false)}
                disabled={isSharing || isAccessLoading}
              >
                <Text style={styles.cancelButtonText}>{t('share.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cancelBtnCreateEnv: {
    marginTop: 10,
  },
  environmentItem: {
    padding: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  environmentName: {
    fontSize: 18,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    height: 40,
    marginVertical: 10,
    flex: 1
  },
  searchIcon: {
    marginRight: 8,
  },
  floatingButton: {
    backgroundColor: '#5db55b',
    width: 40,
    height: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 1000,
    marginLeft: 10,
  },
  TopBarContainer: {
    width: '100%',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#5db55b',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalView: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    color: '#222',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#5db55b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  sectionHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptySharesText: {
    color: '#666',
    marginTop: 8,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF6ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#2e7d32',
    fontWeight: '800',
  },
  shareInfo: { flex: 1, minWidth: 0 },
  shareName: { fontSize: 14, fontWeight: '700', color: '#111' },
  shareEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  actionsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 2,
    marginLeft: 10,
    gap: 8,
  },
  statusIconWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOkBg: { backgroundColor: '#E7F4EA' },
  statusPendingBg: { backgroundColor: '#FFF4E5' },
  iconButtonCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeAccepted: { backgroundColor: '#E7F4EA' },
  badgeAcceptedText: { color: '#2e7d32' },
  badgePending: { backgroundColor: '#FFF4E5' },
  badgePendingText: { color: '#8a5100' },
  revokeButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  revokeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  iconHome: {
    marginRight: 8,
  },
  environmentItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  environmentItem: {
    flex: 1,
    padding: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  environmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  searchWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  searchTypeToggle: {
    flexDirection: 'row',
    marginRight: 10,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#5db55b',
    borderColor: '#5db55b',
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  TopBarContainer: {
    width: '100%',
    marginBottom: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});
