'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { getMotors, calculateSAW, Motor, RankedMotor } from '@/lib/api';

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const f4 = (n: number) => parseFloat(n.toFixed(4));

export default function BandingkanPage() {
  const { showToast } = useToast();
  const [motors, setMotors] = useState<RankedMotor[]>([]);
  const [left, setLeft] = useState<RankedMotor | null>(null);
  const [right, setRight] = useState<RankedMotor | null>(null);

  useEffect(() => {
    Promise.all([calculateSAW(), getMotors()]).then(([saw]) => {
      setMotors(saw);
    }).catch(() => showToast('❌ Gagal memuat data!', 'error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const specs: { key: keyof Motor; label: string; fmt: (v: number) => string }[] = [
    { key: 'harga', label: '💰 Harga', fmt: fmt },
    { key: 'tangki', label: '⛽ Tangki', fmt: v => v + ' L' },
    { key: 'cc', label: '⚙️ CC', fmt: v => v + ' cc' },
  ];

  const winner = left && right ? (left.vi > right.vi ? 'left' : right.vi > left.vi ? 'right' : 'draw') : null;

  const typeClass = (tipe: string) => tipe === 'Matic' ? 'type-matic' : tipe === 'Moped' ? 'type-moped' : 'type-sport';

  return (
    <>
      <div className="page-hero">
        <div className="hero-badge">Komparasi</div>
        <h1>Bandingkan Motor</h1>
        <p>Pilih 2 motor untuk dibandingkan spesifikasi dan skor SAW-nya secara side-by-side.</p>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        {/* Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '0.5rem' }}>Motor A</div>
            <select value={left?.id || ''} onChange={e => setLeft(motors.find(m => m.id === e.target.value) || null)}
              style={{ width: '100%', padding: '0.7rem 1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">— Pilih Motor —</option>
              {motors.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.tipe})</option>)}
            </select>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '1.5rem' }}>VS</div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '0.5rem' }}>Motor B</div>
            <select value={right?.id || ''} onChange={e => setRight(motors.find(m => m.id === e.target.value) || null)}
              style={{ width: '100%', padding: '0.7rem 1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">— Pilih Motor —</option>
              {motors.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.tipe})</option>)}
            </select>
          </div>
        </div>

        {/* Comparison */}
        {left && right ? (
          <div>
            {/* Winner Banner */}
            {winner !== 'draw' && (
              <div style={{ background: 'linear-gradient(135deg,rgba(245,200,66,0.12),var(--surface))', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Rekomendasi SAW</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)', letterSpacing: '2px' }}>
                  {winner === 'left' ? left.nama : right.nama}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Vi = {f4(winner === 'left' ? left.vi : right.vi)} &nbsp;|&nbsp; Rank #{winner === 'left' ? left.rank : right.rank}
                </div>
              </div>
            )}

            {/* Side by side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {[left, right].map((m, i) => (
                <div key={m.id} style={{ background: 'var(--surface)', border: `1px solid ${(i === 0 && winner === 'left') || (i === 1 && winner === 'right') ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '1.5rem', position: 'relative' }}>
                  {((i === 0 && winner === 'left') || (i === 1 && winner === 'right')) && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#0a0a0f', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.8rem', borderRadius: '99px' }}>TERBAIK</div>
                  )}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '0.3rem' }}>{m.nama}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className={`td-type ${typeClass(m.tipe)}`}>{m.tipe}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rank #{m.rank}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.2rem' }}>{f4(m.vi)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Nilai Vi</div>
                  {/* Vi bar */}
                  <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.2rem' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: '99px', width: `${(m.vi / Math.max(left.vi, right.vi) * 100).toFixed(1)}%`, transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spec comparison table */}
            <div className="card">
              <div className="card-title">Perbandingan Spesifikasi</div>
              {specs.map(({ key, label, fmt: fmtFn }) => {
                const lv = left[key] as number, rv = right[key] as number;
                const lWin = lv > rv, rWin = rv > lv;
                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: lWin ? 700 : 400, color: lWin ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                      {fmtFn(lv)} {lWin && '◀'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: rWin ? 700 : 400, color: rWin ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                      {rWin && '▶ '}{fmtFn(rv)}
                    </div>
                  </div>
                );
              })}
              {/* SAW Score row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', padding: '0.8rem 0' }}>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: winner === 'left' ? 700 : 400, color: winner === 'left' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {f4(left.vi)} {winner === 'left' && '◀'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 700 }}>⭐ Nilai Vi</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: winner === 'right' ? 700 : 400, color: winner === 'right' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {winner === 'right' && '▶ '}{f4(right.vi)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pilih 2 Motor</div>
            <div style={{ fontSize: '0.9rem' }}>Gunakan dropdown di atas untuk memilih motor yang ingin dibandingkan</div>
          </div>
        )}
      </div>
    </>
  );
}
