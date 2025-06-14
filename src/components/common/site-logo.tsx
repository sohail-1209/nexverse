import Image from 'next/image';

interface SiteLogoProps {
  size?: number;
  className?: string;
}

export function SiteLogo({ size = 32, className }: SiteLogoProps) {
  return (
    <Image
      src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcS9spLSZsqR6lnssbwBPgPEyc6A7YvHjcoyB05hFmApXolmKKd3"
      alt="NExVERSE Logo"
      width={size}
      height={size}
      className={className}
      priority // Add priority if it's LCP, good for header logo
    />
  );
}
