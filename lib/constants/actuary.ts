/**
 * Shared actuarial taxonomy constants.
 * Used by: job postings, job filters, job seeker profile.
 * Single source of truth — do not re-declare these elsewhere.
 */

export const MAIN_SPECIALIZATIONS = [
  '생명보험',
  '손해보험',
  '재보험',
  '회계법인',
  '계리법인',
  '컨설팅',
  '기타',
] as const

export const DETAILED_SPECIALTIES = [
  '계리평가 - 결산',
  '계리평가 - 모델링',
  '계리평가 - EV',
  '계리평가 - 가정관리',
  '가격산출 / 요율개발',
  '상품 - 개발',
  '상품 - 관리',
  '상품 - 위험율 개발',
  '상품 - 가정관리',
  '리스크관리 - ALM',
  '리스크관리 - 지급여력',
  '준비금 / 손해액 추정',
  '경영기획 / FP&A',
  '회계 / 재무보고',
  '투자 / 자산운용',
  '퇴직연금 / 연금계리',
  '재보험 관리',
  '컨설팅 / 자문',
  '계리시스템 / Prophet / AXIS / 자동화',
  '데이터 / 분석 / 경험통계',
  '기타',
] as const

export const EXPERIENCE_LEVELS = [
  '신입',
  '1~4년',
  '5~8년',
  '9~12년',
  '13~16년',
  '17~20년',
  '20년 초과',
] as const

export const EMPLOYMENT_TYPES = [
  '정규직',
  '계약직',
  '파트타임',
  '인턴',
  '프리랜서',
] as const

export type MainSpecialization = (typeof MAIN_SPECIALIZATIONS)[number]
export type DetailedSpecialty = (typeof DETAILED_SPECIALTIES)[number]
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]
