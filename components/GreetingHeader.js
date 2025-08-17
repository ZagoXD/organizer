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
      <Text style={styles.text} accessibilityLabel={message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  text: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
