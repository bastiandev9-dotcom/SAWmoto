'use client';
import { useState, useEffect } from 'react';
import { IoSunny, IoMoon } from "react-icons/io5";


export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'light';
    if (saved) document.body.classList.add('light-mode');
    setIsLight(saved);
  }, []);

  const toggle = () => {
    document.body.classList.toggle('light-mode');
    const light = document.body.classList.contains('light-mode');
    setIsLight(light);
    localStorage.setItem('theme', light ? 'light' : 'dark');
  };

  return (
    <button className="theme-toggle" onClick={toggle} title="Ganti Tema">
      {isLight ? <IoSunny /> : <IoMoon />}
    </button>
  );
}
