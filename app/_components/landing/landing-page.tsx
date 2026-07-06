import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarRange,
  CheckCircle,
  FileText,
  Shield,
  Sparkles,
  Users,
  Zap,
  Smartphone,
  BarChart3,
  Check,
  Clock,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { HeroMockup } from './hero-mockup';
import { ApprovalFlow } from './approval-flow';
import { Marquee } from './marquee';
import { Reveal } from './reveal';
import { AnimatedCounter } from './animated-counter';

/**
 * LandingPage — Cal.com-style marketing page for NAUB LMS.
 *
 * Design rules followed (from design_skill/cal.com.md):
 * - Cal Sans 600 for headlines (20px+), Cal Sans UI 300 for body
 * - Strict monochrome — Ink, Graphite, Slate, Paper, White
 * - Pill-shaped buttons (9999px) for primary/secondary CTAs
 * - 12px card radius, NO borders on cards, shadow only
 * - 24px card padding
 * - 96px section gap
 * - 1200px page max-width
 * - Product-centric illustrations, no abstract graphics
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col">
      {/* ============================== HEADER ============================== */}
      <header className="sticky top-0 z-50 bg-[var(--bg-page)]/85 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 bg-[var(--ink)] rounded-[var(--radius-md)] inline-flex items-center justify-center">
              <span className="text-white text-[11px] font-bold tracking-tight">
                NA
              </span>
            </span>
            <span className="text-[13px] font-semibold tracking-tight">
              NAUB LMS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[14px] text-[var(--text-secondary)]">
            <a
              href="#features"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Features
            </a>
            <a
              href="#flow"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              How it works
            </a>
            <a
              href="#roles"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Roles
            </a>
            <a
              href="#faq"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="header" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        {/* Subtle dot grid backdrop, masked to top centre */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(36,36,36,0.1) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 30%, black 25%, transparent 70%)',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 30%, black 25%, transparent 70%)',
          }}
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
            {/* Left — copy */}
            <Reveal>
              {/* Tag eyebrow (Cal.com tag-button pattern) */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] text-[11px] font-medium text-[var(--text-secondary)] shadow-card"
              >
                <Sparkles size={11} strokeWidth={1.75} className="text-[var(--text-primary)]" />
                Built for NAUB Biu · 2026
              </span>

              <h1
                className="mt-6 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(36px, 6vw, 64px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                Leave management,
                <br />
                <span className="text-[var(--text-secondary)]">built for NAUB.</span>
              </h1>

              <p
                className="mt-6 max-w-[540px] text-[var(--text-secondary)]"
                style={{
                  fontSize: 'clamp(15px, 1.4vw, 18px)',
                  lineHeight: 1.5,
                  fontWeight: 300,
                  letterSpacing: '-0.19px',
                }}
              >
                Apply, approve, and track staff leave in one streamlined flow.
                Designed for the staff of Nigerian Army University, Biu — no
                paper forms, no queues, no lost requests.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="ink" size="lg" className="w-full">
                    Sign in
                    <ArrowRight size={16} strokeWidth={2} />
                  </Button>
                </Link>
                <a href="#features" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full">
                    See features
                  </Button>
                </a>
              </div>

              <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[var(--text-secondary)]"
                style={{ fontWeight: 300, letterSpacing: '-0.19px' }}
              >
                <li className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-[var(--text-primary)]" strokeWidth={2.5} />
                  Free for all NAUB staff
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-[var(--text-primary)]" strokeWidth={2.5} />
                  No credit card required
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-[var(--text-primary)]" strokeWidth={2.5} />
                  Works on any device
                </li>
              </ul>
            </Reveal>

            {/* Right — product mockup */}
            <Reveal delay={120}>
              <HeroMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== LOGOS / DEPARTMENTS TRUST ROW ============================== */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
          <Reveal>
            <p className="text-center text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Used across every department at NAUB Biu
            </p>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-2 items-center">
            {DEPARTMENTS.map((d) => (
              <Reveal key={d} delay={DEPARTMENTS.indexOf(d) * 60}>
                <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] opacity-80 hover:opacity-100 transition-opacity">
                  <span className="w-5 h-5 rounded-md bg-[var(--bg-subtle)] inline-flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                    {d.charAt(0)}
                  </span>
                  <span className="tracking-tight">{d}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== TRUST STRIP / MARQUEE ============================== */}
      <section className="bg-[var(--bg-page)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Reveal>
            <p className="text-center text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              7 leave types supported out of the box
            </p>
          </Reveal>

          <div className="mt-6">
            <Marquee>
              {LEAVE_TYPES.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap shadow-card"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />
                  {t}
                </span>
              ))}
            </Marquee>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-[860px] mx-auto">
            {[
              { v: 8, s: '+', label: 'Roles configured' },
              { v: 5, s: '', label: 'Departments' },
              { v: 7, s: '', label: 'Leave types' },
              { v: 100, s: '%', label: 'Paperless' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="text-center sm:text-left">
                  <p
                    className="font-semibold text-[var(--text-primary)] tabular-nums"
                    style={{
                      fontFamily: 'var(--font-cal-sans)',
                      fontSize: 'clamp(32px, 4vw, 44px)',
                      lineHeight: 1,
                      letterSpacing: '0.01em',
                    }}
                  >
                    <AnimatedCounter value={s.v} suffix={s.s} />
                  </p>
                  <p className="mt-2 text-[13px] text-[var(--text-secondary)]"
                    style={{ fontWeight: 300 }}
                  >
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================== */}
      <section id="features" className="py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                Features
              </p>
              <h2
                className="mt-3 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                Everything NAUB needs to run leave.
              </h2>
              <p
                className="mt-4 text-[15px] text-[var(--text-secondary)]"
                style={{ fontWeight: 300, lineHeight: 1.5 }}
              >
                Six focused capabilities. No bloated modules, no spreadsheets,
                no email chains — just the workflow that actually works for a
                university.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <FeatureCard {...f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== APPROVAL FLOW DEMO ============================== */}
      <section
        id="flow"
        className="py-24 bg-[var(--bg-card)] border-y border-[var(--border-subtle)]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">
            <Reveal>
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                The flow
              </p>
              <h2
                className="mt-3 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                From application
                <br />
                to approval, in
                <br />
                <span className="text-[var(--text-secondary)]">
                  one clear path.
                </span>
              </h2>
              <p
                className="mt-5 text-[15px] text-[var(--text-secondary)]"
                style={{ fontWeight: 300, lineHeight: 1.5 }}
              >
                Every leave request moves through the same simple flow. HODs
                review first, then HR gives the final nod. Both can act from
                their dashboard — no chasing emails, no paper trails.
              </p>

              <ul className="mt-7 space-y-3.5">
                {[
                  'Staff submit requests in four guided steps',
                  'HODs see their department queue on one screen',
                  'HR managers give the final sign-off with one click',
                  'Status updates flow back to the staff member live',
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]"
                    style={{ fontWeight: 300, lineHeight: 1.5 }}
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--ink)] inline-flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <ApprovalFlow />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== ROLES ============================== */}
      <section id="roles" className="py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                Built for everyone
              </p>
              <h2
                className="mt-3 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                One system, four tailored roles.
              </h2>
              <p
                className="mt-4 text-[15px] text-[var(--text-secondary)]"
                style={{ fontWeight: 300, lineHeight: 1.5 }}
              >
                Each user type sees only what they need. No accidentally seeing
                the wrong queue, no manual filtering — just the right
                dashboard for the right job.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <RoleCard {...r} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS ============================== */}
      <section className="py-24 bg-[var(--bg-card)] border-y border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                How it works
              </p>
              <h2
                className="mt-3 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                Up and running in a day.
              </h2>
              <p
                className="mt-4 text-[15px] text-[var(--text-secondary)]"
                style={{ fontWeight: 300, lineHeight: 1.5 }}
              >
                No training sessions, no consultants. HR provisions staff
                accounts, admins approve them, and everyone submits their
                first leave request in minutes.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 relative">
            {/* Connector line behind cards on desktop */}
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px"
              style={{
                backgroundImage:
                  'linear-gradient(to right, var(--border-subtle) 50%, transparent 0%)',
                backgroundSize: '12px 1px',
                backgroundRepeat: 'repeat-x',
              }}
              aria-hidden
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <StepCard {...s} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section id="faq" className="py-24">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                FAQ
              </p>
              <h2
                className="mt-3 font-semibold text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  lineHeight: 1.1,
                  letterSpacing: '0.01em',
                }}
              >
                Questions, answered.
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 space-y-3">
            {FAQS.map((q, i) => (
              <Reveal key={q.q} delay={i * 60}>
                <FaqItem q={q.q} a={q.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== FINAL CTA ============================== */}
      <section className="pb-24">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[16px] bg-[var(--ink)] text-white px-6 sm:px-12 py-14 sm:py-20 text-center shadow-cta">
              {/* Decorative dot grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.08]"
                aria-hidden
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative max-w-2xl mx-auto">
                <h2
                  className="font-semibold"
                  style={{
                    fontFamily: 'var(--font-cal-sans)',
                    fontSize: 'clamp(32px, 4.5vw, 52px)',
                    lineHeight: 1.1,
                    letterSpacing: '0.01em',
                  }}
                >
                  Ready to simplify leave at NAUB?
                </h2>
                <p
                  className="mt-5 text-[15px] sm:text-[17px] text-white/70"
                  style={{ fontWeight: 300, lineHeight: 1.5 }}
                >
                  Sign in with your staff ID to access the NAUB leave
                  management system. Accounts are provisioned by your HR /
                  admin team.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      variant="ink"
                      size="lg"
                      className="w-full bg-white text-[var(--ink)] hover:bg-white/90 hover:text-[var(--ink)] border-0"
                    >
                      Sign in
                      <ArrowRight size={16} strokeWidth={2} />
                    </Button>
                  </Link>
                  <a href="#features" className="w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full text-white hover:bg-white/10"
                    >
                      See how it works
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-[var(--border-subtle)] py-10 mt-auto bg-[var(--bg-card)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-[var(--ink)] rounded-[var(--radius-md)] inline-flex items-center justify-center">
                <span className="text-white text-[11px] font-bold tracking-tight">
                  NA
                </span>
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                  NAUB LMS
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Nigerian Army University, Biu
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--text-secondary)]"
              style={{ fontWeight: 300 }}
            >
              <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
                Features
              </a>
              <a href="#flow" className="hover:text-[var(--text-primary)] transition-colors">
                How it works
              </a>
              <a href="#roles" className="hover:text-[var(--text-primary)] transition-colors">
                Roles
              </a>
              <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">
                FAQ
              </a>
              <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
                Sign in
              </Link>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)]" style={{ fontWeight: 300 }}>
              © 2026 NAUB · All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================== Sub-components ============================== */

function FeatureCard({
  title,
  description,
  icon: Icon,
  detail,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  detail: string;
}) {
  return (
    <div
      className="group relative h-full bg-[var(--bg-card)] rounded-[12px] p-6 transition-all duration-300 hover:-translate-y-0.5 shadow-card"
    >
      <div className="flex items-start justify-between mb-5">
        <span className="w-10 h-10 rounded-[10px] bg-[var(--bg-subtle)] inline-flex items-center justify-center transition-colors duration-300 group-hover:bg-[var(--ink)]">
          <Icon
            size={18}
            strokeWidth={1.5}
            className="text-[var(--text-primary)] transition-colors duration-300 group-hover:text-white"
          />
        </span>
        {/* Numbered tag — Cal.com style */}
        <span
          className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[10px] font-semibold text-[var(--text-tertiary)] tracking-widest uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {detail}
        </span>
      </div>
      <h3
        className="text-[20px] font-semibold text-[var(--text-primary)]"
        style={{
          fontFamily: 'var(--font-cal-sans)',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-[14px] text-[var(--text-secondary)]"
        style={{ fontWeight: 300, lineHeight: 1.5, letterSpacing: '-0.19px' }}
      >
        {description}
      </p>
    </div>
  );
}

function RoleCard({
  title,
  description,
  capabilities,
  icon: Icon,
  tag,
}: {
  title: string;
  description: string;
  capabilities: string[];
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tag: string;
}) {
  return (
    <div
      className="group h-full bg-[var(--bg-card)] rounded-[12px] p-6 transition-all duration-300 hover:-translate-y-0.5 shadow-card"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-[10px] bg-[var(--bg-subtle)] inline-flex items-center justify-center transition-colors duration-300 group-hover:bg-[var(--ink)]">
          <Icon
            size={18}
            strokeWidth={1.5}
            className="text-[var(--text-primary)] transition-colors duration-300 group-hover:text-white"
          />
        </span>
        <div className="min-w-0">
          <p
            className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)]"
            style={{ letterSpacing: '0.08em' }}
          >
            {tag}
          </p>
          <h3
            className="text-[17px] font-semibold text-[var(--text-primary)] leading-tight mt-0.5"
            style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
          >
            {title}
          </h3>
        </div>
      </div>
      <p
        className="text-[13px] text-[var(--text-secondary)]"
        style={{ fontWeight: 300, lineHeight: 1.5 }}
      >
        {description}
      </p>
      <ul className="mt-4 space-y-1.5">
        {capabilities.map((c) => (
          <li
            key={c}
            className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]"
            style={{ fontWeight: 300 }}
          >
            <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] shrink-0" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({
  n,
  title,
  description,
}: {
  n: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative h-full bg-[var(--bg-card)] rounded-[12px] p-6 text-center shadow-card"
    >
      <div className="flex items-center justify-center mb-5">
        <span
          className="w-10 h-10 rounded-full bg-[var(--ink)] inline-flex items-center justify-center text-[14px] font-semibold text-white"
          style={{ fontFamily: 'var(--font-cal-sans)' }}
        >
          {n}
        </span>
      </div>
      <h3
        className="text-[20px] font-semibold text-[var(--text-primary)]"
        style={{
          fontFamily: 'var(--font-cal-sans)',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-[14px] text-[var(--text-secondary)]"
        style={{ fontWeight: 300, lineHeight: 1.5 }}
      >
        {description}
      </p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="group bg-[var(--bg-card)] rounded-[12px] overflow-hidden shadow-card"
    >
      <summary className="flex items-center justify-between gap-4 cursor-pointer p-5 list-none">
        <h3
          className="text-[15px] font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
        >
          {q}
        </h3>
        <span
          className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] inline-flex items-center justify-center text-[var(--text-secondary)] shrink-0 transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 -mt-1">
        <p
          className="text-[14px] text-[var(--text-secondary)]"
          style={{ fontWeight: 300, lineHeight: 1.55 }}
        >
          {a}
        </p>
      </div>
    </details>
  );
}

/* ============================== Data ============================== */

const DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biological Sciences',
];

const LEAVE_TYPES = [
  'Annual Leave',
  'Casual Leave',
  'Sick Leave',
  'Maternity Leave',
  'Study Leave',
  'Sabbatical Leave',
  'Examination Leave',
];

const FEATURES = [
  {
    title: 'Online applications',
    description:
      'Submit leave requests from any device in four guided steps. No paper forms, no queues, no lost requests.',
    detail: '01',
    icon: FileText,
  },
  {
    title: 'Multi-stage approval',
    description:
      'HODs review, HR approves. Every step tracked in real time with a full audit trail.',
    detail: '02',
    icon: CheckCircle,
  },
  {
    title: 'Rota calendar',
    description:
      'HODs publish departmental leave rotas. Staff see conflicts before they apply, never after.',
    detail: '03',
    icon: CalendarRange,
  },
  {
    title: 'Real-time notifications',
    description:
      'Email and in-app notifications at every stage. Staff and approvers never miss an update.',
    detail: '04',
    icon: Bell,
  },
  {
    title: 'Role-based access',
    description:
      'Staff, HOD, HR, and Admin each get a tailored dashboard with the right tools, and only those.',
    detail: '05',
    icon: Shield,
  },
  {
    title: 'Works on any device',
    description:
      'Fully responsive across phones, tablets, and laptops. Apply, approve, and track on the go.',
    detail: '06',
    icon: Smartphone,
  },
];

const ROLES = [
  {
    title: 'Staff',
    tag: 'For everyone',
    description:
      'Apply for leave, view balances, track every request from submission to sign-off.',
    icon: Users,
    capabilities: [
      'Apply in 4 guided steps',
      'View leave balances live',
      'Track every status update',
      'Cancel pending requests',
    ],
  },
  {
    title: 'Head of Department',
    tag: 'For HODs',
    description:
      'See the department queue at a glance, approve or reject with context, and publish rotas.',
    icon: Shield,
    capabilities: [
      'Department review queue',
      'One-click approve / reject',
      'Rota calendar publishing',
      'Conflict detection',
    ],
  },
  {
    title: 'HR Manager',
    tag: 'For HR',
    description:
      'Final approval, manage staff entitlements, export reports to Excel or PDF in a click.',
    icon: BarChart3,
    capabilities: [
      'Final HR approval',
      'Manage entitlements',
      'Excel + PDF reports',
      'Cross-department view',
    ],
  },
  {
    title: 'Administrator',
    tag: 'For admins',
    description:
      'Approve new accounts, manage departments, configure leave types, and tune the system.',
    icon: Zap,
    capabilities: [
      'Approve new staff accounts',
      'Manage departments & HODs',
      'Configure leave types',
      'System-wide notifications',
    ],
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Account provisioned',
    description:
      'HR creates your account with your staff ID and the default password. You are pre-assigned to a department and a role.',
  },
  {
    n: '2',
    title: 'Sign in & personalise',
    description:
      'Sign in with your staff ID, then change the default password to something memorable from your profile page.',
  },
  {
    n: '3',
    title: 'Apply & track',
    description:
      'Submit your first leave request in under two minutes. Watch it move through HOD and HR review in real time.',
  },
];

const FAQS = [
  {
    q: 'How do I get a staff ID and account?',
    a: 'Your staff ID is issued by NAUB HR. When HR provisions your account, you receive a one-time default password. Sign in with your staff ID, then personalise the password from your profile.',
  },
  {
    q: 'Is this only for academic staff?',
    a: 'No. NAUB LMS supports both academic and non-academic staff with role-specific leave entitlements and approval chains.',
  },
  {
    q: 'What happens if I submit a request over my balance?',
    a: 'The system warns you at submission time and shows a red flag during HOD review. Your HOD or HR can still approve with justification.',
  },
  {
    q: 'Can I cancel a request I already submitted?',
    a: 'Yes. You can cancel any request that is still pending HOD or HR review. Once approved, cancellation requires HR sign-off.',
  },
  {
    q: 'Does it send email notifications?',
    a: 'Yes. Every status change (submitted, HOD approved, HR approved, rejected, cancelled) sends an email to the relevant parties.',
  },
  {
    q: 'How is leave conflict detected?',
    a: 'When HODs publish a rota, the system flags any future leave application that overlaps with an already-approved slot in the same department.',
  },
  {
    q: 'Can I access this on my phone?',
    a: 'Yes. The whole system is fully responsive and works on any modern phone, tablet, or laptop browser.',
  },
];
