'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpenText, Home, LogIn, LogOut, MessageSquare, PlusCircle, Search, Settings, User, Bookmark, Users } from 'lucide-react';
import { SiteLogo } from '@/components/common/site-logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';


const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} passHref>
      <Button variant="ghost" className={cn("text-sm font-medium", isActive ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground")}>
        {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
        {children}
      </Button>
    </Link>
  );
};


export default function AppHeader() {
  const { user, signOut, loading, isAdmin } = useAuth();
  const pathname = usePathname();

  const mainNavLinks = siteConfig.mainNav;
  const authenticatedNavLinks = siteConfig.authenticatedNav;
  const adminNavLinks = siteConfig.adminNav;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <SiteLogo className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-bold text-primary">NExVERSE</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {mainNavLinks.map(link => (
            <NavLink key={link.href} href={link.href} icon={link.icon && <link.icon className="h-4 w-4" />}>
              {link.title}
            </NavLink>
          ))}
          {user && authenticatedNavLinks.map(link => (
            <NavLink key={link.href} href={link.href} icon={link.icon && <link.icon className="h-4 w-4" />}>
              {link.title}
            </NavLink>
          ))}
          {user && isAdmin && adminNavLinks.map(link => (
             <NavLink key={link.href} href={link.href} icon={link.icon && <link.icon className="h-4 w-4" />}>
              {link.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {!pathname.startsWith('/auth') && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
              {!pathname.startsWith('/auth/signup') && !pathname.startsWith('/auth/login') && (
                 <Button asChild size="sm">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              )}
            </>
          )}
           {/* Mobile Menu Trigger - Placeholder */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" /> {/* Or Menu icon */}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
