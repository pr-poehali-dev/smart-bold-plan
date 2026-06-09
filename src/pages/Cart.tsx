import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface CartItem {
  id: number;
  service_id: number;
  slug: string;
  title: string;
  price: number;
  quantity: number;
}

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  const load = async () => {
    const data = await api.cart.get();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const remove = async (service_id: number) => {
    await api.cart.remove(service_id);
    load();
  };

  const changeQty = async (service_id: number, quantity: number) => {
    if (quantity < 1) return;
    await api.cart.update(service_id, quantity);
    load();
  };

  const checkout = async () => {
    setOrdering(true);
    const order = await api.orders.create();
    if (order.error) { setOrdering(false); return; }
    navigate(`/orders/${order.order_id}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-10 dark:text-white">Корзина</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg mb-6">Корзина пуста</p>
            <button onClick={() => navigate('/modeling')} className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-pink-600 transition-colors">
              Выбрать услугу
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex-1">
                    <p className="font-semibold dark:text-white">{item.title}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">от {item.price} ₽ за ед.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.service_id, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-white">−</button>
                    <span className="w-6 text-center dark:text-white">{item.quantity}</span>
                    <button onClick={() => changeQty(item.service_id, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-white">+</button>
                  </div>
                  <p className="font-bold w-24 text-right dark:text-white">{(item.price * item.quantity).toLocaleString()} ₽</p>
                  <button onClick={() => remove(item.service_id)} className="text-neutral-400 hover:text-pink-600 transition-colors">
                    <Icon name="X" size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Итого</p>
                <p className="text-3xl font-bold tracking-tighter dark:text-white">{total.toLocaleString()} ₽</p>
              </div>
              <button
                onClick={checkout}
                disabled={ordering}
                className="px-10 py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-pink-600 dark:hover:bg-pink-600 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                {ordering ? 'Оформляем...' : 'Оформить заказ'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}