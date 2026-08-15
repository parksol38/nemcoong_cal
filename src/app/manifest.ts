import type { MetadataRoute } from "next";
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from "@/lib/legal";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#EFF6FF",
    theme_color: "#2563EB",
    orientation: "portrait",
    lang: "ko",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
