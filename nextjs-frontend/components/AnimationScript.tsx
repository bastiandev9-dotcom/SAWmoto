'use client';
import { useEffect } from 'react';

export default function AnimationScript() {
  useEffect(() => {
    let animFrameId: number;
    let particleFrameId: number;
    let handleMouseMove: (e: MouseEvent) => void;
    let resizeFn: () => void;

    const init = () => {
      // 1. CURSOR SPOTLIGHT
      const spot = document.createElement('div');
      spot.className = 'cursor-spotlight';
      document.body.prepend(spot);
      let mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
      handleMouseMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
      document.addEventListener('mousemove', handleMouseMove);
      const animCursor = () => {
        cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
        spot.style.left = cx + 'px'; spot.style.top = cy + 'px';
        animFrameId = requestAnimationFrame(animCursor);
      };
      animCursor();

      // 2. GRID BACKGROUND
      const g = document.createElement('div');
      g.className = 'grid-bg';
      document.body.prepend(g);

      // 3. PARTICLE CANVAS
      const canvas = document.createElement('canvas');
      canvas.id = 'particles-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.35;';
      document.body.prepend(canvas);
      const ctx = canvas.getContext('2d')!;
      let W: number, H: number;
      resizeFn = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
      resizeFn();
      window.addEventListener('resize', resizeFn);

      class Particle {
        x = 0; y = 0; vx = 0; vy = 0; r = 0; alpha = 0; life = 0; maxLife = 0;
        constructor(initSpread = false) { this.reset(initSpread); }
        reset(initSpread = false) {
          this.x = Math.random() * W;
          this.y = initSpread ? Math.random() * H : H + 10;
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = -(Math.random() * 0.4 + 0.1);
          this.r = Math.random() * 1.5 + 0.4;
          this.alpha = Math.random() * 0.5 + 0.1;
          this.life = 0; this.maxLife = Math.random() * 400 + 200;
        }
        update() { this.x += this.vx; this.y += this.vy; this.life++; if (this.life > this.maxLife || this.y < -10) this.reset(); }
        draw() {
          const p = this.life / this.maxLife;
          const fade = p < 0.1 ? p / 0.1 : p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
          ctx.save(); ctx.globalAlpha = this.alpha * fade;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = Math.random() > 0.7 ? '#ff6b35' : '#f5c842';
          ctx.fill(); ctx.restore();
        }
      }
      const particles: Particle[] = [];
      for (let i = 0; i < 55; i++) particles.push(new Particle(true));
      const particleLoop = () => {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        particleFrameId = requestAnimationFrame(particleLoop);
      };
      particleLoop();

      // 4. SCROLL REVEAL
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseFloat(el.dataset.delay || '0');
            setTimeout(() => el.classList.add('revealed'), delay * 1000);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
      document.querySelectorAll('.feat-card, .step, .rank-item').forEach((el, i) => {
        if (!el.hasAttribute('data-reveal')) (el as HTMLElement).dataset.delay = (i * 0.07).toFixed(2);
        observer.observe(el);
      });

      // 5. COUNT-UP
      const countUp = (el: HTMLElement, target: number, duration = 1200, decimals = 0) => {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = decimals > 0 ? (ease * target).toFixed(decimals) : Math.floor(ease * target).toLocaleString('id-ID');
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('id-ID');
        };
        requestAnimationFrame(tick);
      };
      const countObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            countUp(el, parseFloat(el.dataset.countup || '0'), 1400, parseInt(el.dataset.decimals || '0'));
            countObs.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('[data-countup]').forEach(el => countObs.observe(el));

      // 6. TILT CARDS
      document.querySelectorAll('.visual-card, .feat-card.highlight').forEach(card => {
        card.addEventListener('mousemove', (e: Event) => {
          const me = e as MouseEvent;
          const rect = card.getBoundingClientRect();
          const x = (me.clientX - rect.left) / rect.width - 0.5;
          const y = (me.clientY - rect.top) / rect.height - 0.5;
          (card as HTMLElement).style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
        });
        card.addEventListener('mouseleave', () => {
          (card as HTMLElement).style.transform = '';
          (card as HTMLElement).style.transition = 'transform 0.5s ease';
          setTimeout(() => { (card as HTMLElement).style.transition = ''; }, 500);
        });
      });

      // 7. RANK BAR ANIMATE
      const rankObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bar = entry.target.querySelector('.rank-bar') as HTMLElement;
            if (bar) setTimeout(() => { bar.style.width = bar.dataset.width || '0%'; }, 200);
          }
        });
      }, { threshold: 0.3 });
      document.querySelectorAll('.rank-item').forEach(item => rankObs.observe(item));

      // 8. GLITCH TEXT
      document.querySelectorAll('.glitch').forEach(el => { (el as HTMLElement).dataset.text = el.textContent || ''; });

      // 9. SCROLL PROGRESS BAR
      const progressBar = document.createElement('div');
      progressBar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,#f5c842,#ff6b35);z-index:9999;width:0%;transition:width 0.1s;';
      document.body.appendChild(progressBar);
      window.addEventListener('scroll', () => {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = Math.min(pct, 100) + '%';
      });

      // 10. PAGE TRANSITION
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach(link => {
        link.addEventListener('click', e => {
          if (link.target === '_blank') return;
          e.preventDefault();
          const href = link.href;
          document.body.style.transition = 'opacity 0.25s ease';
          document.body.style.opacity = '0';
          setTimeout(() => { window.location.href = href; }, 250);
        });
      });
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.4s ease';
      requestAnimationFrame(() => { document.body.style.opacity = '1'; });
    };

    const timer = setTimeout(init, 0);
    return () => {
      clearTimeout(timer);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (particleFrameId) cancelAnimationFrame(particleFrameId);
      if (handleMouseMove) document.removeEventListener('mousemove', handleMouseMove);
      if (resizeFn) window.removeEventListener('resize', resizeFn);
    };
  }, []);

  return null;
}
