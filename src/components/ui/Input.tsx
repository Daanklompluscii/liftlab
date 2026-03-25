import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ghost?: string; // ghost/placeholder tekst (bijv "Vorige keer: 80kg × 10")
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ghost, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm text-text-secondary font-medium">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full h-12 px-4 bg-bg-elevated border border-border rounded-xl
              text-text font-mono text-lg
              placeholder:text-text-muted
              focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus
              transition-colors duration-150
              min-h-[48px]
              ${error ? 'border-danger' : ''}
              ${className}
            `}
            {...props}
          />
          {ghost && !props.value && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
              {ghost}
            </span>
          )}
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
