import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Icon from '@/components/ui/icon';

interface TrackEvent {
  date: string;
  name: string;
}

interface TrackData {
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  history: TrackEvent[];
  error?: string;
}

const CARRIER_LABEL: Record<string, string> = {
  cdek: 'СДЭК',
  pochta: 'Почта России',
};

const CARRIER_ICON: Record<string, string> = {
  cdek: 'Truck',
  pochta: 'Mail',
};

const fmtDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
};

export default function Tracking() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    const res = await api.orders.track(Number(id));
    setData(res);
    setLoading(false);
  };

  useEffect(() => { if (user && id) load(); }, [user, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">Загрузка статуса...</div>
      </div>
    );
  }

  const hasTracking = data?.tracking_number;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-2xl">
        <button onClick={() => navigate(`/orders/${id}`)} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-black dark:hover:text-white mb-8 transition-colors">
          <Icon name="ArrowLeft" size={14} /> К заказу
        </button>

        <h1 className="text-4xl font-bold tracking-tighter mb-2 dark:text-white">Отслеживание</h1>
        <p className="text-sm text-neutral-400 mb-8">Заказ #{id}</p>

        {!hasTracking ? (
          <div className="text-center py-16 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Icon name="PackageSearch" size={26} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-neutral-400">Трек-номер ещё не назначен</p>
            <p className="text-sm text-neutral-400 mt-1">Он появится после отправки заказа</p>
          </div>
        ) : (
          <>
            {/* Шапка с трек-номером */}
            <div className="flex items-center gap-4 p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900 mb-6">
              <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center shrink-0">
                <Icon name={CARRIER_ICON[data!.carrier || ''] || 'Truck'} size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-neutral-400">{CARRIER_LABEL[data!.carrier || ''] || 'Доставка'}</p>
                <p className="font-bold dark:text-white">{data!.tracking_number}</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Обновить">
                <Icon name="RefreshCw" size={16} className="dark:text-neutral-300" />
              </button>
            </div>

            {/* Текущий статус */}
            <div className="p-5 border-2 border-brand rounded-2xl mb-8">
              <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Текущий статус</p>
              <p className="text-lg font-bold dark:text-white">{data!.status}</p>
            </div>

            {/* История */}
            {data!.history.length > 0 && (
              <div>
                <h2 className="text-sm uppercase tracking-wider text-neutral-400 mb-4">История перемещений</h2>
                <div className="relative pl-6">
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-5">
                    {[...data!.history].reverse().map((ev, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-6 top-1 w-[11px] h-[11px] rounded-full border-2 ${i === 0 ? 'bg-brand border-brand' : 'bg-white dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700'}`} />
                        <p className={`text-sm ${i === 0 ? 'font-semibold dark:text-white' : 'dark:text-neutral-300'}`}>{ev.name}</p>
                        {ev.date && <p className="text-xs text-neutral-400 mt-0.5">{fmtDate(ev.date)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
