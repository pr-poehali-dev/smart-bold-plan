import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface CartItem {
  id: number;
  service_id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  printing: 'Layers',
  modeling: 'Box',
};

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { refreshCounts } = useCart();
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
    await load();
    refreshCounts();
  };

  const changeQty = async (service_id: number, quantity: number) => {
    if (quantity < 1) return;
    await api.cart.update(service_id, quantity);
    await load();
    refreshCounts();
  };

  const checkout = async () => {
    setOrdering(true);
    const order = await api.orders.create();
    if (order.error) { setOrdering(false); return; }
    navigate(`/checkout/${order.order_id}`);
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
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2 dark:text-white">Корзина</h1>
        {items.length > 0 && (
          <p className="text-neutral-400 mb-8">{items.length} {items.length === 1 ? 'позиция' : items.length < 5 ? 'позиции' : 'позиций'}</p>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="ShoppingCart" size={28} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-lg mb-6">Корзина пуста</p>
            <button
              onClick={() => navigate('/modeling')}
              className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-brand transition-colors"
            >
              Выбрать услугу
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {items.map(item => (
                <div key={item.id} className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
                  <div className="flex items-start gap-4">
                    {/* Иконка категории */}
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <Icon name={CATEGORY_ICONS[item.category] || 'Package'} size={18} className="text-neutral-500 dark:text-neutral-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold dark:text-white leading-tight">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-neutral-400 mt-0.5 truncate">{item.description}</p>
                      )}
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {item.price.toLocaleString()} ₽ × {item.quantity} = <span className="font-semibold text-black dark:text-white">{(item.price * item.quantity).toLocaleString()} ₽</span>
                      </p>
                    </div>

                    <button
                      onClick={() => remove(item.service_id)}
                      className="text-neutral-300 dark:text-neutral-600 hover:text-brand dark:hover:text-brand transition-colors shrink-0"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>

                  {/* Счётчик */}
                  <div className="flex items-center gap-2 mt-4 pl-14">
                    <button
                      onClick={() => changeQty(item.service_id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-white transition-colors"
                    >−</button>
                    <span className="w-8 text-center font-medium dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item.service_id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-white transition-colors"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Итого */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-500 dark:text-neutral-400">Итого</span>
                <span className="text-3xl font-bold tracking-tighter dark:text-white">{total.toLocaleString()} ₽</span>
              </div>
              <button
                onClick={checkout}
                disabled={ordering}
                className="w-full py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-colors disabled:opacity-50"
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