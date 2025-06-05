import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import { BoxProvider } from './context/BoxContext';
import { UserProvider } from './context/UserContext';
import BoxDetailsScreen from './screens/BoxDetailsScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EnvironmentScreen from './screens/EnvironmentScreen';
import UserProfileScreen from './screens/UserProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <BoxProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" >
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Environments" component={EnvironmentScreen} options={{
                title: 'Ambientes', headerLeft: () => null, headerBackground: () => (
                  <>
                    <View style={{ flex: 1, backgroundColor: '#e8e8e8' }} />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderTopLeftRadius: 80,
                        borderTopRightRadius: 80,
                      }}
                    />
                  </>
                ),
              }} />
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'Compartimentos',
                  headerBackground: () => (
                    <>
                      <View style={{ flex: 1, backgroundColor: '#e8e8e8' }} />
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          borderTopLeftRadius: 80,
                          borderTopRightRadius: 80,
                        }}
                      />
                    </>
                  ),
                }}
              />
              <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} options={{
                title: 'Detalhes do Compartimento', headerBackground: () => (
                  <>
                    <View style={{ flex: 1, backgroundColor: '#e8e8e8' }} />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderBottomLeftRadius: 60,
                        borderBottomRightRadius: 60,
                      }}
                    />
                  </>
                ),
              }} />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{
                  title: 'Perfil do Usuário',
                  headerBackground: () => (
                    <>
                      <View style={{ flex: 1, backgroundColor: '#e8e8e8' }} />
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          borderTopLeftRadius: 80,
                          borderTopRightRadius: 80,
                        }}
                      />
                    </>
                  ),
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </BoxProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
