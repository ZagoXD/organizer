import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TextInput, Button, TouchableOpacity, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';
import GreetingHeader from '../components/GreetingHeader';

export default function BoxDetailsScreen({ route }) {
  const { boxId } = route.params;
  const { addItemToBox, updateItemInBox, removeItemFromBox } = useContext(BoxContext);
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');

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

    const { data: itemData, error: itemError } = await supabase
      .from('itens')
      .select('id, name, quantity')
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

  useEffect(() => {
    if (boxId) {
      fetchItems();

      const subscription = supabase
        .channel('items_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'itens'
        }, payload => {
          console.log('Nova mudança de item:', payload);
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [boxId]);

  const filterItemsBySearch = () => {
    if (!search.trim()) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  };


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

          setItems(items.map(item =>
            item.name === editingItem.name
              ? { ...item, name: updatedItem.name, quantity: updatedItem.quantity }
              : item
          ));

          setEditingItem(null);
        } else {
          const createdItem = await addItemToBox(boxId, newItem);

          if (!createdItem) {
            Alert.alert("Erro", "Um item com este nome já existe neste container");
            return;
          }

          setItems([...items, createdItem]);
        }

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

  // Colors
  const getColorFromId = (id) => {
    const colors = ['#E6C4A5', '#D6D6FF', '#FAD6FF'];
    const index = id.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderItem = ({ item }) => {
    const backgroundColor = getColorFromId(item.id);

    return (
      <View style={[styles.itemContainer, { backgroundColor }]}>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Icon name="layers" size={20} color="#000" style={styles.iconItem} />
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
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
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <GreetingHeader />
        <View style={styles.TopBarContainer}>
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
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => {
              setEditingItem(null);
              setNewItemName('');
              setNewItemQuantity('');
              setModalVisible(true);
            }}
          >
            <Icon name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={filterItemsBySearch()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.itemList}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item encontrado.</Text>}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do item"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                placeholder="Quantidade"
                value={newItemQuantity}
                keyboardType="numeric"
                onChangeText={setNewItemQuantity}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveItem}
              >
                <Text style={styles.modalButtonText}>
                  {editingItem ? "Salvar Alterações" : "Adicionar"}
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
  TopBarContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    flex: 1,
    height: 40,
    marginVertical: 10,
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
  floatingButton: {
    backgroundColor: '#5db55b',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 1000,
    marginLeft: 10,
  },
  cancelBtnAddItem: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  iconItem: {
    marginRight: 8,
  },
  itemList: {
    marginTop: 20,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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

});
