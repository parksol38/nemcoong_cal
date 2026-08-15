/**
 * 앱 디자인/제품 버전 (Play Store versionName과 별개)
 *
 * - v1: 초기 완성 스냅샷 (커플·개인용 분위기)
 * - v2: Android Play Store 배포용 (법적 페이지·네이티브 셸·스토어 대응)
 *
 * 롤백·분위기 복원 시 docs/VERSIONS.md 참고
 */
export const DESIGN_VERSION = 2 as const;

export type DesignVersion = 1 | 2;

/** Git 태그명 (스냅샷 복원용) */
export const DESIGN_VERSION_TAGS: Record<DesignVersion, string> = {
  1: "v1",
  2: "v2",
};

/** Play Store / package.json 릴리스 버전 (versionName) */
export const RELEASE_VERSION = "1.0.0";

/** 설정 화면 등에 표시 */
export function formatDesignVersionLabel(): string {
  return `디자인 v${DESIGN_VERSION}`;
}

export function formatReleaseVersionLabel(): string {
  return `v${RELEASE_VERSION}`;
}
