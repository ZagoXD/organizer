import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';
import { Icon } from 'react-native-elements';
import { useContext } from 'react';
import { BoxContext } from '../context/BoxContext';
import { useFocusEffect } from '@react-navigation/native';


export default function EnvironmentScreen({ navigation }) {
  const [environments, setEnvironments] = useState([]);
  const { boxes, fetchAllBoxes } = useContext(BoxContext);
  const [search, setSearch] = useState('');
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
    if (!search.trim()) {
      return environments;
    }

    return environments.filter(env => {
      const boxesInEnv = Object.values(boxes).filter(box =>
        box && box.environment_id === env.id
      );

      return boxesInEnv.some(box =>
        Array.isArray(box.items) &&
        box.items.some(item =>
          item.name.toLowerCase().includes(search.toLowerCase())
        )
      );
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
      Alert.alert('Erro', 'Por favor, insira um username válido.');
      return;
    }

    // Concatena @myapp.com automaticamente
    const fullEmail = `${shareEmail.trim()}@myapp.com`;

    try {
      const { error } = await supabase
        .from('environment_shares')
        .insert([
          {
            environment_id: shareEnvironmentId,
            shared_with_user_email: fullEmail,
            status: 'accepted' // teste
          }
        ]);

      if (error) {
        console.error('Erro ao compartilhar ambiente:', error.message);
        Alert.alert('Erro', 'Não foi possível compartilhar o ambiente.');
      } else {
        Alert.alert('Sucesso', `Ambiente compartilhado com ${shareEmail.trim()} com sucesso!`);
        setShareModalVisible(false);
        setShareEmail('');
      }
    } catch (error) {
      console.error('Erro inesperado ao compartilhar ambiente:', error.message);
    }
  };

  // Color
  const getColorForEnvironment = (environmentId) => {
    const colors = ['#FFB6B6', '#B6E3FF', '#b6ffed', '#FFD6A5', '#FFC4B6', '#D1B6FF'];
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
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar objeto"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
      </View>
      <FlatList
        data={filterEnvironmentsBySearch()}
        renderItem={renderEnvironment}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>Nenhum ambiente encontrado.</Text>}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.floatingButton}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Adicionar Novo Ambiente</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do ambiente"
              value={newEnvironmentName}
              onChangeText={setNewEnvironmentName}
              placeholderTextColor="gray"
            />
            <Button title={loading ? "Criando..." : "Criar"} onPress={addEnvironment} disabled={loading} />
            <View style={styles.cancelBtnCreateEnv}><Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" /></View>
          </View>
        </View>
      </Modal>

      <Modal visible={shareModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Compartilhar Ambiente</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o Username"
              value={shareEmail}
              onChangeText={setShareEmail}
              placeholderTextColor="gray"
            />
            <Button title="Compartilhar" onPress={handleShareEnvironment} />
            <View style={styles.cancelBtnCreateEnv}>
              <Button title="Cancelar" onPress={() => setShareModalVisible(false)} color="red" />
            </View>
          </View>
        </View>
      </Modal>
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#5db55b',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  environmentName: {
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    marginRight: 8,
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
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  iconHome: {
    marginRight: 8,
  },
  environmentItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 10,
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
});
