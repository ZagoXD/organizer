import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function EnvironmentScreen({ navigation }) {
  const [environments, setEnvironments] = useState([]);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Carrega os ambientes do usuário logado
  const fetchEnvironments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from('ambientes')
        .select('*')
        .eq('user_id', session.user.id);
      if (error) console.error('Erro ao buscar ambientes:', error.message);
      else setEnvironments(data);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const handleCreateEnvironment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (newEnvironmentName.trim() && session) {
      const { error } = await supabase
        .from('ambientes')
        .insert([{ name: newEnvironmentName, user_id: session.user.id }]);
      if (error) {
        Alert.alert('Erro', 'Erro ao criar ambiente');
      } else {
        fetchEnvironments(); // Atualiza a lista de ambientes
        setNewEnvironmentName('');
        setModalVisible(false);
      }
    }
  };

  const handleSelectEnvironment = (environment) => {
    navigation.navigate('Home', { environmentId: environment.id }); // Passa o environmentId corretamente
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={environments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.environmentItem} onPress={() => handleSelectEnvironment(item)}>
            <Text style={styles.environmentText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum ambiente criado.</Text>}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Adicionar Ambiente</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Criar Novo Ambiente</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do ambiente"
              value={newEnvironmentName}
              onChangeText={setNewEnvironmentName}
              placeholderTextColor="gray"
            />
            <Button title="Criar" onPress={handleCreateEnvironment} />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" />
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
  environmentItem: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  environmentText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#5db55b',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  modalView: {
    width: '85%',
    padding: 35,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
});
