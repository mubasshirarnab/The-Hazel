import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/shared/auth-provider';
import QueryProvider from '@/components/shared/query-provider';
import { Toaster } from 'sonner';

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Hazel ERP — Luxury Handbags Management',
  description: 'Enterprise Resource Planning for Hazel, Bangladeshi women\'s luxury handbag import brand.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B08D57]/20 selection:text-[#1F3A2E]">
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors toastOptions={{ style: { borderRadius: '12px', border: '1px solid #E9E7E2' } }} />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
