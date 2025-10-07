import type React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solana Developer Tools | Solana Foundation',
  description:
    'Open-source developer tools from the Solana Foundation. Simplified authentication, testing utilities, and deployment helpers for Anchor programs.',
  keywords: [
    'solana',
    'blockchain',
    'anchor',
    'web3',
    'developer tools',
    'solana foundation',
  ],
  authors: [{ name: 'Solana Foundation' }],
  openGraph: {
    title: 'Solana Developer Tools',
    description: 'Essential open-source tools for Solana developers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
