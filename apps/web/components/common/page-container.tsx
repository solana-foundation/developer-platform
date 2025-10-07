import { cn } from '@/lib/utils';
import { containerStyles, sectionStyles } from '@/lib/theme/config';

interface PageContainerProps {
  children: React.ReactNode;
  variant?: keyof typeof containerStyles;
  spacing?: keyof typeof sectionStyles;
  className?: string;
}

/**
 * PageContainer provides consistent page-level layout with proper spacing and containment
 */
export function PageContainer({
  children,
  variant = 'default',
  spacing = 'default',
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        containerStyles[variant],
        sectionStyles[spacing],
        className,
      )}
    >
      {children}
    </div>
  );
}
