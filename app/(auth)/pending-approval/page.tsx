'use client';

import { Clock, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
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

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-left mb-8 shadow-[var(--shadow-sm-4)]">
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
    </div>
  );
}