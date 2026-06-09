import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

export default function Account() {
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.auth.update({ name, phone });
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading || !user) {
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
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-10 dark:text-white">Профиль</h1>

        <form onSubmit={save} className="space-y-4 mb-10">
          <div>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-neutral-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-colors disabled:opacity-50"
          >
            {saved ? 'Сохранено!' : saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>

        <div className="grid grid-cols-2 gap-3 mb-10">
          <button onClick={() => navigate('/orders')} className="flex items-center gap-2 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-black dark:hover:border-white transition-colors dark:text-white">
            <Icon name="Package" size={18} />
            <span className="text-sm">Мои заказы</span>
          </button>
          <button onClick={() => navigate('/favorites')} className="flex items-center gap-2 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-black dark:hover:border-white transition-colors dark:text-white">
            <Icon name="Heart" size={18} />
            <span className="text-sm">Избранное</span>
          </button>
          <button onClick={() => navigate('/cart')} className="flex items-center gap-2 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-black dark:hover:border-white transition-colors dark:text-white">
            <Icon name="ShoppingCart" size={18} />
            <span className="text-sm">Корзина</span>
          </button>
        </div>

        <button onClick={doLogout} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-brand transition-colors">
          <Icon name="LogOut" size={16} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}