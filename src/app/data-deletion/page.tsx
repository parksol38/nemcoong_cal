import Link from "next/link";
import type { Metadata } from "next";
import {
  APP_NAME,
  DATA_DELETION_URL,
  LEGAL_EFFECTIVE_DATE,
  SUPPORT_EMAIL,
  supportMailto,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `데이터 삭제 안내 | ${APP_NAME}`,
  description: `${APP_NAME} 계정 및 데이터 삭제 요청 방법`,
};

export default function DataDeletionPage() {
  const mailto = supportMailto("데이터 삭제 요청");

  return (
    <main className="mx-auto min-h-full max-w-2xl px-5 py-10 text-gray-800 dark:text-gray-100">
      <p className="text-xs font-medium text-gray-400">법적 고지</p>
      <h1 className="mt-1 text-2xl font-bold">데이터 삭제 안내</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        시행일: {LEGAL_EFFECTIVE_DATE} · Google Play 데이터 삭제 정책 대응
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            1. 앱에서 직접 삭제 가능한 항목
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>개별 근무 일정·메모 (달력에서 수정·삭제)</li>
            <li>표시 이름(닉네임) 변경</li>
            <li>기기 로컬 설정(테마·시급 등) — 앱 삭제 또는 설정 초기화</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            2. 서버 데이터 삭제 요청
          </h2>
          <p>
            달력 전체·접속 기기 기록·변경 이력·공유 메시지 등 서버(Supabase)에
            저장된 데이터를 삭제하려면 아래 방법으로 요청해 주세요.
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              {SUPPORT_EMAIL ? (
                <>
                  이메일{" "}
                  {mailto ? (
                    <a
                      href={mailto}
                      className="font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  ) : (
                    <span className="font-semibold">{SUPPORT_EMAIL}</span>
                  )}
                  로 &quot;데이터 삭제 요청&quot; 제목으로 발송
                </>
              ) : (
                <>Play Store 앱 페이지의 개발자 연락처로 &quot;데이터 삭제 요청&quot; 제목으로 문의</>
              )}
            </li>
            <li>공유 코드(또는 달력 이름)와 사용 중인 표시 이름(닉네임) 기재</li>
            <li>삭제 범위(특정 기기 / 달력 전체 등) 명시</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            3. 처리 기한
          </h2>
          <p>
            본인 확인 후 영업일 기준 <strong>30일 이내</strong> 처리합니다.
            처리 완료 시 요청하신 연락처로 안내드립니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            4. 보관이 필요한 경우
          </h2>
          <p>
            관련 법령에 따라 보관 의무가 있는 경우, 해당 기간 동안만 최소
            범위로 보관한 뒤 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            5. 관련 안내
          </h2>
          <p>
            자세한 수집·이용 항목은{" "}
            <Link href="/privacy" className="font-semibold text-accent">
              개인정보처리방침
            </Link>
            을 참고해 주세요.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Play Console 등록 URL: {DATA_DELETION_URL}
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-semibold text-accent"
      >
        ← 앱으로 돌아가기
      </Link>
    </main>
  );
}
