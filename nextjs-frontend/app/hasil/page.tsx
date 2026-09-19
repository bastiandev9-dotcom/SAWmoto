'use client';
import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { useToast } from '@/components/Toast';
import { calculateSAW, getMotors, Motor, RankedMotor } from '@/lib/api';
import { Icon } from '@iconify/react';
import { IoStatsChart } from "react-icons/io5";
import { RiDonutChartFill } from "react-icons/ri";
import { FaFilePdf } from "react-icons/fa6";





ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const f4 = (n: number) => parseFloat(n.toFixed(4));
const medals: Record<number, React.ReactNode> = { 1: <Icon icon="emojione:1st-place-medal" />, 2: <Icon icon="emojione:2nd-place-medal" />, 3: <Icon icon="emojione:3rd-place-medal" /> };

export default function HasilPage() {
  const { showToast } = useToast();
  const [ranked, setRanked] = useState<RankedMotor[]>([]);
  const [allMotors, setAllMotors] = useState<Motor[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<RankedMotor | null>(null);

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Ranking Motor Honda - Metode SAW', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Bobot: C1(Harga)=5, C2(Tangki)=3, C3(CC)=4  |  Total: ${ranked.length} motor  |  ${new Date().toLocaleDateString('id-ID')}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [['Rank', 'Nama Motor', 'Tipe', 'Harga (Rp)', 'Tangki (L)', 'CC', 'Nilai Vi']],
      body: ranked.map(m => [m.rank, m.nama, m.tipe, fmt(m.harga), m.tangki + ' L', m.cc + ' cc', f4(m.vi)]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 200, 66], textColor: [10, 10, 15], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      rowPageBreak: 'auto',
    });

    doc.save('ranking-motor-saw.pdf');
    showToast(' PDF berhasil diexport!', 'success');
  };

  useEffect(() => {
    const saved = localStorage.getItem('sawResult');
    if (saved) {
      try {
        const parsed: RankedMotor[] = JSON.parse(saved);
        const withRank = parsed.map((m, i) => ({ ...m, rank: i + 1 }));
        setRanked(withRank);
        setAllMotors(withRank as unknown as Motor[]);
        return;
      } catch { /* fallback to API */ }
    }
    Promise.all([calculateSAW(), getMotors()]).then(([saw, motors]) => {
      setRanked(saw);
      setAllMotors(motors);
    }).catch(() => showToast(' Gagal memuat ranking!', 'error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ranked.length) return <div style={{ padding: '4rem', textAlign: 'center' }}>Memuat data ranking...</div>;

  const maxVi = ranked[0].vi;
  const top3 = ranked.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumCls = ['pod-2', 'pod-1', 'pod-3'];
  const podiumMedals = [<Icon icon="emojione:2nd-place-medal" />, <Icon icon="emojione:1st-place-medal" />, <Icon icon="emojione:3rd-place-medal" />];
  const podiumNums = ['2', '1', '3'];

  const top10 = ranked.slice(0, 10);
  const barData = {
    labels: top10.map(m => m.nama),
    datasets: [{ label: 'Nilai Vi', data: top10.map(m => m.vi), backgroundColor: top10.map((_, i) => i === 0 ? 'rgba(245,200,66,0.8)' : i === 1 ? 'rgba(192,192,192,0.6)' : i === 2 ? 'rgba(205,127,50,0.6)' : 'rgba(74,111,165,0.4)'), borderWidth: 1, borderRadius: 8 }]
  };
  const tipeCount = { Matic: 0, Moped: 0, Sport: 0 };
  ranked.forEach(m => tipeCount[m.tipe as keyof typeof tipeCount]++);
  const pieData = {
    labels: ['Matic', 'Moped', 'Sport'],
    datasets: [{ data: [tipeCount.Matic, tipeCount.Moped, tipeCount.Sport], backgroundColor: ['rgba(74,222,128,0.7)', 'rgba(245,200,66,0.7)', 'rgba(255,107,53,0.7)'], borderColor: '#12121a', borderWidth: 2 }]
  };

  const getNorm = (motor: RankedMotor, key: keyof Motor) => {
    const vals = allMotors.map(m => m[key] as number);
    if (key === 'harga') return Math.min(...vals) / (motor[key] as number);
    return (motor[key] as number) / Math.max(...vals);
  };

  const filteredRanked = filter === 'all' ? ranked : ranked.filter(m => m.tipe === filter);

  return (
    <>
      <div className="page-hero">
        <div className="hero-badge">Hasil SAW</div>
        <h1>Ranking Motor Honda</h1>
        <p>Peringkat 16 motor Honda berdasarkan metode SAW dengan bobot W = (5, 3, 4).</p>
      </div>

      <div className="ranking-layout">
        <div className="section-label">Podium Teratas</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', margin: '2rem 0 3rem' }}>
          {podiumOrder.map((m, i) => m && (
            <div key={m.id} className={`podium-item ${podiumCls[i]}`}>
              <div className="podium-avatar">{podiumMedals[i]}</div>
              <div className="podium-name">{m.nama}</div>
              <div className="podium-score">{f4(m.vi)}</div>
              <div className="podium-block">{podiumNums[i]}</div>
            </div>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: '2rem' }}><IoStatsChart /> Grafik Perbandingan</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '1rem 0 2rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}><IoStatsChart /> Nilai Vi (Bar Chart)</h4>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#7a7a9a' }, grid: { color: 'rgba(42,42,62,0.5)' } }, x: { ticks: { color: '#7a7a9a', maxRotation: 45 }, grid: { display: false } } } }} />
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><RiDonutChartFill size={20}/> Distribusi Tipe Motor</h4>
            <Doughnut data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#e8e8f0', padding: 15 } } } }} />
          </div>
        </div>

        <div className="section-label">Grafik Nilai Vi</div>
        <div className="card" style={{ marginTop: '1rem', marginBottom: '2.5rem' }}>
          {ranked.map(m => {
            const pct = (m.vi / maxVi * 100).toFixed(1);
            const color = m.rank === 1 ? '#f5c842' : m.rank <= 3 ? '#ff6b35' : '#4a6fa5';
            return (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '12rem 1fr 5rem', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <div><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.rank}. {m.nama}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.tipe}</div></div>
                <div style={{ height: '10px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden' }}><div style={{ height: '100%', background: color, borderRadius: '99px', width: pct + '%', transition: 'width 1s ease' }}></div></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent)', textAlign: 'right' }}>{f4(m.vi)}</div>
              </div>
            );
          })}
        </div>

        <div className="section-label">Ranking Lengkap</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {['all', 'Matic', 'Moped', 'Sport'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'Semua' : f}</button>
            ))}
          </div>
          <button onClick={exportPDF} style={{ padding: '0.4rem 1.2rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '99px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}><FaFilePdf /> Export PDF</button>
        </div>

        <div className="rank-grid">
          {filteredRanked.map(m => {
            const pct = (m.vi / maxVi * 100).toFixed(1);
            const cls = m.rank === 1 ? 'gold' : m.rank === 2 ? 'silver' : m.rank === 3 ? 'bronze' : '';
            const tc = m.tipe === 'Matic' ? 'type-matic' : m.tipe === 'Moped' ? 'type-moped' : 'type-sport';
            return (
              <div key={m.id} className={`rank-item ${cls} fade-up`} onClick={() => setSelected(m)}>
                <div className="rank-num">{m.rank}</div>
                <div><div className="rank-name">{m.nama}</div><div className="rank-tipe"><span className={`td-type ${tc}`}>{m.tipe}</span> · {fmt(m.harga)} · {m.cc}cc · {m.tangki}L</div></div>
                <div className="rank-bar-wrap"><div className="rank-bar" data-width={pct + '%'} style={{ width: pct + '%' }}></div></div>
                <div className="rank-score">{f4(m.vi)}</div>
                <div className="rank-medal">{medals[m.rank] || ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', maxWidth: '480px', width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '0.3rem' }}>{selected.nama}</div>
            <span className={`td-type ${selected.tipe === 'Matic' ? 'type-matic' : selected.tipe === 'Moped' ? 'type-moped' : 'type-sport'}`}>{selected.tipe}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Rank #{selected.rank} {medals[selected.rank] || ''}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', margin: '1.2rem 0' }}>
              {[['Harga', fmt(selected.harga)], ['Tangki', selected.tangki + ' L'], ['CC', selected.cc + ' cc']].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: l === 'Harga' ? '0.78rem' : '1rem', marginTop: '0.2rem' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Detail SAW</div>
            {allMotors.length > 0 && (() => {
              const rC1 = getNorm(selected, 'harga'), rC2 = getNorm(selected, 'tangki'), rC3 = getNorm(selected, 'cc');
              return (
                <div>
                  {[['r_C1 (Harga)', f4(rC1)], ['r_C2 (Tangki)', f4(rC2)], ['r_C3 (CC)', f4(rC3)], [`Vi = 5×${f4(rC1)} + 3×${f4(rC2)} + 4×${f4(rC3)}`, f4(selected.vi)]].map(([l, v]) => (
                    <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
