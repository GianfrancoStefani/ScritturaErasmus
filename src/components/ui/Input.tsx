import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="input-group">
        {label && (
          <label className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx('input-field', className)}
          style={{ marginBottom: error ? '0.25rem' : '0' }}
          {...props}
        />
        {error && (
          <span className="input-error">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

