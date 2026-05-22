"use client";

import { useEffect, useRef, useState } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────

const TOTAL_FRAMES = 240;

// Zone 1 scroll structure (fraction of 0–1 within the 600vh driver):
// 0.00–0.10 : Hero — keyboard assembled, name visible
// 0.10–0.90 : Deconstruct — frames 0 → 239, text overlays (bidirectional)
// 0.90–1.00 : Hold — fully exploded frame

// ─── Helpers ────────────────────────────────────────────────────────────────

function frameIndex(p: number): number {
  if (p <= 0.1) return 0;
  if (p < 0.9)
    return Math.min(Math.floor(((p - 0.1) / 0.8) * TOTAL_FRAMES), TOTAL_FRAMES - 1);
  return TOTAL_FRAMES - 1;
}

// Fade in i0→i1, hold i1→o0, fade out o0→o1
function fade(p: number, i0: number, i1: number, o0: number, o1: number): number {
  if (p < i0 || p > o1) return 0;
  if (i1 > i0 && p < i1) return (p - i0) / (i1 - i0);
  if (p > o0) return 1 - (p - o0) / (o1 - o0);
  return 1;
}

function setOp(el: HTMLElement | null, v: number) {
  if (el) el.style.opacity = String(Math.max(0, Math.min(1, v)));
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="font-heading text-white font-semibold mb-10" style={{ fontSize: "2.5rem" }}>
      {text}
    </p>
  );
}

function ContactLink({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  const isMailto = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMailto ? undefined : "_blank"}
      rel={isMailto ? undefined : "noopener noreferrer"}
      className="font-code group flex items-center gap-3 transition-colors duration-150 cursor-pointer"
      style={{ color: accent ? "#2dd4bf" : "rgba(255,255,255,0.65)", fontSize: "16px", minHeight: "44px" }}
    >
      <span className="transition-colors duration-150" style={{ color: accent ? "#2dd4bf" : "rgba(255,255,255,0.3)" }}>
        →
      </span>
      <span className="group-hover:text-white transition-colors duration-150">{label}</span>
    </a>
  );
}

// ─── Zone 1 helpers ─────────────────────────────────────────────────────────

function TextOverlay({ num, label, title }: { num: string; label: string; title: string }) {
  return (
    <div className="text-center select-none">
      <p className="font-code text-white/70 tracking-[0.2em] uppercase mb-4" style={{ fontSize: "16px" }}>
        {num} — {label}
      </p>
      <h2
        className="font-heading text-white/90 font-bold leading-none"
        style={{ fontSize: "clamp(2.2rem, 7vw, 5.5rem)" }}
      >
        {title}
      </h2>
    </div>
  );
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#050505]"
      role="status"
      aria-label={`Loading portfolio: ${progress}%`}
    >
      <div className="flex flex-col items-center gap-5 w-48">
        <p className="font-code text-white/20 tracking-[0.45em] uppercase" style={{ fontSize: "9px" }}>
          Jaivin Phabiani
        </p>
        <div className="w-full relative overflow-hidden rounded-full" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }}>
          <div
            className="absolute inset-y-0 left-0 bg-[#6366f1]"
            style={{ width: `${progress}%`, transition: "width 0.12s linear" }}
          />
        </div>
        <p className="font-code text-white/15 tabular-nums" style={{ fontSize: "10px" }}>{progress}%</p>
      </div>
    </div>
  );
}

// ─── Project data ────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    name: "BruinGE",
    year: "2026",
    desc: "GE planning tool for UCLA students",
    detail: "I was tired of jumping between BruinWalk, my DAR, reddit, and myUCLA just to figure out which classes counted for GEs so I built one website that does it all. 2,000+ UCLA students use it every quarter.",
    tech: ["Next.js", "Tailwind", "Vercel", "Supabase", "Python", "TypeScript", "GitHub Actions"],
    url: "https://bruinge.com",
    accent: "indigo" as "indigo" | "teal" | undefined,
    badge: undefined as string | undefined,
    devpostUrl: undefined as string | undefined,
    logoSrc: "/logos/bruinge.png",
    imageUrl: "/projectImages/bruinge.png",
  },
  {
    name: "StatLine",
    year: "2026",
    desc: "Live NBA player prop prediction engine",
    detail: "I got curious whether you could actually beat sportsbook lines with machine learning. I trained a model to make NBA prop bets and created a dashboard to compare different ML models head to head. Still actively developing it, adding new models and improving accuracy.",
    tech: ["XGBoost", "FastAPI", "Next.js", "pandas"],
    url: "https://stat-line-rho.vercel.app/" as string | null,
    accent: undefined as "indigo" | "teal" | undefined,
    badge: undefined as string | undefined,
    devpostUrl: undefined as string | undefined,
    logoSrc: "/logos/statLine.png",
    imageUrl: "/projectImages/statLine.png",
  },
  {
    name: "OTK",
    year: "2026",
    desc: "Subscription platform for a client's book",
    detail: "Freelance project for a client that needed a subscription platform for their book. I implemented payments with Stripe, auth with Clerk, serverless backend on Cloudflare Workers. First time building a full payments + auth stack end to end.",
    tech: ["Stripe", "Clerk", "Cloudflare", "Supabase", "Next.js"],
    url: "https://shop.otkpublishing.com/",
    accent: "teal" as "indigo" | "teal" | undefined,
    badge: undefined as string | undefined,
    devpostUrl: undefined as string | undefined,
    logoSrc: undefined as string | undefined,
    imageUrl: "/projectImages/OTK.png",
  },
  {
    name: "GetTabs",
    year: "2026",
    desc: "Guitar tab extractor from YouTube tutorials",
    detail: "Paste a YouTube URL or upload a video recording of a guitar tutorial and it pulls the tab overlay out as a clean PDF. I Built it because I keep pausing and rewinding the same 10 seconds when I learn new songs.",
    tech: ["Next.js", "Vercel"],
    url: "https://get-tabs-kenneth-acoustic.vercel.app/",
    accent: "teal" as "indigo" | "teal" | undefined,
    badge: "beta",
    devpostUrl: undefined as string | undefined,
    logoSrc: "/logos/getTabs.png",
    imageUrl: "/projectImages/getTabs.png",
  },
  {
    name: "Failsafe",
    year: "2026",
    desc: "Smart cold chain monitoring system — LA Hacks 2026",
    detail: "Built a smart shipping container system that monitors pharmaceutical cold chains using Raspberry Pi sensors. We had a multiagent system talk to itself in real time to catch anomalies.",
    tech: ["Fetch.ai", "Raspberry Pi", "Python", "OpenCV"],
    url: null as string | null,
    accent: undefined as "indigo" | "teal" | undefined,
    badge: undefined as string | undefined,
    devpostUrl: "https://devpost.com/software/aegis-m1webn",
    logoSrc: undefined as string | undefined,
    imageUrl: undefined as string | undefined,
  },
];

// ─── Star field background ────────────────────────────────────────────────────

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Skip entirely on mobile/tablet — canvas animation is too expensive on mobile GPUs
    if (window.innerWidth < 1024) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pickColor = (): string => {
      const r = Math.random();
      if (r < 0.40) return "#ffffff";
      if (r < 0.60) return "rgb(210,225,255)";
      if (r < 0.80) return `rgb(255,${Math.floor(240 + Math.random() * 15)},200)`;
      if (r < 0.90) return "#818cf8";
      return "#5eead4";
    };

    // Pre-render each star's glow once to an offscreen canvas.
    // Every frame costs only one drawImage blit instead of 3× shadowBlur passes.
    const makeGlow = (r: number, color: string) => {
      const pad = Math.ceil(r * 22);
      const size = Math.ceil(r * 2) + pad * 2;
      const oc = document.createElement("canvas");
      oc.width = size;
      oc.height = size;
      const ox = oc.getContext("2d")!;
      const cx = size / 2;
      ox.shadowColor = color;
      ox.fillStyle = color;

      ox.shadowBlur = r * 20; ox.globalAlpha = 0.25;
      ox.beginPath(); ox.arc(cx, cx, r, 0, Math.PI * 2); ox.fill();

      ox.shadowBlur = r * 8;  ox.globalAlpha = 0.60;
      ox.beginPath(); ox.arc(cx, cx, r, 0, Math.PI * 2); ox.fill();

      ox.shadowBlur = r * 2;  ox.globalAlpha = 1.0;
      ox.beginPath(); ox.arc(cx, cx, r, 0, Math.PI * 2); ox.fill();

      if (r > 1.5) {
        const len = r * 7;
        ox.strokeStyle = color; ox.lineWidth = 0.5;
        ox.shadowBlur = r * 4; ox.globalAlpha = 0.30;
        for (const [dx, dy] of [[1, 0], [0, 1]] as [number, number][]) {
          ox.beginPath();
          ox.moveTo(cx - dx * len, cx - dy * len);
          ox.lineTo(cx + dx * len, cx + dy * len);
          ox.stroke();
        }
      }
      return { canvas: oc, half: size / 2 };
    };

    const COUNT = 60;
    const stars = Array.from({ length: COUNT }, () => {
      const isLeft = Math.random() < 0.5;
      const x = isLeft ? Math.random() * 0.20 : 0.80 + Math.random() * 0.20;
      const r = Math.random() < 0.70
        ? Math.random() * 1.0 + 0.5
        : Math.min(2.5, Math.random() * 1.0 + 1.5);
      const base = r < 1.5
        ? Math.random() * 0.20 + 0.45
        : Math.random() * 0.25 + 0.65;
      const color = pickColor();
      return {
        x, y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00005,
        vy: (Math.random() - 0.5) * 0.00005,
        r, base, opacity: base, isLeft,
        parallax: r < 1.0 ? 0.3 : r < 1.8 ? 0.6 : 1.0,
        twinkles: Math.random() < 0.30,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.005 + 0.002,
        amp: Math.random() * 0.07 + 0.02,
        glow: makeGlow(r, color),
      };
    });

    // Mouse — throttled to one update per frame (~16ms)
    let targetMX = 0, targetMY = 0, smoothMX = 0, smoothMY = 0;
    let lastMouse = 0;
    const MAX_SHIFT = 45;

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouse < 16) return;
      lastMouse = now;
      targetMX = (e.clientX / window.innerWidth)  * 2 - 1;
      targetMY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onMouseLeave = () => { targetMX = 0; targetMY = 0; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // Pause when tab is not visible
    let paused = document.hidden;
    const onVis = () => { paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (paused) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      smoothMX += (targetMX - smoothMX) * 0.06;
      smoothMY += (targetMY - smoothMY) * 0.06;

      const zone1End = 5 * window.innerHeight;
      const fadeIn = Math.min(1, Math.max(0, (window.scrollY - zone1End) / 400));

      if (fadeIn > 0) {
        for (const s of stars) {
          s.x += s.vx; s.y += s.vy;
          if (s.y < 0) s.y = 1;
          if (s.y > 1) s.y = 0;
          if (s.isLeft) {
            if (s.x < 0)    { s.x = 0;    s.vx =  Math.abs(s.vx); }
            if (s.x > 0.20) { s.x = 0.20; s.vx = -Math.abs(s.vx); }
          } else {
            if (s.x < 0.80) { s.x = 0.80; s.vx =  Math.abs(s.vx); }
            if (s.x > 1)    { s.x = 1;    s.vx = -Math.abs(s.vx); }
          }
          if (s.twinkles) {
            s.phase += s.speed;
            s.opacity = Math.max(0.10, Math.min(1.0, s.base + Math.sin(s.phase) * s.amp));
          }
          const px = s.x * w + smoothMX * MAX_SHIFT * s.parallax;
          const py = s.y * h + smoothMY * MAX_SHIFT * s.parallax;
          ctx.globalAlpha = s.opacity * fadeIn;
          ctx.drawImage(s.glow.canvas, px - s.glow.half, py - s.glow.half);
        }
        ctx.globalAlpha = 1;
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: -1,
        willChange: "transform",
      }}
    />
  );
}

// ─── Project logo / avatar ───────────────────────────────────────────────────

function ProjectLogo({ src, name }: { src?: string; name: string }) {
  const circleStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
    overflow: "hidden",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{ ...circleStyle, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        ...circleStyle,
        background: "#252525",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "14px",
        fontWeight: 500,
      }}
      className="font-code"
      aria-hidden="true"
    >
      {name[0].toUpperCase()}
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const links: { label: string; id: string }[] = [
    { label: "Work",    id: "projects" },
    { label: "About",   id: "about"    },
    { label: "Contact", id: "contact"  },
  ];

  return (
    <>
      <nav
        aria-label="Site navigation"
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12"
        style={{
          height: "60px",
          background: "rgba(5,5,5,0.8)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          zIndex: 10000,
        }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-code text-white/60 hover:text-white/90 transition-colors duration-150 cursor-pointer flex items-center gap-2.5"
          style={{ fontSize: "18px", letterSpacing: "0.02em", minHeight: "44px" }}
          aria-label="Scroll to top"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="" width="30" height="30" style={{ borderRadius: "50%" }} />
          Jaivin Phabiani
        </button>

        {/* Desktop links + social icons */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="font-code text-white/35 hover:text-white/80 transition-colors duration-150 cursor-pointer focus-visible:text-white/80"
              style={{ fontSize: "16px", letterSpacing: "0.04em", minHeight: "44px" }}
            >
              {label}
            </button>
          ))}
          <div className="flex items-center gap-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "24px" }}>
            <a
              href="https://github.com/JaivinP"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white/80 transition-colors duration-150"
              aria-label="GitHub"
              style={{ minHeight: "44px", display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/jaivin-phabiani-6bb019295/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white/80 transition-colors duration-150"
              aria-label="LinkedIn"
              style={{ minHeight: "44px", display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{ minWidth: "44px", minHeight: "44px", gap: "5px" }}
        >
          <span style={{ display: "block", width: "22px", height: "2px", background: "rgba(255,255,255,0.6)", borderRadius: "1px" }} />
          <span style={{ display: "block", width: "22px", height: "2px", background: "rgba(255,255,255,0.6)", borderRadius: "1px" }} />
          <span style={{ display: "block", width: "14px", height: "2px", background: "rgba(255,255,255,0.6)", borderRadius: "1px" }} />
        </button>
      </nav>

      {/* Fullscreen mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ background: "rgba(5,5,5,0.97)", zIndex: 10001, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          onClick={() => setMenuOpen(false)}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute font-code text-white/40 hover:text-white/80 transition-colors"
            style={{ top: "12px", right: "20px", fontSize: "32px", minWidth: "44px", minHeight: "44px" }}
            aria-label="Close menu"
          >
            ×
          </button>
          <nav className="flex flex-col items-center gap-10" onClick={(e) => e.stopPropagation()}>
            {links.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="font-heading text-white/70 hover:text-white font-semibold transition-colors duration-150 cursor-pointer"
                style={{ fontSize: "clamp(2rem, 10vw, 3rem)", minHeight: "44px" }}
              >
                {label}
              </button>
            ))}

            {/* Social icons */}
            <div className="flex items-center gap-8 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "32px" }}>
              <a
                href="https://github.com/JaivinP"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors duration-150"
                aria-label="GitHub"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/jaivin-phabiani-6bb019295/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors duration-150"
                aria-label="LinkedIn"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

// ─── Stack section ───────────────────────────────────────────────────────────

function StackSection() {
  const rows = [
    { category: "Languages", tools: "Python · TypeScript · C++ · Swift · R" },
    { category: "Frontend",  tools: "React · Next.js · Tailwind CSS" },
    { category: "Backend",   tools: "FastAPI · Supabase · PostgreSQL · Cloudflare Workers" },
    { category: "ML & Data", tools: "XGBoost · scikit-learn · pandas · PyTorch" },
    { category: "Tools",     tools: "Git · Vercel · Stripe · Raspberry Pi · Fetch.ai" },
  ];

  return (
    <section id="stack" aria-label="Stack">
      <SectionLabel text="Stack" />
      <div>
        {rows.map(({ category, tools }) => (
          <div
            key={category}
            className="flex items-baseline py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span
              className="font-code uppercase text-white/40 flex-shrink-0"
              style={{ fontSize: "11px", letterSpacing: "0.08em", width: "130px" }}
            >
              {category}
            </span>
            <span
              className="font-code text-white/80"
              style={{ fontSize: "15px" }}
            >
              {tools}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Zone 2 sections ─────────────────────────────────────────────────────────

const DIVIDER = "1px solid rgba(255,255,255,0.14)";

function ProjectRow({
  p,
  i,
  isExpanded,
  onToggle,
}: {
  p: typeof PROJECTS[0];
  i: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setEntered(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const anim = (delay: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
  });

  const pill: React.CSSProperties = {
    fontSize: "9px", padding: "2px 6px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    letterSpacing: "0.08em",
  };

  const chevron = (
    <span
      className="font-code"
      style={{
        fontSize: "20px",
        width: "20px",
        textAlign: "center",
        flexShrink: 0,
        display: "inline-block",
        color: isExpanded ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.25)",
        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "color 0.25s, transform 0.35s ease-in-out",
        opacity: entered ? 1 : 0,
      }}
      aria-hidden="true"
    >
      ›
    </span>
  );

  const badges = (
    <div className="flex items-center gap-2 flex-wrap">
      {p.badge && (
        <span className="font-code text-white/40 rounded" style={pill}>{p.badge}</span>
      )}
      {p.devpostUrl && (
        <a
          href={p.devpostUrl} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-code text-white/40 rounded hover:text-white/70 transition-colors duration-150"
          style={pill}
        >
          devpost
        </a>
      )}
    </div>
  );

  const expandedPanel = (
    // CSS grid trick: animates to natural content height without needing a fixed maxHeight
    <div
      style={{
        display: "grid",
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.4s ease-in-out",
        borderLeft: isExpanded ? "2px solid #6366f1" : "2px solid transparent",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <div
          className="flex gap-5 pb-6"
          style={{
            paddingLeft: isMobile ? "0" : "248px",
            paddingTop: "16px",
            alignItems: "flex-start",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* Screenshot */}
          {p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={`${p.name} screenshot`}
              style={{
                height: isMobile ? "auto" : "140px",
                width: isMobile ? "100%" : "auto",
                maxWidth: isMobile ? "100%" : "260px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3" style={{ paddingTop: isMobile ? "0" : "6px" }}>
            {p.url && (
              <a
                href={p.url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-code text-white hover:bg-[#6366f1] transition-colors duration-150 rounded"
                style={{ fontSize: "12px", padding: "8px 16px", border: "1px solid #6366f1", minHeight: "44px", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                Visit Project →
              </a>
            )}
            {p.devpostUrl && (
              <a
                href={p.devpostUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-code text-white/50 hover:text-white/80 transition-colors duration-150 rounded"
                style={{ fontSize: "12px", padding: "8px 16px", border: "1px solid rgba(255,255,255,0.15)", minHeight: "44px", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}
              >
                DevPost ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const rowShell = (children: React.ReactNode) => (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full cursor-pointer outline-none"
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        borderLeft: isExpanded ? "2px solid #6366f1" : "2px solid transparent",
        transition: "background 0.15s, border-color 0.35s",
      }}
    >
      {children}
    </div>
  );

  return (
    <div ref={rowRef} style={{ borderBottom: DIVIDER }}>
      {isMobile ? (
        // ── Mobile: stacked layout ──────────────────────────────
        <>
          {rowShell(
            <div className="flex flex-col py-5 gap-3">
              {/* Logo + name + chevron */}
              <div className="flex items-center justify-between" style={anim(0)}>
                <div className="flex items-center gap-3">
                  <ProjectLogo src={p.logoSrc} name={p.name} />
                  <div>
                    <h3
                      id={i === 0 ? "projects-heading" : undefined}
                      className="font-heading text-white font-bold"
                      style={{ fontSize: "1.25rem" }}
                    >
                      {p.name}
                    </h3>
                    <span className="font-code text-white/30 block" style={{ fontSize: "11px" }}>{p.year}</span>
                    {badges}
                  </div>
                </div>
                {chevron}
              </div>
              {/* Description */}
              <div style={anim(80)}>
                <p className="font-code text-white/80 mb-1" style={{ fontSize: "14px" }}>{p.desc}</p>
                <p className="font-code text-white/55 leading-relaxed" style={{ fontSize: "12px" }}>{p.detail}</p>
              </div>
            </div>
          )}
          {expandedPanel}
        </>
      ) : (
        // ── Desktop: horizontal layout ──────────────────────────
        <>
          {rowShell(
            <div className="flex items-center py-9">
              {/* Logo */}
              <div style={{ ...anim(0), marginRight: "16px", flexShrink: 0 }}>
                <ProjectLogo src={p.logoSrc} name={p.name} />
              </div>

              {/* Name + year + badges */}
              <div style={{ ...anim(160), width: "200px", flexShrink: 0 }}>
                <h3
                  id={i === 0 ? "projects-heading" : undefined}
                  className="font-heading text-white font-bold"
                  style={{ fontSize: "1.5rem" }}
                >
                  {p.name}
                </h3>
                <span className="font-code text-white/30 block mb-1" style={{ fontSize: "11px" }}>{p.year}</span>
                {badges}
              </div>

              {/* Description + detail */}
              <div className="flex-1 min-w-0 px-8 md:px-12" style={anim(240)}>
                <p className="font-code text-white/80 mb-1.5" style={{ fontSize: "15px" }}>{p.desc}</p>
                <p className="font-code text-white/55 leading-relaxed" style={{ fontSize: "13px" }}>{p.detail}</p>
              </div>

              {/* Chevron */}
              <div style={{ flexShrink: 0 }}>
                {chevron}
              </div>
            </div>
          )}
          {expandedPanel}
        </>
      )}
    </div>
  );
}

function ProjectsSection() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (i: number) => setExpanded((prev) => (prev === i ? null : i));

  return (
    <section id="projects" aria-labelledby="projects-heading">
      <SectionLabel text="Selected Projects" />
      <div style={{ borderTop: DIVIDER }}>
        {PROJECTS.map((p, i) => (
          <ProjectRow
            key={p.name}
            p={p}
            i={i}
            isExpanded={expanded === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  const stats = [
    { value: "UCLA",         label: "Math of Computation" },
    { value: "ACM Hack",     label: "Officer" },
    { value: "NAVFAC NREIP", label: "2026" },
    { value: "Flute · Guitar", label: "Band" },
  ];

  return (
    <section id="about" aria-label="About">
      <SectionLabel text="About" />
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginBottom: "2rem" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        <div>
          <p className="font-code text-white/70 leading-relaxed" style={{ fontSize: "14px" }}>
            I&apos;m currently studying Math of Computation at UCLA.
            I like building things that are actually useful. Most of my projects
            started because I needed something that didn&apos;t exist yet.
          </p>
          <p className="font-code text-white/70 leading-relaxed mt-4" style={{ fontSize: "14px" }}>
            Outside of coding I play music. I&apos;ve been playing flute for 8 years
            and guitar for 5, and I play in a band with friends. If I&apos;m not at
            my desk or playing music I&apos;m probably playing basketball.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col justify-between p-5"
              style={{ background: "#050505" }}
            >
              <span
                className="font-heading text-white/90 font-semibold block mb-1"
                style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)" }}
              >
                {value}
              </span>
              <span className="font-code text-white/30 uppercase tracking-widest" style={{ fontSize: "9px" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  return (
    <button
      onClick={copy}
      className="font-code transition-colors duration-150 cursor-pointer flex-shrink-0"
      style={{
        fontSize: "11px",
        padding: "3px 10px",
        border: `1px solid ${copied ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.15)"}`,
        borderRadius: "4px",
        color: copied ? "#2dd4bf" : "rgba(255,255,255,0.4)",
        background: copied ? "rgba(45,212,191,0.08)" : "transparent",
        transition: "all 0.2s",
        minHeight: "28px",
        whiteSpace: "nowrap",
      }}
      aria-label="Copy email address"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ContactSection() {
  const email = "jaivinphabiani@gmail.com";

  return (
    <section id="contact" aria-labelledby="contact-heading">
      <SectionLabel text="Contact" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
        <div>
          <h2
            id="contact-heading"
            className="font-heading text-white/90 font-semibold leading-tight mb-3"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Let&apos;s build something.
          </h2>
          <p className="font-code text-white/30 leading-relaxed" style={{ fontSize: "13px" }}>
            Open to internships, collaborations, and interesting problems.
          </p>
        </div>

        <nav className="flex flex-col gap-3.5 pt-1" aria-label="Contact links">
          {/* Email row with copy button */}
          <div className="flex items-center gap-3">
            <ContactLink href={`mailto:${email}`} label={email} />
            <CopyEmailButton email={email} />
          </div>
          <ContactLink href="https://github.com/JaivinP"   label="github.com/JaivinP" />
          <ContactLink href="https://www.linkedin.com/in/jaivin-phabiani-6bb019295/" label="linkedin.com/in/jaivinphabiani" />
        </nav>
      </div>
    </section>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Portfolio() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [zone1Height, setZone1Height] = useState("600vh");

  // Shorter scroll zone on mobile — less scrolling required
  useEffect(() => {
    const update = () => setZone1Height(window.innerWidth < 768 ? "300vh" : "600vh");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const framesRef   = useRef<HTMLImageElement[]>([]);
  const rafRef      = useRef<number>(0);
  const rawP        = useRef(0);
  const smoothP     = useRef(0);

  // Zone 1 overlay refs — mutated directly in the RAF loop
  const heroRef      = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const t1Ref        = useRef<HTMLDivElement>(null);
  const t2Ref        = useRef<HTMLDivElement>(null);
  const t3Ref        = useRef<HTMLDivElement>(null);
  const t4Ref        = useRef<HTMLDivElement>(null);

  // Preload all 240 frames
  useEffect(() => {
    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let done = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/ezgif-frame-${String(i + 1).padStart(3, "0")}.webp`;
      const onSettle = () => {
        done++;
        setLoadProgress(Math.round((done / TOTAL_FRAMES) * 100));
        if (done === TOTAL_FRAMES) { framesRef.current = imgs; setLoaded(true); }
      };
      img.onload = onSettle;
      img.onerror = onSettle;
      imgs[i] = img;
    }
  }, []);

  // Canvas + scroll scrub (scoped to Zone 1 only)
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onScroll = () => {
      // Responsive zone height: 300vh on mobile, 600vh on desktop
      const zone1Max =
        window.innerWidth < 768
          ? 1.2 * window.innerHeight   // 220vh − 100vh = 120vh
          : 5 * window.innerHeight;    // 600vh − 100vh = 500vh
      rawP.current = Math.min(1, Math.max(0, window.scrollY / zone1Max));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    function drawFrame(idx: number) {
      const img = framesRef.current[idx];
      if (!img?.complete || img.naturalWidth === 0 || !ctx || !canvas) return;
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    let lastIdx = -1;

    const loop = () => {
      smoothP.current = prefersReduced
        ? rawP.current
        : smoothP.current + (rawP.current - smoothP.current) * 0.07;

      const s = smoothP.current;
      const idx = frameIndex(s);
      if (idx !== lastIdx) { drawFrame(idx); lastIdx = idx; }

      // Hero: full at start, fades out 7–12%
      setOp(heroRef.current,      fade(s, 0,    0,    0.07, 0.12));
      // Scroll cue: brief appearance 2–9%
      setOp(scrollCueRef.current, fade(s, 0.02, 0.05, 0.07, 0.10));
      // Text overlays spread across deconstruction zone (0.10–0.90)
      setOp(t1Ref.current, fade(s, 0.12, 0.16, 0.26, 0.30));
      setOp(t2Ref.current, fade(s, 0.34, 0.38, 0.48, 0.52));
      setOp(t3Ref.current, fade(s, 0.55, 0.58, 0.66, 0.70));
      setOp(t4Ref.current, fade(s, 0.72, 0.75, 0.81, 0.85));

      rafRef.current = requestAnimationFrame(loop);
    };

    drawFrame(0);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [loaded]);

  if (!loaded) return <LoadingScreen progress={loadProgress} />;

  return (
    <main>
      <ParticleBackground />
      <Navbar />

      <div className="sr-only">
        Jaivin Phabiani — Full-Stack Engineer, ML &amp; Data Systems, ACM Hack UCLA, NAVFAC NREIP 2026.
      </div>

      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#6366f1] focus:text-white focus:rounded font-code text-sm"
      >
        Skip to content
      </a>

      {/* ── ZONE 1 — scroll animation (600vh desktop / 300vh mobile) ──────── */}
      <div style={{ height: zone1Height }}>
        <div className="sticky top-0 h-screen overflow-hidden bg-[#050505]">

          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />

          {/* Covers watermark burned into source frames */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 280,
              height: 50,
              background: "#050505",
              zIndex: 9999,
            }}
          />

          {/* Hero */}
          <div
            ref={heroRef}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
            style={{ opacity: 1 }}
          >
            <p className="font-code text-[#2dd4bf]/70 tracking-[0.35em] uppercase mb-5" style={{ fontSize: "13px" }}>
              Portfolio
            </p>
            <h1
              className="font-heading text-white font-bold leading-none tracking-tight text-center"
              style={{ fontSize: "clamp(2rem, 7vw, 7rem)" }}
            >
              Jaivin
              <br className="sm:hidden" />
              {" "}Phabiani
            </h1>
            <p className="font-code text-white/55 tracking-widest uppercase mt-5" style={{ fontSize: "14px" }}>
              Software Engineer
            </p>
          </div>

          {/* Scroll cue */}
          <div
            ref={scrollCueRef}
            className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none"
            style={{ opacity: 0 }}
          >
            <p className="font-code text-white/25 tracking-[0.3em] uppercase mb-3" style={{ fontSize: "9px" }}>
              scroll to explore
            </p>
            <div className="scroll-cue-line" style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Deconstruction overlays */}
          <div ref={t1Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
            <TextOverlay num="01" label="role"        title="Full-Stack Engineer" />
          </div>
          <div ref={t2Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
            <TextOverlay num="02" label="focus"       title="ML & Data Systems" />
          </div>
          <div ref={t3Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
            <TextOverlay num="03" label="community"   title="ACM Hack UCLA" />
          </div>
          <div ref={t4Ref} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
            <TextOverlay num="04" label="internship"  title="NAVFAC NREIP 2026" />
          </div>

        </div>
      </div>

      {/* ── ZONE 2 — Normal page content ─────────────────────────────────── */}
      <div>
        {/* Thin rule separating zones */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

        <div className="mx-auto px-6 md:px-12 lg:px-20" style={{ maxWidth: "1100px" }}>

          {/* Projects */}
          <div className="pt-6 pb-12 md:py-20">
            <ProjectsSection />
          </div>

          {/* Stack */}
          <div className="py-16 md:py-20">
            <StackSection />
          </div>

          {/* About */}
          <div className="py-16 md:py-20">
            <AboutSection />
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

          {/* Contact */}
          <div className="py-16 md:py-20">
            <ContactSection />
          </div>

        </div>

        {/* Footer */}
        <div
          className="text-center pb-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="font-code text-white/15 pt-10" style={{ fontSize: "10px" }}>
            Jaivin Phabiani · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
