import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TextInput, Button, TouchableOpacity, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';
import { supabase } from '../supabase';

export default function BoxDetailsScreen({ route }) {
  const { boxId } = route.params; 
  const { addItemToBox, updateItemInBox, removeItemFromBox } = useContext(BoxContext);
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Função para buscar os itens da caixa
  const fetchItems = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
      return;
    }

    if (!boxId) {
      console.error('boxId está indefinido');
      return;
    }

    // Buscar os itens da caixa usando o boxId
    const { data: itemData, error: itemError } = await supabase
      .from('itens')
      .select('*')
      .eq('box_id', boxId);

    if (itemError) {
      console.error('Erro ao carregar itens:', itemError.message);
    } else {
      setItems(itemData);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [boxId]);

  // Função para salvar item (adicionar ou editar)
  const saveItem = async () => {
    try {
      if (newItemName && newItemQuantity) {
        const newItem = { name: newItemName, quantity: newItemQuantity };
  
        if (editingItem) {
          const updatedItem = {
            originalName: editingItem.name,  
            name: newItemName,
            quantity: newItemQuantity
          };
          
          const success = await updateItemInBox(boxId, updatedItem);
          
          if (!success) {
            Alert.alert('Erro', 'Não foi possível atualizar o item.');
            return;
          }

          setItems(items.map(item => item.name === editingItem.name ? updatedItem : item));
          
          setEditingItem(null); 
        } else {
          const success = await addItemToBox(boxId, newItem);
    
          if (!success) {
            Alert.alert("Erro", "Um item com este nome já existe neste container");
            return;
          }
    
          setItems([...items, newItem]);
        }
  
        // Resetando os campos e fechando o modal
        setNewItemName('');
        setNewItemQuantity('');
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Erro ao salvar o item:', error.message);
    }
  };
  
  // Função para remover um item
  const removeItem = async (item) => {
    await removeItemFromBox(boxId, item.name);
    setItems(items.filter(i => i.name !== item.name));
  };

  // Função para editar um item
  const editItem = (item) => {
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
    setEditingItem(item);  
    setModalVisible(true);
  };
  
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>Quantidade: {item.quantity}</Text>
      </View>
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
      <Text style={styles.title}>Detalhes do compartimento</Text>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.itemList}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item adicionado ainda.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => {
        setEditingItem(null); 
        setModalVisible(true);
      }}>
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
              placeholderTextColor="gray"
            />
            <TextInput
              style={styles.input}
              placeholder="Quantidade"
              value={newItemQuantity}
              keyboardType="numeric"
              onChangeText={setNewItemQuantity}
              placeholderTextColor="gray"
            />
            <Button title={editingItem ? "Salvar Alterações" : "Adicionar"} onPress={saveItem} />
            <View style={styles.cancelBtnAddItem}><Button title="Cancelar" color="red" onPress={() => setModalVisible(false)} /></View>
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
  cancelBtnAddItem: {
    marginTop: 20,
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
  itemInfo: {
    flex: 1, 
    marginRight: 10, 
  },
  itemName: {
    fontSize: 18,
    maxWidth: '80%',
    flexWrap: 'wrap', 
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#888',
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
