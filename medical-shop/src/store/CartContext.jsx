/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useReducer } from 'react';

const defaultCartState = {
  items: [],
  totalAmount: 0,
};

const CART_STORAGE_KEY = 'bms_cart_v2';

const normalizeCartItem = (item) => {
  if (!item?.id || !item?.name) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    imageUrl: item.imageUrl || '',
    category: item.category || '',
    dosage: item.dosage || '',
    packQuantity: item.packQuantity || '',
    packUnit: item.packUnit || '',
    manufacturer: item.manufacturer || '',
  };
};

const calculateTotalAmount = (items) => items.reduce(
  (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
  0
);

const initializeCartState = () => {
  if (typeof window === 'undefined') {
    return defaultCartState;
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return defaultCartState;
    }

    const parsedCart = JSON.parse(rawCart);
    const items = Array.isArray(parsedCart?.items)
      ? parsedCart.items.map(normalizeCartItem).filter(Boolean)
      : [];

    return {
      items,
      totalAmount: calculateTotalAmount(items),
    };
  } catch {
    return defaultCartState;
  }
};

const cartReducer = (state, action) => {
  if (action.type === 'ADD_ITEM') {
    const item = normalizeCartItem(action.item);
    if (!item) {
      return state;
    }

    const updatedTotalAmount = state.totalAmount + item.price * item.quantity;
    const existingCartItemIndex = state.items.findIndex((cartItem) => cartItem.id === item.id);
    const existingCartItem = state.items[existingCartItemIndex];

    let updatedItems;

    if (existingCartItem) {
      const updatedItem = {
        ...existingCartItem,
        quantity: existingCartItem.quantity + item.quantity,
      };
      updatedItems = [...state.items];
      updatedItems[existingCartItemIndex] = updatedItem;
    } else {
      updatedItems = state.items.concat(item);
    }

    return {
      items: updatedItems,
      totalAmount: updatedTotalAmount,
    };
  }

  if (action.type === 'REMOVE_ITEM') {
    const existingCartItemIndex = state.items.findIndex((item) => item.id === action.id);
    const existingItem = state.items[existingCartItemIndex];

    if (!existingItem) {
      return state;
    }

    const updatedTotalAmount = state.totalAmount - existingItem.price;

    let updatedItems;
    if (existingItem.quantity === 1) {
      updatedItems = state.items.filter((item) => item.id !== action.id);
    } else {
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

  return state;
};

export const CartContext = createContext(defaultCartState);

export const CartProvider = ({ children }) => {
  const [cartState, dispatchCartAction] = useReducer(cartReducer, defaultCartState, initializeCartState);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: cartState.items,
        })
      );
    } catch {
      // Keep cart usable even if storage is full or blocked.
    }
  }, [cartState.items]);

  const addItemHandler = (item) => {
    dispatchCartAction({ type: 'ADD_ITEM', item });
  };

  const removeItemHandler = (id) => {
    dispatchCartAction({ type: 'REMOVE_ITEM', id });
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
