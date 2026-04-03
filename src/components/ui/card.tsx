'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, footer, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-xl border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800',
          'shadow-sm',
          className
        )}
        ref={ref}
        {...props}
      >
        {header && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {header}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
