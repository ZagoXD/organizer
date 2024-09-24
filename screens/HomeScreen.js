import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Button } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';

export default function HomeScreen({ navigation }) {
  const { boxes, addBox, removeBox, fetchBoxes } = useContext(BoxContext); 
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');

  // Função para filtrar caixas com base na pesquisa de objetos
  const filterBoxesBySearch = () => {
    if (!search.trim()) {
      return Object.keys(boxes);
    }
  
    // Filtra caixas que contêm itens cujo nome corresponde ao termo de pesquisa
    return Object.keys(boxes).filter(boxName =>
      boxes[boxName].some(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  };
  

  useEffect(() => {
    fetchBoxes();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.boxContainer}>
      <TouchableOpacity 
        style={styles.boxItem} 
        onPress={() => navigation.navigate('BoxDetails', { boxName: item })}
      >
        <Text style={styles.boxText}>{item}</Text>
      </TouchableOpacity>
      <View style={styles.boxActions}>
        <TouchableOpacity onPress={() => removeBox(item)}> 
          <Icon name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleAddBox = () => {
    if (newBoxName.trim()) {
      addBox(newBoxName);
      setNewBoxName('');
      setModalVisible(false); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Pesquisar objeto" 
          value={search} 
          onChangeText={setSearch} 
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Icon name="add" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filterBoxesBySearch()}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.boxList}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma caixa encontrada.</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Adicionar Nova Caixa</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da caixa"
              value={newBoxName}
              onChangeText={setNewBoxName}
              placeholderTextColor="#555"
            />
            <Button title="Adicionar Caixa" onPress={handleAddBox} />
            <Button title="Cancelar" color="red" onPress={() => setModalVisible(false)} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    marginLeft: 10,
  },
  boxList: {
    marginTop: 20,
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  boxItem: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  boxText: {
    fontSize: 18,
  },
  boxActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    padding: 35,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
});
