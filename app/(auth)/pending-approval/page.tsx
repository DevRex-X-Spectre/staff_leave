'use client';

import { Clock, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';

export default function PendingApprovalPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-4">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 bg-[var(--warning-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} className="text-[var(--warning)]" strokeWidth={1.5} />
        </div>

        <h1 className="text-[20px] font-semibold text-[var(--text-primary)] mb-3">
          Account pending approval
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8">
          Your account registration has been submitted and is awaiting approval
          from a system administrator. You will receive an email notification
          once your account is activated.
        </p>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-left mb-8">
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-[var(--text-secondary)] mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">What happens next?</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-[var(--text-secondary)] font-light">
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] mt-1.5 shrink-0" />
                  An admin reviews your registration details
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] mt-1.5 shrink-0" />
                  You receive an email when approved
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] mt-1.5 shrink-0" />
                  You can then sign in with your credentials
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
