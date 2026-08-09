# 교대근무 공유 달력

아이폰(PWA)과 노트북 브라우저에서 함께 쓰는 **실시간 교대근무 공유 달력**입니다.  
두 사람이 같은 공유 코드로 접속하면, 근무를 저장하는 즉시 상대방 화면에 반영됩니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Next.js (App Router), Tailwind CSS, Lucide Icons |
| 백엔드 / DB | Supabase (Postgres + Realtime) |
| PWA | `manifest.ts` + `@ducanh2912/next-pwa` |

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 준비

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. **Settings → API**에서 Project URL / anon key를 복사합니다.
4. 프로젝트 루트에 `.env.local`을 만들고 값을 넣습니다.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 사용 방법

1. 한 명이 **새 달력 만들기** → 공유 코드 발급
2. 상대방은 **공유 코드로 참여**
3. 날짜를 탭해 근무 형태(주간 / 야간 / 심야 / 휴무)와 메모를 저장
4. 상대방 기기에서 **Realtime**으로 즉시 확인

### 근무 색상

| 형태 | 색상 |
|------|------|
| 주간 | 주황색 |
| 야간 | Navy |
| 심야 | 더 진한 Navy + 아이콘 구분 |
| 휴무 | 흰 배경 + 회색 테두리 |

## iPhone에 홈 화면 추가 (PWA)

1. Safari로 배포 URL(또는 로컬 터널 URL)을 엽니다.
2. 공유 버튼 → **홈 화면에 추가**
3. 앱 아이콘으로 실행하면 전체 화면(standalone)으로 열립니다.

> 참고: iOS에서 PWA는 **Safari**로 추가해야 합니다.  
> Service Worker는 프로덕션 빌드(`npm run build`)에서 활성화됩니다.

## 프로젝트 구조

```
src/
  app/                 # App Router (layout, page, manifest)
  components/          # 달력, 모달, 온보딩
  hooks/useShifts.ts   # 조회 + Realtime 구독
  lib/                 # Supabase 클라이언트, API, 타입
supabase/
  schema.sql           # 테이블 / RLS / Realtime
public/icons/          # PWA · Apple Touch 아이콘
```

## 데이터베이스 개요

- `calendars` — 공유 달력 + `share_code`
- `shifts` — 일자별 근무 (`calendar_id` + `date` 유니크)
- Realtime publication에 `shifts` 테이블 포함

## 스크립트

```bash
npm run dev      # 개발
npm run build    # 프로덕션 빌드 (+ SW 생성)
npm run start    # 프로덕션 실행
```

## 보안 안내

이 앱은 커플용 **간편 공유(공유 코드)** 를 전제로 anon 정책을 열어 두었습니다.  
외부에 공개하거나 민감한 일정을 다룰 경우 Supabase Auth / RLS를 더 강화하세요.
