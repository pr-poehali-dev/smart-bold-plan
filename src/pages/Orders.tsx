import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  in_progress: 'В работе',
  done: 'Выполнен',
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Не оплачен',
  waiting: 'Ожидает',
  succeeded: 'Оплачен',
  canceled: 'Отменён',
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    if (id) {
      api.orders.get(Number(id)).then(data => { setOrder(data); setLoading(false); });
    } else {
      api.orders.list().then(data => { setOrders(data.orders || []); setLoading(false); });
    }
  }, [user, id]);

  const pay = async (orderId: number, type: 'bank_card' | 'sbp') => {
    setPaying(true);
    const returnUrl = `${window.location.origin}/orders/${orderId}`;
    const data = await api.orders.pay(orderId, type, returnUrl);
    if (data.confirmation_url) window.location.href = data.confirmation_url;
    setPaying(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  // Детальный вид заказа
  if (id && order) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-2xl">
          <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-black dark:hover:text-white mb-8 transition-colors">
            <Icon name="ArrowLeft" size={14} /> Все заказы
          </button>
          <h1 className="text-4xl font-bold tracking-tighter mb-2 dark:text-white">Заказ #{order.id}</h1>
          <p className="text-sm text-neutral-400 mb-8">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>

          <div className="space-y-2 mb-6">
            {((order.items as {title:string;price:number;quantity:number}[]) || []).map((item, i: number) => (
              <div key={i} className="flex justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="dark:text-white">{item.title} × {item.quantity}</span>
                <span className="font-semibold dark:text-white">{(item.price * item.quantity).toLocaleString()} ₽</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-lg font-bold mb-8 dark:text-white">
            <span>Итого</span>
            <span>{(order.total || 0).toLocaleString()} ₽</span>
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs border border-neutral-200 dark:border-neutral-700 dark:text-neutral-300">{STATUS_LABEL[order.status] || order.status}</span>
            <span className={`px-3 py-1 rounded-full text-xs border ${order.payment_status === 'succeeded' ? 'border-green-500 text-green-600' : 'border-neutral-200 dark:border-neutral-700 dark:text-neutral-300'}`}>
              {PAYMENT_LABEL[order.payment_status] || order.payment_status}
            </span>
          </div>

          {order.payment_status !== 'succeeded' && (
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Выберите способ оплаты:</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => pay(order.id, 'bank_card')}
                  disabled={paying}
                  className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white dark:text-black text-white text-sm rounded-xl hover:bg-pink-400 dark:hover:bg-pink-400 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <Icon name="CreditCard" size={16} />
                  Карта Мир
                </button>
                <button
                  onClick={() => pay(order.id, 'sbp')}
                  disabled={paying}
                  className="flex items-center gap-2 px-6 py-3 border border-neutral-200 dark:border-neutral-700 dark:text-white text-sm rounded-xl hover:border-black dark:hover:border-white transition-colors disabled:opacity-50"
                >
                  <Icon name="Zap" size={16} />
                  СБП
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Список заказов
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-10 dark:text-white">Мои заказы</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg mb-6">Заказов пока нет</p>
            <button onClick={() => navigate('/cart')} className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white text-sm uppercase tracking-widest rounded-xl hover:bg-pink-400 transition-colors">
              Перейти в корзину
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <button
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="w-full flex items-center justify-between p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-colors text-left"
              >
                <div>
                  <p className="font-semibold dark:text-white">Заказ #{o.id}</p>
                  <p className="text-sm text-neutral-400">{new Date(o.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold dark:text-white">{(o.total || 0).toLocaleString()} ₽</p>
                  <p className={`text-xs ${o.payment_status === 'succeeded' ? 'text-green-500' : 'text-neutral-400'}`}>
                    {PAYMENT_LABEL[o.payment_status] || o.payment_status}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}