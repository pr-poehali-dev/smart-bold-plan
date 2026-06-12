import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  payment_status: string;
  items: OrderItem[];
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<'card' | 'sbp' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !id) return;
    api.orders.get(Number(id)).then(data => {
      if (data.error) { navigate('/orders'); return; }
      setOrder(data);
      setLoading(false);
    });
  }, [user, id]);

  const pay = async (type: 'bank_card' | 'sbp') => {
    setPaying(type === 'bank_card' ? 'card' : 'sbp');
    setError('');
    const returnUrl = `${window.location.origin}/orders/${id}`;
    const data = await api.orders.pay(Number(id), type, returnUrl);
    if (data.confirmation_url) {
      window.location.href = data.confirmation_url;
    } else {
      setError(data.error || t('Не удалось создать платёж. Попробуйте ещё раз.'));
      setPaying(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">{t('Загрузка...')}</div>
      </div>
    );
  }

  if (!order) return null;

  const alreadyPaid = order.payment_status === 'succeeded';

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-lg">

        <button onClick={() => navigate(`/orders/${id}`)} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-black dark:hover:text-white mb-8 transition-colors">
          <Icon name="ArrowLeft" size={14} /> {t('К заказу')}
        </button>

        <h1 className="text-4xl font-bold tracking-tighter mb-1 dark:text-white">{t('Оплата')}</h1>
        <p className="text-sm text-neutral-400 mb-8">{t('Заказ')} #{order.id}</p>

        {/* Состав заказа */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden mb-6">
          <div className="p-5 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <span className="text-sm dark:text-neutral-300 leading-tight">{t(item.title)} × {item.quantity}</span>
                <span className="text-sm font-semibold dark:text-white shrink-0">{(item.price * item.quantity).toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-800 px-5 py-4 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900">
            <span className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{t('Итого')}</span>
            <span className="text-2xl font-bold tracking-tighter dark:text-white">{order.total.toLocaleString()} ₽</span>
          </div>
        </div>

        {alreadyPaid ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Icon name="CheckCircle" size={28} className="text-green-500" />
            </div>
            <p className="text-lg font-bold dark:text-white mb-1">{t('Оплачено')}</p>
            <p className="text-sm text-neutral-400 mb-6">{t('Этот заказ уже оплачен')}</p>
            <button onClick={() => navigate('/orders')} className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-colors">
              {t('Мои заказы')}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{t('Выберите способ оплаты:')}</p>

            <div className="space-y-3">
              {/* Карта Мир */}
              <button
                onClick={() => pay('bank_card')}
                disabled={!!paying}
                className="w-full flex items-center gap-4 p-5 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-brand dark:hover:border-brand transition-all disabled:opacity-60 group"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
                  {paying === 'card'
                    ? <Icon name="Loader" size={22} className="text-brand animate-spin" />
                    : <Icon name="CreditCard" size={22} className="text-neutral-500 group-hover:text-brand transition-colors" />
                  }
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold dark:text-white">{t('Карта Мир')}</p>
                  <p className="text-xs text-neutral-400">{t('Банковская карта платёжной системы Мир')}</p>
                </div>
                <Icon name="ChevronRight" size={18} className="text-neutral-300 dark:text-neutral-600 group-hover:text-brand transition-colors" />
              </button>

              {/* СБП */}
              <button
                onClick={() => pay('sbp')}
                disabled={!!paying}
                className="w-full flex items-center gap-4 p-5 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-brand dark:hover:border-brand transition-all disabled:opacity-60 group"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
                  {paying === 'sbp'
                    ? <Icon name="Loader" size={22} className="text-brand animate-spin" />
                    : <Icon name="Zap" size={22} className="text-neutral-500 group-hover:text-brand transition-colors" />
                  }
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold dark:text-white">{t('СБП')}</p>
                  <p className="text-xs text-neutral-400">{t('Система быстрых платежей — по QR или ссылке')}</p>
                </div>
                <Icon name="ChevronRight" size={18} className="text-neutral-300 dark:text-neutral-600 group-hover:text-brand transition-colors" />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm">
                <Icon name="AlertCircle" size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <p className="text-xs text-neutral-400 text-center mt-6">
              {t('Оплата проходит через ЮKassa — безопасно и надёжно')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}