# Google Play Console 등록 체크리스트

넴쿵 교대근무표(`com.nemkung.shiftcalendar`) Play Store 출시 전 확인용입니다.

---

## 출시 전 필수 (코드·배포)

- [ ] Vercel 환경 변수 `NEXT_PUBLIC_SUPPORT_EMAIL` 설정 (개인정보·삭제 요청용)
- [ ] 웹 배포 후 URL 확인
  - [ ] https://shift-calendar-three.vercel.app/privacy
  - [ ] https://shift-calendar-three.vercel.app/terms
  - [ ] https://shift-calendar-three.vercel.app/data-deletion
- [ ] `capacitor.config.ts` → 프로덕션 HTTPS URL (`cleartext: false`)
- [ ] Release keystore 생성·백업
- [ ] AAB 빌드 (`versionCode` 업로드마다 +1)

---

## 1. 개발자 프로그램 정책

Play Console → **앱 콘텐츠** → **앱 콘텐츠 선언** 완료

| 항목 | 이 앱 답변 |
|------|-----------|
| 광고 | **아니오** |
| 인앱 결제 | **아니오** |
| Google/소셜 로그인 | **아니오** (공유 코드 방식) |
| 사용자 생성 콘텐츠(UGC) | **예** (공유 메시지·메모) |
| 위치 | **아니오** |
| 건강/금융 기능 | **아니오** |
| 정부/공공기관 공식 앱 | **아니오** — 비공식 개인 도구 |

**스토어 설명에 반드시 포함:**

> 본 앱은 경찰청·소방청 등 공공기관과 무관한 **비공식 개인용** 교대 근무 일정 관리 도구입니다. 급여·수당 계산은 참고용이며 공식 급여를 보장하지 않습니다. **인터넷 연결이 필요**합니다.

---

## 2. Play 앱 서명

- [ ] **Play 앱 서명 서비스 약관 동의** (Console 첫 AAB 업로드 시)
- 업로드 키(keystore)는 로컬에서 생성 → Play가 앱 서명 키 관리
- keystore 분실 시 업데이트 불가 → **반드시 백업**

---

## 3. 미국 수출법 (암호화)

Console → **앱 콘텐츠** → **앱 액세스 / 암호화** (또는 수출 규정 설문)

| 질문 | 답변 |
|------|------|
| 앱이 암호화를 사용합니까? | **예** |
| 표준 HTTPS/TLS만 사용합니까? | **예** |
| ERN(Encryption Registration) 필요? | **아니오** (대중 시장 면제) |

코드 변경 불필요. HTTPS로 Supabase·Vercel 통신만 사용합니다.

---

## 4. 데이터 안전성 (Data safety)

Play Console → **앱 콘텐츠** → **데이터 안전성**

### 수집 여부: **예, 데이터를 수집합니다**

| 데이터 유형 | 수집 | 공유(판매) | 목적 |
|------------|------|-----------|------|
| 이름 (닉네임) | ✅ | ❌ | 앱 기능 |
| 사용자 ID (device ID) | ✅ | ❌ | 앱 기능·기기 구분 |
| 앱 활동 (근무표·메시지·변경 이력) | ✅ | ❌ | 앱 기능 |
| 기타 (User-Agent) | ✅ | ❌ | 기기 구분 |
| 위치 | ❌ | — | — |
| 재정 정보 | ❌ | — | — |
| 광고 ID | ❌ | — | — |

### 기타 설정

- **데이터 암호화(전송 중)**: 예 (HTTPS)
- **데이터 삭제 요청 가능**: 예
- **데이터 삭제 URL**: `https://shift-calendar-three.vercel.app/data-deletion`
- **제3자와 공유(판매)**: 아니오
- **처리 위탁**: Supabase, Vercel (서비스 제공 목적)

---

## 5. 개인정보처리방침 URL

Play Console → **스토어 설정** → **개인정보처리방침**

```
https://shift-calendar-three.vercel.app/privacy
```

---

## 6. 콘텐츠 등급 (IARC)

| 질문 | 답변 |
|------|------|
| 폭력/성적/욕설/약물 | 없음 |
| 사용자 간 상호작용 | **예** (공유 달력·메시지) |
| 위치 공유 | 아니오 |
| 디지털 구매 | 아니오 |
| **예상 등급** | **전체이용가 (Everyone / 3+)** |

---

## 7. 타겟 대상

- **대상 연령**: 성인·일반 (아동 대상 아님)
- **Designed for Families**: **아니오**

---

## 8. 스토어 등록정보 (수동 준비)

| 자산 | 요구 |
|------|------|
| 앱 이름 | 넴쿵 교대근무표 |
| 짧은 설명 (80자) | 예: 경찰·소방 교대 근무표를 만들고 공유 코드로 실시간 공유하는 개인용 일정 앱 |
| 전체 설명 | 기능 + 비공식 고지 + 인터넷 필요 |
| 스크린샷 (휴대폰) | 최소 2장 (권장 4~8장) |
| 앱 아이콘 | 512×512 (`public/icons/icon-512.png` 활용) |
| Feature graphic | 1024×500 (제작 필요) |
| 개발자 이메일 | Console 계정 설정 |

---

## 9. Android 권한 (심사용 참고)

현재 선언 권한: **`INTERNET`만**

민감 권한(위치·카메라·연락처·알림·저장소·AD_ID) 없음 → 추가 선언 불필요.

---

## 10. 심사 리스크 참고

이 앱은 Capacitor WebView로 **원격 웹(Vercel)** 을 로드합니다.

- **완화**: 네이티브 Splash·StatusBar·뒤로가기, productivity 도구 포지셔닝, 법적 페이지·데이터 삭제 URL 제공
- **스토어 설명**: 인터넷 필수·비공식 앱 명시
- 장기적으로는 정적 번들(`webDir`) 방식이 심사·오프라인에 유리

---

## 빠른 링크

| URL | 용도 |
|-----|------|
| `/privacy` | Play 개인정보처리방침 (필수) |
| `/terms` | 이용약관 |
| `/data-deletion` | 데이터 삭제 (Play Data safety) |

상세 빌드 방법: [ANDROID_DEPLOY.md](./ANDROID_DEPLOY.md)
