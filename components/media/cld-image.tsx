import Image from "next/image";
import { cn } from "@/lib/utils";

// The only sanctioned way to render a MediaAsset image anywhere in the app —
// always routes through the Cloudinary loader (f_auto,q_auto,dpr_auto) and
// the stored blurDataUrl, per architecture-full.md §6.
export function CldImage({
  publicId,
  alt,
  width,
  height,
  blurDataUrl,
  sizes = "100vw",
  fill = false,
  className,
}: {
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataUrl?: string | null;
  sizes?: string;
  fill?: boolean;
  className?: string;
}) {
  const placeholderProps = blurDataUrl
    ? ({ placeholder: "blur", blurDataURL: blurDataUrl } as const)
    : ({ placeholder: "empty" } as const);

  if (fill) {
    return (
      <Image
        src={publicId}
        alt={alt}
        fill
        sizes={sizes}
        className={cn("object-cover", className)}
        {...placeholderProps}
      />
    );
  }

  return (
    <Image
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      {...placeholderProps}
    />
  );
}
