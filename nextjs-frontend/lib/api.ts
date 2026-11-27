const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TIMEOUT_MS = 15000;

export interface Motor { id: string; nama: string; tipe: string; harga: number; tangki: number; cc: number; }
export interface Kriteria { id: string; label: string; key: string; type: string; bobot: number; }
export interface RankedMotor extends Motor { vi: number; rank: number; [key: string]: string | number; }
export interface Admin { username: string; role: 'admin'; csrfToken: string; }

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('sawmoto_csrf='));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD'].includes(method) && path !== '/auth/login') {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers.set('x-csrf-token', csrfToken);
  }

  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
      if (res.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sawmoto:unauthorized'));
      }
      throw new Error(body.message || `Gagal (${res.status})`);
    }
    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('Request timeout — server tidak merespons');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const login = (username: string, password: string) =>
  req<Admin>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const logout = () => req<{ message: string }>('/auth/logout', { method: 'POST' });

export const getMe = () => req<Admin>('/auth/me');

export const getMotors = () => req<Motor[]>('/motors');
export const createMotor = (data: Motor) => req<Motor>('/motors', { method: 'POST', body: JSON.stringify(data) });
export const updateMotor = (id: string, data: Motor) => req<Motor>(`/motors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMotor = (id: string) => req<{ message: string }>(`/motors/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const calculateSAW = (payload?: { ids?: string[]; bobot?: Record<string, number> }) =>
  req<RankedMotor[]>('/motors/calculate/saw', { method: 'POST', body: JSON.stringify(payload ?? {}) });
export const getKriteria = () => req<Kriteria[]>('/kriteria');
