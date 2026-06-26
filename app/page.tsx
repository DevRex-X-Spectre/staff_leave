import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--ink)] rounded-[var(--radius-md)] flex items-center justify-center">
            <span className="text-white text-[13px] font-bold tracking-tight">NA</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-none">NAUB LMS</p>
            <p className="text-[11px] text-[var(--text-tertiary)] leading-none mt-0.5">
              Nigerian Army University, Biu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="ink" size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--bg-subtle)] rounded-full border border-[var(--border-subtle)] text-[12px] text-[var(--text-secondary)] mb-6">
          Nigerian Army University, Biu
        </div>
        <h1 className="text-[48px] font-semibold text-[var(--text-primary)] leading-[1.1] tracking-tight max-w-3xl mx-auto">
          Staff Leave Management,
          <br />
          <span className="text-[var(--color-action-blue)]">Simplified.</span>
        </h1>
        <p className="text-[18px] text-[var(--text-secondary)] mt-6 max-w-xl mx-auto leading-relaxed font-light">
          Apply, track, and approve leave requests in one place. Built for the
          Nigerian Army University, Biu community.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link href="/login">
            <Button variant="ink" size="lg">Sign in to your account</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">Register as staff</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--bg-card)] border-t border-[var(--border-subtle)] py-20">
        <div className="max-w-[1200px] mx-auto px-8">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)] text-center mb-14">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 bg-[var(--bg-page)] rounded-[var(--radius-lg)]"
              >
                <div className="w-10 h-10 bg-[var(--ink)] rounded-[var(--radius-md)] flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-2">
                  {f.title}
                </h3>
                <p className="text-[14px] text-[var(--text-secondary)] font-light leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 max-w-[1200px] mx-auto px-8">
        <p className="text-[12px] text-[var(--text-tertiary)] text-center">
          Nigerian Army University, Biu (NAUB) — Staff Leave Management System
        </p>
      </footer>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={16} strokeWidth={1.5} />
      ) : (
        <Moon size={16} strokeWidth={1.5} />
      )}
    </button>
  );
}

const FEATURES = [
  {
    title: 'Apply in minutes',
    description:
      'Submit leave requests with supporting documents. Know your remaining balance at a glance.',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    title: 'Two-gate approval',
    description:
      'HOD reviews first, then HR gives final approval. Track every step in real time.',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    title: 'Rota calendar',
    description:
      'Department heads publish leave rotas. Staff see conflicts before applying.',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
];
