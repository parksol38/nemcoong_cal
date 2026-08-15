/**
 * 검은 배경 JPEG → 투명 PNG 마스코트 분리
 * (캐릭터 검은 테두리는 가장자리 flood-fill로 배경만 제거)
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC =
  process.argv[2] ||
  "C:/Users/네모/.cursor/projects/d-AI-08/assets/c__Users____AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_KakaoTalk_20260815_090359827-b6ad82dd-bb0a-479b-9c8b-78359fba2222.png";
const OUT_DIR = path.join(ROOT, "public/images/mascots");

function isBackgroundBlack(r, g, b) {
  return r <= 42 && g <= 42 && b <= 42;
}

/** 가장자리와 연결된 검은 배경만 투명 처리 */
function keyOutEdgeBlack(data, width, height, channels) {
  const size = width * height;
  const isBg = new Uint8Array(size);
  const queue = [];

  const idx = (x, y) => y * width + x;
  const px = (i) => {
    const o = i * channels;
    return [data[o], data[o + 1], data[o + 2]];
  };

  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const i = idx(x, y);
      const [r, g, b] = px(i);
      if (isBackgroundBlack(r, g, b) && !isBg[i]) {
        isBg[i] = 1;
        queue.push(i);
      }
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (const x of [0, width - 1]) {
      const i = idx(x, y);
      const [r, g, b] = px(i);
      if (isBackgroundBlack(r, g, b) && !isBg[i]) {
        isBg[i] = 1;
        queue.push(i);
      }
    }
  }

  while (queue.length) {
    const i = queue.pop();
    const x = i % width;
    const y = (i - x) / width;
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = idx(nx, ny);
      if (isBg[ni]) continue;
      const [r, g, b] = px(ni);
      if (isBackgroundBlack(r, g, b)) {
        isBg[ni] = 1;
        queue.push(ni);
      }
    }
  }

  for (let i = 0; i < size; i += 1) {
    if (!isBg[i]) continue;
    data[i * channels + 3] = 0;
  }
}

async function exportMascot(buffer, outName) {
  const base = sharp(buffer).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  keyOutEdgeBlack(data, info.width, info.height, info.channels);

  const outPath = path.join(OUT_DIR, outName);
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(outName, meta.width, meta.height, "alpha:", meta.hasAlpha);
  return meta;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const srcBuf = await sharp(SRC).toBuffer();
  const { width, height } = await sharp(srcBuf).metadata();
  const half = Math.floor(width / 2);

  const fireBuf = await sharp(srcBuf)
    .extract({ left: 0, top: 0, width: half, height })
    .toBuffer();
  const policeBuf = await sharp(srcBuf)
    .extract({ left: half, top: 0, width: width - half, height })
    .toBuffer();

  await exportMascot(fireBuf, "fire-delivery.png");
  await exportMascot(policeBuf, "police-delivery.png");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
