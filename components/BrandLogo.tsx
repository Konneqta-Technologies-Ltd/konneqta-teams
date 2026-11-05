import Image from 'next/image';

export default function BrandLogo({
  className = 'h-8 w-auto',
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/k-white.png"
      alt="Konneqta"
      width={580}
      height={148}
      className={className}
      priority={priority}
    />
  );
}
