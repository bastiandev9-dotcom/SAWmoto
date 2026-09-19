import { FiHexagon } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand"><FiHexagon size={18}/> SAW<em>moto</em></div>
      <p className="footer-sub">Sistem Pendukung Keputusan Pemilihan Kendaraan Roda Dua</p>
    </footer>
  );
}
