import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import AnimationScript from '@/components/AnimationScript';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'DSS SAW — Pemilihan Kendaraan Roda Dua',
  description: 'Sistem Pendukung Keputusan Pemilihan Kendaraan Roda Dua Honda menggunakan metode SAW',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ThemeToggle />
          <AnimationScript />
        </ToastProvider>
      </body>
    </html>
  );
}
