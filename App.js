import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import BoxDetailsScreen from './screens/BoxDetailsScreen';
import { BoxProvider } from './context/BoxContext'; // Importando o BoxProvider

const Stack = createStackNavigator();

export default function App() {
  return (
    <BoxProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Organização de Caixas' }} />
          <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} options={{ title: 'Detalhes da Caixa' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </BoxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
