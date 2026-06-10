import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

type Mode = 'login' | 'register' | 'phone';

const AUTH_URL = 'https://functions.poehali.dev/1e17b5c0-c2a0-431d-84d6-7be524bd5652';

function getOAuthUrl(provider: 'yandex' | 'vk') {
  const redirect = encodeURIComponent(`${window.location.origin}/auth/callback`);
  return `${AUTH_URL}?provider=${provider}&redirect_uri=${redirect}`;
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, refresh } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await register(email, password, name);
      if (result.error) { setError(result.error); return; }
      navigate('/account');
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const sendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = await api.auth.smsSend(phone);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSmsSent(true);
  };

  const verifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = await api.auth.smsVerify(phone, smsCode);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    localStorage.setItem('session_id', data.session_id);
    await refresh();
    navigate('/account');
  };

  const btnClass = "w-full py-4 bg-black dark:bg-white text-white dark:text-black text-sm uppercase tracking-widest rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50";
  const socialClass = "w-full flex items-center justify-center gap-3 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm hover:border-black dark:hover:border-white transition-colors dark:text-white";

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-md">
        <h1 className="text-4xl font-bold tracking-tighter mb-8 dark:text-white">
          {mode === 'register' ? 'Регистрация' : mode === 'phone' ? 'Вход по телефону' : 'Вход'}
        </h1>

        {/* OAuth кнопки */}
        {mode !== 'phone' && (
          <div className="space-y-3 mb-6">
            <a href={getOAuthUrl('yandex')} className={socialClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13.5 2H10.5C7 2 5 4 5 7.5C5 10.2 6.3 12.1 8.7 13L5 22H8.3L11.8 13.4H13.5V22H16.5V2H13.5ZM13.5 10.8H11.9C9.9 10.8 8.2 9.6 8.2 7.4C8.2 5.2 9.6 4.5 11.9 4.5H13.5V10.8Z" fill="#FC3F1D"/>
              </svg>
              Войти через Яндекс
            </a>
            <a href={getOAuthUrl('vk')} className={socialClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20.8 7.6C21 7 20.8 6.5 20 6.5H17.5C16.8 6.5 16.5 6.9 16.3 7.4C16.3 7.4 15 10.4 13.2 12.3C12.6 12.9 12.3 13.1 12 13.1C11.8 13.1 11.5 12.9 11.5 12.3V7.6C11.5 6.9 11.3 6.5 10.7 6.5H6.8C6.4 6.5 6.1 6.8 6.1 7.1C6.1 7.8 7.1 7.9 7.2 9.8V13.2C7.2 14.1 7 14.2 6.7 14.2C5.9 14.2 4 11.1 2.9 7.7C2.7 6.9 2.4 6.5 1.7 6.5H-0.8C-1.6 6.5 -1.8 6.9 -1.8 7.4C-1.8 8.1 -1 11.4 2.1 15.8C4.2 18.8 7.2 20.4 9.9 20.4C11.6 20.4 11.8 20 11.8 19.3V17C11.8 16.2 12 16 12.5 16C12.9 16 13.6 16.2 15.2 17.8C17 19.6 17.3 20.4 18.3 20.4H20.8C21.6 20.4 22 20 21.8 19.2C21.5 18.4 20.6 17.3 19.4 16C18.8 15.3 17.9 14.5 17.6 14.1C17.2 13.6 17.3 13.4 17.6 13C17.6 13 20.6 8.7 20.8 7.6Z" fill="#2787F5"/>
              </svg>
              Войти через ВКонтакте
            </a>
            <button onClick={() => { setMode('phone'); setError(''); }} className={socialClass}>
              <Icon name="Phone" size={18} />
              Войти по номеру телефона
            </button>
          </div>
        )}

        {mode !== 'phone' && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-sm text-neutral-400">или</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          </div>
        )}

        {/* Email/пароль форма */}
        {mode !== 'phone' && (
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  placeholder="Ваше имя"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                placeholder="Минимум 6 символов"
              />
            </div>
            {error && <p className="text-brand text-sm">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
        )}

        {/* Телефон форма */}
        {mode === 'phone' && (
          <form onSubmit={smsSent ? verifySms : sendSms} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Номер телефона</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                disabled={smsSent}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50"
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            {smsSent && (
              <div>
                <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Код из SMS</label>
                <input
                  type="text"
                  value={smsCode}
                  onChange={e => setSmsCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white tracking-widest text-center text-lg"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-neutral-400 mt-1">Код отправлен на {phone}</p>
              </div>
            )}
            {error && <p className="text-brand text-sm">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Загрузка...' : smsSent ? 'Подтвердить' : 'Получить код'}
            </button>
            {smsSent && (
              <button type="button" onClick={() => { setSmsSent(false); setSmsCode(''); setError(''); }}
                className="w-full text-sm text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                Изменить номер
              </button>
            )}
          </form>
        )}

        <div className="mt-6 space-y-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {mode !== 'phone' && (
            <p>
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-black dark:text-white underline underline-offset-2"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          )}
          {mode === 'phone' && (
            <button onClick={() => { setMode('login'); setError(''); setSmsSent(false); }}
              className="text-black dark:text-white underline underline-offset-2">
              Войти через email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}