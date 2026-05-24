/**
 * 대한민국 공휴일 정적 목록.
 *
 * - 이 목록은 "확실히 학교를 가지 않는 날"만 포함한다.
 * - 음력 기반 공휴일(설날·추석·부처님오신날)과 대체공휴일은 매년 수동으로 갱신해야 한다.
 * - 누락된 휴일이 있어도 NEIS 데이터가 0건이면 결국 "학교 가지 않는 날" 로 떨어지므로
 *   사용자 경험에는 큰 영향이 없다.
 *
 * 형식: 'YYYY-MM-DD': '공휴일명'
 */
const HOLIDAYS = {
  // 2026
  '2026-01-01': '신정',
  '2026-02-16': '설날',
  '2026-02-17': '설날 연휴',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체공휴일(삼일절)',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일(부처님오신날)',
  '2026-06-03': '제8회 전국동시지방선거',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체공휴일(광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-09-28': '대체공휴일(추석)',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일(개천절)',
  '2026-10-09': '한글날',
  '2026-12-25': '크리스마스',

  // 2027
  '2027-01-01': '신정',
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일(설날)',
  '2027-03-01': '삼일절',
  '2027-05-05': '어린이날',
  '2027-05-13': '부처님오신날',
  '2027-06-06': '현충일',
  '2027-06-07': '대체공휴일(현충일)',
  '2027-08-15': '광복절',
  '2027-08-16': '대체공휴일(광복절)',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-03': '개천절',
  '2027-10-04': '대체공휴일(개천절)',
  '2027-10-09': '한글날',
  '2027-10-11': '대체공휴일(한글날)',
  '2027-12-25': '크리스마스',
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isWeekend(date = new Date()) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function getHolidayName(date = new Date()) {
  return HOLIDAYS[toKey(date)] || null
}

export function isHoliday(date = new Date()) {
  return Boolean(getHolidayName(date))
}

export function isOffSchoolByCalendar(date = new Date()) {
  return isWeekend(date) || isHoliday(date)
}

export function describeOffSchoolReason(date = new Date()) {
  if (isHoliday(date)) return getHolidayName(date)
  const day = date.getDay()
  if (day === 6) return '토요일'
  if (day === 0) return '일요일'
  return null
}
