import { cn } from '@/lib/utils';
import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  level?: 1 | 2 | 3;
  className?: string;
}

/**
 * SectionHeader provides consistent section titles with optional descriptions
 */
export function SectionHeader({
  title,
  description,
  level = 2,
  className,
}: SectionHeaderProps) {
  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const headingStyles = {
    1: 'text-4xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <HeadingTag className={headingStyles[level]}>{title}</HeadingTag>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
