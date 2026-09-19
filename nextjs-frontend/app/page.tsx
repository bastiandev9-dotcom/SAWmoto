'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { FaMotorcycle, FaRankingStar } from "react-icons/fa6";
import { CiCalculator2 } from "react-icons/ci";
import { BsArrowRight } from "react-icons/bs";
import { RxDoubleArrowRight } from "react-icons/rx";



export default function HomePage() {
  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('[data-countup]').forEach(el => {
        const target = parseFloat(el.dataset.countup || '0');
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1000, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(ease * target).toLocaleString('id-ID');
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString('id-ID');
        };
        requestAnimationFrame(tick);
      });
    }, 1600);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-bg-text">SAW</div>
        <div className="hero-content">
          <div className="hero-badge">Sistem Pendukung Keputusan</div>
          <h1 className="hero-title">Temukan Motor<br /><span className="accent glitch" data-text="Terbaik">Terbaik</span> Untukmu</h1>
          <p className="hero-sub">Menggunakan metode <strong>Simple Additive Weighting (SAW)</strong> untuk merekomendasikan kendaraan roda dua Honda berdasarkan Harga, Kapasitas Tangki, dan Volume Silinder (CC).</p>        
          <div className="hero-buttons">
            <Link href="/hitung" className="btn-primary">Mulai Hitung <RxDoubleArrowRight size={20} /></Link>
            <Link href="/data" className="btn-outline">Lihat Data</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card card-float"><div className="vc-label">Metode</div><div className="vc-value">SAW</div></div>
          <div className="visual-card card-float2"><div className="vc-label">Alternatif</div><div className="vc-value" data-countup="16">0</div></div>
          <div className="visual-card card-float3"><div className="vc-label">Kriteria</div><div className="vc-value" data-countup="3">0</div></div>
          <div className="hero-circle"></div>
        </div>
      </section>

      <section className="section features">
        <div className="section-label" data-reveal="left">Fitur Utama</div>
        <div className="features-grid">
          <div className="feat-card" data-reveal="up">
            <div className="feat-icon"><FaMotorcycle /></div>
            <h3>Data Motor</h3>
            <p>Lihat tabel lengkap 16 jenis motor Honda beserta spesifikasi harga, tangki, dan CC.</p>
            <Link href="/data" className="feat-link">Buka <RxDoubleArrowRight size={19}/></Link>
          </div>
          <div className="feat-card highlight" data-reveal="up">
            <div className="feat-icon"><CiCalculator2 /></div>
            <h3>Kalkulator SAW</h3>
            <p>Input nilai alternatif dan bobot kriteria, sistem otomatis menghitung normalisasi & nilai akhir.</p>
            <Link href="/hitung" className="feat-link">Hitung <RxDoubleArrowRight size={19}/></Link>
          </div>
          <div className="feat-card" data-reveal="up">
            <div className="feat-icon"><FaRankingStar /></div>
            <h3>Hasil Ranking</h3>
            <p>Tampilan peringkat seluruh alternatif motor dari nilai tertinggi hingga terendah.</p>
            <Link href="/hasil" className="feat-link">Lihat <RxDoubleArrowRight size={19}/></Link>
          </div>
        </div>
      </section>

      <section className="section steps-section">
        <div className="section-label" data-reveal="left">Cara Kerja SAW</div>
        <div className="steps-row">
          <div className="step-arrow"><BsArrowRight /></div>
          <div className="step" data-reveal="up"><div className="step-num">01</div><h4>Tentukan Kriteria</h4><p>Harga (C1), Kapasitas Tangki (C2), Volume CC (C3)</p></div>
          <div className="step-arrow"><BsArrowRight /></div>
          <div className="step" data-reveal="up"><div className="step-num">02</div><h4>Beri Bobot</h4><p>Bobot kepentingan tiap kriteria (1-5)</p></div>
          <div className="step-arrow"><BsArrowRight /></div>
          <div className="step" data-reveal="up"><div className="step-num">03</div><h4>Normalisasi</h4><p>Hitung rij = xij / max(xij) atau min(xij) / xij</p></div>
          <div className="step-arrow"><BsArrowRight /></div>
          <div className="step" data-reveal="up"><div className="step-num">04</div><h4>Ranking</h4><p>Vi = Σ(wj * rij), nilai tertinggi = terbaik</p></div>
        </div>
      </section>
    </>
  );
}
