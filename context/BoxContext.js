import React, { createContext, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabase';

export const BoxContext = createContext();

export const BoxProvider = ({ children }) => {
  const [boxes, setBoxes] = useState({});

  // Helper: registra atividade no Supabase
  let _actorCache = null;
  const getActorCached = async () => {
    if (_actorCache) return _actorCache;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, email: null, name: null };
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const name = profile?.full_name
      || user.user_metadata?.full_name
      || (user.email ? user.email.split('@')[0] : null);
    _actorCache = { id: user.id, email: user.email || null, name };
    return _actorCache;
  };

  const logActivity = async (event, environmentId, meta = {}) => {
    try {
      const actor = await getActorCached();
      await supabase.from('activity_logs').insert([{
        environment_id: environmentId,
        box_id: meta.box_id ?? null,
        item_id: meta.item_id ?? null,
        actor_id: actor.id,
        actor_email: actor.email,
        actor_name: actor.name,
        event,
        meta: { actor_name: actor.name, ...meta }
      }]);
    } catch (e) {
      console.log('[logActivity]', e?.message);
    }
  };

  const resolveBoxInfo = async (boxId) => {
    const local = boxes[boxId];
    if (local?.environment_id) {
      return { envId: local.environment_id, boxName: local.name || '' };
    }
    const { data, error } = await supabase
      .from('caixas')
      .select('environment_id, name')
      .eq('id', boxId)
      .maybeSingle();
    if (error) {
      return { envId: null, boxName: '' };
    }
    return { envId: data?.environment_id ?? null, boxName: data?.name ?? '' };
  };

  //Carregar caixas de um ambiente 
  const fetchBoxes = async (environmentId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
        return;
      }

      const { data: boxData, error: boxError } = await supabase
        .from('caixas')
        .select('id, name, environment_id')
        .eq('environment_id', environmentId);

      if (boxError) {
        console.error('Erro ao carregar caixas:', boxError.message);
        return;
      }

      if (boxData && boxData.length > 0) {
        const loadedBoxes = {};

        for (const box of boxData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('itens')
            .select('*')
            .eq('box_id', box.id);

          if (itemsError) {
            console.error('Erro ao carregar itens da caixa:', itemsError.message);
            loadedBoxes[box.id] = { name: box.name, environment_id: box.environment_id, items: [] };
          } else {
            loadedBoxes[box.id] = { name: box.name, environment_id: box.environment_id, items: itemsData };
          }
        }

        setBoxes(loadedBoxes);
      } else {
        setBoxes({});
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar caixas:', error.message);
    }
  };

  //Carregar TODAS as caixas
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
        return;
      }

      if (boxData && boxData.length > 0) {
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
        setBoxes({});
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar caixas:', error.message);
    }
  };

  //Remover ambiente (com guarda) 
  const removeEnvironment = async (environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
      return false;
    }
    
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
      const { data: boxesInEnv, error: boxesError } = await supabase
        .from('caixas')
        .select('id')
        .eq('environment_id', environmentId)
        .eq('user_id', user.id);

      if (boxesError) {
        console.error('Erro ao verificar caixas no ambiente:', boxesError.message);
        return false;
      }

      if (boxesInEnv && boxesInEnv.length > 0) {
        Alert.alert(
          'Erro',
          'Não é possível excluir o ambiente. Exclua todos os compartimentos antes de remover o ambiente.',
          [{ text: 'OK' }]
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
      // Se não é dono, remove o compartilhamento
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

  //criar caixa
  const addBox = async (boxName, environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message || 'Usuário não autenticado');
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

    const { data, error } = await supabase
      .from('caixas')
      .insert([{ name: boxName, user_id: user.id, environment_id: environmentId }])
      .select('*');

    if (error) {
      console.error('Erro ao adicionar a caixa:', error.message);
      return;
    }

    const box = data?.[0];
    if (box) {
      setBoxes(prev => ({
        ...prev,
        [box.id]: { name: boxName, environment_id: environmentId, items: [] }
      }));
      await logActivity('box.create', environmentId, { box_id: box.id, box_name: boxName });
    }
  };

  // rremover caixa + itens
  const removeBox = async (boxId, environmentId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { console.error('Erro ao obter o usuário:', userError?.message); return; }
    if (!boxes[boxId]) { console.error('Erro: container não encontrado no estado'); return; }

    const boxName = boxes[boxId]?.name || '';

    await logActivity('box.delete', environmentId, { box_id: boxId, box_name: boxName });

    const { error: deleteItemsError } = await supabase
      .from('itens')
      .delete()
      .eq('box_id', boxId);
    if (deleteItemsError) { console.error('Erro ao remover os itens associados:', deleteItemsError.message); return; }

    const { error: deleteBoxError } = await supabase
      .from('caixas')
      .delete()
      .eq('id', boxId);
    if (deleteBoxError) { console.error('Erro ao remover a caixa no Supabase:', deleteBoxError.message); return; }

    setBoxes(prev => {
      const next = { ...prev };
      delete next[boxId];
      return next;
    });
  };

  //  Adicionar item na caixa
  const addItemToBox = async (boxId, newItem) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao obter o usuário:', userError?.message);
      return false;
    }
    if (!boxId) {
      console.error('Erro: boxId está indefinido');
      return false;
    }

    const { data: existingItem, error: existingError } = await supabase
      .from('itens')
      .select('id')
      .eq('box_id', boxId)
      .eq('name', newItem.name)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Erro ao verificar item duplicado:', existingError.message);
      return false;
    }
    if (existingItem) {
      return false;
    }

    const { data: insertedItems, error: insertError } = await supabase
      .from('itens')
      .insert([{ box_id: boxId, name: newItem.name, quantity: newItem.quantity }])
      .select('*');

    if (insertError) {
      console.error('Erro ao adicionar item:', insertError.message);
      return false;
    }

    const insertedItem = insertedItems?.[0];
    if (!insertedItem) return false;

    setBoxes(prev => ({
      ...prev,
      [boxId]: {
        ...prev[boxId],
        items: [...(prev[boxId]?.items || []), insertedItem]
      }
    }));

    // log
    let { envId, boxName } = await resolveBoxInfo(boxId);
    await logActivity('item.create', envId, {
      box_id: boxId,
      box_name: boxName,
      item_id: insertedItem.id,
      item_name: insertedItem.name,
      quantity: insertedItem.quantity
    });

    return insertedItem;
  };

  //Atualizar item
  const updateItemInBox = async (boxId, updatedItem) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro ao obter o usuário:', userError?.message);
        return false;
      }
      if (!boxId) {
        console.error('Erro: boxId está indefinido');
        return false;
      }

      const { data: before, error: beforeErr } = await supabase
        .from('itens')
        .select('id, name, quantity')
        .eq('box_id', boxId)
        .eq('name', updatedItem.originalName)
        .maybeSingle();

      if (beforeErr) {
        console.error('Erro ao buscar estado anterior do item:', beforeErr.message);
      }

      const { error: updateError } = await supabase
        .from('itens')
        .update({ name: updatedItem.name, quantity: updatedItem.quantity })
        .eq('box_id', boxId)
        .eq('name', updatedItem.originalName);

      if (updateError) {
        console.error('Erro ao atualizar o item:', updateError.message);
        return false;
      }

      setBoxes(prev => {
        const b = prev[boxId];
        if (!b) return prev;

        const nextItems = (b.items || []).map(it =>
          it.name === updatedItem.originalName
            ? { ...it, name: updatedItem.name, quantity: updatedItem.quantity }
            : it
        );

        return { ...prev, [boxId]: { ...b, items: nextItems } };
      });

      // Log estruturado
      let { envId, boxName } = await resolveBoxInfo(boxId);
      await logActivity('item.update', envId, {
        box_id: boxId,
        box_name: boxName,
        item_id: before?.id ?? null,
        item_name: updatedItem.name,

        old_qty: typeof before?.quantity === 'number' ? before.quantity : before?.quantity ?? null,
        new_qty: updatedItem.quantity,

        qty_prev: typeof before?.quantity === 'number' ? before.quantity : before?.quantity ?? null,
        qty: updatedItem.quantity,

        old_name: updatedItem.originalName,
        name_prev: updatedItem.originalName,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar o item:', error.message);
      return false;
    }
  };


  //Remover item
  const removeItemFromBox = async (boxId, itemName) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { console.error('Erro ao obter o usuário:', userError?.message); return; }
    if (!boxId) { console.error('Erro: boxId está indefinido'); return; }

    const { data: itemData, error: itemError } = await supabase
      .from('itens')
      .select('id, quantity')
      .eq('box_id', boxId)
      .eq('name', itemName)
      .maybeSingle();
    if (itemError || !itemData) { console.error('Erro ao buscar o item:', itemError?.message || 'Item não encontrado'); return; }

    const { envId, boxName } = await resolveBoxInfo(boxId);
    await logActivity('item.delete', envId, {
      box_id: boxId,
      box_name: boxName,
      item_id: itemData.id,
      item_name: itemName,
      quantity: itemData.quantity ?? null,
    });

    const { error: deleteError } = await supabase
      .from('itens')
      .delete()
      .eq('id', itemData.id);
    if (deleteError) { console.error('Erro ao remover o item:', deleteError.message); return; }

    setBoxes(prev => ({
      ...prev,
      [boxId]: {
        ...prev[boxId],
        items: (prev[boxId]?.items || []).filter(it => it.name !== itemName)
      }
    }));
  };

  return (
    <BoxContext.Provider
      value={{
        boxes,
        setBoxes,
        fetchBoxes,
        fetchAllBoxes,
        addBox,
        removeBox,
        addItemToBox,
        updateItemInBox,
        removeItemFromBox,
        removeEnvironment,
      }}
    >
      {children}
    </BoxContext.Provider>
  );
};
