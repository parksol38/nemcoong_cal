import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 넴쿵 교대근무표",
  description: "넴쿵 교대근무표 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-full max-w-2xl px-5 py-10 text-gray-800 dark:text-gray-100">
      <p className="text-xs font-medium text-gray-400">법적 고지</p>
      <h1 className="mt-1 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        시행일: 2026년 8월 10일 · 앱/웹 공통
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            1. 수집하는 정보
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>표시 이름(닉네임)</li>
            <li>기기 식별값(앱 내 생성되는 device ID) 및 기기 표시 라벨</li>
            <li>근무표·근무 유형·시간·추가시간 등 사용자가 입력한 일정 데이터</li>
            <li>공유 메시지·변경 이력 등 사용자가 작성·발생시킨 기록</li>
            <li>달력 접근을 위한 공유 코드·비밀번호(암호화·해시 처리 등 서비스 정책에 따름)</li>
          </ul>
          <p className="mt-2">
            시급·앱 테마·근무 색상 등 일부 설정은 해당 기기의 로컬 저장소에만
            저장될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            2. 이용 목적
          </h2>
          <p>
            경찰·소방 공무원 교대 근무표 작성·공유, 접속 기기/작성자 구분, 변경
            알림·메시지 기능 제공, 서비스 안정성 유지 및 문의 대응을 위해
            사용합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            3. 보관 및 처리 위탁
          </h2>
          <p>
            서비스 데이터는 Supabase 등 클라우드 인프라에 저장·처리될 수 있으며,
            웹/앱 호스팅은 Vercel 등 배포 환경을 이용할 수 있습니다. 각 제공자의
            보안·위치 정책이 적용됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            4. 제3자 제공
          </h2>
          <p>
            법령에 따른 요청이 있는 경우를 제외하고, 이용자 동의 없이 개인정보를
            외부에 판매·제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            5. 보관 기간 및 삭제
          </h2>
          <p>
            서비스 이용 기간 동안 보관하며, 달력 삭제·관리자 요청·관련 법령에
            따른 기간이 지나면 지체 없이 파기합니다. 삭제 요청은 앱/웹 문의
            채널 또는 운영자에게 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            6. 이용자 권리
          </h2>
          <p>
            닉네임·근무 데이터 수정·삭제, 기기 목록 확인 등 앱 기능을 통해
            열람·정정할 수 있습니다. 문의 시 본인 확인 후 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            7. 문의
          </h2>
          <p>
            개인정보 관련 문의는 앱 내 안내 또는 서비스 운영자 채널로
            연락해 주세요. 본 방침은 서비스 변경에 따라 개정될 수 있으며, 개정 시
            앱/웹에 게시합니다.
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
