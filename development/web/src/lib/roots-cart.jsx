import { createContext, useContext, useEffect, useState } from 'react';

export const MAX_RESTAURANTS = 3;

const CartContext = createContext(null);

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => load('roots_cart', [])); // [{dishId, restId, qty}]
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem('roots_cart', JSON.stringify(cart));
  }, [cart, loaded]);

  const cartRests = [...new Set(cart.map((c) => c.restId))];
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const add = (dishId, restId) => {
    if (!cartRests.includes(restId) && cartRests.length >= MAX_RESTAURANTS) {
      return { ok: false, reason: 'limit' };
    }
    setCart((c) =>
      c.some((x) => x.dishId === dishId)
        ? c.map((x) => (x.dishId === dishId ? { ...x, qty: Math.min(20, x.qty + 1) } : x))
        : [...c, { dishId, restId, qty: 1 }]
    );
    return { ok: true };
  };

  const setQty = (dishId, qty) => {
    setCart((c) => c.map((x) => (x.dishId === dishId ? { ...x, qty } : x)).filter((x) => x.qty > 0));
  };

  const remove = (dishId) => {
    setCart((c) => c.filter((x) => x.dishId !== dishId));
  };

  const clear = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        lines: cart,
        add,
        setQty,
        remove,
        clear,
        restaurantIds: cartRests,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart outside provider');
  return c;
}
