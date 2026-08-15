# 안드로이드(Play Store) 배포 가이드

넴쿵 교대근무표는 **Capacitor**로 감싼 WebView 앱입니다.  
앱을 열면 프로덕션 웹(`https://shift-calendar-three.vercel.app`)을 그대로 로드합니다.

- 앱 ID: `com.nemkung.shiftcalendar`
- 앱 이름: `넴쿵 교대근무표`
- 설정 파일: `capacitor.config.ts`

---

## 0. 한 줄 요약 순서

1. Android Studio 설치  
2. Google Play Console 개발자 등록  
3. 이 프로젝트에서 `npx cap sync android` → Android Studio 열기  
4. 서명 키 만들고 **AAB** 빌드  
5. Play Console에 업로드 + 개인정보처리방침 URL 등록  
6. 내부 테스트 → 프로덕션 출시  

> **Play Console 체크리스트**: [PLAY_STORE_CHECKLIST.md](./PLAY_STORE_CHECKLIST.md) — 정책·데이터 안전성·암호화 선언 답변 포함

---

## 1. PC에 필요한 프로그램

### Android Studio

1. https://developer.android.com/studio 에서 설치  
2. 설치 마법사에서 **Android SDK**, **Android SDK Platform**, **Android Virtual Device** 포함  
3. 첫 실행 후 SDK Manager에서 최신 **Android SDK Platform** / **Build-Tools** 확인  

### JDK

Android Studio에 포함된 JDK를 쓰면 됩니다. (별도 Oracle JDK 필수는 아님)

설치 확인(PowerShell):

```powershell
# Android Studio 설치 후
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" version
```

---

## 2. Google Play 개발자 계정

1. https://play.google.com/console 접속  
2. Google 계정으로 개발자 등록 (개인/조직)  
3. 등록비 **약 $25 (1회)** 결제 및 본인/사업자 정보 입력  
4. 심사·활성화까지 며칠 걸릴 수 있음  

아직 계정이 없어도 **AAB 빌드까지는 로컬에서 가능**합니다. 업로드만 Console이 필요합니다.

---

## 3. 프로젝트에서 안드로이드 프로젝트 준비

프로젝트 폴더에서:

```powershell
cd "D:\AI 활용\08. 교대근무표"
npm install
npm run icons
npx cap sync android
npm run cap:open:android
```

- `android/` 폴더가 Capacitor 네이티브 프로젝트입니다.  
- `cap:open:android` 가 Android Studio를 엽니다.  
- Studio가 처음이면 Gradle 동기화에 시간이 걸릴 수 있습니다.

웹(Vercel) URL을 바꾼 경우 `capacitor.config.ts` 의 `server.url` 을 수정한 뒤 다시:

```powershell
npx cap sync android
```

---

## 4. 앱 서명 키(keystore) 만들기

Play Store 업로드용 **업로드 키**가 필요합니다. **절대 Git에 올리지 마세요.**

Android Studio 또는 `keytool`로 생성 예:

```powershell
keytool -genkey -v -keystore "$env:USERPROFILE\nemkung-upload.keystore" -alias nemkung -keyalg RSA -keysize 2048 -validity 10000
```

비밀번호·alias를 안전한 곳에 백업하세요. 키를 분실하면 업데이트 배포가 매우 어려워집니다.

### Gradle에 서명 연결 (예시)

`android/keystore.properties` (이 파일도 Git 제외 권장):

```properties
storeFile=C:\\Users\\당신\\nemkung-upload.keystore
storePassword=****
keyAlias=nemkung
keyPassword=****
```

`android/app/build.gradle` 에 signingConfigs를 연결하는 방법은 Android Studio  
**Build → Generate Signed Bundle / APK** 마법사를 쓰는 편이 초보에게 더 쉽습니다.

---

## 5. AAB(Android App Bundle) 빌드

Android Studio에서:

1. **Build → Generate Signed Bundle / APK**  
2. **Android App Bundle** 선택  
3. keystore 선택 후 **release** 빌드  
4. 생성된 `.aab` 파일 위치 확인 (보통 `android/app/release/` 근처)

버전:

- `versionName`: 사용자에게 보이는 버전 (예: `1.0.0`)  
- `versionCode`: 정수, **업로드마다 반드시 증가** (1, 2, 3…)  

위치: `android/app/build.gradle` 의 `defaultConfig`.

---

## 6. Play Console에 앱 만들기

1. Play Console → **앱 만들기**  
2. 앱 이름: `넴쿵 교대근무표`  
3. 기본 언어: 한국어  
4. 앱/게임: 앱, 무료/유료 선택  
5. 정책 선언 체크 후 만들기  

### 필수 입력

| 항목 | 내용 |
|------|------|
| 개인정보처리방침 | `https://shift-calendar-three.vercel.app/privacy` |
| 데이터 삭제 안내 | `https://shift-calendar-three.vercel.app/data-deletion` |
| 이용약관(선택) | `https://shift-calendar-three.vercel.app/terms` |
| 문의 이메일 | Vercel `NEXT_PUBLIC_SUPPORT_EMAIL` (Play Console 개발자 이메일과 동일 권장) |
| 데이터 안전성 | 닉네임·앱 활동·기기 ID 등 수집 여부 정직하게 표시 ([체크리스트](./PLAY_STORE_CHECKLIST.md) 참고) |
| 스크린샷 | 휴대전화 기준 최소 2장 이상 |
| 앱 아이콘 | 512×512 |
| 기능 그래픽 | 스토어 요구 사이즈에 맞게 |

앱 안 **설정 → 개인정보처리방침 / 이용약관** 링크로도 동일 페이지를 열 수 있습니다.

---

## 7. 테스트 트랙 → 출시

1. **내부 테스트**에 AAB 업로드  
2. 테스터 Google 계정 추가 후 설치·동작 확인  
   - 달력 로그인, 근무 저장, 설정, 다크모드, 뒤로가기  
3. 문제 없으면 **프로덕션**으로 승격·출시 제출  
4. 심사(수시간~수일) 후 스토어 게시  

---

## 8. 자주 막히는 점

- **인터넷 필수**: 앱은 웹 서버를 로드합니다. 오프라인에서는 동작이 제한됩니다.  
- **URL/SSL**: `server.url` 은 반드시 HTTPS.  
- **정책 페이지 404**: Vercel에 `/privacy`, `/terms`, `/data-deletion` 배포가 되어 있어야 합니다.  
- **문의 이메일 미설정**: `.env.local` / Vercel에 `NEXT_PUBLIC_SUPPORT_EMAIL` 설정 후 재배포하세요.
- **키스토어 분실**: 업데이트 불가에 가깝습니다. 백업 필수.  
- **package name 변경**: `com.nemkung.shiftcalendar` 은 스토어에 올린 뒤 바꾸기 어렵습니다.  

---

## 9. 개발할 때 로컬 웹 붙이기 (선택)

개발 중 로컬 Next를 보려면 `capacitor.config.ts` 임시 변경:

```ts
server: {
  url: "http://192.168.x.x:3000", // PC LAN IP
  cleartext: true,
}
```

그다음 `npx cap sync android` 후 실행.  
**스토어 빌드 전에는 반드시 프로덕션 HTTPS URL로 되돌리세요.**

---

## 10. 다음에 iOS 할 때

- Apple Developer 계정 (연간 유료) + **Mac + Xcode** 필요  
- `npx cap add ios` → `npx cap sync ios`  
- App Store Connect에 개인정보·스크린샷 등록  

Android와 같은 Capacitor 설정을 재사용합니다.
