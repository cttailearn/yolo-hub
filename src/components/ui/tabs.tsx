'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, value, onChange, className }) => {
  const selectedTab = items.find((item) => item.value === value) || items[0];

  return (
    <div className={cn('flex border-b border-gray-200 dark:border-gray-700', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => !item.disabled && onChange?.(item.value)}
          disabled={item.disabled}
          className={cn(
            'px-4 h-10 font-medium text-sm',
            'border-b-2 -mb-px',
            'transition-colors',
            'focus:outline-none',
            item.value === selectedTab.value
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export { Tabs };
