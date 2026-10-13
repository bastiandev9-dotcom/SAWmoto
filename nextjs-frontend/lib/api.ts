const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TIMEOUT_MS = 15000;

export interface Motor { id: string; nama: string; tipe: string; harga: number; tangki: number; cc: number; }
export interface Kriteria { id: string; label: string; key: string; type: string; bobot: number; }
export interface RankedMotor extends Motor { vi: number; rank: number; [key: string]: string | number; }

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { message?: string }));
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

export const getMotors = () => req<Motor[]>('/motors');
export const createMotor = (data: Motor) => req<Motor>('/motors', { method: 'POST', body: JSON.stringify(data) });
export const updateMotor = (id: string, data: Motor) => req<Motor>(`/motors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMotor = (id: string) => req<{ message: string }>(`/motors/${id}`, { method: 'DELETE' });
export const calculateSAW = (payload?: { ids?: string[]; bobot?: Record<string, number> }) =>
  req<RankedMotor[]>('/motors/calculate/saw', { method: 'POST', body: JSON.stringify(payload ?? {}) });
export const getKriteria = () => req<Kriteria[]>('/kriteria');
