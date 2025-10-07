import { cn } from '@/lib/utils';

interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

/**
 * ButtonGroup provides consistent layout for multiple buttons
 */
export function ButtonGroup({
  children,
  orientation = 'horizontal',
  align = 'start',
  className,
}: ButtonGroupProps) {
  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        alignmentClasses[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
