// components/GreetingHeader.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserContext } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

export default function GreetingHeader() {
  const { firstName } = useContext(UserContext);
  const { t } = useTranslation();

  const name = (firstName || '').trim();
  const message = name
    ? t('greetingHeader.hello_name', { name })
    : t('greetingHeader.hello');

  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
        accessibilityLabel={message}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 0 },
  text: { color: '#111', fontSize: 20, fontWeight: 'bold' },
});
