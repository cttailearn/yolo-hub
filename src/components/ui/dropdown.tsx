'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Select...',
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.value === value);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'text-left',
          'flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
      >
        <span className={selectedItem ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>
          {selectedItem?.label || placeholder}
        </span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 w-full mt-1 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                if (!item.disabled) {
                  onChange?.(item.value);
                  setOpen(false);
                }
              }}
              className={cn(
                'w-full px-3 py-2 text-left',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                item.value === value && 'bg-gray-100 dark:bg-gray-700'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { Dropdown };
