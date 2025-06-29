import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Button, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { BoxContext } from '../context/BoxContext';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';
import GreetingHeader from '../components/GreetingHeader';

export default function HomeScreen({ route, navigation }) {
  const { environmentId } = route.params || {};
  const { boxes, addBox, removeBox, fetchBoxes } = useContext(BoxContext);
  const [searchType, setSearchType] = useState('Objeto');
  const [search, setSearch] = useState('');
  const [boxSearch, setBoxSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');

  useEffect(() => {
    if (environmentId) {
      fetchBoxes(environmentId);
    } else {
      setBoxes({});
    }
  }, [environmentId]);

  useEffect(() => {
    if (environmentId) {
      fetchBoxes(environmentId);

      const subscription = supabase
        .channel('boxes_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'caixas'
        }, payload => {
          console.log('Nova mudança de caixa:', payload);
          fetchBoxes(environmentId);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setBoxes({});
    }
  }, [environmentId]);

  // Pesquisa objetos dentro das caixas
  const filterBoxesByItemSearch = () => {
    if (!search.trim()) {
      return Object.keys(boxes);
    }

    return Object.keys(boxes).filter(boxId =>
      boxes[boxId] &&
      Array.isArray(boxes[boxId].items) &&
      boxes[boxId].items.some(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  };

  // Pesquisa caixa
  const filterBoxesByNameSearch = () => {
    if (!boxSearch.trim()) {
      return Object.keys(boxes);
    }

    return Object.keys(boxes).filter(boxId =>
      boxes[boxId] &&
      boxes[boxId].name.toLowerCase().includes(boxSearch.toLowerCase())
    );
  };

  const combinedFilteredBoxes = () => {
    if (!search.trim()) {
      return Object.keys(boxes);
    }

    if (searchType === 'Objeto') {
      return Object.keys(boxes).filter(boxId =>
        boxes[boxId] &&
        Array.isArray(boxes[boxId].items) &&
        boxes[boxId].items.some(item =>
          item.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else if (searchType === 'Compartimento') {
      return Object.keys(boxes).filter(boxId =>
        boxes[boxId] &&
        boxes[boxId].name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return Object.keys(boxes);
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

  const boxList = combinedFilteredBoxes().map(boxId => ({
    id: boxId,
    name: boxes[boxId].name,
    items: boxes[boxId].items,
  }));

  // Cores dinamicas
  const getColorFromId = (id) => {
    const colors = ['#E1D6FF', '#FFDFB6'];
    const index = id.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderItem = ({ item }) => {
    const backgroundColor = getColorFromId(item.id);

    return (
      <View style={[styles.boxContainer, { backgroundColor }]}>
        <TouchableOpacity
          style={styles.boxItem}
          onPress={() => navigation.navigate('BoxDetails', { boxId: item.id })}
        >
          <View style={styles.boxTitleRow}>
            <Icon name="inventory" size={20} color="#000" style={styles.iconBox} />
            <Text style={styles.boxText}>{item.name}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveBox(item.id)}>
          <Icon name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleAddBox = async () => {
    if (newBoxName.trim()) {
      await addBox(newBoxName, environmentId);

      fetchBoxes(environmentId);
      setNewBoxName('');
      setModalVisible(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <GreetingHeader />
        <View style={styles.TopBarContainer}>
          <View style={styles.searchWrapperRow}>
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
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#aaa"
            />
          </View>
        </View>
        <FlatList
          data={boxList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum compartimento encontrado para este ambiente.</Text>}
        />
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
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddBox}
              >
                <Text style={styles.modalButtonText}>Adicionar Compartimento</Text>
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
  cancelBtnCreateBox: {
    marginTop: 10,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  iconBox: {
    marginRight: 8,
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
    borderRadius: 5,
    padding: 20,
  },
  boxItem: {
    padding: 10,
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
  searchWrapper: {
    flex: 1,
    marginRight: 10,
  },
  searchTypeToggle: {
    flexDirection: 'row',
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
  searchWrapperRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 5,
},
});