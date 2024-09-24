import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; 
import { BoxProvider } from './context/BoxContext';
import BoxDetailsScreen from './screens/BoxDetailsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <BoxProvider> 
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registrar' }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
          <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} options={{ title: 'Detalhes da Caixa' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </BoxProvider>
  );
}
