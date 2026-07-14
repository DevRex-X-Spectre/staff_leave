'use client';

import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import {
  forwardRef,
  type InputHTMLAttributes,
  useId,
  useState,
} from 'react';

/* -------------------------------------------------------------------------
   PasswordInput - Input with a built-in show/hide toggle.

   Drop-in replacement for `<Input type="password" ...>`. Same styling as
   `<Input>`, plus an Eye/EyeOff icon button on the trailing edge that flips
   the underlying input between `password` and `text`. The button does NOT
   steal focus from the input on click (mousedown is preventDefault'd) so
   caret position is preserved.
   ------------------------------------------------------------------------- */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { error?: string }
>(({ className, error, id, disabled, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const reactId = useId();
  const inputId = id ?? `password-${reactId}`;

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-center',
          'rounded-[var(--radius-md)]',
          'bg-[var(--bg-input)] border',
          error ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]',
          'transition-colors duration-150',
          'focus-within:ring-2 focus-within:ring-[var(--border-focus)] focus-within:ring-offset-1',
          error && 'focus-within:ring-[var(--danger)]'
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={cn(
            'w-full h-10 pl-3 pr-11 rounded-[var(--radius-md)] bg-transparent border-0 outline-none',
            'text-[var(--text-primary)] text-[14px] font-light tracking-tight leading-none',
            'placeholder:text-[var(--text-tertiary)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={inputId}
          disabled={disabled}
          onMouseDown={(event) => {
            // Keep focus on the input so caret position is preserved.
            event.preventDefault();
          }}
          onClick={() => setVisible((value) => !value)}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2',
            'h-7 w-7 inline-flex items-center justify-center',
            'rounded-[var(--radius-sm)]',
            'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-hover)] transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';
