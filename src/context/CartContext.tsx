import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CartContextType {
  cartCount: number;
  favCount: number;
  refreshCounts: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!user) { setCartCount(0); setFavCount(0); return; }
    const [cart, fav] = await Promise.all([api.cart.get(), api.favorites.get()]);
    setCartCount((cart.items || []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0));
    setFavCount((fav.items || []).length);
  }, [user]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  return (
    <CartContext.Provider value={{ cartCount, favCount, refreshCounts }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
