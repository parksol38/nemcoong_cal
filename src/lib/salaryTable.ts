/**
 * 공무원보수규정 [별표 10] 경찰·소방·의무경찰 봉급표 (2026.1.2 개정)
 * 단위: 원 / 월
 */

export type SalaryAgency = "police" | "fire";

export type SalaryRankId =
  | "chi_an_jeong_gam"
  | "chi_an_gam"
  | "gyeong_mu_gwan"
  | "chong_gyeong"
  | "gyeong_jeong"
  | "gyeong_gam"
  | "gyeong_wi"
  | "gyeong_sa"
  | "gyeong_jang"
  | "sun_gyeong";

export type SalaryRank = {
  id: SalaryRankId;
  /** 경찰 계급명 */
  policeLabel: string;
  /** 소방 계급명 */
  fireLabel: string;
  /** 표 열 인덱스 (0~9) */
  column: number;
};

export const SALARY_RANKS: SalaryRank[] = [
  {
    id: "chi_an_jeong_gam",
    policeLabel: "치안정감",
    fireLabel: "소방정감",
    column: 0,
  },
  {
    id: "chi_an_gam",
    policeLabel: "치안감",
    fireLabel: "소방감",
    column: 1,
  },
  {
    id: "gyeong_mu_gwan",
    policeLabel: "경무관",
    fireLabel: "소방준감",
    column: 2,
  },
  {
    id: "chong_gyeong",
    policeLabel: "총경",
    fireLabel: "소방정",
    column: 3,
  },
  {
    id: "gyeong_jeong",
    policeLabel: "경정",
    fireLabel: "소방령",
    column: 4,
  },
  {
    id: "gyeong_gam",
    policeLabel: "경감",
    fireLabel: "소방경",
    column: 5,
  },
  {
    id: "gyeong_wi",
    policeLabel: "경위",
    fireLabel: "소방위",
    column: 6,
  },
  {
    id: "gyeong_sa",
    policeLabel: "경사",
    fireLabel: "소방장",
    column: 7,
  },
  {
    id: "gyeong_jang",
    policeLabel: "경장",
    fireLabel: "소방교",
    column: 8,
  },
  {
    id: "sun_gyeong",
    policeLabel: "순경",
    fireLabel: "소방사",
    column: 9,
  },
];

/** 호봉(1~32) × 계급열. null = 해당 없음 */
export const SALARY_TABLE: (number | null)[][] = [
  // 1호봉
  [4905100, 4563500, 4167700, 3619000, 3126100, 2698600, 2507700, 2472100, 2215300, 2133000],
  // 2
  [5068300, 4719000, 4307600, 3751300, 3243100, 2814700, 2567700, 2493100, 2245500, 2155600],
  // 3
  [5235600, 4876600, 4451700, 3885800, 3364700, 2933000, 2640000, 2539000, 2290400, 2187500],
  // 4
  [5406700, 5035600, 4596800, 4023500, 3491000, 3054900, 2758200, 2610800, 2350700, 2229200],
  // 5
  [5582000, 5197000, 4744300, 4163000, 3620600, 3178700, 2879500, 2710600, 2427500, 2281100],
  // 6
  [5759400, 5358400, 4893200, 4304000, 3752700, 3305500, 3001800, 2826000, 2522200, 2343900],
  // 7
  [5939400, 5522100, 5044000, 4446100, 3887000, 3435100, 3125400, 2942100, 2628900, 2418400],
  // 8
  [6120900, 5685500, 5195000, 4588900, 4022900, 3565700, 3249000, 3059100, 2731700, 2505600],
  // 9
  [6305100, 5850100, 5347400, 4732300, 4159300, 3697600, 3373300, 3170300, 2829500, 2595100],
  // 10
  [6490300, 6014400, 5499700, 4875500, 4296500, 3820800, 3490700, 3276600, 2922200, 2680900],
  // 11
  [6675000, 6179600, 5652200, 5019900, 4425000, 3937600, 3600800, 3376800, 3012000, 2762900],
  // 12
  [6866100, 6350500, 5810200, 5155900, 4548700, 4051200, 3709400, 3475200, 3099500, 2844100],
  // 13
  [7058200, 6522400, 5957200, 5282900, 4666100, 4158400, 3812400, 3568600, 3183800, 2922200],
  // 14
  [7250800, 6678100, 6093600, 5401600, 4775600, 4261000, 3909100, 3657900, 3264300, 2998100],
  // 15
  [7419100, 6821500, 6219400, 5513300, 4879100, 4357000, 4002700, 3743200, 3341600, 3070500],
  // 16
  [7568600, 6952900, 6336500, 5618700, 4976500, 4449500, 4090100, 3823900, 3416300, 3140600],
  // 17
  [7701100, 7073900, 6445400, 5716500, 5068100, 4535400, 4173700, 3901400, 3486000, 3209100],
  // 18
  [7819100, 7184600, 6546700, 5807900, 5154500, 4618100, 4252700, 3975500, 3553600, 3273000],
  // 19
  [7924800, 7286800, 6640300, 5893300, 5236000, 4695400, 4327900, 4045300, 3618500, 3335700],
  // 20
  [8019600, 7380000, 6728100, 5973100, 5312400, 4768800, 4399300, 4111700, 3680400, 3395400],
  // 21
  [8106800, 7465300, 6809300, 6047600, 5384200, 4837900, 4467200, 4175200, 3739400, 3451600],
  // 22
  [8184600, 7543500, 6884500, 6117500, 5451700, 4904700, 4531200, 4235000, 3796100, 3506000],
  // 23
  [8250400, 7615000, 6953800, 6183200, 5515300, 4965900, 4592000, 4293000, 3850000, 3557600],
  // 24
  [null, 7673600, 7018800, 6245100, 5574900, 5025200, 4650300, 4347900, 3902200, 3607200],
  // 25
  [null, 7729500, 7071800, 6301600, 5631200, 5080100, 4705700, 4399900, 3951600, 3654200],
  // 26
  [null, null, 7122700, 6349600, 5684200, 5134000, 4756500, 4449900, 3999600, 3697100],
  // 27
  [null, null, 7169800, 6393700, 5728100, 5183300, 4800000, 4492000, 4039500, 3733900],
  // 28
  [null, null, null, 6436100, 5770400, 5225600, 4841900, 4531300, 4078000, 3769300],
  // 29
  [null, null, null, null, 5809200, 5264800, 4881500, 4569300, 4114300, 3803400],
  // 30
  [null, null, null, null, 5846900, 5303200, 4918600, 4605800, 4149600, 3836800],
  // 31
  [null, null, null, null, null, 5338600, 4954300, 4639900, 4183800, 3869200],
  // 32
  [null, null, null, null, null, 5372500, null, null, null, null],
];

/** 월 소정근로시간 (통상시급 산출 기준) */
export const MONTHLY_STATUTORY_HOURS = 209;

/**
 * 야간·심야 시급 가산 비율 (순경 1호봉 기본값 대비)
 * 주간 10,200 / 야간 13,900 / 심야 15,500
 */
export const NIGHT_RATE_RATIO = 13900 / 10200;
export const OVERNIGHT_RATE_RATIO = 15500 / 10200;

export const DEFAULT_SALARY_RANK_ID: SalaryRankId = "sun_gyeong";
export const DEFAULT_SALARY_GRADE = 1;
export const DEFAULT_SALARY_AGENCY: SalaryAgency = "police";

export type SalaryProfile = {
  agency: SalaryAgency;
  rankId: SalaryRankId;
  /** 1~32 */
  grade: number;
};

export const DEFAULT_SALARY_PROFILE: SalaryProfile = {
  agency: DEFAULT_SALARY_AGENCY,
  rankId: DEFAULT_SALARY_RANK_ID,
  grade: DEFAULT_SALARY_GRADE,
};

export function getSalaryRank(id: SalaryRankId): SalaryRank {
  return SALARY_RANKS.find((r) => r.id === id) ?? SALARY_RANKS[9]!;
}

export function rankLabel(rank: SalaryRank, agency: SalaryAgency): string {
  return agency === "fire" ? rank.fireLabel : rank.policeLabel;
}

/** 해당 계급에서 선택 가능한 호봉 목록 */
export function availableGrades(rankId: SalaryRankId): number[] {
  const col = getSalaryRank(rankId).column;
  const grades: number[] = [];
  for (let i = 0; i < SALARY_TABLE.length; i++) {
    if (SALARY_TABLE[i]![col] != null) grades.push(i + 1);
  }
  return grades;
}

/** 월 기본급 (없으면 null) */
export function lookupMonthlySalary(
  rankId: SalaryRankId,
  grade: number,
): number | null {
  if (grade < 1 || grade > SALARY_TABLE.length) return null;
  const col = getSalaryRank(rankId).column;
  return SALARY_TABLE[grade - 1]![col] ?? null;
}

export function clampSalaryProfile(profile: Partial<SalaryProfile>): SalaryProfile {
  const agency: SalaryAgency =
    profile.agency === "fire" || profile.agency === "police"
      ? profile.agency
      : DEFAULT_SALARY_AGENCY;
  const rankId = SALARY_RANKS.some((r) => r.id === profile.rankId)
    ? (profile.rankId as SalaryRankId)
    : DEFAULT_SALARY_RANK_ID;
  const grades = availableGrades(rankId);
  const gradeRaw = Number(profile.grade);
  const grade = grades.includes(gradeRaw)
    ? gradeRaw
    : (grades[0] ?? DEFAULT_SALARY_GRADE);
  return { agency, rankId, grade };
}

/** 기본급 → 통상(주간) 시급 */
export function usualHourlyFromBase(monthlyBase: number): number {
  return Math.round(monthlyBase / MONTHLY_STATUTORY_HOURS);
}

/** 봉급표 기준 주간·야간·심야 시급 추정 */
export function hourlyRatesFromBase(monthlyBase: number): {
  day: number;
  night: number;
  overnight: number;
} {
  const day = usualHourlyFromBase(monthlyBase);
  return {
    day,
    night: Math.round(day * NIGHT_RATE_RATIO),
    overnight: Math.round(day * OVERNIGHT_RATE_RATIO),
  };
}

export function hourlyRatesFromProfile(profile: SalaryProfile): {
  day: number;
  night: number;
  overnight: number;
} | null {
  const base = lookupMonthlySalary(profile.rankId, profile.grade);
  if (base == null) return null;
  return hourlyRatesFromBase(base);
}

export function formatSalaryProfileLabel(profile: SalaryProfile): string {
  const rank = getSalaryRank(profile.rankId);
  return `${rankLabel(rank, profile.agency)} ${profile.grade}호봉`;
}
