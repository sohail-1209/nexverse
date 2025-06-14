
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function GlobalAuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const alwaysPublicPaths = ['/auth/login', '/auth/signup', '/about', '/contact', '/privacy', '/terms'];
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';
  const isAlwaysPublicPage = alwaysPublicPaths.includes(pathname);

  useEffect(() => {
    if (loading) {
      // Still determining auth state, do nothing yet to avoid premature redirects
      return;
    }

    if (user) {
      // User is logged in
      if (isAuthPage) {
        // If logged-in user is on a login/signup page, redirect to dashboard
        router.replace('/dashboard');
      } else if (pathname === '/') {
        // If logged-in user is on the public root, redirect to dashboard
        router.replace('/dashboard');
      }
      // For other pages, allow access (AuthGuard in (app)/layout will handle its specific routes if needed)
    } else {
      // User is not logged in
      if (!isAlwaysPublicPage) {
        // If on a protected page (not in alwaysPublicPaths), redirect to login
        router.replace('/auth/login');
      }
      // If on an always public page, allow access
    }
  }, [user, loading, router, pathname, isAuthPage, isAlwaysPublicPage]);

  // Show loader while auth state is loading AND the page isn't an auth page or an always public one
  // (to prevent content flashing on protected routes before redirect)
  // OR if a redirect is likely happening for a logged-in user away from an auth page or public root.
  if (loading && !isAlwaysPublicPage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If after loading, user is not present and it's not an always public page,
  // a redirect to login should be in progress. Show loader.
  if (!loading && !user && !isAlwaysPublicPage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If after loading, user is present and they are on an auth page or the root,
  // a redirect to dashboard should be in progress. Show loader.
   if (!loading && user && (isAuthPage || pathname === '/')) {
     return (
       <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
       </div>
     );
   }

  return <>{children}</>;
}
