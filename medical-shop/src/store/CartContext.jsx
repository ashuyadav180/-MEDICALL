import React, { createContext, useReducer } from 'react';

// --- Default State ---
const defaultCartState = {
  items: [],
  totalAmount: 0,
};

// --- REDUCER FUNCTION ---
const cartReducer = (state, action) => {
  if (action.type === 'ADD_ITEM') {
    const item = action.item;
    // CRITICAL: Ensure total calculation is correct
    const updatedTotalAmount = state.totalAmount + item.price * item.quantity; 
    
    // 1. Find the index of the existing item
    const existingCartItemIndex = state.items.findIndex((i) => i.id === item.id);
    const existingCartItem = state.items[existingCartItemIndex];

    let updatedItems;

    if (existingCartItem) {
      // Scenario A: Item exists (update quantity)
      const updatedItem = {
        ...existingCartItem,
        quantity: existingCartItem.quantity + item.quantity,
      };
      updatedItems = [...state.items];
      updatedItems[existingCartItemIndex] = updatedItem;
    } else {
      // Scenario B: New item (add to array)
      updatedItems = state.items.concat(item);
    }

    return {
      items: updatedItems,
      totalAmount: updatedTotalAmount,
    };
  }

  if (action.type === 'REMOVE_ITEM') {
    const existingCartItemIndex = state.items.findIndex((i) => i.id === action.id);
    const existingItem = state.items[existingCartItemIndex];
    const updatedTotalAmount = state.totalAmount - existingItem.price;

    let updatedItems;
    if (existingItem.quantity === 1) {
      // Remove item completely
      updatedItems = state.items.filter(item => item.id !== action.id);
    } else {
      // Decrease quantity by 1
      const updatedItem = { ...existingItem, quantity: existingItem.quantity - 1 };
      updatedItems = [...state.items];
      updatedItems[existingCartItemIndex] = updatedItem;
    }

    return {
      items: updatedItems,
      totalAmount: updatedTotalAmount,
    };
  }
  
  if (action.type === 'CLEAR_CART') {
    return defaultCartState;
  }

  return defaultCartState;
};

// --- CONTEXT CREATION and EXPORTS ---
export const CartContext = createContext(defaultCartState);

export const CartProvider = ({ children }) => {
  const [cartState, dispatchCartAction] = useReducer(cartReducer, defaultCartState);

  const addItemHandler = (item) => {
    dispatchCartAction({ type: 'ADD_ITEM', item: item });
  };

  const removeItemHandler = (id) => {
    dispatchCartAction({ type: 'REMOVE_ITEM', id: id });
  };
  
  const clearCartHandler = () => {
    dispatchCartAction({ type: 'CLEAR_CART' });
  };

  const cartContext = {
    items: cartState.items,
    totalAmount: cartState.totalAmount,
    addItem: addItemHandler,
    removeItem: removeItemHandler,
    clearCart: clearCartHandler,
  };

  return (
    <CartContext.Provider value={cartContext}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => React.useContext(CartContext);
