
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function GlobalAuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const alwaysPublicPaths = ['/', '/auth/login', '/auth/signup', '/about', '/contact', '/privacy', '/terms'];
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';
  // Check if the current path is one of the always public paths OR if it's the root path itself.
  const isPubliclyAccessiblePage = alwaysPublicPaths.includes(pathname);


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
      }
      // No longer redirecting from '/' if logged in.
      // For other pages, AuthGuard in (app)/layout will handle its specific routes if needed.
    } else {
      // User is not logged in
      if (!isPubliclyAccessiblePage) {
        // If on a protected page (not in alwaysPublicPaths), redirect to login
        router.replace('/auth/login');
      }
      // If on an always public page (including '/'), allow access
    }
  }, [user, loading, router, pathname, isAuthPage, isPubliclyAccessiblePage]);

  // Show loader while auth state is loading AND the page isn't one that's always public
  // (to prevent content flashing on protected routes before redirect)
  // OR if a redirect is likely happening for a logged-in user away from an auth page.
  if (loading && !isPubliclyAccessiblePage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If after loading, user is not present and it's not a publicly accessible page,
  // a redirect to login should be in progress. Show loader.
  if (!loading && !user && !isPubliclyAccessiblePage) {
    return (
      <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If after loading, user is present and they are on an auth page (login/signup),
  // a redirect to dashboard should be in progress. Show loader.
   if (!loading && user && isAuthPage) {
     return (
       <div className="flex min-h-[calc(100vh_-_theme(spacing.32)_-_theme(spacing.16))] items-center justify-center">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
       </div>
     );
   }

  return <>{children}</>;
}
