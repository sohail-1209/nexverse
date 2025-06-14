
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { GlobalAuthRedirect } from '@/components/layout/global-auth-redirect';
import { Inter, Poppins, Michroma } from 'next/font/google';

// Define fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const michroma = Michroma({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-michroma',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'NExVERSE - Your Exam Companion',
  description: 'Organize, share, and discover exam answers with NExVERSE.',
  manifest: '/manifest.json', // Added manifest link to metadata
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${michroma.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#33ADFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NExVERSE" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"/>
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased flex flex-col")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8">
              <GlobalAuthRedirect>{children}</GlobalAuthRedirect>
            </main>
            <AppFooter />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
