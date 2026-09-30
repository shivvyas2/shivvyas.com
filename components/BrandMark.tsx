import Image from "next/image";

type BrandMarkProps = {
  variant?: "flat" | "isometric";
  size?: number;
  className?: string;
};

export default function BrandMark({
  variant = "flat",
  size = 36,
  className,
}: BrandMarkProps) {
  return (
    <Image
      src={
        variant === "isometric"
          ? "/brand/precision-fold-3d.png"
          : "/brand/precision-fold-mono.png"
      }
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      unoptimized
    />
  );
}
