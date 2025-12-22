import clsx from 'clsx';
import { HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('card', className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
