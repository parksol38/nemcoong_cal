const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function makeIcon(size, file) {
  const r = Math.round(size * 0.22);
  const sw = (size * 0.045).toFixed(1);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#5856D6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <g fill="none" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <rect x="${size * 0.22}" y="${size * 0.26}" width="${size * 0.56}" height="${size * 0.5}" rx="${size * 0.06}"/>
    <path d="M${size * 0.34} ${size * 0.26} V${size * 0.18} M${size * 0.66} ${size * 0.26} V${size * 0.18}"/>
    <path d="M${size * 0.22} ${size * 0.4} H${size * 0.78}"/>
  </g>
  <circle cx="${size * 0.38}" cy="${size * 0.55}" r="${size * 0.045}" fill="#FF9500"/>
  <circle cx="${size * 0.52}" cy="${size * 0.55}" r="${size * 0.045}" fill="white" opacity="0.9"/>
  <circle cx="${size * 0.66}" cy="${size * 0.55}" r="${size * 0.045}" fill="#0F2744"/>
</svg>`);
  await sharp(svg).png().toFile(file);
  console.log("wrote", file);
}

(async () => {
  const dir = path.join("public", "icons");
  fs.mkdirSync(dir, { recursive: true });
  await makeIcon(192, path.join(dir, "icon-192.png"));
  await makeIcon(512, path.join(dir, "icon-512.png"));
  await makeIcon(180, path.join(dir, "apple-touch-icon.png"));
})();
