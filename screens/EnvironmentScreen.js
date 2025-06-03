import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function EnvironmentScreen({ navigation }) {
  const [environments, setEnvironments] = useState([]);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  // Função para carregar os ambientes
  const fetchEnvironments = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      const { data: environmentData, error: environmentError } = await supabase
        .from('environments')
        .select('id, name')
        .eq('user_id', user.id);

      if (environmentError) {
        console.error('Erro ao carregar ambientes:', environmentError.message);
        return;
      }

      setEnvironments(environmentData || []); 
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

  const selectEnvironment = (environment) => {
    navigation.navigate('Home', { environmentId: environment.id }); 
  };

  const renderEnvironment = ({ item }) => (
    <TouchableOpacity 
      style={styles.environmentItem} 
      onPress={() => selectEnvironment(item)}
    >
      <Text style={styles.environmentName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={environments}
        renderItem={renderEnvironment}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>Nenhum ambiente encontrado.</Text>}
      />

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}> 
        <Text  style={styles.addButtonText}>Criar Ambiente</Text> 
      </TouchableOpacity> 

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}> 
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
    backgroundColor: '#eaeaea',
    borderRadius: 5,
    marginBottom: 10,
  },
  environmentName: {
    fontSize: 18,
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
});
