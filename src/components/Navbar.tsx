import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const linkClass = (active: boolean) =>
    `text-sm uppercase tracking-widest transition-colors ${
      active ? 'text-brand' : 'hover:text-brand dark:text-neutral-300 dark:hover:text-brand'
    }`;

  const iconBtnClass = (active: boolean) =>
    `p-2 rounded-lg border transition-colors ${
      active
        ? 'border-black dark:border-white'
        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
    }`;

  const goHome = (hash?: string) => {
    setMenuOpen(false);
    if (isHome) {
      if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/' + (hash ?? ''));
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-colors duration-300">
      {/* Топ-баннер доставки */}
      <div className="bg-black dark:bg-neutral-900 text-white text-xs py-1.5 px-4 text-center">
        <span className="flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Icon name="Truck" size={11} className="text-brand" />
            Доставка по всей России
          </span>
          <span className="text-neutral-600 hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <Icon name="Package" size={11} className="text-neutral-400" />
            СДЭК
          </span>
          <span className="text-neutral-600 hidden sm:inline">·</span>
          <span className="flex items-center gap-1">
            <Icon name="Mail" size={11} className="text-neutral-400" />
            Почта России
          </span>
        </span>
      </div>

      <div className="bg-white dark:bg-neutral-950 border-b border-black dark:border-neutral-700">
        <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          {/* Логотип */}
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold tracking-tighter dark:text-white shrink-0"
          >
            FORM3D
          </button>

          {/* Десктоп-меню */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => goHome('#work')} className={linkClass(false)}>Работы</button>
            <button onClick={() => goHome('#about')} className={linkClass(false)}>О нас</button>
            <button onClick={() => navigate('/modeling')} className={linkClass(location.pathname === '/modeling')}>Моделирование</button>
            <button onClick={() => navigate('/printing')} className={linkClass(location.pathname === '/printing')}>3D-печать</button>
            <button onClick={() => goHome('#contact')} className={linkClass(false)}>Контакты</button>
          </div>

          {/* Иконки (всегда видны) */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/favorites')} className={iconBtnClass(location.pathname === '/favorites')} aria-label="Избранное">
              <Icon name="Heart" size={16} className="dark:text-neutral-300" />
            </button>
            <button onClick={() => navigate('/cart')} className={iconBtnClass(location.pathname === '/cart')} aria-label="Корзина">
              <Icon name="ShoppingCart" size={16} className="dark:text-neutral-300" />
            </button>
            <button onClick={() => navigate(user ? '/account' : '/auth')} className={iconBtnClass(location.pathname === '/account' || location.pathname === '/auth')} aria-label="Профиль">
              <Icon name={user ? 'UserCheck' : 'User'} size={16} className="dark:text-neutral-300" />
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Тема">
              <Icon name={dark ? 'Sun' : 'Moon'} size={16} className="dark:text-neutral-300" />
            </button>
            {/* Бургер — только мобильный */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Меню"
            >
              <Icon name={menuOpen ? 'X' : 'Menu'} size={16} className="dark:text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-4 flex flex-col gap-4">
            <button onClick={() => goHome('#work')} className={linkClass(false)}>Работы</button>
            <button onClick={() => goHome('#about')} className={linkClass(false)}>О нас</button>
            <button onClick={() => { navigate('/modeling'); setMenuOpen(false); }} className={linkClass(location.pathname === '/modeling')}>Моделирование</button>
            <button onClick={() => { navigate('/printing'); setMenuOpen(false); }} className={linkClass(location.pathname === '/printing')}>3D-печать</button>
            <button onClick={() => goHome('#contact')} className={linkClass(false)}>Контакты</button>
          </div>
        )}
      </div>
    </nav>
  );
}
