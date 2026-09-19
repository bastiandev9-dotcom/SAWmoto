import Link from 'next/link';
import { BsFillJournalBookmarkFill } from "react-icons/bs";
import { RiFormula } from "react-icons/ri";
import { IoStatsChart } from "react-icons/io5";
import { CiCalculator2 } from "react-icons/ci";
import { FaRankingStar } from "react-icons/fa6";
import { SiNextdotjs, SiNodedotjs, SiMongodb, SiReact, SiChartdotjs, SiTypescript, SiExpress, SiMongoose, SiIconify, SiJavascript, SiTailwindcss } from 'react-icons/si';


const techIcons: Record<string, React.ReactNode> = {
  'Next.js 16': <SiNextdotjs size={20} />,
  'Node.js': <SiNodedotjs size={20} color="#4ade80" />,
  'Express': <SiExpress size={20} color="#4ade80" />,
  'MongoDB': <SiMongodb size={20} color="#4ade80" />,
  'Mongoose': <SiMongoose size={20} color="#ed2727" />,
  'React 19': <SiReact size={20} color="#60a5fa" />,
  'Tailwind CSS': <SiTailwindcss size={20} color="#106cdd" />,
  'Chart.js': <SiChartdotjs size={20} color="#f97316" />,
  'TypeScript': <SiTypescript size={20} color="#003980" />,
  'Javascript': <SiJavascript size={20} color="#fbff2a" />,
  'Iconify': <SiIconify size={20} color="#683907" />,
  'React Icons': <SiReact size={20} color="#ed2727" />,
};

const techData = [
  ['Next.js 16', 'Frontend Framework', '#ffff'],
  ['Node.js', 'Backend Runtime', '#4ade80'],
  ['Express', 'Backend Framework', '#4ade80'],
  ['MongoDB', 'Database', '#4ade80'],
  ['Mongoose', 'Database ODM', '#ed2727'],
  ['React 19', 'UI Library', '#60a5fa'],
  ['Tailwind CSS', 'Styling Library', '#106cdd'],
  ['Chart.js', 'Visualisasi Data', '#f97316'],
  ['TypeScript', 'Type Safety', '#003980'],
  ['Javascript', 'Programming Language', '#fbff2a'],
  ['Iconify', 'Icon Library', '#683907'],
  ['React Icons', 'Icon Library', '#ed2727'],
];


export default function TentangPage() {
  return (
    <>
      <div className="page-hero">
        <div className="hero-badge">Dokumentasi</div>
        <h1>Tentang Sistem</h1>
        <p>Informasi lengkap tentang metode SAW, cara perhitungan, referensi jurnal, dan identitas pengembang.</p>
      </div>

      <div className="about-layout">
        <div className="about-content">
          <div className="formula-section" data-reveal="up">
            <h3>Apa itu SAW?</h3>
            <p>Simple Additive Weighting (SAW) adalah metode pengambilan keputusan multi-kriteria yang paling banyak digunakan. Metode ini mencari penjumlahan terbobot dari rating kinerja pada setiap alternatif di semua atribut.</p>
            <p>Konsepnya sederhana, mudah dipahami, komputasinya efisien, dan memiliki kemampuan untuk mengukur kinerja relatif dari alternatif-alternatif keputusan dalam bentuk matematis yang sederhana <em style={{ color: 'var(--text-muted)' }}>(MacCrimmon, 1968)</em>.</p>
          </div>

          <div className="formula-section" data-reveal="up">
            <h3><RiFormula />  Rumus & Langkah Perhitungan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text)' }}>Langkah 1 — Tentukan Kriteria (Ci)</strong></p>
            <div className="formula-block">
              <em>C1</em> = Harga Motor &#8594; atribut <strong>Benefit</strong><br />
              <em>C2</em> = Kapasitas Tangki &#8594; atribut <strong>Benefit</strong><br />
              <em>C3</em> = Volume Silinder (CC) &#8594; atribut <strong>Benefit</strong>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '1.2rem' }}><strong style={{ color: 'var(--text)' }}>Langkah 2 — Tentukan Bobot (W)</strong></p>
            <div className="formula-block">W = (<strong>w1</strong>, <strong>w2</strong>, <strong>w3</strong>) = (5, 3, 4)</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '1.2rem' }}><strong style={{ color: 'var(--text)' }}>Langkah 3 — Normalisasi Matriks (rij)</strong></p>
            <div className="formula-block">
              r<sub>ij</sub> = x<sub>ij</sub> / Max(x<sub>ij</sub>) → Benefit<br />
              r<sub>ij</sub> = Min(x<sub>ij</sub>) / x<sub>ij</sub> → Cost
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '1.2rem' }}><strong style={{ color: 'var(--text)' }}>Langkah 4 — Hitung Nilai Preferensi (Vi)</strong></p>
            <div className="formula-block">
              V<sub>i</sub> = Σ ( w<sub>j</sub> * r<sub>ij</sub> )<br />
              V<sub>i</sub> = 5*r<sub>C1</sub> + 3*r<sub>C2</sub> + 4*r<sub>C3</sub><br /><br />
              <strong>Alternatif dengan Vi terbesar = Rekomendasi Terbaik</strong>
            </div>
          </div>

          <div className="formula-section" data-reveal="up">
            <h3>Alur Kerja Sistem</h3>
            <div className="flow-steps">
              {[['01','Input Data','Masukkan data alternatif motor beserta nilai tiap kriteria'],['02','Tentukan Bobot','Atur bobot kepentingan tiap kriteria sesuai prioritas konsumen'],['03','Normalisasi','Hitung rij menggunakan rumus benefit atau cost'],['04','Hitung Vi','Kalikan bobot dengan nilai normalisasi lalu jumlahkan'],['05','Ranking','Urutkan dari Vi terbesar. Motor dengan Vi tertinggi = terbaik']].map(([num, title, desc]) => (
                <div key={num} className="flow-step" data-reveal="up" data-num={num}>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="formula-section" data-reveal="up">
            <h3><BsFillJournalBookmarkFill />  Referensi</h3>
            <ul className="ref-list">
              {[
                ['Sarmadi & Effiyaldi (2018)', 'Analisis dan Perancangan Sistem Pendukung Keputusan Pemilihan Kendaraan Roda Dua Menggunakan Metode SAW. Jurnal Manajemen Sistem Informasi Vol.3, No.1.'],
                ['MacCrimmon, K.R. (1968)', 'Decision Making Among Multiple-Attribute Alternatives: A Survey and Consolidated Approach. RAND Memorandum.'],
                ['Turban, E., Aronson, J.E. & Liang, T.T. (2005)', 'Decision Support Systems and Intelligent Systems. Prentice Hall.'],
                ['Kusrini & Alter (2007)', 'Sistem Penunjang Keputusan — sistem informasi interaktif yang menyediakan informasi, pemodelan, dan pemanipulasian data.'],
                ['Adhi Putra Guntur (2014)', 'Sistem Pendukung Keputusan Pemilihan Kendaraan Roda Dua SAW.'],
              ].map(([author, desc]) => (
                <li key={author} data-reveal="left"><strong>{author}</strong>{desc}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="profile-card" data-reveal="scale" style={{ marginBottom: '1.5rem' }}>
            <div className="profile-avatar">OB</div>
            <div className="profile-name">Ogi Bastian</div>
            <div className="profile-detail">Fakultas Teknik dan Informatika<br />Universitas PGRI Semarang</div>
          </div>

          <div className="info-card" data-reveal="right" style={{ marginBottom: '1.5rem' }}>
            <h3>Spesifikasi Sistem</h3>
            {[['Metode','SAW'],['Alternatif','16 motor'],['Kriteria','3 kriteria'],['Bobot C1','5 (Harga, Benefit)'],['Bobot C2','3 (Tangki, Benefit)'],['Bobot C3','4 (CC, Benefit)'],['Studi Kasus','PT. Sinar Sentosa'],['Produk','Honda']].map(([k, v]) => (
              <div key={k} className="info-row"><span>{k}</span><span>{v}</span></div>
            ))}
          </div>

          <div className="info-card" data-reveal="right">
            <h3>Navigasi Cepat</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link href="/data" className="btn-secondary" style={{ textAlign: 'center' }}><IoStatsChart color='#fbff2a'/> Data Motor</Link>
              <Link href="/hitung" className="btn-secondary" style={{ textAlign: 'center' }}><CiCalculator2 color='#fbff2a'/> Kalkulator SAW</Link>
              <Link href="/hasil" className="btn-secondary" style={{ textAlign: 'center' }}><FaRankingStar color='#fbff2a'/> Ranking</Link>
            </div>
          </div>

          <div className="info-card" data-reveal="right" style={{ marginTop: '1.5rem' }}>
            <h3>Tech Stack</h3>
            {techData.map(([name, role, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.2rem', width: '1.5rem', textAlign: 'center' }}>
                  {techIcons[name]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{role}</div>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
