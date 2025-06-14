
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
import { Separator } from '@/components/ui/separator';
import { LogIn, LogOut, Menu } from 'lucide-react'; 
import { SiteLogo } from '@/components/common/site-logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle
import React from 'react';


const NavLink = ({ href, children, icon, onClick }: { href: string; children: React.ReactNode; icon?: React.ReactNode, onClick?: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center text-sm font-medium px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
      )}
    >
      {icon && React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: "mr-2 h-4 w-4" })}
      {children}
    </Link>
  );
};


export default function AppHeader() {
  const { user, signOut, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const mainNavLinks = siteConfig.mainNav;
  const authenticatedNavLinks = siteConfig.authenticatedNav;
  const adminNavLinks = siteConfig.adminNav;
  const profileNavLinksConfig = siteConfig.profileNav || [];

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const renderNavLinks = (isMobile = false) => (
    <>
      {mainNavLinks.map(link => (
        <NavLink key={`main-${link.href}`} href={link.href} icon={link.icon && <link.icon />} onClick={() => isMobile && setMobileMenuOpen(false)}>
          {link.title}
        </NavLink>
      ))}
      {user && authenticatedNavLinks.map(link => (
        <NavLink key={`auth-${link.href}`} href={link.href} icon={link.icon && <link.icon />} onClick={() => isMobile && setMobileMenuOpen(false)}>
          {link.title}
        </NavLink>
      ))}
      {user && isAdmin && adminNavLinks.map(link => (
         <NavLink key={`admin-${link.href}`} href={link.href} icon={link.icon && <link.icon />} onClick={() => isMobile && setMobileMenuOpen(false)}>
          {link.title}
        </NavLink>
      ))}
    </>
  );
  
  const renderProfileLinks = (isMobile = false, closeMenu?: () => void) => {
    const handleLinkClick = () => {
      if (isMobile && closeMenu) closeMenu();
    };
    const handleLogoutClick = () => {
      signOut();
      if (isMobile && closeMenu) closeMenu();
    }

    if (isMobile) {
      return (
        <>
          {profileNavLinksConfig.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className="flex items-center px-3 py-2 text-base rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
            >
              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
              <span>{item.title}</span>
            </Link>
          ))}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            onClick={handleLogoutClick}
            className="w-full justify-start flex items-center px-3 py-2 text-base rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Button>
        </>
      );
    }

    // Desktop Dropdown
    return (
     <>
        {profileNavLinksConfig.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
            <Link href={item.href} onClick={handleLinkClick}>
              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogoutClick} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
    </>
    );
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2" onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}>
          <SiteLogo size={40} />
          <span className="font-headline text-xl font-bold text-primary">NExVERSE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {renderNavLinks()}
        </nav>

        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
             <div className="hidden md:block">
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
                        {user.email && <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {renderProfileLinks(false)}
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          ) : (
            <>
              {!pathname.startsWith('/auth') && (
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
              {!pathname.startsWith('/auth/signup') && !pathname.startsWith('/auth/login') && (
                 <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              )}
            </>
          )}
          
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
                <SheetHeader className="p-4 pb-0">
                  <SheetTitle className="text-left text-lg font-headline text-primary">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1 px-4 flex-grow mt-4">
                  {renderNavLinks(true)}
                  
                  {user && (
                    <>
                      <div className="my-2 border-t border-border/40 -mx-4"></div>
                      <div className="px-3 py-1 text-sm font-medium text-muted-foreground">My Account</div>
                      <div className="flex flex-col space-y-1">
                        {renderProfileLinks(true, () => setMobileMenuOpen(false))}
                      </div>
                    </>
                  )}
                </nav>
                
                {!user && !loading && (
                    <div className="mt-auto p-4 border-t border-border/40">
                      <div className="flex flex-col space-y-2">
                        <Button asChild variant="default" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                            <Link href="/auth/login">Login</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                            <Link href="/auth/signup">Sign Up</Link>
                        </Button>
                      </div>
                    </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
