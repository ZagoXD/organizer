import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Button } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';
import { supabase } from '../supabase';

export default function BoxDetailsScreen({ route }) {
  const { boxName } = route.params;
  const { boxes, addItemToBox, updateItemInBox, removeItemFromBox } = useContext(BoxContext); // Adiciona a função removeItemFromBox
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
      return;
    }
  
    const { data: boxData, error: boxError } = await supabase
      .from('caixas')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', user.id) // Certifica-se de buscar a caixa do usuário
      .maybeSingle();  // Substitua por maybeSingle para evitar o erro de múltiplos resultados
  
    if (boxError) {
      console.error('Erro ao buscar o ID da caixa:', boxError.message);
      return;
    }
  
    if (!boxData) {
      console.error('Caixa não encontrada ou múltiplas caixas retornadas');
      return;
    }
  
    const boxId = boxData.id;
  
    // Buscar os itens da caixa
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
  }, []);

  const saveItem = async () => {
    if (newItemName && newItemQuantity) {
      if (editingItem !== null) {
        const updatedItem = {
          originalName: editingItem.name,
          name: newItemName,
          quantity: newItemQuantity,
        };
  
        await updateItemInBox(boxName, updatedItem);

        setItems(items.map(item => 
          item.name === editingItem.name 
            ? { name: newItemName, quantity: newItemQuantity }
            : item
        ));
      } else {

        const newItem = { name: newItemName, quantity: newItemQuantity };
  
        await addItemToBox(boxName, newItem)

        setItems([...items, newItem]);
      }

      setNewItemName('');
      setNewItemQuantity('');
      setEditingItem(null);
      setModalVisible(false);
    }
  };

  const removeItem = (item) => {
    removeItemFromBox(boxName, item.name);
    setItems(items.filter(i => i.name !== item.name)); 
  };

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
