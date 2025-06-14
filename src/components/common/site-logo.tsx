import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SiteLogoProps {
  size?: number;
  className?: string;
}

export function SiteLogo({ size = 32, className }: SiteLogoProps) {
  return (
    <Image
      src="https://placehold.co/100x100/3B82F6/FFFFFF.png?text=N"
      data-ai-hint="logo initial"
      alt="NExVERSE Logo"
      width={size}
      height={size}
      className={cn("rounded-full border-2 border-muted", className)}
      priority 
    />
  );
}
