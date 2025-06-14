
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function GlobalAuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define pages that are always public and do not require login
  const alwaysPublicPaths = ['/auth/login', '/auth/signup', '/about', '/contact', '/privacy', '/terms'];
  const isAlwaysPublicPage = alwaysPublicPaths.includes(pathname);

  useEffect(() => {
    // If authentication is not loading, we don't have a user, and the current page is not always public,
    // then redirect to the login page.
    if (!loading && !user && !isAlwaysPublicPage) {
      router.replace('/auth/login');
    }
  }, [user, loading, router, isAlwaysPublicPage, pathname]);

  // While loading authentication state, AND the current page is not always public, show a loader.
  if (loading && !isAlwaysPublicPage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If authentication is resolved (not loading), there's no user, AND the current page is not always public,
  // it means a redirect should be in progress (or has just been initiated by useEffect). Show a loader or null to prevent content flashing.
  if (!loading && !user && !isAlwaysPublicPage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // In all other cases (e.g., user is present, or it's an always public page), render the children.
  return <>{children}</>;
}
