'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { getMotors, createMotor, updateMotor, deleteMotor, Motor } from '@/lib/api';
import { FaFileCsv } from "react-icons/fa6";
import { BsDatabaseAdd } from "react-icons/bs";
import { ImPencil2 } from "react-icons/im";
import { MdDeleteForever } from "react-icons/md";
import { FaMoneyBillWave, FaGasPump, FaCog } from "react-icons/fa";
import { Icon } from '@iconify/react';
import { LuNotepadText } from "react-icons/lu";




const kriteriaIcons: Record<string, React.ReactNode> = {
  'C1 — Harga': <FaMoneyBillWave color='rgba(59, 195, 59, 0.53)' />,
  'C2 — Kapasitas Tangki': <FaGasPump color='rgba(207, 25, 25, 0.4)'/>,
  'C3 — Volume Silinder (CC)': <FaCog  color='rgba(197, 173, 183, 0.4)'/>,
};

const kriteriaData = [
  ['C1 — Harga', '5', 'Benefit'],
  ['C2 — Kapasitas Tangki', '3', 'Benefit'],
  ['C3 — Volume Silinder (CC)', '4', 'Benefit'],
];



const fmt = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID');

const emptyForm = (): Motor => ({ id: '', nama: '', tipe: 'Matic', harga: 0, tangki: 0, cc: 0 });

export default function DataPage() {
  const { showToast } = useToast();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: keyof Motor | null; asc: boolean }>({ key: null, asc: true });
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(''); // original id when editing
  const [form, setForm] = useState<Motor>(emptyForm());

  const load = useCallback(async () => {
    try {
      const data = await getMotors();
      setMotors(data);
    } catch {
      showToast('Gagal memuat data. Pastikan API berjalan.', 'error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const getFiltered = () => {
    let list = [...motors];
    if (filter !== 'all') list = list.filter(m => m.tipe === filter);
    if (search) list = list.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()));
    if (sort.key) list.sort((a, b) => {
      const av = a[sort.key!], bv = b[sort.key!];
      return sort.asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  };

  const handleSort = (key: keyof Motor) => setSort(s => ({ key, asc: s.key === key ? !s.asc : true }));

  const openAdd = () => { setEditId(''); setForm(emptyForm()); setModal(true); };
  const openEdit = (m: Motor) => { setEditId(m.id); setForm({ ...m }); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateMotor(editId, form);
        showToast('Motor berhasil diupdate!', 'success');
      } else {
        await createMotor(form);
        showToast('Motor berhasil ditambahkan!', 'success');
      }
      setModal(false);
      load();
    } catch {
      showToast('Gagal menyimpan!', 'error');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<Motor | null>(null);

  const del = async (motor: Motor) => {
    setDeleteConfirm(motor);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMotor(deleteConfirm.id);
      showToast('Motor dihapus!', 'success');
      setDeleteConfirm(null);
      load();
    } catch {
      showToast('Gagal menghapus!', 'error');
    }
  };

  const exportCSV = () => {
    const list = getFiltered();
    if (!list.length) { showToast('Tidak ada data!', 'error'); return; }
    let csv = '\uFEFFID,Nama Motor,Tipe,Harga,Tangki,CC\n';
    list.forEach(m => csv += `${m.id},"${m.nama}","${m.tipe}",${m.harga},${m.tangki},${m.cc}\n`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'data-motor.csv'; a.click();
    showToast(`Berhasil export ${list.length} data!`, 'success');
  };

  const list = getFiltered();
  const hargaList = list.map(m => m.harga);
  const ccList = list.map(m => m.cc);

  return (
    <>
      <div className="page-hero">
        <div className="hero-badge">Dataset</div>
        <h1>Data Motor Honda</h1>
        <p>16 alternatif kendaraan roda dua Honda dengan spesifikasi Harga, Kapasitas Tangki, dan Volume Silinder (CC).</p>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {['all', 'Matic', 'Moped', 'Sport'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Semua' : f}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Cari nama motor..."
            style={{ padding: '0.4rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '99px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', marginLeft: 'auto', width: '220px' }} />
          <button onClick={exportCSV} style={{ padding: '0.4rem 1rem', background: 'var(--success)', color: '#000', border: 'none', borderRadius: '99px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}><FaFileCsv /> Export CSV</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }} data-reveal="up">
          <div className="stat-card"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Motor</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--accent)' }}>{list.length}</div></div>
          <div className="stat-card"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Harga Terendah</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--success)' }}>{list.length ? fmt(Math.min(...hargaList)) : '—'}</div></div>
          <div className="stat-card"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Harga Tertinggi</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--danger)' }}>{list.length ? fmt(Math.max(...hargaList)) : '—'}</div></div>
          <div className="stat-card"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>CC Terbesar</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--accent2)' }}>{list.length ? Math.max(...ccList) + ' cc' : '—'}</div></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={openAdd} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}><BsDatabaseAdd /> Tambah Motor</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {(['id', 'nama', null, 'harga', 'tangki', 'cc'] as const).map((k, i) => (
                  <th key={i} style={{ cursor: k ? 'pointer' : 'default' }} onClick={() => k && handleSort(k)}>
                    {['ID ↕', 'Nama Motor ↕', 'Tipe', 'Harga (Rp) ↕', 'Tangki (L) ↕', 'CC ↕', 'Aksi'][i]}
                  </th>
                ))}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada data ditemukan.</td></tr>
              ) : list.map((m, i) => (
                <tr key={m.id} className="fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="td-num">{m.id}</td>
                  <td><strong>{m.nama}</strong></td>
                  <td><span className={`td-type ${m.tipe === 'Matic' ? 'type-matic' : m.tipe === 'Moped' ? 'type-moped' : 'type-sport'}`}>{m.tipe}</span></td>
                  <td className="td-num">{fmt(m.harga)}</td>
                  <td className="td-num">{m.tangki} L</td>
                  <td className="td-num">{m.cc} cc</td>
                  <td style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => openEdit(m)} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}><ImPencil2 /></button>
                    <button onClick={() => del(m)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}><MdDeleteForever /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CRUD Modal */}
        {modal && (
          <div className="detail-modal open" onClick={() => setModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxWidth: '800px', width: '95%', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,var(--surface2),var(--surface))', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>{editId ? 'EDIT DATA' : 'TAMBAH BARU'}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text)', letterSpacing: '1px', margin: 0 }}>{editId ? form.nama : 'Motor Baru'}</h3>
                </div>
                <button onClick={() => setModal(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
              <form onSubmit={save} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="form-group"><label>ID Motor</label><input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="A17" required style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center' }} /></div>
                    <div className="form-group"><label>Nama Motor</label><input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Masukkan nama motor..." required /></div>
                    <div className="form-group">
                      <label>Tipe Motor</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Matic', 'Moped', 'Sport'].map(t => (
                          <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipe: t }))}
                            style={{ flex: 1, padding: '0.8rem 0.5rem', background: 'var(--surface2)', border: `2px solid ${form.tipe === t ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: form.tipe === t ? 'var(--accent)' : 'var(--text)' }}>
                            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.3rem' }}>{t === 'Matic' ? <Icon icon="healthicons:vespa-motorcycle" /> : t === 'Moped' ? <Icon icon="healthicons:cross-country-motorcycle" /> : <Icon icon="emojione:motorcycle" />}</span>{t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="form-group"><label><FaMoneyBillWave /> Harga (Rp)</label><input type="number" value={form.harga || ''} onChange={e => setForm(f => ({ ...f, harga: Number(e.target.value) }))} placeholder="10000000" required style={{ fontFamily: 'var(--font-mono)' }} onWheel={e => (e.target as HTMLElement).blur()} /></div>
                    <div className="form-group"><label><FaGasPump /> Kapasitas Tangki (L)</label><input type="number" step="0.1" value={form.tangki || ''} onChange={e => setForm(f => ({ ...f, tangki: Number(e.target.value) }))} placeholder="5.5" required style={{ fontFamily: 'var(--font-mono)' }} onWheel={e => (e.target as HTMLElement).blur()} /></div>
                    <div className="form-group"><label><FaCog /> Volume Silinder (CC)</label><input type="number" value={form.cc || ''} onChange={e => setForm(f => ({ ...f, cc: Number(e.target.value) }))} placeholder="150" required style={{ fontFamily: 'var(--font-mono)' }} onWheel={e => (e.target as HTMLElement).blur()} /></div>
                    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}><LuNotepadText /> Preview Data</div>
                      {[['ID', form.id || '-'], ['Nama', form.nama || '-'], ['Tipe', form.tipe], ['Harga', 'Rp ' + (form.harga || 0).toLocaleString('id-ID')], ['Tangki', (form.tangki || '-') + ' L'], ['CC', (form.cc || '-') + ' cc']].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                  <button type="submit" style={{ flex: 2, padding: '0.8rem', background: 'linear-gradient(135deg,var(--accent),#ffd84d)', color: '#0a0a0f', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
                    {editId ? ' Update Motor' : ' Simpan Motor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxWidth: '420px', width: '95%', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg,rgba(248,113,113,0.12),var(--surface))', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}><MdDeleteForever /></div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>KONFIRMASI HAPUS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', letterSpacing: '1px' }}>{deleteConfirm.nama}</div>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>Data motor berikut akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
                  {[['ID', deleteConfirm.id], ['Tipe', deleteConfirm.tipe], ['Harga', fmt(deleteConfirm.harga)], ['CC', deleteConfirm.cc + ' cc']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                  <button onClick={confirmDelete} style={{ flex: 1, padding: '0.75rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 700 }}><MdDeleteForever /> Hapus</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '3rem' }}>
        <div className="section-label" data-reveal="left">Keterangan Kriteria</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginTop: '1rem' }}>
          {kriteriaData.map(([label, bobot, type]) => (
            <div key={label} className="card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {kriteriaIcons[label]}
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Bobot: <b style={{ color: 'var(--accent)' }}>{bobot}</b> · Tipe: <b style={{ color: 'var(--success)' }}>{type}</b>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
