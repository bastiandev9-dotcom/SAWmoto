'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { admin, loading, login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && admin) router.replace('/data');
  }, [admin, loading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      showToast('Login admin berhasil', 'success');
      router.replace('/data');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section" style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '6rem' }}>
      <div className="card" data-reveal="up">
        <div className="section-label">Admin</div>
        <h1 style={{ marginTop: '0.5rem' }}>Login Admin</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Masuk untuk menambah, mengubah, atau menghapus data motor dan kriteria.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', border: 'none', borderRadius: '8px', background: 'var(--accent)', color: '#000', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
            {submitting ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  );
}
