import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

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

  const linkClass = (active: boolean) =>
    `text-xs md:text-sm uppercase tracking-widest transition-colors ${
      active
        ? 'text-red-600 dark:text-red-400'
        : 'hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400'
    }`;

  const goHome = (hash?: string) => {
    if (isHome) {
      if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/' + (hash ?? ''));
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-neutral-950 border-b border-black dark:border-neutral-700 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold tracking-tighter dark:text-white"
        >
          FORM3D
        </button>
        <div className="flex items-center space-x-4 md:space-x-8">
          <button onClick={() => goHome('#work')} className={linkClass(false)}>
            Работы
          </button>
          <button onClick={() => goHome('#about')} className={linkClass(false)}>
            О нас
          </button>
          <button
            onClick={() => navigate('/modeling')}
            className={linkClass(location.pathname === '/modeling')}
          >
            Моделирование
          </button>
          <button
            onClick={() => navigate('/printing')}
            className={linkClass(location.pathname === '/printing')}
          >
            3D-печать
          </button>
          <button onClick={() => goHome('#contact')} className={linkClass(false)}>
            Контакты
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Переключить тему"
          >
            <Icon name={dark ? 'Sun' : 'Moon'} size={16} className="dark:text-neutral-300" />
          </button>
        </div>
      </div>
    </nav>
  );
}