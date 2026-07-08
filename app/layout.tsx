import type { Metadata } from 'next';
import { Cal_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/auth-provider';
import { DataProvider } from '@/components/providers/data-provider';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${calSans.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] antialiased">
        <AuthProvider>
          <DataProvider>
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
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}