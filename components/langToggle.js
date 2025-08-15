import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LangToggle() {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('lang');
      if (saved && saved !== i18n.language) {
        await i18n.changeLanguage(saved);
        setLang(saved);
      }
    })();
  }, []);

  const toggle = async () => {
    const next = lang === 'pt_br' ? 'en' : 'pt_br';
    await i18n.changeLanguage(next);
    setLang(next);
    await AsyncStorage.setItem('lang', next);
  };

  return (
    <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ fontWeight: '700' }}>{lang === 'pt_br' ? 'PT-BR' : 'EN'}</Text>
    </TouchableOpacity>
  );
}
