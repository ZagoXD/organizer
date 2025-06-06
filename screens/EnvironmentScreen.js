import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';
import { Icon } from 'react-native-elements';
import { useContext } from 'react';
import { BoxContext } from '../context/BoxContext';
import { useFocusEffect } from '@react-navigation/native';
import BottomBar from '../components/BottomBar';
import GreetingHeader from '../components/GreetingHeader';


export default function EnvironmentScreen({ navigation }) {
  const [environments, setEnvironments] = useState([]);
  const { boxes, fetchAllBoxes } = useContext(BoxContext);
  const [searchType, setSearchType] = useState('Objeto');
  const [search, setSearch] = useState('');
  const [searchBox, setSearchBox] = useState('');
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { removeEnvironment } = useContext(BoxContext);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareEnvironmentId, setShareEnvironmentId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchEnvironments();
    fetchAllBoxes();
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('environments_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'environments'
      }, payload => {
        console.log('Nova mudança de ambiente:', payload);
        fetchEnvironments();
        fetchAllBoxes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('environments_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'environment_shares'
      }, payload => {
        console.log('Nova mudança de ambiente compartilhado:', payload);
        fetchEnvironments();
        fetchAllBoxes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);


  // Caso retornar para a tela Ambiente
  useFocusEffect(
    React.useCallback(() => {
      fetchAllBoxes();
    }, [])
  );

  // Função para carregar os ambientes
  const fetchEnvironments = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      setUserId(user.id);

      // Ambientes próprios
      const { data: ownEnvironments, error: ownError } = await supabase
        .from('environments')
        .select('id, name, user_id')
        .eq('user_id', user.id);

      if (ownError) {
        console.error('Erro ao buscar ambientes próprios:', ownError.message);
      }

      // IDs de ambientes compartilhados
      const { data: sharedEnvIdsData, error: sharedEnvIdsError } = await supabase
        .from('environment_shares')
        .select('environment_id')
        .eq('shared_with_user_email', user.email)
        .eq('status', 'accepted');

      if (sharedEnvIdsError) {
        console.error('Erro ao buscar IDs de ambientes compartilhados:', sharedEnvIdsError.message);
      }

      const sharedEnvIds = (sharedEnvIdsData || []).map(record => record.environment_id);

      const { data: sharedEnvironments, error: sharedError } = await supabase
        .from('environments')
        .select('id, name, user_id')
        .in('id', sharedEnvIds);

      if (sharedError) {
        console.error('Erro ao buscar ambientes compartilhados:', sharedError.message);
      }

      const allEnvironments = [...(ownEnvironments || [])];

      (sharedEnvironments || []).forEach(sharedEnv => {
        if (!allEnvironments.find(env => env.id === sharedEnv.id)) {
          allEnvironments.push(sharedEnv);
        }
      });

      setEnvironments(allEnvironments);
    } catch (error) {
      console.error('Erro inesperado ao carregar ambientes:', error);
    }
  };

  // Função para adicionar um novo ambiente
  const addEnvironment = async () => {
    if (!newEnvironmentName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o ambiente.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Erro ao obter o usuário:', userError.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('environments')
        .insert([{ name: newEnvironmentName, user_id: user.id }])
        .select(); //garante ambiente novo de ser carregado

      if (error) {
        console.error('Erro ao criar ambiente:', error.message);
        setLoading(false);
        return;
      }

      // Verifica se os dados foram retornados corretamente
      if (data && data.length > 0) {
        const newEnvironment = data[0];
        setEnvironments([...environments, newEnvironment]);
      } else {
        console.error('Nenhum ambiente foi retornado após a inserção.');
      }

      // Limpa o campo de texto e fecha o modal
      setNewEnvironmentName('');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro inesperado ao adicionar ambiente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ambiente
  const filterEnvironmentsBySearch = () => {
    if (!search.trim() && !searchBox.trim()) {
      return environments;
    }

    return environments.filter(env => {
      const boxesInEnv = Object.values(boxes).filter(box =>
        box && box.environment_id === env.id
      );

      if (searchType === 'Objeto' && search.trim()) {
        return boxesInEnv.some(box =>
          Array.isArray(box.items) &&
          box.items.some(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
          )
        );
      }

      if (searchType === 'Compartimento' && searchBox.trim()) {
        return boxesInEnv.some(box =>
          box.name.toLowerCase().includes(searchBox.toLowerCase())
        );
      }

      return true;
    });
  };

  const selectEnvironment = (environment) => {
    navigation.navigate('Home', { environmentId: environment.id });
  };

  //Deleta Ambiente
  const handleDeleteEnvironment = (environmentId) => {
    Alert.alert(
      "Confirmação",
      "Tem certeza que deseja excluir este ambiente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            (async () => {
              try {
                const success = await removeEnvironment(environmentId);
                if (success) {
                  setEnvironments(prev => prev.filter(env => env.id !== environmentId));
                }
              } catch (error) {
                console.error("Erro ao tentar remover o ambiente:", error);
              }
            })();
          }
        }
      ]
    );
  };

  //Compartilhar Ambiente
  const handleShareEnvironment = async () => {
    if (!shareEmail.trim()) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    const fullEmail = shareEmail.trim();

    try {
      const { error } = await supabase
        .from('environment_shares')
        .insert([
          {
            environment_id: shareEnvironmentId,
            shared_with_user_email: fullEmail,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Erro ao compartilhar ambiente:', error.message);
        Alert.alert('Erro', 'Não foi possível compartilhar o ambiente.');
      } else {
        Alert.alert('Sucesso', `Convite enviado para ${fullEmail}!`);
        setShareModalVisible(false);
        setShareEmail('');
      }
    } catch (error) {
      console.error('Erro inesperado ao compartilhar ambiente:', error.message);
      Alert.alert('Erro', 'Erro inesperado ao compartilhar ambiente.');
    }
  };

  // Color
  const getColorForEnvironment = (environmentId) => {
    const colors = ['#FFC4B6', '#D1B6FF'];
    const index = environmentId % colors.length;
    return colors[index];
  };

  const renderEnvironment = ({ item }) => {
    const isOwner = item.user_id === userId;
    const isShared = !isOwner;
    const backgroundColor = getColorForEnvironment(item.id);

    return (
      <View style={[styles.environmentItemContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={styles.environmentItem}
          onPress={() => selectEnvironment(item)}
        >
          <View style={styles.environmentTitleRow}>
            <Icon name="home" size={20} color="#000" style={styles.iconHome} />
            <Text style={styles.environmentName}>
              {item.name} {isShared && <Text style={{ fontSize: 14, color: '#555' }}>(compartilhado)</Text>}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.itemActions}>
          {isOwner && (
            <TouchableOpacity onPress={() => {
              setShareEnvironmentId(item.id);
              setShareModalVisible(true);
            }}>
              <Icon name="share" size={24} color="blue" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDeleteEnvironment(item.id)}>
            <Icon name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <GreetingHeader />
        <View style={styles.TopBarContainer}>
          <View style={styles.topBarRow}>
            <View style={styles.searchTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  searchType === 'Objeto' && styles.toggleButtonActive
                ]}
                onPress={() => setSearchType('Objeto')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    searchType === 'Objeto' && styles.toggleButtonTextActive
                  ]}
                >
                  Objeto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  searchType === 'Compartimento' && styles.toggleButtonActive
                ]}
                onPress={() => setSearchType('Compartimento')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    searchType === 'Compartimento' && styles.toggleButtonTextActive
                  ]}
                >
                  Compartimento
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.floatingButton}
            >
              <Icon name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Pesquisar ${searchType.toLowerCase()}`}
              value={searchType === 'Objeto' ? search : searchBox}
              onChangeText={text => {
                if (searchType === 'Objeto') setSearch(text);
                else setSearchBox(text);
              }}
              placeholderTextColor="#aaa"
            />
          </View>
        </View>
        <FlatList
          data={filterEnvironmentsBySearch()}
          renderItem={renderEnvironment}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text>Nenhum ambiente encontrado.</Text>}
        />

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Adicionar Novo Ambiente</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do ambiente"
                value={newEnvironmentName}
                onChangeText={setNewEnvironmentName}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={addEnvironment}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? "Criando..." : "Criar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={shareModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Compartilhar Ambiente</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o E-mail"
                value={shareEmail}
                onChangeText={setShareEmail}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleShareEnvironment}
              >
                <Text style={styles.modalButtonText}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShareModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cancelBtnCreateEnv: {
    marginTop: 10,
  },
  environmentItem: {
    padding: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  environmentName: {
    fontSize: 18,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    height: 40,
    marginVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  floatingButton: {
    backgroundColor: '#5db55b',
    width: 40,
    height: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 1000,
    marginLeft: 10,
  },
  TopBarContainer: {
    width: '100%',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#5db55b',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalView: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#5db55b',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  iconHome: {
    marginRight: 8,
  },
  environmentItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  environmentItem: {
    flex: 1,
    padding: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  environmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  searchWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  searchTypeToggle: {
    flexDirection: 'row',
    marginRight: 10,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#5db55b',
    borderColor: '#5db55b',
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  TopBarContainer: {
    width: '100%',
    marginBottom: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});
