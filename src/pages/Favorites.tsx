import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface FavItem {
  id: number;
  service_id: number;
  slug: string;
  title: string;
  price: number;
  category: string;
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  const load = async () => {
    const data = await api.favorites.get();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const remove = async (service_id: number) => {
    await api.favorites.remove(service_id);
    load();
  };

  const addToCart = async (service_id: number) => {
    await api.cart.add(service_id);
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
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-10 dark:text-white">Избранное</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg mb-6">Список избранного пуст</p>
            <button onClick={() => navigate('/modeling')} className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-pink-600 transition-colors">
              Посмотреть услуги
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900">
                <div className="flex-1">
                  <p className="font-semibold dark:text-white">{item.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">от {item.price.toLocaleString()} ₽</p>
                </div>
                <button
                  onClick={() => addToCart(item.service_id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-black dark:bg-white dark:text-black text-white rounded-xl hover:bg-pink-600 dark:hover:bg-pink-600 dark:hover:text-white transition-colors"
                >
                  <Icon name="ShoppingCart" size={14} />
                  В корзину
                </button>
                <button onClick={() => remove(item.service_id)} className="text-neutral-400 hover:text-pink-600 transition-colors">
                  <Icon name="Heart" size={18} className="fill-pink-600 text-pink-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}