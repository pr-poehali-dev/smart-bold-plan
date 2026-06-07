import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('state') || 'yandex';
    if (!code) { navigate('/auth'); return; }

    const redirect_uri = `${window.location.origin}/auth/callback`;
    api.auth.oauthCallback(provider, code, redirect_uri).then(data => {
      if (data.error) { navigate('/auth'); return; }
      localStorage.setItem('session_id', data.session_id);
      refresh().then(() => navigate('/account'));
    });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
      <p className="text-neutral-400 text-lg">Выполняется вход...</p>
    </div>
  );
}
