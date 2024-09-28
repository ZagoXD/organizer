import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';  // Certifique-se de que o arquivo Supabase esteja configurado

export const BoxContext = createContext();

export const BoxProvider = ({ children }) => {
  const [boxes, setBoxes] = useState({});

  // Função para carregar as caixas do Supabase ao iniciar
  const fetchBoxes = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }
  
      const { data: boxData, error: boxError } = await supabase
        .from('caixas')
        .select('id, name')
        .eq('user_id', user.id);
  
      if (boxError) {
        console.error('Erro ao carregar caixas:', boxError.message);
      } else {
        const loadedBoxes = {};
        for (let box of boxData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('itens')
            .select('name, quantity')
            .eq('box_id', box.id);
  
          if (itemsError) {
            console.error(`Erro ao carregar itens da caixa ${box.name}:`, itemsError.message);
          } else {
            loadedBoxes[box.name] = itemsData || [];
          }
        }
        setBoxes(loadedBoxes);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar caixas:', error.message);
    }
  };
  

  // Função para adicionar uma nova caixa
  const addBox = async (boxName) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }
  
    const { data, error } = await supabase
      .from('caixas')
      .insert([{ 
        name: boxName,
        user_id: user.id // Associar a caixa ao user_id
      }]);
  
    if (error) {
      console.error('Erro ao adicionar a caixa:', error.message);
    } else {
      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxName]: [] // Adiciona a nova caixa ao estado
      }));
    }
  };
  

  const removeBox = async (boxName) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }
  
    // Buscar o ID da caixa pelo nome e user_id
    const { data: boxData, error: boxError } = await supabase
      .from('caixas')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', user.id) // Certificar-se de buscar a caixa correta
      .maybeSingle();  // Substitua por maybeSingle
  
    if (boxError) {
      console.error('Erro ao buscar o ID da caixa:', boxError.message);
      return;
    }
  
    if (!boxData) {
      console.error('Caixa não encontrada ou múltiplas caixas retornadas');
      return;
    }
  
    const boxId = boxData.id;
  
    // Remover a caixa
    const { error: deleteError } = await supabase
      .from('caixas')
      .delete()
      .eq('id', boxId)
      .eq('user_id', user.id);
  
    if (deleteError) {
      console.error('Erro ao remover a caixa no Supabase:', deleteError.message);
    } else {
      setBoxes(prevBoxes => {
        const updatedBoxes = { ...prevBoxes };
        delete updatedBoxes[boxName];
        return updatedBoxes;
      });
    }
  };
  
  

  // Função para adicionar um item a uma caixa
  const addItemToBox = async (boxName, newItem) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }
  
    // Busca o ID da caixa com base no nome e user_id
    const { data: boxData, error: boxError } = await supabase
      .from('caixas')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', user.id) // Certifica que estamos buscando a caixa do usuário correto
      .single();
  
    if (boxError) {
      console.error('Erro ao buscar ID da caixa:', boxError.message);
      return;
    }
  
    const boxId = boxData.id;
  
    // Inserir o item na caixa
    const { error: insertError } = await supabase
      .from('itens')
      .insert([{ 
        box_id: boxId,
        name: newItem.name,
        quantity: newItem.quantity
      }]);
  
    if (insertError) {
      console.error('Erro ao adicionar item:', insertError.message);
    } else {
      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxName]: [...prevBoxes[boxName], newItem]
      }));
    }
  };
  

  // Função para atualizar um item na caixa
  const updateItemInBox = async (boxName, updatedItem) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError) {
      console.error('Erro ao obter o usuário:', userError.message);
      return;
    }
  
    // Busca o ID da caixa com base no nome e user_id
    const { data: boxData, error: boxError } = await supabase
      .from('caixas')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', user.id) // Certifica que estamos atualizando o item da caixa correta
      .single();
  
    if (boxError || !boxData) {
      console.error('Erro ao buscar o ID da caixa:', boxError?.message || 'Caixa não encontrada');
      return;
    }
  
    const boxId = boxData.id;
  
    // Atualiza o item na caixa
    const { error: updateError } = await supabase
      .from('itens')
      .update({
        name: updatedItem.name,
        quantity: updatedItem.quantity
      })
      .eq('box_id', boxId)
      .eq('name', updatedItem.originalName);  
  
    if (updateError) {
      console.error('Erro ao atualizar o item no Supabase:', updateError.message);
    } else {
      setBoxes(prevBoxes => ({
        ...prevBoxes,
        [boxName]: prevBoxes[boxName].map(item =>
          item.name === updatedItem.originalName
            ? { name: updatedItem.name, quantity: updatedItem.quantity }
            : item
        )
      }));
    }
  };

  // Função para remover um item de uma caixa
  const removeItemFromBox = async (boxName, itemName) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
  
      if (userError) {
        console.error('Erro ao obter o usuário:', userError.message);
        return;
      }

      const { data: boxData, error: boxError } = await supabase
        .from('caixas')
        .select('id')
        .eq('name', boxName)
        .eq('user_id', user.id)
        .single();
  
      if (boxError || !boxData) {
        console.error('Erro ao buscar o ID da caixa:', boxError?.message || 'Caixa não encontrada');
        return;
      }
  
      const boxId = boxData.id;
  
      // Remove o item
      const { error: deleteError } = await supabase
        .from('itens')
        .delete()
        .eq('box_id', boxId)
        .eq('name', itemName); 
  
      if (deleteError) {
        console.error('Erro ao remover o item no Supabase:', deleteError.message);
      } else {
        setBoxes(prevBoxes => ({
          ...prevBoxes,
          [boxName]: prevBoxes[boxName].filter(item => item.name !== itemName)
        }));
      }
    } catch (error) {
      console.error('Erro inesperado ao remover item:', error.message);
    }
  };

  return (
    <BoxContext.Provider value={{ boxes, addBox, removeBox, addItemToBox, updateItemInBox, removeItemFromBox, fetchBoxes }}>
      {children}
    </BoxContext.Provider>
  );
};
