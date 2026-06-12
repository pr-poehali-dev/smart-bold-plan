import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

export default function Partner() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setContactName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    const res = await api.partner.apply({ org_name: orgName, contact_name: contactName, email, phone, description });
    setSending(false);
    if (res?.success) {
      setDone(true);
    } else {
      setError(res?.error || t('Произошла ошибка, попробуйте ещё раз'));
    }
  };

  if (authLoading || !user) {
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
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-xl">

        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-black dark:hover:text-white transition-colors mb-8"
        >
          <Icon name="ArrowLeft" size={16} />
          {t('Назад в кабинет')}
        </button>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 dark:text-white">
          {t('Стать партнёром')}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-10">
          {t('Расскажите о своей организации — мы свяжемся с вами и обсудим условия сотрудничества.')}
        </p>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Icon name="Check" size={28} className="text-white dark:text-black" />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter dark:text-white">{t('Заявка отправлена!')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400">{t('Мы рассмотрим её и свяжемся с вами в ближайшее время.')}</p>
            <button
              onClick={() => navigate('/account')}
              className="mt-4 px-6 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              {t('В личный кабинет')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                {t('Название организации')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
                placeholder={t('ООО «Пример»')}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                {t('Контактное лицо')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                required
                placeholder={t('Иван Иванов')}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('Телефон')}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('О сотрудничестве')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder={t('Расскажите, чем занимается ваша организация и как вы видите партнёрство...')}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {sending ? t('Отправляем...') : t('Отправить заявку')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}