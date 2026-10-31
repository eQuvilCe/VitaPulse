import { cx } from "@/lib/cx";

// Free Unsplash photos, cropped and compressed by their image CDN.
export function unsplash(id: string, width: number, height?: number) {
  const size = height ? `&h=${height}` : "";
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=${width}${size}`;
}

type Props = {
  id: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

// A plain <img> with a 1x/2x srcset: next/image would need remote image config.
export default function Photo({ id, alt, width, height, className, priority, sizes }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={unsplash(id, width, height)}
      srcSet={`${unsplash(id, width, height)} 1x, ${unsplash(id, width * 2, height * 2)} 2x`}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cx("bg-subtle object-cover", className)}
    />
  );
}

export const PHOTOS = {
  bowl: "1512621776951-a57141f2eefd",
  plate: "1490645935967-10de6ba17061",
  crunches: "1571019613454-1cb2f99b2d8b",
  salmonBowl: "1546069901-ba9599a7e63c",
  avocadoToast: "1525351484163-7529414344d8",
  quinoa: "1547592180-85f173990554",
  yogurt: "1494390248081-4e521a5940db",
  pilates: "1518611012118-696072aa579a",
  deadlift: "1517836357463-d25dfeac3438",
  running: "1552674605-db6ffd4facb5",
  vegetables: "1498837167922-ddd27525d352",
} as const;
