import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | 넴쿵 교대근무표",
  description: "넴쿵 교대근무표 이용약관",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-full max-w-2xl px-5 py-10 text-gray-800 dark:text-gray-100">
      <p className="text-xs font-medium text-gray-400">법적 고지</p>
      <h1 className="mt-1 text-2xl font-bold">이용약관</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        시행일: 2026년 8월 10일 · 앱/웹 공통
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            1. 서비스 개요
          </h2>
          <p>
            넴쿵 교대근무표(이하 &quot;서비스&quot;)는 경찰·소방 공무원의 교대
            근무 일정을 작성·공유하기 위한 웹 및 모바일 앱 서비스입니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            2. 계정·접근
          </h2>
          <p>
            공유 코드와 비밀번호 등으로 달력에 접근할 수 있습니다. 비밀번호와
            공유 정보를 안전하게 관리할 책임은 이용자에게 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            3. 이용자 의무
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>타인의 정보를 무단으로 수집·게시하지 않습니다.</li>
            <li>서비스를 해킹·과부하·무단 접근 등 부정한 방법으로 이용하지 않습니다.</li>
            <li>법령 및 공서양속에 반하는 내용을 저장·공유하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            4. 서비스 제공
          </h2>
          <p>
            서비스는 최선의 가용성을 위해 노력하나, 점검·장애·천재지변 등으로
            일시 중단될 수 있습니다. 근무 데이터의 백업은 필요 시 이용자가 별도
            보관하는 것을 권장합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            5. 책임의 제한
          </h2>
          <p>
            서비스는 근무 일정 관리를 돕는 도구이며, 급여·법적 근로시간 계산의
            공식 근거를 보장하지 않습니다. 예상 월급 등 참고 수치가 표시될 수
            있으나 실제 급여와 다를 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            6. 약관 변경
          </h2>
          <p>
            약관은 필요 시 개정될 수 있으며, 중요한 변경은 앱/웹에 게시합니다.
            변경 후에도 서비스를 계속 이용하면 개정 약관에 동의한 것으로 봅니다.
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-semibold text-[#007AFF]"
      >
        ← 앱으로 돌아가기
      </Link>
    </main>
  );
}
