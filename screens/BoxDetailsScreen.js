import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext'; 

export default function BoxDetailsScreen({ route }) {
  const { boxName } = route.params;
  const { boxes, addItemToBox, updateItemInBox } = useContext(BoxContext);
  const [items, setItems] = useState(boxes[boxName]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Adiciona ou edita um item
  const saveItem = () => {
    if (newItemName && newItemQuantity) {
      if (editingItem !== null) {
        const updatedItems = items.map(item => 
          item === editingItem ? { name: newItemName, quantity: newItemQuantity } : item
        );
        setItems(updatedItems);
        updateItemInBox(boxName, updatedItems); 
      } else {
        const newItem = { name: newItemName, quantity: newItemQuantity };
        setItems([...items, newItem]);
        addItemToBox(boxName, newItem); 
      }
      setNewItemName('');
      setNewItemQuantity('');
      setEditingItem(null);
      setModalVisible(false);
    }
  };

  const removeItem = (itemToRemove) => {
    const updatedItems = items.filter(item => item !== itemToRemove);
    setItems(updatedItems);
    updateItemInBox(boxName, updatedItems); 
  };

  const editItem = (item) => {
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
    setEditingItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name} - Quantidade: {item.quantity}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => editItem(item)}>
          <Icon name="edit" size={24} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeItem(item)}>
          <Icon name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{boxName}</Text>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.itemList}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item adicionado ainda.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Adicionar Item</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{editingItem ? 'Editar Item' : 'Adicionar Novo Item'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do item"
              value={newItemName}
              onChangeText={setNewItemName}
              placeholderTextColor="#555"
            />
            <TextInput
              style={styles.input}
              placeholder="Quantidade"
              value={newItemQuantity}
              keyboardType="numeric"
              onChangeText={setNewItemQuantity}
              placeholderTextColor="#555"
            />
            <Button title={editingItem ? "Salvar Alterações" : "Adicionar"} onPress={saveItem} />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  itemList: {
    marginTop: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
  },
  addButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#5db55b',
    alignItems: 'center',
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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
