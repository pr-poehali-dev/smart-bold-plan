import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const plans = [
  {
    id: 1,
    title: 'FDM-печать',
    price: '299 ₽ / 60 г филамента',
    description: 'Послойная печать пластиком — быстро и доступно для прототипов и функциональных деталей. Итоговая цена зависит от граммовки модели и времени печати.',
    examples: ['Прототипы и макеты', 'Корпуса и держатели', 'Запчасти и детали', 'Технические изделия'],
    icon: 'Printer',
    accent: false,
  },
];

export default function Printing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [added, setAdded] = useState<Record<number, 'cart' | 'fav' | null>>({});

  const handleCart = async (id: number) => {
    if (!user) { navigate('/auth'); return; }
    await api.cart.add(id);
    setAdded(prev => ({ ...prev, [id]: 'cart' }));
    setTimeout(() => setAdded(prev => ({ ...prev, [id]: null })), 1500);
  };

  const handleFav = async (id: number) => {
    if (!user) { navigate('/auth'); return; }
    await api.favorites.add(id);
    setAdded(prev => ({ ...prev, [id]: 'fav' }));
    setTimeout(() => setAdded(prev => ({ ...prev, [id]: null })), 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-12 md:pt-32 md:pb-20 max-w-5xl">
        <div className="mb-12 md:mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4 dark:text-white">
            3D-печать
          </h1>
          <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl">
            Печатаем на FDM и фотополимерных принтерах — выбирайте технологию под вашу задачу.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`relative rounded-2xl p-6 md:p-8 border transition-all flex flex-col ${
                plan.accent
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white'
              }`}
            >
              {plan.accent && (
                <span className="absolute top-4 right-4 text-xs uppercase tracking-widest bg-white/20 rounded-full px-3 py-1">
                  Популярное
                </span>
              )}
              <Icon
                name={plan.icon}
                size={28}
                className={plan.accent ? 'text-white/80 mb-4' : 'text-neutral-400 dark:text-neutral-500 mb-4'}
              />
              <h2 className="text-lg font-bold tracking-tight mb-1">{plan.title}</h2>
              <p className={`text-sm mb-4 ${plan.accent ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {plan.description}
              </p>
              <div className="text-3xl font-bold tracking-tighter mb-4">{plan.price}</div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.examples.map((ex) => (
                  <li key={ex} className="flex items-center gap-2 text-sm">
                    <Icon
                      name="Check"
                      size={14}
                      className={plan.accent ? 'text-white/80 shrink-0' : 'text-red-500 shrink-0'}
                    />
                    <span className={plan.accent ? 'text-white/90' : 'text-neutral-600 dark:text-neutral-300'}>
                      {ex}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleCart(plan.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
                    plan.accent
                      ? 'bg-white text-red-600 hover:bg-neutral-100'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white'
                  }`}
                >
                  <Icon name="ShoppingCart" size={14} />
                  {added[plan.id] === 'cart' ? 'Добавлено!' : 'В корзину'}
                </button>
                <button
                  onClick={() => handleFav(plan.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    plan.accent
                      ? 'border-white/40 hover:bg-white/10'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-red-500'
                  }`}
                  title="В избранное"
                >
                  <Icon
                    name="Heart"
                    size={16}
                    className={added[plan.id] === 'fav' ? 'text-red-500 fill-red-500' : plan.accent ? 'text-white/70' : 'text-neutral-400'}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="/#contact"
            className="inline-block px-10 py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors rounded-xl"
          >
            Заказать печать
          </a>
          <span className="text-sm text-neutral-400">Ответим в течение 1 рабочего дня</span>
        </div>
      </div>
    </div>
  );
}