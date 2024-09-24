import React, { createContext, useState } from 'react';

export const BoxContext = createContext();

export const BoxProvider = ({ children }) => {
  const [boxes, setBoxes] = useState({});

  // Função para adicionar uma nova caixa
  const addBox = (boxName) => {
    setBoxes(prevBoxes => ({
      ...prevBoxes,
      [boxName]: []
    }));
  };

  // Função para excluir uma caixa
  const removeBox = (boxName) => {
    const updatedBoxes = { ...boxes };
    delete updatedBoxes[boxName];
    setBoxes(updatedBoxes);
  };

  // Função para editar o nome da caixa
  const editBoxName = (oldName, newName) => {
    const updatedBoxes = { ...boxes };
    updatedBoxes[newName] = updatedBoxes[oldName];
    delete updatedBoxes[oldName];
    setBoxes(updatedBoxes);
  };

  const addItemToBox = (boxName, newItem) => {
    setBoxes(prevBoxes => ({
      ...prevBoxes,
      [boxName]: [...prevBoxes[boxName], newItem]
    }));
  };

  const updateItemInBox = (boxName, updatedItems) => {
    setBoxes(prevBoxes => ({
      ...prevBoxes,
      [boxName]: updatedItems,
    }));
  };

  return (
    <BoxContext.Provider value={{ boxes, addBox, removeBox, editBoxName, addItemToBox, updateItemInBox }}>
      {children}
    </BoxContext.Provider>
  );
};
