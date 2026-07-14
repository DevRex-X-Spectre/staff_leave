import Link from 'next/link';
import { ArrowRight, FileText, ShieldCheck, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { LeaveWidgetCard } from './leave-widget-card';

/**
 * Landing page - Cal.com design skill, hero + 3-column feature grid.
 *
 * Exactly the patterns described in design_skill/cal.com.md:
 *   - Hero: headline + body + 2 CTAs on the left, scheduling widget on the right
 *   - Below: centered headline + 3-column feature card grid (each card uses
 *     a Cal Sans 20px heading, Cal Sans UI body, and the diffuse card shadow)
 *
 * Nothing else.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper,#f4f4f4)] text-[var(--graphite,#242424)] flex flex-col">
      {/* HEADER */}
      <header className="bg-[var(--paper,#f4f4f4)] border-b border-[var(--silver,#e5e7eb)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/naub-logo.png" alt="NAUB logo" className="w-8 h-8 rounded-full shrink-0" />
            <span
              className="text-[13px] font-semibold tracking-tight text-[var(--graphite,#242424)]"
              style={{ fontFamily: 'var(--font-cal-sans-ui)' }}
            >
              NAUB LMS
            </span>
          </Link>
          <Link href="/login">
            <Button variant="header" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <main className="flex-1">
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
            {/* Left - copy */}
            <div>
              <h1
                className="font-semibold text-[var(--graphite,#242424)]"
                style={{
                  fontFamily: 'var(--font-cal-sans)',
                  fontSize: 'var(--text-display)',
                  lineHeight: 'var(--leading-display)',
                  letterSpacing: 'var(--tracking-display)',
                }}
              >
                The better way to
                <br />
                manage staff leave.
              </h1>

              <p
                className="mt-6 max-w-[540px] text-[var(--slate,#6b7280)]"
                style={{
                  fontFamily: 'var(--font-cal-sans-ui)',
                  fontSize: 'var(--text-subheading)',
                  lineHeight: 'var(--leading-subheading)',
                  fontWeight: 'var(--font-weight-light)',
                  letterSpacing: 'var(--tracking-subheading)',
                }}
              >
                NAUB LMS gives every staff member at Nigerian Army
                University, Biu a single place to apply, approve, and
                track leave. Sign in with your staff ID, and you're set.
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
                    Learn more
                  </Button>
                </a>
              </div>
            </div>

            {/* Right - scheduling-widget card */}
            <div>
              <LeaveWidgetCard />
            </div>
          </div>
        </section>

        {/* FEATURES - 3-column grid, the Cal.com pattern below the hero */}
        <section
          id="features"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-[11px] uppercase tracking-widest text-[var(--stone,#898989)] font-semibold"
              style={{ letterSpacing: '0.08em' }}
            >
              Features
            </p>
            <h2
              className="mt-3 font-semibold text-[var(--graphite,#242424)]"
              style={{
                fontFamily: 'var(--font-cal-sans)',
                fontSize: 'var(--text-heading-lg)',
                lineHeight: 'var(--leading-heading-lg)',
                letterSpacing: 'var(--tracking-heading-lg)',
              }}
            >
              Everything leave management needs.
            </h2>
            <p
              className="mt-4 text-[var(--slate,#6b7280)]"
              style={{
                fontFamily: 'var(--font-cal-sans-ui)',
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-body)',
                fontWeight: 'var(--font-weight-light)',
                letterSpacing: 'var(--tracking-body)',
              }}
            >
              One streamlined flow for the whole university: no paper
              forms, no queues, no lost requests.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="h-full">
                <span
                  className="inline-flex w-9 h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--paper,#f4f4f4)] mb-5"
                  aria-hidden
                >
                  <f.icon size={16} strokeWidth={1.5} className="text-[var(--graphite,#242424)]" />
                </span>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER - 3-region footer per the Cal.com style guide */}
      <footer className="border-t border-[var(--silver,#e5e7eb)] bg-[var(--white,#ffffff)] mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {/* Brand */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <img src="/naub-logo.png" alt="NAUB logo" className="w-8 h-8 rounded-full shrink-0" />
                <span
                  className="text-[13px] font-semibold tracking-tight text-[var(--graphite,#242424)]"
                  style={{ fontFamily: 'var(--font-cal-sans)' }}
                >
                  NAUB LMS
                </span>
              </Link>
              <p
                className="mt-3 text-[13px] text-[var(--slate,#6b7280)] max-w-[260px]"
                style={{
                  fontFamily: 'var(--font-cal-sans-ui)',
                  fontWeight: 'var(--font-weight-light)',
                  letterSpacing: 'var(--tracking-body-sm)',
                }}
              >
                Staff leave management system for Nigerian Army
                University, Biu.
              </p>
            </div>

            {/* Institution */}
            <div>
              <p
                className="text-[11px] uppercase tracking-widest text-[var(--stone,#898989)] font-semibold"
                style={{ letterSpacing: '0.08em' }}
              >
                Institution
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px] text-[var(--slate,#6b7280)]"
                style={{
                  fontFamily: 'var(--font-cal-sans-ui)',
                  fontWeight: 'var(--font-weight-light)',
                  letterSpacing: 'var(--tracking-body-sm)',
                }}
              >
                <li>Nigerian Army University, Biu</li>
                <li>Biu, Borno State, Nigeria</li>
              </ul>
            </div>

            {/* System */}
            <div>
              <p
                className="text-[11px] uppercase tracking-widest text-[var(--stone,#898989)] font-semibold"
                style={{ letterSpacing: '0.08em' }}
              >
                System
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px]"
                style={{
                  fontFamily: 'var(--font-cal-sans-ui)',
                  fontWeight: 'var(--font-weight-light)',
                  letterSpacing: 'var(--tracking-body-sm)',
                }}
              >
                <li>
                  <Link
                    href="/login"
                    className="text-[var(--graphite,#242424)] hover:text-[var(--ink)] transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-[var(--graphite,#242424)] hover:text-[var(--ink)] transition-colors"
                  >
                    Features
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom strip - copyright */}
          <div className="mt-10 pt-6 border-t border-[var(--silver,#e5e7eb)] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[12px] text-[var(--stone,#898989)]"
              style={{ fontFamily: 'var(--font-cal-sans-ui)' }}
            >
              © 2026 NAUB. All rights reserved.
            </p>
            <p className="text-[12px] text-[var(--stone,#898989)]"
              style={{ fontFamily: 'var(--font-cal-sans-ui)' }}
            >
              v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Online applications',
    description:
      'Staff apply from any device in four guided steps. Every request is tracked end-to-end with a full audit trail.',
    icon: FileText,
  },
  {
    title: 'Two-stage approval',
    description:
      'HODs review first, then the Registrar. Both queues live in one dashboard, with one-click decisions and the option to add context.',
    icon: ShieldCheck,
  },
  {
    title: 'Rota-aware calendar',
    description:
      'HODs publish departmental rotas so staff see conflicts before they apply, never after they have already submitted.',
    icon: CalendarRange,
  },
];