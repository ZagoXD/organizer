import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Alert } from 'react-native';

export const BoxContext = createContext();

export const BoxProvider = ({ children }) => {
  const [boxes, setBoxes] = useState({});

  // Função para carregar as caixas associadas ao environmentId
  const fetchBoxes = async (environmentId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      // Buscar caixas associadas ao usuário e ao ambiente
      const { data: boxData, error: boxError } = await supabase
        .from('caixas')
        .select('id, name, environment_id')
        .eq('environment_id', environmentId)

      if (boxError) {
        console.error('Erro ao carregar caixas:', boxError.message);
      } else if (boxData.length > 0) {
        const loadedBoxes = {};

        // Para cada caixa, buscar seus itens
        for (const box of boxData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('itens')
            .select('*')
            .eq('box_id', box.id);

          if (itemsError) {
            console.error('Erro ao carregar itens da caixa:', itemsError.message);
            loadedBoxes[box.id] = { name: box.name, items: [] }; // Caixa sem itens
          } else {
            loadedBoxes[box.id] = { name: box.name, environment_id: box.environment_id, items: itemsData }; // Caixa com itens
          }
        }

        setBoxes(loadedBoxes);
      } else {
        console.log('Nenhuma caixa foi encontrada para este ambiente');
        setBoxes({});
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar caixas:', error.message);
    }
  };

  // Carrega TODAS as caixas
  const fetchAllBoxes = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      const { data: boxData, error: boxError } = await supabase
        .from('caixas')
        .select('id, name, environment_id');

      if (boxError) {
        console.error('Erro ao carregar caixas:', boxError.message);
      } else if (boxData.length > 0) {
        const loadedBoxes = {};

        for (const box of boxData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('itens')
            .select('*')
            .eq('box_id', box.id);

          if (itemsError) {
            console.error('Erro ao carregar itens da caixa:', itemsError.message);
            loadedBoxes[box.id] = {
              name: box.name,
              environment_id: box.environment_id,
              items: []
            };
          } else {
            loadedBoxes[box.id] = {
              name: box.name,
              environment_id: box.environment_id,
              items: itemsData
            };
          }
        }

        setBoxes(loadedBoxes);
      } else {
        console.log('Nenhuma caixa foi encontrada');
        setBoxes({});
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar caixas:', error.message);
    }
  };

  // Remover ambiente
  const removeEnvironment = async (environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
      return false;
    }

    // Verifica se o usuário é o dono do ambiente
    const { data: envData, error: envError } = await supabase
      .from('environments')
      .select('user_id')
      .eq('id', environmentId)
      .single();

    if (envError) {
      console.error('Erro ao verificar dono do ambiente:', envError.message);
      return false;
    }

    if (envData.user_id === user.id) {
      const { data: boxes, error: boxesError } = await supabase
        .from('caixas')
        .select('id')
        .eq('environment_id', environmentId)
        .eq('user_id', user.id);

      if (boxesError) {
        console.error('Erro ao verificar caixas no ambiente:', boxesError.message);
        return false;
      }

      if (boxes.length > 0) {
        Alert.alert(
          "Erro",
          "Não é possível excluir o ambiente. Exclua todos os compartimentos antes de remover o ambiente.",
          [{ text: "OK" }]
        );
        return false;
      }

      const { error: deleteError } = await supabase
        .from('environments')
        .delete()
        .eq('id', environmentId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Erro ao excluir o ambiente:', deleteError.message);
        return false;
      }

      return true;
    } else {
      const { error: shareDeleteError } = await supabase
        .from('environment_shares')
        .delete()
        .eq('environment_id', environmentId)
        .eq('shared_with_user_email', user.email);

      if (shareDeleteError) {
        console.error('Erro ao remover compartilhamento:', shareDeleteError.message);
        return false;
      }

      return true;
    }
  };

  const addBox = async (boxName, environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }

    const { data: existingBox, error: existingError } = await supabase
      .from('caixas')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', user.id)
      .eq('environment_id', environmentId)
      .maybeSingle();

    if (existingError) {
      console.error('Erro ao verificar se a caixa já existe:', existingError.message);
      return;
    }

    if (existingBox) {
      console.error('Caixa já existe neste ambiente para este usuário');
      return;
    }

    // Inserir a nova caixa
    const { data, error } = await supabase
      .from('caixas')
      .insert([{
        name: boxName,
        user_id: user.id,
        environment_id: environmentId
      }])
      .select();

    if (error) {
      console.error('Erro ao adicionar a caixa:', error.message);
    } else {
      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxName]: []
      }));
    }
  };


  const removeBox = async (boxId, environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }

    if (!boxes[boxId]) {
      console.error('Erro: container não encontrado no estado');
      return;
    }

    const { error: deleteItemsError } = await supabase
      .from('itens')
      .delete()
      .eq('box_id', boxId);

    if (deleteItemsError) {
      console.error('Erro ao remover os itens associados:', deleteItemsError.message);
      return;
    }

    const { error: deleteBoxError } = await supabase
      .from('caixas')
      .delete()
      .eq('id', boxId);

    if (deleteBoxError) {
      console.error('Erro ao remover a caixa no Supabase:', deleteBoxError.message);
    } else {
      setBoxes(prevBoxes => {
        const updatedBoxes = { ...prevBoxes };
        delete updatedBoxes[boxId];
        return updatedBoxes;
      });
    }
  };

  // Função para adicionar um item a uma caixa
  const addItemToBox = async (boxId, newItem) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return false;
    }

    if (!boxId) {
      console.error('Erro: boxId está indefinido');
      return false
    }

    const { data: existingItem, error: existingError } = await supabase
      .from('itens')
      .select('id')
      .eq('box_id', boxId)
      .eq('name', newItem.name)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 indica que nenhum item foi encontrado
      console.error('Erro ao verificar item duplicado:', existingError.message);
      return false;
    }

    if (existingItem) {
      return false;
    }

    const { error: insertError } = await supabase
      .from('itens')
      .insert([{
        box_id: boxId,
        name: newItem.name,
        quantity: newItem.quantity
      }]);

    if (insertError) {
      console.error('Erro ao adicionar item:', insertError.message);
      return false;
    } else {

      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxId]: {
          ...prevBoxes[boxId],
          items: [...prevBoxes[boxId].items, newItem]
        }
      }));
      return true;
    }
  };

  const updateItemInBox = async (boxId, updatedItem) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Erro ao obter o usuário:', userError.message);
        return false;
      }

      if (!boxId) {
        console.error('Erro: boxId está indefinido');
        return false;
      }

      // Atualiza o item no banco de dados
      const { error: updateError } = await supabase
        .from('itens')
        .update({
          name: updatedItem.name,
          quantity: updatedItem.quantity
        })
        .eq('box_id', boxId)
        .eq('name', updatedItem.originalName);

      if (updateError) {
        console.error('Erro ao atualizar o item:', updateError.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar o item:', error.message);
      return false;
    }
  };

  // Função para remover um item de uma caixa
  const removeItemFromBox = async (boxId, itemName) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }
    if (!boxId) {
      console.error('Erro: boxId está indefinido');
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from('itens')
      .select('id')
      .eq('box_id', boxId)
      .eq('name', itemName)
      .single();

    if (itemError || !itemData) {
      console.error('Erro ao buscar o item:', itemError?.message || 'Item não encontrado');
      return;
    }

    const itemId = itemData.id;

    const { error: deleteError } = await supabase
      .from('itens')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Erro ao remover o item:', deleteError.message);
    } else {
      // Atualize o estado local para remover o item do array de itens da caixa
      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxId]: {
          ...prevBoxes[boxId],
          items: prevBoxes[boxId].items.filter(item => item.name !== itemName)
        }
      }));
    }
  };


  return (
    <BoxContext.Provider value={{ boxes, addBox, removeBox, addItemToBox, updateItemInBox, removeItemFromBox, fetchBoxes, fetchAllBoxes, removeEnvironment }}>
      {children}
    </BoxContext.Provider>
  );
};
