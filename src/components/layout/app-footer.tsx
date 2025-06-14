'use client';

import Link from "next/link";
import { SiteLogo } from "@/components/common/site-logo";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background/95 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
             <SiteLogo size={24} />
            <p className="text-sm text-muted-foreground font-headline">
              &copy; {currentYear} NExVERSE. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
