import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Button, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';

export default function HomeScreen({ route, navigation }) {
  const { environmentId } = route.params || {};
  const { boxes, addBox, removeBox, fetchBoxes } = useContext(BoxContext);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');

  useEffect(() => {
    if (environmentId) {
      fetchBoxes(environmentId);
    } else {
      setBoxes({});
    }
  }, [environmentId]);

  const filterBoxesBySearch = () => {
    if (!search.trim()) {
      return Object.keys(boxes);
    }

    return Object.keys(boxes).filter(boxName =>
      boxes[boxName] && Array.isArray(boxes[boxName].items) && // Verifica se items é um array
      boxes[boxName].items.some(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  };

  const handleRemoveBox = (boxId) => {
    Alert.alert(
      "Confirmação",
      "Tem certeza que deseja excluir este compartimento? Todos seus objetos serão perdidos",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeBox(boxId, environmentId);
            } catch (error) {
              console.error("Erro ao tentar remover a caixa:", error);
            }
          }
        }
      ]
    );
  };

  const boxList = filterBoxesBySearch().map(boxId => ({
    id: boxId,
    name: boxes[boxId].name,
    items: boxes[boxId].items,
  }));

  const renderItem = ({ item }) => (
    <View style={styles.boxContainer}>
      <TouchableOpacity
        style={styles.boxItem}
        onPress={() => navigation.navigate('BoxDetails', { boxId: item.id })}
      >
        <Text style={styles.boxText}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleRemoveBox(item.id)}>
        <Icon name="delete" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );


  const handleAddBox = async () => {
    if (newBoxName.trim()) {
      await addBox(newBoxName, environmentId);

      fetchBoxes(environmentId);
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
      </View>

      <FlatList
        data={boxList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum compartimento encontrado para este ambiente.</Text>}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Adicionar Compartimento</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Adicionar Novo Compartimento</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do compartimento"
              value={newBoxName}
              onChangeText={setNewBoxName}
              placeholderTextColor="gray"
            />
            <Button title="Adicionar Compartimento" onPress={handleAddBox} />
            <View style={styles.cancelBtnCreateBox}><Button title="Cancelar" color="red" onPress={() => setModalVisible(false)} /></View>
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
  cancelBtnCreateBox: {
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    marginLeft: 10,
    padding: 15,
    backgroundColor: '#5db55b',
    alignItems: 'center',
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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
    width: '85%',
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
    fontSize: 25,
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
    marginBottom: 20,
  },
});