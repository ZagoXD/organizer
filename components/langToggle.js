import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'pt_br', label: 'Português (Brasil)', short: 'PT-BR', flag: '🇧🇷' },
  { code: 'en',    label: 'English (US)',       short: 'EN',    flag: '🇺🇸' },
  { code: 'es', label: 'Español', short: 'ES', flag: '🇪🇸' }
];

export default function LangToggle({ style, compact = true }) {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState(i18n.language || 'pt_br');
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('lang');
      const next = saved || lang || 'pt_br';
      if (next !== i18n.language) await i18n.changeLanguage(next);
      setLang(next);
    })();
  }, []);

  const current = LANGS.find(l => l.code === (lang || '').toLowerCase()) || LANGS[0];

  const apply = async (code) => {
    if (code === lang) {
      setVisible(false);
      return;
    }
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('lang', code);
    setLang(code);
    setVisible(false);
  };

  const renderItem = ({ item }) => {
    const selected = item.code === lang;
    return (
      <TouchableOpacity
        style={[styles.row, selected && styles.rowActive]}
        onPress={() => apply(item.code)}
        activeOpacity={0.85}
      >
        <Text style={styles.rowFlag}>{item.flag}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[styles.rowLabel, selected && styles.rowLabelActive]}>
            {item.label}
          </Text>
          <Text style={styles.rowCode}>{item.short}</Text>
        </View>
        <View style={[styles.dot, selected ? styles.dotOn : styles.dotOff]} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[styles.trigger, compact && styles.triggerCompact, style]}
        activeOpacity={0.85}
      >
        <Text style={styles.triggerFlag}>{current.flag}</Text>
        {!compact && <Text style={styles.triggerText}>{current.short}</Text>}
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('lang.select')}</Text>
          <FlatList
            data={LANGS}
            keyExtractor={(it) => it.code}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  triggerCompact: {
    paddingHorizontal: 8, paddingVertical: 6,
  },
  triggerFlag: { fontSize: 16, marginRight: 6 },
  triggerText: { fontSize: 12, fontWeight: '700', color: '#222' },

  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute', left: 16, right: 16, top: 90,
    backgroundColor: '#fff', borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 16, fontWeight: '700', color: '#111', padding: 12, paddingBottom: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#eee',
    padding: 10, borderRadius: 10,
  },
  rowActive: {
    borderColor: '#5db55b33', backgroundColor: '#f7fff7',
  },
  rowFlag: { fontSize: 18, marginRight: 10 },
  rowLabel: { fontSize: 14, color: '#222', fontWeight: '600' },
  rowLabelActive: { color: '#1b5e20' },
  rowCode: { fontSize: 12, color: '#888' },
  dot: {
    width: 12, height: 12, borderRadius: 6, marginLeft: 10,
    borderWidth: 2,
  },
  dotOn: { backgroundColor: '#5db55b', borderColor: '#5db55b' },
  dotOff: { backgroundColor: '#fff', borderColor: '#d1d5db' },

  closeBtn: {
    alignSelf: 'flex-end',
    margin: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f3f4',
  },
  closeText: { fontWeight: '700', color: '#111' },
});
