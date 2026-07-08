import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/* -------------------------------------------------------------------------
   Button variants - Cal.com style:
   - ink:      solid Ink pill (primary CTA)
   - secondary: paper-pill with visible graphite text (secondary ghost)
   - header:    solid Ink rectangle, 8px radius (header CTA)
   - ghost:     transparent text-only (tertiary / non-destructive)
   - danger:    solid danger pill
   ------------------------------------------------------------------------- */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-body-sm tracking-tight leading-none whitespace-nowrap',
    'transition-all duration-150 cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        ink: [
          'bg-[var(--ink)] text-[var(--text-on-ink)]',
          'hover:bg-[#1c1c1c]',
          'rounded-full px-6 py-2.5',
        ],
        secondary: [
          'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)]',
          'hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)]',
          'rounded-full px-6 py-2.5',
        ],
        header: [
          'bg-[var(--ink)] text-[var(--text-on-ink)]',
          'hover:bg-[#1c1c1c]',
          'rounded-[var(--radius-md)] px-4 py-2 text-[13px]',
        ],
        'header-secondary': [
          'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)]',
          'hover:bg-[var(--bg-hover)]',
          'rounded-[var(--radius-md)] px-4 py-2 text-[13px]',
        ],
        ghost: [
          'bg-transparent text-[var(--text-primary)]',
          'hover:bg-[var(--bg-hover)]',
          'rounded-[var(--radius-md)] px-3 py-1.5',
        ],
        danger: [
          'bg-[var(--danger)] text-white',
          'hover:opacity-90',
          'rounded-full px-6 py-2.5',
        ],
        'outline-danger': [
          'bg-transparent border border-[var(--danger)] text-[var(--danger)]',
          'hover:bg-[var(--danger-bg)]',
          'rounded-full px-6 py-2.5',
        ],
        // Legacy alias kept so existing dashboard calls don't break.
        outline: [
          'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)]',
          'hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)]',
          'rounded-full px-6 py-2.5',
        ],
      },
      size: {
        sm: 'text-[13px] px-4 py-1.5',
        md: 'text-[14px] px-6 py-2.5',
        lg: 'text-[16px] px-7 py-3',
        icon: 'p-2 w-9 h-9',
      },
    },
    defaultVariants: {
      variant: 'ink',
      size: 'md',
    },
  }
);

export type ButtonProps = VariantProps<typeof buttonVariants> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';
