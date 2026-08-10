import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 네이티브 앱은 로컬 정적 파일을 쓰지 않고,
 * 배포된 Next.js(Vercel) URL을 WebView로 엽니다.
 */
const config: CapacitorConfig = {
  appId: "com.nemkung.shiftcalendar",
  appName: "넴쿵 교대근무표",
  webDir: "www",
  server: {
    url: "https://shift-calendar-three.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#F2F2F7",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F2F2F7",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#F2F2F7",
  },
};

export default config;
