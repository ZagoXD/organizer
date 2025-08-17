import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useContext } from 'react';
import { View, Modal, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import SearchItemScreen from './screens/SearchItemScreen';
import BoxDetailsScreen from './screens/BoxDetailsScreen';
import EnvironmentScreen from './screens/EnvironmentScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import GreetingHeader from './components/GreetingHeader';

import { BoxProvider } from './context/BoxContext';
import { UserProvider } from './context/UserContext';
import { InviteProvider, InviteContext } from './context/InviteContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './navigation';
import './i18n';
import { useTranslation } from 'react-i18next';
import LangToggle from './components/langToggle';

const Stack = createStackNavigator();

function withI18nTitle(ScreenComponent, titleKey, defaultTitle) {
  return function Wrapped(props) {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    React.useEffect(() => {
      navigation.setOptions({ title: t(titleKey, { defaultValue: defaultTitle }) });
    }, [i18n.language, navigation]);
    return <ScreenComponent {...props} />;
  };
}

function InviteModal() {
  const { t } = useTranslation();
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
      transparent
      animationType="slide"
      visible={showInviteModal}
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {t('share.title', { defaultValue: 'Compartilhar Ambiente' })}
          </Text>
          <Text style={styles.modalText}>
            {t('invites.modal_text', {
              env: selectedInvite.environment_name || t('common.no_name', { defaultValue: 'Sem nome' }),
              defaultValue: 'Você foi convidado para o ambiente: {{env}}.'
            })}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#5db55b' }]}
              onPress={() => acceptInvite(selectedInvite.id)}
            >
              <Text style={styles.buttonText}>
                {t('common.ok', { defaultValue: 'OK' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff4d4d' }]}
              onPress={() => declineInvite(selectedInvite.id)}
            >
              <Text style={styles.buttonText}>
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const curvedHeader = (
    <>
      <View style={{ flex: 1, backgroundColor: '#e8e8e8' }} />
      <View
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 80,
          borderTopRightRadius: 80,
        }}
      />
    </>
  );

  return (
    <SafeAreaProvider>
      <InviteProvider>
        <UserProvider>
          <BoxProvider>
            <NavigationContainer ref={navigationRef}>
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerRight: () => <LangToggle />,

                  //ios
                  headerRightContainerStyle: { paddingRight: 12 },
                  headerBackTitleVisible: false,
                  headerBackTitle: '',
                  headerTruncatedBackTitle: '',
                }}
              >
                <Stack.Screen name="Login" component={LoginScreen} options={{ title: '' }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />

                <Stack.Screen
                  name="Environments"
                  component={EnvironmentScreen}
                  options={{
                    headerTitle: () => <GreetingHeader />,
                    headerTitleAlign: 'left',
                    headerTitleContainerStyle: { left: 16, right: 16 },
                    headerLeft: () => null,
                    headerBackground: () => curvedHeader,
                  }}
                />

                <Stack.Screen
                  name="Home"
                  component={withI18nTitle(HomeScreen, 'screens.home.title', 'Compartimentos')}
                  options={{ headerBackground: () => curvedHeader }}
                />

                <Stack.Screen
                  name="BoxDetails"
                  component={withI18nTitle(BoxDetailsScreen, 'screens.boxDetails.title', 'Detalhes do Compartimento')}
                  options={{ headerBackground: () => curvedHeader }}
                />

                <Stack.Screen
                  name="UserProfile"
                  component={withI18nTitle(UserProfileScreen, 'screens.userProfile.title', 'Perfil do Usuário')}
                  options={{ headerBackground: () => curvedHeader }}
                />

                <Stack.Screen
                  name="search"
                  component={withI18nTitle(SearchItemScreen, 'search.title', 'Buscar')}
                  options={{ headerBackground: () => curvedHeader }}
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
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff', padding: 20, borderRadius: 10,
    width: '80%', alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 16 }
});
