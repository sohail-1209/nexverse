
import { Orbit } from 'lucide-react'; // Changed from Atom to Orbit
import { cn } from '@/lib/utils';

interface SiteLogoProps {
  size?: number;
  className?: string;
  iconClassName?: string;
}

export function SiteLogo({ size = 32, className, iconClassName }: SiteLogoProps) {
  const iconSize = Math.floor(size * 0.6); // Adjust icon size relative to container

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-muted",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Orbit // Changed from Atom to Orbit
        size={iconSize}
        className={cn("stroke-[1.5]", iconClassName)} // Ensure stroke width is appropriate
      />
    </div>
  );
}
