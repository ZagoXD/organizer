import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, Modal, Alert
} from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';
import { useTranslation } from 'react-i18next';

export default function HomeScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { environmentId } = route.params || {};
  const { boxes, addBox, removeBox, fetchBoxes } = useContext(BoxContext);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');

  // ====== Histórico ======
  const [logsVisible, setLogsVisible] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [me, setMe] = useState({ id: null, email: null });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMe({ id: user.id, email: user.email || null });
    })();
  }, []);

  useEffect(() => {
    if (!environmentId) return;
    fetchBoxes(environmentId);
  }, [environmentId]);

  // Realtime das caixas
  useEffect(() => {
    if (!environmentId) return;

    const ch = supabase
      .channel('boxes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixas' }, () => {
        fetchBoxes(environmentId);
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [environmentId, fetchBoxes]);

  const fetchLogs = async () => {
    if (!environmentId) return;
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, environment_id, box_id, item_id, actor_id, actor_email, actor_name, event, meta, created_at')
        .eq('environment_id', environmentId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.log('[history] load error:', error.message);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } finally {
      setLogsLoading(false);
    }
  };

  // Realtime dos logs
  useEffect(() => {
    if (!environmentId) return;

    const ch = supabase
      .channel('activity_logs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload) => {
        const envId = payload?.new?.environment_id || payload?.old?.environment_id;
        if (envId === environmentId) fetchLogs();
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [environmentId]);

  // abre modal e carrega
  const openLogs = () => {
    setLogsVisible(true);
    fetchLogs();
  };

  //Busca local de caixas
  const filteredIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    return Object.keys(boxes || {}).filter((boxId) => {
      const b = boxes[boxId];
      if (!b || b.environment_id !== environmentId) return false;
      return !term || (b.name || '').toLowerCase().includes(term);
    });
  }, [search, boxes, environmentId]);

  const boxList = filteredIds.map((id) => ({
    id,
    name: boxes[id]?.name,
    items: boxes[id]?.items,
  }));

  // Remover caixa (confirmação)
  const handleRemoveBox = (boxId) => {
    Alert.alert(
      t('boxes.confirm_title', { defaultValue: 'Confirmação' }),
      t('boxes.confirm_msg', {
        defaultValue: 'Tem certeza que deseja excluir este compartimento? Todos seus objetos serão perdidos'
      }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        {
          text: t('common.delete', { defaultValue: 'Excluir' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBox(boxId, environmentId);
            } catch (error) {
              console.error('Erro ao tentar remover a caixa:', error);
            }
          }
        }
      ]
    );
  };

  //Add caixa
  const handleAddBox = async () => {
    if (!newBoxName.trim()) return;
    await addBox(newBoxName, environmentId);
    fetchBoxes(environmentId);
    setNewBoxName('');
    setModalVisible(false);
  };

  // Helpers UI 
  const getColorFromId = (id) => {
    const colors = ['#E1D6FF', '#FFDFB6'];
    const index = id.toString().split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderItem = ({ item }) => {
    const backgroundColor = getColorFromId(item.id);
    return (
      <View style={[styles.boxContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={styles.boxItem}
          onPress={() => navigation.navigate('BoxDetails', { boxId: item.id })}
        >
          <View style={styles.boxTitleRow}>
            <Icon name="inventory" size={20} color="#000" style={styles.iconBox} />
            <Text style={styles.boxText}>{item.name}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveBox(item.id)}>
          <Icon name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  const relTime = (iso) => {
    const now = Date.now();
    const ts = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - ts) / 1000)); // s
    const m = Math.floor(diff / 60);
    const h = Math.floor(diff / 3600);
    const d = Math.floor(diff / 86400);
    let chunk;
    if (d > 0) chunk = `${d}d`;
    else if (h > 0) chunk = `${h}h`;
    else if (m > 0) chunk = `${m}m`;
    else chunk = `${diff}s`;
    // "há X" (pt) | "X ago" (en/es)
    const isPT = (i18n.language || '').toLowerCase().startsWith('pt');
    return isPT
      ? t('history.ago_pt', { time: chunk, defaultValue: `há ${chunk}` })
      : t('history.ago_en', { time: chunk, defaultValue: `${chunk} ago` });
  };

  const actorLabel = (log) => {
    if (log.actor_id && me.id && log.actor_id === me.id) {
      return t('history.you', { defaultValue: 'Você' });
    }
    const emailPrefix = log.actor_email ? log.actor_email.split('@')[0] : null;
    return (
      log.actor_name ||
      (log.meta && log.meta.actor_name) ||
      emailPrefix ||
      t('history.someone', { defaultValue: 'Alguém' })
    );
  };

  const iconForEvent = (ev) => {
    if (ev.includes('create')) return { name: 'add-circle-outline', color: '#2e7d32' };
    if (ev.includes('delete')) return { name: 'delete', color: '#c62828' };
    return { name: 'edit', color: '#1565c0' }; // update
  };

  const messageFor = (log) => {
    const ev = log.event;
    const m = log.meta || {};
    const who = actorLabel(log);

    switch (ev) {
      case 'box.create':
        return t('history.msg.box_create', {
          user: who,
          box: m.box_name || t('search.box', { defaultValue: 'Compartimento' }),
          defaultValue: '{{user}} adicionou o compartimento "{{box}}"'
        });

      case 'box.delete':
        return t('history.msg.box_delete', {
          user: who,
          box: m.box_name || t('search.box', { defaultValue: 'Compartimento' }),
          defaultValue: '{{user}} removeu o compartimento "{{box}}"'
        });

      case 'item.create':
        return t('history.msg.item_create', {
          user: who,
          qty: m.quantity ?? m.qty ?? '',
          item: m.item_name || t('search.item', { defaultValue: 'Objeto' }),
          box: m.box_name || t('search.box', { defaultValue: 'Compartimento' }),
          defaultValue: '{{user}} adicionou {{qty}} de "{{item}}" em "{{box}}"'
        });

      case 'item.update': {
        // suporte a renomeação + delta de quantidade
        const fromVal = m.old_qty ?? m.qty_prev ?? m.from ?? '';
        const toVal = m.new_qty ?? m.qty ?? m.to ?? '';
        const itemLabel =
          (m.old_name && m.item_name && m.old_name !== m.item_name)
            ? `${m.old_name} → ${m.item_name}`
            : (m.item_name || m.name || t('search.item', { defaultValue: 'Objeto' }));

        return t('history.msg.item_update', {
          user: who,
          from: fromVal,
          to: toVal,
          item: itemLabel,
          box: m.box_name || t('search.box', { defaultValue: 'Compartimento' }),
          defaultValue: '{{user}} atualizou "{{item}}" em "{{box}}" ({{from}} → {{to}})'
        });
      }

      case 'item.delete':
        return t('history.msg.item_delete', {
          user: who,
          item: m.item_name || t('search.item', { defaultValue: 'Objeto' }),
          box: m.box_name || t('search.box', { defaultValue: 'Compartimento' }),
          defaultValue: '{{user}} removeu "{{item}}" de "{{box}}"'
        });

      default:
        return `${who} • ${ev}`;
    }
  };

  const renderLog = ({ item }) => {
    const { name, color } = iconForEvent(item.event);
    return (
      <View style={styles.logRow}>
        <Icon name={name} size={20} color={color} style={{ marginRight: 8 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={styles.logText}>
            {messageFor(item)}
          </Text>
          <Text style={styles.logTime}>{relTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.TopBarContainer}>
          <View style={styles.searchWrapperRow}>
            <View style={[styles.searchContainer, { flex: 1, marginVertical: 0 }]}>
              <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search.placeholders.boxes', { defaultValue: 'Pesquisar compartimento' })}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#aaa"
              />
            </View>

            <TouchableOpacity onPress={openLogs} style={[styles.iconButton, { marginLeft: 8 }]}>
              <Icon name="history" size={26} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.floatingButton}>
              <Icon name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={boxList}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t('boxes.empty', { defaultValue: 'Nenhum compartimento encontrado para este ambiente.' })}
            </Text>
          }
        />

        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>
                {t('boxes.add_title', { defaultValue: 'Adicionar Novo Compartimento' })}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('boxes.name_ph', { defaultValue: 'Nome do compartimento' })}
                value={newBoxName}
                onChangeText={setNewBoxName}
                placeholderTextColor="#888"
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleAddBox}>
                <Text style={styles.modalButtonText}>
                  {t('boxes.add_cta', { defaultValue: 'Adicionar Compartimento' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel', { defaultValue: 'Cancelar' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={logsVisible}
          onRequestClose={() => setLogsVisible(false)}
        >
          <View style={styles.histBackdrop}>
            <View style={styles.histSheet}>
              <View style={styles.histHeader}>
                <Text style={styles.histTitle}>
                  {t('history.title', { defaultValue: 'Histórico de ações' })}
                </Text>
                <TouchableOpacity onPress={() => setLogsVisible(false)} style={styles.histClose}>
                  <Icon name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              {logsLoading ? (
                <Text style={styles.histHint}>
                  {t('history.loading', { defaultValue: 'Carregando…' })}
                </Text>
              ) : logs.length === 0 ? (
                <Text style={styles.histHint}>
                  {t('history.empty', { defaultValue: 'Nenhuma atividade ainda.' })}
                </Text>
              ) : (
                <FlatList
                  data={logs}
                  keyExtractor={(it) => String(it.id)}
                  renderItem={renderLog}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  style={{ maxHeight: 420 }}
                  showsVerticalScrollIndicator
                />
              )}
            </View>
          </View>
        </Modal>
      </View>

      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  TopBarContainer: { width: '100%', marginBottom: 10 },

  searchWrapperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, paddingHorizontal: 10, borderColor: '#ccc', borderRadius: 5,
    backgroundColor: '#f9f9f9', height: 40, marginVertical: 10, flex: 1
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },

  iconButton: {
    backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e5e5e5'
  },
  floatingButton: {
    backgroundColor: '#5db55b', width: 40, height: 40, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, zIndex: 1000, marginLeft: 10,
  },

  boxContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderRadius: 5, padding: 20,
  },
  boxItem: { padding: 10, flex: 1, marginRight: 10 },
  boxTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { marginRight: 8 },
  boxText: { fontSize: 18 },

  emptyText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 20 },

  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%', padding: 35, backgroundColor: 'white', borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 4, elevation: 5,
  },
  modalTitle: { fontSize: 25, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: {
    height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 10, marginBottom: 20,
  },
  modalButton: {
    width: '100%', backgroundColor: '#5db55b', paddingVertical: 15,
    borderRadius: 10, alignItems: 'center', marginBottom: 10,
  },
  modalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelButton: {
    width: '100%', backgroundColor: '#fff', paddingVertical: 15, borderRadius: 10,
    borderWidth: 1, borderColor: '#ccc', alignItems: 'center',
  },
  cancelButtonText: { color: '#333', fontSize: 16 },

  histBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  histSheet: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8
  },
  histHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  histTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111' },
  histClose: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6'
  },
  histHint: { textAlign: 'center', color: '#666', paddingVertical: 14 },

  logRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 6, backgroundColor: '#fff'
  },
  logText: { color: '#222', fontSize: 14 },
  logTime: { color: '#888', fontSize: 12, marginTop: 2 },
});
