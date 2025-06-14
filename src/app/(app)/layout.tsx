
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is a client component because it uses hooks (useAuth, useRouter, useEffect)
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login'); // Redirect to login if not authenticated and not loading
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return null; // Or a message, or redirect again. Null avoids rendering children.
  }

  return <>{children}</>;
}


export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* 
        This layout can be expanded to include elements common to all authenticated pages,
        like a sidebar navigation, specific header/footer variants, etc.
        For now, it mainly enforces authentication.
      */}
      <div className="flex flex-col min-h-full">
        {/* Example: <AppSidebar /> */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}

