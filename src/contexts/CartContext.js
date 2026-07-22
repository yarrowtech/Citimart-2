import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Helper to get consistent ID
  const getItemId = (item) => item._id || item.id;

  // Add item to cart (increase quantity if same product & size exists)
  const addToCart = (product) => {
    const id = getItemId(product);
    const size = product.selectedSize;

    const existing = cart.find(
      (item) => getItemId(item) === id && item.selectedSize === size
    );

    if (existing) {
      setCart(
        cart.map((item) =>
          getItemId(item) === id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Remove item based on ID
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => getItemId(item) !== id));
  };

  // Update quantity safely (min = 1)
  const updateQuantity = (id, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        getItemId(item) === id
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
