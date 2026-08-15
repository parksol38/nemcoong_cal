const MAX_EDGE = 960;
const JPEG_QUALITY = 0.72;
const MAX_BYTES = 450_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    img.src = src;
  });
}

/** data URL JPEG 크기·용량 줄이기 */
export async function compressMessagePhoto(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진 처리에 실패했어요.");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let output = canvas.toDataURL("image/jpeg", quality);
  while (output.length > MAX_BYTES * 1.37 && quality > 0.45) {
    quality -= 0.08;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length > MAX_BYTES * 1.37) {
    throw new Error("사진이 너무 커요. 조금 더 가까이에서 다시 찍어 주세요.");
  }

  return output;
}

/** 비디오 프레임을 JPEG data URL로 */
export function captureVideoFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx || !video.videoWidth || !video.videoHeight) {
    throw new Error("카메라 화면을 아직 불러오지 못했어요.");
  }
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("이 기기에서는 카메라 촬영을 지원하지 않아요.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 1280 },
      },
      audio: false,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
}

export function stopCameraStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}
