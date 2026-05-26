import Image from "next/image";

export default function BrandMark({ size=40 }: { size?: number }) {
  return <Image src="/brand/roga_logo_white.svg" alt="Cephos" width={size} height={size} priority />;
}