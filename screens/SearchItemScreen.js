import React, { useEffect, useMemo, useState, useContext } from 'react';
import { View, StyleSheet, FlatList, TextInput, Text, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { Icon } from 'react-native-elements';
import { supabase } from '../supabase';
import { BoxContext } from '../context/BoxContext';
import BottomBar from '../components/BottomBar';
import { useTranslation } from 'react-i18next';

export default function SearchItemScreen({ navigation }) {
  const { boxes, fetchAllBoxes } = useContext(BoxContext);
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [envMap, setEnvMap] = useState({});
  const [mode, setMode] = useState('items'); // 'items' | 'boxes'

  useEffect(() => {
    fetchAllBoxes();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: own = [] } = await supabase
        .from('environments').select('id, name').eq('user_id', user.id);
      const { data: sharedIds = [] } = await supabase
        .from('environment_shares').select('environment_id')
        .eq('shared_with_user_email', user.email).eq('status', 'accepted');
      const ids = sharedIds.map(r => r.environment_id);
      let shared = [];
      if (ids.length) {
        const { data: se = [] } = await supabase
          .from('environments').select('id, name').in('id', ids);
        shared = se;
      }
      const map = {};
      [...own, ...shared].forEach(e => { map[e.id] = e.name; });
      setEnvMap(map);
    })();
  }, []);

  const normalize = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

  // resultados para os dois modos
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q || !boxes) return [];
    const out = [];

    if (mode === 'items') {
      for (const boxId of Object.keys(boxes)) {
        const box = boxes[boxId];
        if (!box) continue;
        const items = Array.isArray(box.items) ? box.items : [];
        for (const it of items) {
          const name = (it?.name ?? '').toString();
          if (name && normalize(name).includes(q)) {
            out.push({
              key: `i:${boxId}:${name}:${out.length}`,
              envId: box.environment_id,
              envName: envMap[box.environment_id] ?? t('search.env'),
              boxId,
              boxName: box.name ?? t('search.box'),
              itemName: name,
              kind: 'item',
            });
          }
        }
      }
      out.sort((a,b) =>
        (a.envName||'').localeCompare(b.envName||'') ||
        (a.boxName||'').localeCompare(b.boxName||'') ||
        (a.itemName||'').localeCompare(b.itemName||'')
      );
    } else {
      for (const boxId of Object.keys(boxes)) {
        const box = boxes[boxId];
        if (!box) continue;
        const name = (box.name ?? '').toString();
        if (name && normalize(name).includes(q)) {
          out.push({
            key: `b:${boxId}:${out.length}`,
            envId: box.environment_id,
            envName: envMap[box.environment_id] ?? t('search.env'),
            boxId,
            boxName: name,
            itemName: null,
            kind: 'box',
          });
        }
      }
      out.sort((a,b) =>
        (a.envName||'').localeCompare(b.envName||'') ||
        (a.boxName||'').localeCompare(b.boxName||'')
      );
    }

    return out;
  }, [query, boxes, envMap, mode, t]);

  const renderResult = ({ item }) => {
    const leftIcon = item.kind === 'item' ? 'layers' : 'inventory';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BoxDetails', { boxId: item.boxId })}
      >
        <Icon name={leftIcon} size={20} color="#5db55b" style={{ marginRight: 10 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {item.kind === 'item' ? (
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.breadcrumb}>
              <Text style={styles.crumb}>{item.envName} › {item.boxName} › </Text>
              <Text style={styles.itemBold}>{item.itemName}</Text>
            </Text>
          ) : (
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.breadcrumb}>
              <Text style={styles.itemBold}>{item.envName}</Text>
              <Text style={styles.crumb}> › {item.boxName}</Text>
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={22} color="#bbb" />
      </TouchableOpacity>
    );
  };

  const placeholder = mode === 'items'
    ? t('search.placeholders.items')
    : t('search.placeholders.boxes');

  const helper = mode === 'items'
    ? `${t('search.env')} › ${t('search.box')} › ${t('search.item')}`
    : `${t('search.env')} › ${t('search.box')}`;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        {/* Header com toggle + input */}
        <View style={styles.header}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'items' && styles.toggleBtnActive]}
              onPress={() => setMode('items')}
            >
              <Text style={[styles.toggleText, mode === 'items' && styles.toggleTextActive]}>
                {t('search.modes.items')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'boxes' && styles.toggleBtnActive]}
              onPress={() => setMode('boxes')}
            >
              <Text style={[styles.toggleText, mode === 'boxes' && styles.toggleTextActive]}>
                {t('search.modes.boxes')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>

        {query.trim().length === 0 ? (
          <View style={styles.helperWrap}>
            <Text style={styles.helperText}>
              {t('search.helper_prefix')} <Text style={{ fontWeight: '700' }}>{helper}</Text>
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.helperWrap}>
            <Text style={styles.helperText}>{t('search.none')}</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={results}
            renderItem={renderResult}
            keyExtractor={(it) => it.key}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          />
        )}
      </KeyboardAvoidingView>

      <BottomBar />
    </View>
  );
}

const BAR_HEIGHT = 96;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },

  header: { paddingTop: 8, paddingHorizontal: 16 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#5db55b',
  },
  toggleText: { color: '#333', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f4f5f6',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  input: { flex: 1, color: '#111' },

  helperWrap: { paddingHorizontal: 16, marginTop: 10, flexGrow: 1 },
  helperText: { color: '#666' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: BAR_HEIGHT },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  breadcrumb: { color: '#222' },
  crumb: { color: '#333' },
  itemBold: { fontWeight: '700', color: '#111' },
});
