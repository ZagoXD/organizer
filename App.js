import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { View, Modal, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useContext } from 'react';
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
import { navigationRef } from './navigation';
import { InviteProvider, InviteContext } from './context/InviteContext';

const Stack = createStackNavigator();

function InviteModal() {
  const {
    showInviteModal,
    selectedInvite,
    acceptInvite,
    declineInvite,
    setShowInviteModal
  } = useContext(InviteContext);

  if (!showInviteModal || !selectedInvite) return null;

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={showInviteModal}
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Convite de Compartilhamento</Text>
          <Text style={styles.modalText}>
            Você foi convidado para o ambiente:{" "}
            {selectedInvite.environment_name || 'Sem nome'}.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#5db55b' }]}
              onPress={() => acceptInvite(selectedInvite.id)}
            >
              <Text style={styles.buttonText}>Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff4d4d' }]}
              onPress={() => declineInvite(selectedInvite.id)}
            >
              <Text style={styles.buttonText}>Recusar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <InviteProvider>
        <UserProvider>
          <BoxProvider>
            <NavigationContainer ref={navigationRef}>
              <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen
                  name="Environments"
                  component={EnvironmentScreen}
                  options={{
                    title: 'Ambientes',
                    headerLeft: () => null,
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
                <Stack.Screen
                  name="BoxDetails"
                  component={BoxDetailsScreen}
                  options={{
                    title: 'Detalhes do Compartimento',
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
              <InviteModal />
            </NavigationContainer>
          </BoxProvider>
        </UserProvider>
      </InviteProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 16
  }
});
