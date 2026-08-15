# 앱 버전 관리 (v1 / v2)

넴쿵 교대근무표의 **제품·디자인 버전**을 Git 태그와 문서로 관리합니다.  
Play Store `versionName`(예: 1.0.0)과는 **별개**입니다.

| 구분 | v1 | v2 |
|------|----|----|
| 목적 | 초기 완성 (PWA·웹) | **Android Play Store 배포** |
| Git 태그 | `v1` | `v2` (Android 준비 완료 시 생성) |
| Git 브랜치 | — | `version/v2` |
| 코드 상수 | — | `src/lib/appVersion.ts` → `DESIGN_VERSION = 2` |

---

## v1 — 초기 버전

- **태그**: `v1`
- **커밋**: `b3f7539` — `v1: 교대근무표 앱 완성 스냅샷`
- **범위**: 다크모드, 설정, 급여·수당 UI, 커플 온보딩 등 **웹/PWA 완성본**

### v1 분위기·이미지 (복원 시 참고)

| 항목 | 값 |
|------|-----|
| 스플래시 배경 | `#FFF5F7` → `#F2F2F7` → `#E8F1FF` gradient |
| 메인 일러스트 | `/images/couple-sticker.png` |
| 캐치프레이즈 | 「멋진여자 박네모가 만든 넴쿵 교대근무표」 / 「함께 보는 하루」 |
| 포인트 컬러 | Apple Blue `#007AFF` |
| 배경 (라이트) | `#F2F2F7` |
| 배경 (다크) | `#0B0F14` |
| 톤 | 커플·개인용, 따뜻한 스티커 느낌 |

### v1으로 롤백

```powershell
cd "D:\AI 활용\08. 교대근무표"
git fetch --tags
git checkout v1 -- .
# 또는 특정 파일만: git checkout v1 -- src/components/SplashScreen.tsx
```

---

## v2 — Android 배포 버전 (현재 작업 중)

- **브랜치**: `version/v2` (v2 작업은 이 브랜치에서 진행)
- **태그**: Android 스토어 제출 직전 `git tag v2` 로 스냅샷 고정
- **시작 시점**: 2026-08-12 Play Store 정책·법적 페이지·Android Manifest 보강 이후

### v2에 포함되는 것

- Play Store 정책 대응 (`/privacy`, `/terms`, `/data-deletion`)
- Capacitor Android (`com.nemkung.shiftcalendar`)
- 온보딩 약관 동의, 설정 법적 링크
- `docs/PLAY_STORE_CHECKLIST.md`, `docs/ANDROID_DEPLOY.md`
- v1 이후 기능: 2026 봉급표, 경찰·소방 전용, 시간외·야간·휴일 수당 등
- **앞으로 할 Android용 앱 UI·아이콘·분위기 변경**

### v2 분위기·이미지 (2026-08 Android 상용 리브랜딩)

| 항목 | 경찰 테마 | 소방 테마 |
|------|-----------|-----------|
| 앱 이름 | **오늘도 출동** | **오늘도 출동** |
| 포인트 컬러 | `#2563EB` (블루) | `#DC2626` (레드) |
| 스플래시·온보딩 배경 | 딥 네이비 gradient | 다크 레드 gradient |
| 아이콘 | `/images/app-icon.png` (경찰·소방 통합) | 동일 |
| 톤 | 전문·공무원 교대 일정 | 전문·공무원 교대 일정 |
| 직군 선택 | 온보딩·달력 `agency` 컬럼 | 공유 코드 참여 시 달력 직군 따름 |

### v2로 롤백

```powershell
cd "D:\AI 활용\08. 교대근무표"
git checkout version/v2
# 또는 태그 생성 후:
git checkout v2 -- .
```

---

## AI / 개발자에게 요청할 때

| 요청 | 의미 |
|------|------|
| 「v1으로 롤백해줘」 | `v1` 태그 기준 코드·UI 복원 |
| 「v2로 롤백해줘」 | `v2` 태그 또는 `version/v2` 브랜치 기준 복원 |
| 「v2 분위기/이미지로 바꿔줘」 | v2 스냅샷의 스플래시·아이콘·색·카피 적용 |
| 「v1 분위기로 돌려줘」 | v1 표의 그radient·couple-sticker·카피 복원 |

---

## 태그·브랜치 명령 (관리자용)

```powershell
# v2 작업 브랜치 (최초 1회)
git checkout -b version/v2

# Android 제출 준비 완료 시 v2 스냅샷
git tag -a v2 -m "v2: Android Play Store 배포 스냅샷"
git push origin v2
git push origin version/v2
```

---

## 릴리스 버전 (Play Store)

| 필드 | 위치 | 현재 |
|------|------|------|
| `versionName` | `android/app/build.gradle`, `package.json` | `1.0.0` |
| `versionCode` | `android/app/build.gradle` | `1` (업로드마다 +1) |

스토어에 **2.0.0**을 올릴 때는 `RELEASE_VERSION` / `build.gradle`만 올리고,  
디자인 v1/v2와는 별도로 관리합니다.
