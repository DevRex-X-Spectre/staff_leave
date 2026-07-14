import type { Metadata } from 'next';
import { Cal_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionProvider } from '@/components/providers/session-provider';

const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-cal-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NAUB LMS - Staff Leave Management System',
  description:
    'Nigerian Army University, Biu - Professional staff leave management system.',
  icons: {
    icon: [{ url: '/naub-logo.png', type: 'image/png' }],
    shortcut: '/naub-logo.png',
    apple: '/naub-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${calSans.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] antialiased">
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}