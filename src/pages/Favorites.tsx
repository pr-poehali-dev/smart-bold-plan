import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLang } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface FavItem {
  id: number;
  service_id: number;
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  printing: 'Layers',
  modeling: 'Box',
};

const CATEGORY_LABELS: Record<string, string> = {
  printing: '3D-печать',
  modeling: 'Моделирование',
};

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { refreshCounts } = useCart();
  const { t } = useLang();
  const navigate = useNavigate();
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

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
    await load();
    refreshCounts();
  };

  const addToCart = async (service_id: number) => {
    await api.cart.add(service_id);
    refreshCounts();
    setAddedIds(prev => new Set(prev).add(service_id));
    setTimeout(() => {
      setAddedIds(prev => { const s = new Set(prev); s.delete(service_id); return s; });
    }, 1500);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">{t('Загрузка...')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2 dark:text-white">{t('Избранное')}</h1>
        {items.length > 0 && (
          <p className="text-neutral-400 mb-8">{items.length} {items.length === 1 ? t('услуга') : items.length < 5 ? t('услуги') : t('услуг')}</p>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="Heart" size={28} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-lg mb-6">{t('Список избранного пуст')}</p>
            <button
              onClick={() => navigate('/modeling')}
              className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              {t('Посмотреть услуги')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
                <div className="flex items-start gap-4">
                  {/* Иконка категории */}
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Icon name={CATEGORY_ICONS[item.category] || 'Package'} size={18} className="text-neutral-500 dark:text-neutral-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold dark:text-white leading-tight">{t(item.title)}</p>
                        {item.description && (
                          <p className="text-sm text-neutral-400 mt-0.5">{t(item.description)}</p>
                        )}
                      </div>
                      {/* Удалить из избранного */}
                      <button
                        onClick={() => remove(item.service_id)}
                        className="shrink-0 text-brand"
                        aria-label={t('Удалить из избранного')}
                      >
                        <Icon name="Heart" size={18} className="fill-brand text-brand" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-neutral-400">
                          {t(CATEGORY_LABELS[item.category] || item.category)}
                        </span>
                        <p className="font-bold dark:text-white">{t('от')} {item.price.toLocaleString()} ₽</p>
                      </div>
                      <button
                        onClick={() => addToCart(item.service_id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-colors ${
                          addedIds.has(item.service_id)
                            ? 'bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white'
                            : 'bg-black dark:bg-white dark:text-black text-white hover:bg-neutral-700 dark:hover:bg-neutral-200'
                        }`}
                      >
                        <Icon name={addedIds.has(item.service_id) ? 'Check' : 'ShoppingCart'} size={14} />
                        {addedIds.has(item.service_id) ? t('Добавлено') : t('В корзину')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}