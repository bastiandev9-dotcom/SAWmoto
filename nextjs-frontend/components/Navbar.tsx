'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiHexagon } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";



const links = [
  { href: '/', label: 'Beranda' },
  { href: '/data', label: 'Data Motor' },
  { href: '/hitung', label: 'Kalkulator SAW' },
  { href: '/hasil', label: 'Hasil & Ranking' },
  { href: '/tentang', label: 'Tentang' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <span className="nav-logo"><FiHexagon /></span>
          <span className="nav-title">SAW<em>moto</em></span>
        </Link>
      </div>
      <ul className={`nav-links ${open ? 'open' : ''}`}>
        {links.map((l, i) => (
          <li key={l.href} style={{ animationDelay: `${0.45 + i * 0.1}s` }}>
            <Link href={l.href} className={pathname === l.href ? 'active' : ''} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="hamburger" onClick={() => setOpen(!open)}>{open ? <IoMdClose /> : <GiHamburgerMenu />}</button>
    </nav>
  );
}
