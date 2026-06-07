import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const plans = [
  {
    title: 'Малый объект',
    price: 'от 599 ₽',
    description: 'Небольшие детали, украшения, сувениры, фигурки до 10 см',
    examples: ['Брелоки и значки', 'Ювелирные украшения', 'Миниатюры и фигурки', 'Простые крепёжные элементы'],
    icon: 'Box',
    accent: false,
  },
  {
    title: 'Средний объект',
    price: 'от 899 ₽',
    description: 'Детали механизмов, корпуса, архитектурные элементы от 10 до 30 см',
    examples: ['Корпуса для электроники', 'Архитектурные детали', 'Прототипы изделий', 'Запчасти и комплектующие'],
    icon: 'Layers',
    accent: true,
  },
  {
    title: 'Крупный объект',
    price: 'от 2 000 ₽',
    description: 'Габаритные изделия, сборные конструкции, сложные формы от 30 см',
    examples: ['Архитектурные макеты', 'Промышленные прототипы', 'Скульптуры и арт-объекты', 'Сложные сборные модели'],
    icon: 'Package',
    accent: false,
  },
];

export default function Modeling() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <span className="text-sm uppercase tracking-widest text-neutral-400">Услуги</span>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 max-w-5xl">
        {/* Title */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4 dark:text-white">
            Моделирование
          </h1>
          <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl">
            Создаём точные 3D-модели любой сложности — от миниатюрных деталей до крупных промышленных объектов.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`relative rounded-2xl p-6 md:p-8 border transition-all ${
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
              <div className="text-3xl font-bold tracking-tighter mb-6">{plan.price}</div>
              <ul className="space-y-2">
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
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="/#contact"
            className="inline-block px-10 py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-colors rounded-xl"
          >
            Заказать моделирование
          </a>
          <span className="text-sm text-neutral-400">Ответим в течение 1 рабочего дня</span>
        </div>
      </div>
    </div>
  );
}
