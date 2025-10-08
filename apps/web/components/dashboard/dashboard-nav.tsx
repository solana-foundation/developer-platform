'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Programs', href: '/dashboard/programs' },
  { name: 'Deployments', href: '/dashboard/deployments' },
  { name: 'Airdrop', href: '/dashboard/airdrop' },
  { name: 'API Keys', href: '/dashboard/api-keys' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
