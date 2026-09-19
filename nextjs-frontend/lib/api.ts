const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Motor { id: string; nama: string; tipe: string; harga: number; tangki: number; cc: number; }
export interface Kriteria { id: string; label: string; key: string; type: string; bobot: number; }
export interface RankedMotor extends Motor { vi: number; rank: number; [key: string]: string | number; }

export const getMotors = () => fetch(`${API}/motors`).then(r => { if (!r.ok) throw new Error('Gagal'); return r.json() as Promise<Motor[]>; });
export const createMotor = (data: Motor) => fetch(`${API}/motors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error('Gagal'); return r.json(); });
export const updateMotor = (id: string, data: Motor) => fetch(`${API}/motors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error('Gagal'); return r.json(); });
export const deleteMotor = (id: string) => fetch(`${API}/motors/${id}`, { method: 'DELETE' }).then(r => { if (!r.ok) throw new Error('Gagal'); });
export const calculateSAW = () => fetch(`${API}/motors/calculate/saw`).then(r => { if (!r.ok) throw new Error('Gagal'); return r.json() as Promise<RankedMotor[]>; });
export const getKriteria = () => fetch(`${API}/kriteria`).then(r => { if (!r.ok) throw new Error('Gagal'); return r.json() as Promise<Kriteria[]>; });
