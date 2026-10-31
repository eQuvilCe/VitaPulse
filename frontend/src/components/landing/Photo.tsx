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
} as const;
