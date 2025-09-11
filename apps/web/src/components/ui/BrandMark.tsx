import Image from "next/image";

export default function BrandMark({ size=40 }: { size?: number }) {
  return <Image src="/brand/roga-logo_svg.svg" alt="Roga" width={size} height={size} priority />;
}