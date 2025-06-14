
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { GlobalAuthRedirect } from '@/components/layout/global-auth-redirect';

export const metadata: Metadata = {
  title: 'NExVERSE - Your Exam Companion',
  description: 'Organize, share, and discover exam answers with NExVERSE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3F51B5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NExVERSE" />
        <link rel="apple-touch-icon" href="https://placehold.co/180x180/3B82F6/3B82F6.png"/>
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
