import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const src = "apps/web/public/brand/roga-master.png";
const outDir = "apps/web/public/brand";
await mkdir(outDir, { recursive: true });

const sizes = [1024,512,256,192,180,128,64,32,16];
await Promise.all(
  sizes.map(async s =>
    sharp(src).resize(s, s).png({ compressionLevel: 9 }).toFile(`${outDir}/roga-${s}.png`)
  )
);

// apple touch
await sharp(src).resize(180, 180).png().toFile("apps/web/public/apple-touch-icon.png");

// favicon.ico
// favicon (use PNG; modern browsers support this)
await sharp(src).resize(32, 32).png().toFile("apps/web/public/brand/roga-32.png");

console.log("✅ Roga icons generated");
