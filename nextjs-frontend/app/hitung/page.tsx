'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { getMotors, Motor } from '@/lib/api';
import { TiArrowLeft, TiArrowRight } from "react-icons/ti";
import { MdOutlineCheck, MdWarning } from "react-icons/md";
import { Icon } from '@iconify/react';
import { GiChampions } from "react-icons/gi";



const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const f4 = (n: number) => parseFloat(n.toFixed(4));
type Step = 0 | 1 | 2 | 3;
interface RankedMotor extends Motor { vi: number; [key: string]: string | number; }

const KRITERIA = [
  { id: 'C1', label: 'Harga (C1)', key: 'harga', desc: 'Cost — semakin murah semakin baik' },
  { id: 'C2', label: 'Kapasitas Tangki (C2)', key: 'tangki', desc: 'Benefit — semakin besar semakin baik' },
  { id: 'C3', label: 'Volume Silinder (C3)', key: 'cc', desc: 'Benefit — semakin besar semakin baik' },
];

export default function HitungPage() {
  const { showToast } = useToast();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterAlt, setFilterAlt] = useState('all');
  const [bobot, setBobot] = useState({ C1: 5, C2: 3, C3: 4 });
  const [step, setStep] = useState<Step>(0);
  const [sawResult, setSawResult] = useState<RankedMotor[]>([]);
  const [normalized, setNormalized] = useState<RankedMotor[]>([]);

  useEffect(() => {
    showToast(' Menghubungkan ke database...', 'info');
    localStorage.removeItem('sawResult');
    getMotors().then(data => {
      setMotors(data);
      setSelectedIds(new Set(data.map(m => m.id)));
      showToast(` ${data.length} motor dari database!`, 'success');
    }).catch(() => showToast(' Gagal koneksi database!', 'error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMotor = (id: string) => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const selectAll = () => { const vis = filterAlt === 'all' ? motors : motors.filter(m => m.tipe === filterAlt); setSelectedIds(prev => { const s = new Set(prev); vis.forEach(m => s.add(m.id)); return s; }); };
  const clearAll = () => { const vis = filterAlt === 'all' ? motors : motors.filter(m => m.tipe === filterAlt); setSelectedIds(prev => { const s = new Set(prev); vis.forEach(m => s.delete(m.id)); return s; }); };

  const buildMatriks = () => {
    const sel = motors.filter(m => selectedIds.has(m.id));
    const min_harga = Math.min(...sel.map(m => m.harga));
    const max = { tangki: Math.max(...sel.map(m => m.tangki)), cc: Math.max(...sel.map(m => m.cc)) };
    const norm: RankedMotor[] = sel.map(m => ({ ...m, vi: 0, r_C1: min_harga / m.harga, r_C2: m.tangki / max.tangki, r_C3: m.cc / max.cc }));
    setNormalized(norm);
    setSawResult(norm.map(m => ({ ...m, vi: bobot.C1 * (m.r_C1 as number) + bobot.C2 * (m.r_C2 as number) + bobot.C3 * (m.r_C3 as number) })).sort((a, b) => b.vi - a.vi));
  };

  const goStep = (s: Step) => {
    if (s === 1 && selectedIds.size < 2) { showToast(' Pilih minimal 2 motor!', 'error'); return; }
    if (s === 2) buildMatriks();
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visible = filterAlt === 'all' ? motors : motors.filter(m => m.tipe === filterAlt);
  const btnPrev = (to: Step) => <button onClick={() => goStep(to)} style={{ padding: '0.7rem 1.5rem', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TiArrowLeft size={25}/> Kembali</button>;
  const btnNext = (to: Step, label = 'Lanjut →') => <button onClick={() => goStep(to)} style={{ padding: '0.7rem 1.8rem', background: 'var(--accent)', color: '#0a0a0f', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 700 }}>{label}</button>;
  return (
    <>
      <div className="page-hero">
        <div className="hero-badge">Kalkulator Interaktif</div>
        <h1>Kalkulator SAW</h1>
        <p>Pilih alternatif motor, atur bobot kriteria, dan sistem akan menghitung secara otomatis menggunakan metode SAW.</p>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', marginBottom: '2rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {['1 Pilih Motor', '2 Bobot Kriteria', '3 Matriks & Normalisasi', '4 Hasil'].map((label, i) => (
            <div key={i} onClick={() => i <= step && goStep(i as Step)}
              style={{ flex: 1, padding: '0.7rem 0.5rem', textAlign: 'center', background: step === i ? 'rgba(245,200,66,0.12)' : i < step ? 'rgba(74,222,128,0.08)' : 'var(--surface)', color: step === i ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', cursor: i <= step ? 'pointer' : 'default' }}>
              {label}
            </div>
          ))}
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <div>
            <div className="card">
              <div className="card-title">Pilih Alternatif Motor</div>
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {['all', 'Matic', 'Moped', 'Sport'].map(f => <button key={f} className={`filter-btn ${filterAlt === f ? 'active' : ''}`} onClick={() => setFilterAlt(f)}>{f === 'all' ? 'Semua' : f}</button>)}
                <button onClick={selectAll} className="filter-btn" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}><MdOutlineCheck size={15} /> Pilih Semua</button>
                <button onClick={clearAll} className="filter-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Icon icon="material-symbols:close-small" width={20}  /> Hapus Semua</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '0.8rem', marginTop: '1rem' }}>
                {visible.map(m => (
                  <div key={m.id} onClick={() => toggleMotor(m.id)}
                    style={{ background: 'var(--surface2)', border: `2px solid ${selectedIds.has(m.id) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', padding: '0.9rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ float: 'right', opacity: selectedIds.has(m.id) ? 1 : 0 }}><MdOutlineCheck /></span>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.tipe} · {m.cc}cc · Rp{(m.harga / 1e6).toFixed(1)}jt</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                Terpilih: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{selectedIds.size}</span> motor
                {selectedIds.size < 2 && <span style={{ color: 'var(--danger)', marginLeft: '1rem' }}><MdWarning /> Pilih minimal 2 motor</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>{btnNext(1)}</div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="card">
              <div className="card-title">Atur Bobot Kriteria</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Geser slider untuk menentukan bobot kepentingan tiap kriteria (1 = rendah, 10 = sangat tinggi).</p>
              {KRITERIA.map(k => (
                <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface2)', borderRadius: '10px', marginBottom: '0.8rem' }}>
                  <div><div style={{ fontWeight: 600 }}>{k.label}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{k.desc}</div></div>
                  <input type="range" min="1" max="10" step="1" value={bobot[k.id as keyof typeof bobot]} onChange={e => setBobot(b => ({ ...b, [k.id]: +e.target.value }))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)', textAlign: 'center' }}>{bobot[k.id as keyof typeof bobot]}</div>
                </div>
              ))}
              <div style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--accent)', padding: '1rem 1.2rem', borderRadius: '0 8px 8px 0', marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>Rumus Normalisasi:</strong><br />rij = xij / max(xij) <TiArrowRight size={16} /> jika <em>benefit</em><br />rij = min(xij) / xij <TiArrowRight size={16}/> jika <em>cost</em>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>{btnPrev(0)}{btnNext(2, 'Hitung →')}</div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && normalized.length > 0 && (
          <div>
            <div className="section-label">Matriks Keputusan Awal (X)</div>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%' }}>
                <thead><tr><th>Alternatif</th>{KRITERIA.map(k => <th key={k.id}>{k.id} — {k.label.split(' ')[0]}</th>)}</tr></thead>
                <tbody>{normalized.map(m => <tr key={m.id}><td><strong>{m.nama}</strong></td>{KRITERIA.map(k => <td key={k.id} style={{ fontFamily: 'var(--font-mono)' }}>{k.key === 'harga' ? fmt(m[k.key] as number) : m[k.key]}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="section-label">Matriks Normalisasi (R)</div>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%' }}>
                <thead><tr><th>Alternatif</th>{KRITERIA.map(k => <th key={k.id}>r_{k.id}</th>)}</tr></thead>
                <tbody>{normalized.map(m => <tr key={m.id}><td><strong>{m.nama}</strong></td>{KRITERIA.map(k => <td key={k.id} style={{ fontFamily: 'var(--font-mono)' }}>{f4(m[`r_${k.id}`] as number)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="section-label">Nilai Preferensi Vi = Σ(wj * rij)</div>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%' }}>
                <thead><tr><th>Rank</th><th>Alternatif</th>{KRITERIA.map(k => <th key={k.id}>w{bobot[k.id as keyof typeof bobot]} * r_{k.id}</th>)}<th>Vi</th></tr></thead>
                <tbody>{sawResult.map((m, i) => (
                  <tr key={m.id} style={{ background: i === 0 ? 'rgba(245,200,66,0.04)' : '' }}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                    <td><strong>{m.nama}</strong>{i === 0 && <span style={{ background: 'var(--accent)', color: '#0a0a0f', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, marginLeft: '0.5rem' }}>TERBAIK</span>}</td>
                    {KRITERIA.map(k => <td key={k.id} style={{ fontFamily: 'var(--font-mono)' }}>{f4(bobot[k.id as keyof typeof bobot] * (m[`r_${k.id}`] as number))}</td>)}
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>{f4(m.vi)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>{btnPrev(1)}{btnNext(3, 'Lihat Hasil →')}</div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && sawResult.length > 0 && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,rgba(245,200,66,0.12),var(--surface))', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', gap: '5px' }}><GiChampions size={25}/> Rekomendasi Terbaik</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--accent)', letterSpacing: '2px' }}>{sawResult[0].nama}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Nilai Vi = {f4(sawResult[0].vi)}</div>
              <span className={`td-type ${sawResult[0].tipe === 'Matic' ? 'type-matic' : sawResult[0].tipe === 'Moped' ? 'type-moped' : 'type-sport'}`} style={{ display: 'inline-block', marginTop: '0.8rem' }}>{sawResult[0].tipe}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginTop: '1.5rem', textAlign: 'center' }}>
                <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Harga</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{'Rp ' + sawResult[0].harga.toLocaleString('id-ID')}</div></div>
                <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tangki</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{sawResult[0].tangki} L</div></div>
                <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CC</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{sawResult[0].cc} cc</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Peringkat Lengkap</div>
              {sawResult.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '2rem', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-muted)' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}><strong>{m.nama}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.tipe} · {m.cc}cc</span></div>
                  <div style={{ width: '80px', height: '5px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--accent)', width: `${(m.vi / sawResult[0].vi * 100).toFixed(1)}%` }}></div></div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.88rem' }}>{f4(m.vi)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              {btnPrev(2)}
              <Link href="/hasil" onClick={() => localStorage.setItem('sawResult', JSON.stringify(sawResult))} style={{ padding: '0.7rem 1.8rem', background: 'var(--accent)', color: '#0a0a0f', borderRadius: 'var(--radius)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>Lihat Ranking Penuh <TiArrowRight size={25}/></Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
