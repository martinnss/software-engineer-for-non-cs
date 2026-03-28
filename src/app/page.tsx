'use client';

import { useEffect, useRef } from 'react';

/* ─── ASCII Background Generator ────────────────────────────── */
const ASCII_CHARS = '01{}[]<>/*-+=_.,:;~^%#@!&?|\\01010110';
function generateAsciiGrid(): string {
  // sparse: only every ~4th cell is a char, rest is spaces
  const cols = 130;
  const rows = 80; // double height so the loop is seamless
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const roll = Math.random();
      out += roll < 0.12
        ? ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
        : ' ';
    }
    out += '\n';
  }
  return out;
}
const ASCII_GRID = generateAsciiGrid(); // generate once at module level

/* ─── Canvas Particle System (Slide 1) ───────────────────────── */
function initParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let raf: number;

  const resize = () => {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number };

  const nodes: Node[] = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 2 + 1,
    pulse: Math.random() * Math.PI * 2,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.pulse += 0.018;
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0,102,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      const glow = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (0.8 + 0.4 * glow), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,102,255,${glow * 0.7})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#0066FF';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    raf = requestAnimationFrame(draw);
  };

  draw();
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}

/* ─── Counter Animation ──────────────────────────────────────── */
function animateCounter(el: Element, target: number, duration = 1400, suffix = '') {
  const start = performance.now();
  const update = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ─── Timeline Connector ─────────────────────────────────────── */
function TimelineConnector() {
  return (
    <svg style={{ position: 'absolute', top: '48px', left: '80px', right: '80px', width: 'calc(100% - 160px)', height: '4px', pointerEvents: 'none' }} preserveAspectRatio="none">
      <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(0,102,255,0.12)" strokeWidth="2" />
      <line x1="0" y1="2" x2="100%" y2="2"
        stroke="#0066FF" strokeWidth="2"
        strokeDasharray="1000" strokeDashoffset="1000"
        style={{ animation: 'drawLine 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s forwards' }}
      />
    </svg>
  );
}

/* ─── Image Placeholder ──────────────────────────────────────── */
function ImgPlaceholder({ label, icon = '🖼️' }: { label: string; icon?: string }) {
  return (
    <div className="placeholder-img">
      <span className="placeholder-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/* ─── BubbleTool Component ───────────────────────────────────── */
function BubbleTool({
  name, size, top, left, delay, tx, ty, dur, emoji
}: {
  name: string; size: number; top: string; left: string;
  delay: string; tx: string; ty: string; dur: string; emoji: string;
}) {
  return (
    <div
      className="tool-bubble"
      style={{
        width: size, height: size, top, left,
        '--tx': tx, '--ty': ty, '--dur': dur, '--delay': delay,
      } as React.CSSProperties}
    >
      <div className="bubble-logo">{emoji}</div>
      <div className="bubble-name">{name}</div>
    </div>
  );
}

/* ─── Main Presentation Component ────────────────────────────── */
export default function Presentation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cleanupCanvas: (() => void) | undefined;

    // Inject reveal.js base CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css';
    document.head.appendChild(link);

    import('reveal.js').then(({ default: Reveal }) => {
      const deck = new Reveal(document.querySelector('.reveal') as HTMLElement, {
        hash: true,
        transition: 'none',
        backgroundTransition: 'fade',
        controls: false,
        progress: false,
        center: false,
        width: 1920,
        height: 1080,
        margin: 0,
        slideNumber: false,
        keyboard: true,
        touch: true,
        fragments: true,
      });

      deck.initialize().then(() => {
        // Slide 1 particles
        if (canvasRef.current) {
          cleanupCanvas = initParticles(canvasRef.current);
        }

        // Advance on mouse click (anywhere on the slide)
        const handleClick = (e: MouseEvent) => {
          // Ignore clicks on interactive elements
          const target = e.target as HTMLElement;
          if (target.closest('a, button, input, select, textarea')) return;
          deck.next();
        };
        const revealEl = document.querySelector('.reveal') as HTMLElement;
        revealEl?.addEventListener('click', handleClick);
        const origCleanup = cleanupCanvas;
        cleanupCanvas = () => {
          origCleanup?.();
          revealEl?.removeEventListener('click', handleClick);
        };

        // Slide change triggers
        deck.on('slidechanged', (ev: unknown) => {
          const i = (ev as { indexh: number }).indexh;

          // Slide 3 — 90% counter
          if (i === 2) {
            const el = document.querySelector('.stat-counter-big');
            if (el) animateCounter(el, 90, 1400, '%');
          }

          // Slide 4 — timeline nodes light up
          if (i === 3) {
            document.querySelectorAll('.timeline-node').forEach((node, idx) => {
              setTimeout(() => node.classList.add('active'), idx * 320 + 400);
            });
          }

          // Slide 9 (index 8) — Noora counter
          if (i === 8) {
            const el = document.querySelector('.demo-metric-value');
            if (el) animateCounter(el, 12, 1500, '');
          }
        });

        // Fragment shown handler
        deck.on('fragmentshown', (ev: unknown) => {
          const e = ev as { fragment: HTMLElement };
          const action = e.fragment?.dataset?.action;
          const tombs = document.querySelectorAll('.tombstone');

          if (action === 'tomb-1') tombs[0]?.classList.add('animate');
          if (action === 'tomb-2') tombs[1]?.classList.add('animate');
          if (action === 'tomb-3') tombs[2]?.classList.add('animate');
          if (action === 'rocket')  document.querySelector('.rocket-wrap')?.classList.add('animate');

          if (action === 'ai-reveal') {
            document.querySelector('.before-center-stage')?.classList.add('dying');
            document.querySelector('.after-reveal')?.classList.add('visible');
            document.querySelector('.ai-arrow')?.classList.add('visible');
          }
        });

        // Fragment hidden — reverse all actions
        deck.on('fragmenthidden', (ev: unknown) => {
          const e = ev as { fragment: HTMLElement };
          const action = e.fragment?.dataset?.action;
          const tombs = document.querySelectorAll('.tombstone');

          if (action === 'tomb-1') tombs[0]?.classList.remove('animate');
          if (action === 'tomb-2') tombs[1]?.classList.remove('animate');
          if (action === 'tomb-3') tombs[2]?.classList.remove('animate');
          if (action === 'rocket')  document.querySelector('.rocket-wrap')?.classList.remove('animate');

          if (action === 'ai-reveal') {
            document.querySelector('.before-center-stage')?.classList.remove('dying');
            document.querySelector('.after-reveal')?.classList.remove('visible');
            document.querySelector('.ai-arrow')?.classList.remove('visible');
          }
        });
      });
    });

    return () => { cleanupCanvas?.(); };
  }, []);

  return (
    <div className="reveal" style={{ width: '100vw', height: '100vh' }}>
      {/* ASCII ambient background — sits behind everything */}
      <div className="ascii-bg" aria-hidden="true">
        <div className="ascii-bg-inner">{ASCII_GRID + ASCII_GRID}</div>
      </div>

      <div className="slides">

        {/* ══ SLIDE 1 — THE HOOK ════════════════════════════════ */}
        <section className="slide-hook">
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%' }} />
          <div className="split-left" style={{ zIndex: 2 }}>
            <ImgPlaceholder label="UTEM Campus · Santiago" icon="🏛️" />
          </div>
          <div className="split-right" style={{ zIndex: 2 }}>
            <ImgPlaceholder label="Silicon Valley · San Francisco" icon="🌉" />
          </div>
          <div className="hook-divider" style={{ zIndex: 5 }} />
          <div className="hook-content anim-fadeInUp delay-200" style={{ zIndex: 10 }}>
            <div className="hook-tag">Software Engineering for Non-CS Majors · UTEM 2026</div>
            <h1 className="hook-title">De la UTEM a Silicon Valley</h1>
            <p className="hook-subtitle anim-fadeIn delay-1500">
              Construir productos de IA desde cero.{' '}
              <strong style={{ color: '#0a0a0a' }}>HOY.</strong>
            </p>
            <div className="hook-footer anim-fadeIn delay-1500">
              Martín Olivares · Ing. Civil Industrial → el nuevo arquitecto de software.
            </div>
          </div>
        </section>

        {/* ══ SLIDE 2 — YOUR STORY ══════════════════════════════ */}
        <section className="slide-story" style={{ background: 'var(--bg)' }}>
          <div className="story-grid">
            <div className="anim-fadeInLeft">
              <div className="story-img-wrap">
                <ImgPlaceholder label="Tu foto UTEM · estudiante" icon="📸" />
              </div>
              <div style={{ marginTop: '16px' }}>
                <div className="device-frame" style={{ height: '220px' }}>
                  <div className="device-notch" />
                  <div className="device-screen">
                    <ImgPlaceholder label="Spik AI / Noora · App Store" icon="📱" />
                  </div>
                </div>
              </div>
            </div>

            <div className="story-content anim-fadeInRight delay-200">
              <div className="slide-num">02 / 12</div>
              <h2 className="story-title">Yo estaba<br />exactamente ahí.</h2>
              <p className="story-body fragment">
                No era crack de código.<br />
                Era <strong>optimizador de sistemas</strong>.
              </p>
              <div className="fragment" style={{ marginTop: '24px' }}>
                <div className="plot-twist-badge">Plot Twist</div>
                <p className="plot-twist-text">
                  Industrial = pensar en sistemas.<br />
                  La IA hace la sintaxis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 3 — PARADIGM SHIFT ══════════════════════════ */}
        <section className="slide-paradigm">
          <h2 className="paradigm-title anim-fadeInUp">
            El mundo no quiere optimizadores.<br />
            Quiere <span style={{ color: 'var(--blue)' }}>BUILDERS</span>.
          </h2>

          <div className="paradigm-cols anim-fadeInUp delay-200">
            <div className="paradigm-card academia">
              <div className="paradigm-card-label">🏛️ La Academia Enseña</div>
              {['Optimizar lo que ya existe','Miedo al fracaso (nota 1.0)','Teoría de sistemas','Reportes en Excel'].map(item => (
                <div key={item} className="paradigm-item fragment">
                  <span className="item-bullet">—</span>{item}
                </div>
              ))}
            </div>
            <div className="paradigm-card mercado">
              <div className="paradigm-card-label">⚡ El Mercado Necesita</div>
              {['Construir lo que no existe','Iterar rápido (Build & Learn)','Lanzar y validar','Automatizar y escalar'].map(item => (
                <div key={item} className="paradigm-item fragment">
                  <span className="item-bullet">→</span>{item}
                </div>
              ))}
            </div>
          </div>

          {/* Big centered 90% stat — no pie chart */}
          <div className="fragment anim-fadeInUp delay-400" style={{ textAlign: 'center', paddingTop: '16px' }}>
            <div className="stat-hero">
              <span className="stat-counter-big">0%</span>
              <div className="stat-hero-label">del éxito es entender el problema.</div>
              <div className="stat-hero-sub">Solo el 10% es escribir código.</div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 4 — UNFAIR ADVANTAGE ════════════════════════ */}
        <section className="slide-advantage">
          <h2 className="adv-title anim-fadeInUp">
            Ventaja unfair:{' '}
            <span style={{ color: 'var(--orange)' }}>vivir la operación</span>.
          </h2>
          <p className="adv-subtitle anim-fadeIn delay-300">Primero entiendo. Luego construyo.</p>

          <div className="timeline anim-fadeInUp delay-400">
            <TimelineConnector />
            {[
              { icon: '🚗', label: 'Cabify', metric: '15 min → 5 min\ninspección vehicular', desc: 'Me inscribí como driver para sentir el dolor' },
              { icon: '📦', label: 'BlueX', metric: '−45% merma\n−80% pérdida paquetes', desc: 'Fui a los PUDOs. Entendí el caos.' },
              { icon: '🚀', label: 'Noora Labs', metric: 'Meeting Copilot\nFlutter + OpenAI', desc: 'De la operación al producto' },
            ].map(node => (
              <div key={node.label} className="timeline-node">
                <div className="timeline-icon">{node.icon}</div>
                <div className="timeline-label">{node.label}</div>
                <div className="timeline-metric" style={{ whiteSpace: 'pre-line' }}>{node.metric}</div>
                <div className="timeline-desc">{node.desc}</div>
              </div>
            ))}
          </div>

          <div className="fragment anim-fadeInUp delay-800" style={{ marginTop: '40px' }}>
            <div style={{
              background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '14px', padding: '20px 32px', display: 'inline-block'
            }}>
              <span style={{ color: 'var(--muted)', fontSize: '18px' }}>No es la sintaxis — es el </span>
              <strong style={{ color: 'var(--orange)', fontSize: '22px' }}>contexto</strong>
              <span style={{ color: 'var(--muted)', fontSize: '18px' }}>. Esa es su ventaja real.</span>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 5 — THE CEMETERY ════════════════════════════ */}
        <section className="slide-cemetery">
          <h2 className="cemetery-title anim-fadeInUp">Mi cementerio personal.</h2>
          <p className="cemetery-subtitle anim-fadeIn delay-200">5+ proyectos matados. 0 arrepentimientos.</p>

          {/* Hidden fragment triggers — one click per tombstone, then rocket */}
          <div className="fragment" data-action="tomb-1" style={{ display: 'none' }} />
          <div className="fragment" data-action="tomb-2" style={{ display: 'none' }} />
          <div className="fragment" data-action="tomb-3" style={{ display: 'none' }} />
          <div className="fragment" data-action="rocket"  style={{ display: 'none' }} />

          <div className="tombstones">
            {[
              { name: 'App 1', cause: 'ERROR: sin usuarios', lesson: 'Construí sin hablar\ncon nadie. Nunca.' },
              { name: 'App 2', cause: 'ERROR: sin plata', lesson: 'Modelo de negocio\ncompletamente roto.' },
              { name: 'App 3', cause: 'ERROR: demasiado tarde', lesson: 'Mercado ya lleno.\nLlegué 6 meses tarde.' },
            ].map(t => (
              <div key={t.name} className="tombstone">
                <div className="tombstone-skull">💀</div>
                <div className="tombstone-name">{t.name}</div>
                <div className="tombstone-cause">{t.cause}</div>
                <div className="tombstone-lesson" style={{ whiteSpace: 'pre-line' }}>{t.lesson}</div>
              </div>
            ))}
          </div>

          {/* Centered rocket + lesson */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <div className="rocket-wrap">
              <div className="rocket-emoji">🚀</div>
            </div>
            <div className="cemetery-lesson anim-fadeIn delay-1200" style={{ textAlign: 'center' }}>
              En Silicon Valley lo llaman <strong style={{ color: 'var(--text)' }}>iteración</strong>.<br />
              La resiliencia es tu ventaja competitiva más real.
            </div>
          </div>
        </section>

        {/* ══ SLIDE 6 — LEARN BY DOING ══════════════════════════ */}
        <section className="slide-learn">
          <h2 className="learn-title anim-fadeInUp">Aprender haciendo.</h2>
          <p className="learn-sub anim-fadeIn delay-200">
            Nadie aprende a nadar leyendo sobre natación.
          </p>

          <div className="learn-grid">
            {[
              {
                emoji: '💀', tool: 'Git',
                event: 'Perdí todo mi código.',
                lesson: <><span>Control de versiones.</span> La próxima vez.</>,
              },
              {
                emoji: '👻', tool: 'UX / Research',
                event: 'Nadie usó mi app.',
                lesson: <><span>Primero escuchar.</span> Luego construir.</>,
              },
              {
                emoji: '💸', tool: 'Ventas',
                event: 'No vendí nada.',
                lesson: <><span>El producto</span> no vende solo.</>,
              },
              {
                emoji: '⏰', tool: 'Validación',
                event: 'Llegué 6 meses tarde.',
                lesson: <><span>Validar antes</span> de construir.</>,
              },
            ].map((item, i) => (
              <div
                key={item.tool}
                className="learn-card fragment"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="learn-emoji">{item.emoji}</div>
                <div className="learn-tool-badge">{item.tool}</div>
                <div className="learn-event">&ldquo;{item.event}&rdquo;</div>
                <div className="learn-lesson">{item.lesson}</div>
              </div>
            ))}
          </div>

          <div className="learn-punch fragment">
            No esperen estar listos.<br />
            <span style={{ fontSize: '0.75em', fontWeight: 600, color: 'var(--text)', opacity: 0.7 }}>
              La competencia ya está construyendo.
            </span>
          </div>
        </section>

        {/* ══ SLIDE 7 — TOOLBOX (Floating Bubbles) ════════════ */}
        <section className="slide-toolbox">
          <h2 className="toolbox-title anim-fadeInUp">
            Tu equipo en <span style={{ color: 'var(--blue)' }}>una pestaña</span>.
          </h2>
          <p className="toolbox-subtitle anim-fadeIn delay-200">
            Sin equipo de 5. Sin presupuesto. Sin excusas.
          </p>

          <div className="bubble-field anim-fadeIn delay-300">
            {[
              { name: 'Zapier',       emoji: '⚡', size: 148, top: '8%',  left: '2%',   tx: '12px',  ty: '18px',  dur: '5.2s', delay: '0.0s' },
              { name: 'Make',         emoji: '🔗', size: 124, top: '5%',  left: '18%',  tx: '-14px', ty: '12px',  dur: '6.1s', delay: '0.1s' },
              { name: 'n8n',          emoji: '🛠️', size: 110, top: '50%', left: '0%',   tx: '10px',  ty: '-15px', dur: '4.8s', delay: '0.15s' },
              { name: 'Bubble',       emoji: '🫧', size: 138, top: '2%',  left: '35%',  tx: '-10px', ty: '14px',  dur: '5.5s', delay: '0.2s' },
              { name: 'Glide',        emoji: '📱', size: 118, top: '55%', left: '14%',  tx: '16px',  ty: '-10px', dur: '6.4s', delay: '0.25s' },
              { name: 'Lovable/v0',   emoji: '💎', size: 152, top: '18%', left: '52%',  tx: '-12px', ty: '16px',  dur: '5.0s', delay: '0.3s' },
              { name: 'Softr',        emoji: '🌐', size: 122, top: '62%', left: '36%',  tx: '14px',  ty: '-12px', dur: '5.8s', delay: '0.35s' },
              { name: 'ChatGPT',      emoji: '🤖', size: 150, top: '5%',  left: '70%',  tx: '-16px', ty: '10px',  dur: '4.6s', delay: '0.4s' },
              { name: 'Claude',       emoji: '🧠', size: 136, top: '58%', left: '55%',  tx: '10px',  ty: '16px',  dur: '6.2s', delay: '0.45s' },
              { name: 'Cursor',       emoji: '🖊️', size: 144, top: '20%', left: '80%',  tx: '-14px', ty: '-12px', dur: '5.3s', delay: '0.5s' },
              { name: 'Replit Agent', emoji: '🔁', size: 128, top: '62%', left: '75%',  tx: '12px',  ty: '-16px', dur: '6.0s', delay: '0.55s' },
            ].map(b => (
              <BubbleTool key={b.name} {...b} />
            ))}
          </div>

          <div className="fragment anim-fadeIn" style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--muted)' }}>
            &ldquo;Tally + Zapier + WhatsApp automático → eso ya es un producto.&rdquo;
          </div>
        </section>

        {/* ══ SLIDE 8 — AI CO-PILOT (staged reveal) ════════════ */}
        <section className="slide-ai">
          <h2 className="ai-title anim-fadeInUp">
            La IA ya escribe el código difícil.
          </h2>

          <div className="ai-stage anim-fadeInUp delay-300">
            {/* Phase 1: Antes — centered, large */}
            <div className="before-center-stage">
              <div className="ba-label">Antes</div>
              <div className="ba-main-big">5 devs<br />+ 6 meses</div>
              <div className="ba-sub">
                Equipo grande. Runway quemado.<br />Un MVP tardío que nadie esperaba.
              </div>
            </div>

            {/* Arrow — appears when fragment fires */}
            <svg className="ai-arrow" width="60" height="40" viewBox="0 0 60 40">
              <path d="M0 20 H45 M35 5 L55 20 L35 35"
                stroke="#0066FF" strokeWidth="3" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="100" strokeDashoffset="100"
                style={{ animation: 'drawLine 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
              />
            </svg>

            {/* Phase 2: Ahora — slides in on fragment */}
            <div className="after-reveal">
              <div className="ba-label">Ahora</div>
              <div className="ba-main-big">1 persona<br />+ 1 fin de semana</div>
              <div className="ba-sub">
                Idea → prototipo → usuarios reales.
              </div>
              <div className="ba-tools">
                {['Cursor', 'Claude', 'Replit Agent'].map(t => (
                  <span key={t} className="ba-tool-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Hidden fragment that triggers the JS animation */}
          <div className="fragment" data-action="ai-reveal" style={{ display: 'none' }} />

          <div className="ai-conclusion fragment anim-fadeInUp">
            <div style={{ fontSize: '26px', fontWeight: 700 }}>
              Su trabajo: <strong>elegir el problema correcto</strong>.
            </div>
            <div style={{ fontSize: '18px', color: 'var(--muted)', marginTop: '8px' }}>
              Y eso, como industriales, es exactamente lo que saben hacer.
            </div>
          </div>
        </section>

        {/* ══ SLIDE 9 — NOORA DEMO ══════════════════════════════ */}
        <section className="slide-demo">
          <div className="demo-grid">
            <div>
              <h2 className="demo-title anim-fadeInLeft">
                Demo en vivo:<br />
                <span style={{ color: 'var(--blue)' }}>Noora Labs</span>
              </h2>
              <p className="demo-subtitle anim-fadeIn delay-300">&ldquo;Lo construí por las noches.&rdquo;</p>

              <div className="demo-stack">
                {[['Flutter', '0.2s'], ['OpenAI', '0.4s']].map(([name, delay]) => (
                  <div key={name} className="stack-badge" style={{ animationDelay: delay }}>{name}</div>
                ))}
                <div className="stack-badge" style={{ animationDelay: '0.6s', background: 'var(--blue-10)', borderColor: 'var(--blue-30)', color: 'var(--blue)' }}>
                  ESO ES TODO.
                </div>
              </div>

              <div className="demo-metric anim-fadeInUp delay-500">
                <div className="demo-metric-label">features shipped this week →</div>
                <div className="demo-metric-value">0</div>
              </div>

              <div className="fragment" style={{ marginTop: '24px', fontSize: '18px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Meeting copilot: escucha tus reuniones, conoce<br />
                todos tus proyectos, te sopla qué responder.
              </div>
            </div>

            <div className="anim-fadeInRight delay-300">
              <div className="device-frame">
                <div className="device-notch" />
                <div className="device-screen">
                  <ImgPlaceholder label="Noora Labs interface" icon="🤖" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 10 — TREASURE MAP (Premium) ════════════════ */}
        <section className="slide-treasure">
          <h2 className="treasure-title anim-fadeInUp">
            El conocimiento de élite está{' '}
            <span style={{ color: 'var(--green)' }}>GRATIS</span>.
          </h2>

          <div className="treasure-premium">
            {[
              { icon: '🏆', name: 'YC Startup School', desc: 'Valida y lanza con los mejores del mundo.', tag: 'Free · 7 weeks' },
              { icon: '🎙️', name: 'a16z Podcast', desc: 'Entiende qué sigue y cómo piensan los mejores.', tag: 'Podcast + essays' },
              { icon: '🇨🇱', name: 'Startup Chile', desc: 'CLP $15M equity-free + mentores + red local.', tag: '4 meses · Santiago' },
              { icon: '📰', name: 'Hacker News', desc: 'Ve qué construyen personas como tú ahora mismo.', tag: 'Daily · free' },
              { icon: '🎓', name: 'MIT CS50 / 6.006', desc: 'Fundamentos de CS gratis. YouTube + PDF.', tag: 'Free forever' },
            ].map((r, i) => (
              <div key={r.name} className="treasure-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="treasure-logo-zone">{r.icon}</div>
                <div className="treasure-item-name">{r.name}</div>
                <div className="treasure-item-desc">{r.desc}</div>
                <div className="treasure-item-tag">{r.tag}</div>
              </div>
            ))}
          </div>

          <div className="fragment anim-fadeIn delay-600" style={{ marginTop: '28px', fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--muted)' }}>
            &ldquo;Su competencia no es el de la fila de al lado. Es alguien en Bangalore o San Francisco.&rdquo;
          </div>
        </section>

        {/* ══ SLIDE 11 — PLAYBOOK (Horizontal) ════════════════ */}
        <section className="slide-playbook">
          <h2 className="playbook-title anim-fadeInUp">
            De idea a MVP en <span style={{ color: 'var(--blue)' }}>1 semana</span>.
          </h2>
          <p className="playbook-subtitle anim-fadeIn delay-200">
            El playbook que habría querido tener a los 20.
          </p>

          <div className="playbook-panels">
            {[
              { num: '01', emoji: '👀', title: 'Ve a la operación', desc: 'Físicamente. Observa. No asumas. El problema real siempre es diferente al que imaginas.' },
              { num: '02', emoji: '📝', title: 'Anota 3 dolores', desc: 'Específicos. Concretos. Que duelan de verdad a las personas que los viven.' },
              { num: '03', emoji: '🗣️', title: 'Habla con 3 personas', desc: 'Que vivan ese dolor. Valida antes de construir. Escuchar es más difícil que codear.' },
              { num: '04', emoji: '✏️', title: 'Flujo en papel', desc: 'Un diagrama básico. Sin Figma. Sin código. Solo el "qué hace" antes del "cómo".' },
              { num: '05', emoji: '🚀', title: 'MVP: Forms + IA + Zapier', desc: 'No esperes saber React. Empieza con lo que tienes. La velocidad es la estrategia.' },
            ].map((s, i) => (
              <div key={s.num} className="playbook-panel fragment" style={{ animationDelay: `${i * 0.1}s` }}>
                {i < 4 && <div className="panel-connector">→</div>}
                <div className="panel-num">{s.num}</div>
                <div className="panel-emoji">{s.emoji}</div>
                <div className="panel-title">{s.title}</div>
                <div className="panel-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ SLIDE 12 — GOODBYE (Impact) ══════════════════════ */}
        <section className="slide-goodbye">
          <div className="goodbye-watermark" aria-hidden>B</div>
          <div className="goodbye-content">
            <div className="goodbye-main">Tu turno.</div>
            <div className="goodbye-sub fragment anim-fadeInUp">
              Esta semana. Un problema real. Un MVP.
            </div>
            <div className="fragment anim-fadeInUp delay-200">
              <div className="goodbye-handle">@martinolivares</div>
              <div className="goodbye-dm">Me mandan DM con capturas 📸</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
