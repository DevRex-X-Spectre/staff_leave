import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

/* -------------------------------------------------------------------------
   Input - Cal.com style: 8px radius, paper background, silver border.
   ------------------------------------------------------------------------- */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={cn(
        'w-full h-10 px-3 rounded-[var(--radius-md)]',
        'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
        'text-[var(--text-primary)] text-[14px] font-light tracking-tight leading-none',
        'placeholder:text-[var(--text-tertiary)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-150',
        error && 'border-[var(--danger)] focus:ring-[var(--danger)]',
        className
      )}
      {...props}
    />
    {error && (
      <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>
    )}
  </div>
));
Input.displayName = 'Input';

/* -------------------------------------------------------------------------
   Textarea
   ------------------------------------------------------------------------- */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <div className="w-full">
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[96px] px-3 py-2.5 rounded-[var(--radius-md)] resize-y',
        'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
        'text-[var(--text-primary)] text-[14px] font-light tracking-tight leading-none',
        'placeholder:text-[var(--text-tertiary)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-150',
        error && 'border-[var(--danger)]',
        className
      )}
      {...props}
    />
    {error && (
      <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>
    )}
  </div>
));
Textarea.displayName = 'Textarea';

/* -------------------------------------------------------------------------
   Select
   ------------------------------------------------------------------------- */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: string;
    placeholder?: string;
    children: ReactNode;
  }
>(({ className, error, placeholder, children, ...props }, ref) => (
  <div className="w-full">
    <select
      ref={ref}
      className={cn(
        'w-full h-10 px-3 rounded-[var(--radius-md)] appearance-none',
        'bg-[var(--bg-input)] border border-[var(--border-subtle)]',
        'text-[var(--text-primary)] text-[14px] font-light tracking-tight leading-none',
        'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-150 cursor-pointer',
        'bg-no-repeat bg-[right_12px_center]',
        '[background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M2 4l4 4 4-4\' stroke=\'%236b7280\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")]',
        error && 'border-[var(--danger)]',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
    {error && (
      <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>
    )}
  </div>
));
Select.displayName = 'Select';

/* -------------------------------------------------------------------------
   Label
   ------------------------------------------------------------------------- */
export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5',
        className
      )}
    >
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------
   FormField - wraps Label + Input + error in one composable unit
   ------------------------------------------------------------------------- */
export function FormField({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[12px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
