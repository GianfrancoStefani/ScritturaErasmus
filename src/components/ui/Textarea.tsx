import { TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="input-group">
        {label && (
          <label className="input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx('input-field min-h-[100px] resize-y', className)}
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

Textarea.displayName = 'Textarea';
