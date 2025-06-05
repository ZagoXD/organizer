import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserContext } from '../context/UserContext';

export default function GreetingHeader() {
  const { firstName } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Olá, {firstName}!</Text>
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
