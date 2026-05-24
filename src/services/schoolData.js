import { toYmd } from '../utils/index.js'
import { describeOffSchoolReason, isHoliday, isWeekend } from '../utils/koreanHolidays.js'
import { fetchMealInfo, fetchTimetableInfo } from './neis.js'

/**
 * "오늘 학교를 가는 날인가?" 판정 + 급식/시간표 데이터를 한 번에 반환한다.
 *
 * 반환:
 * {
 *   schoolDay: boolean,           // 학교 가는 날 여부 (false 면 UI 는 "학교 가지 않는 날" 카드 표시)
 *   reason:    'school' | 'weekend' | 'holiday' | 'no-data' | 'error' | 'no-school-profile',
 *   reasonLabel: string | null,   // '일요일' / '부처님오신날' / null 등 사용자에게 보여줄 라벨
 *   date:      string,            // YYYYMMDD
 *   schoolName: string,
 *   meal:      { menu: string[], available: boolean },
 *   timetable: { rows: {period, subject}[], available: boolean },
 *   errored:   boolean,           // 네트워크/HTTP/키 오류 등 호출 자체 실패
 * }
 */
export async function getSchoolDayInfo(profile, targetDate = new Date()) {
  const date = toYmd(targetDate)
  const schoolName = profile?.school?.name || '우리 학교'
  const hasSchoolProfile = Boolean(profile?.school?.eduCode && profile?.school?.id)
  const grade = Number(profile?.grade || 1)
  const classNum = Number(profile?.classNum || 1)

  // 1) 달력 기반 판정 (주말/공휴일)
  if (isHoliday(targetDate) || isWeekend(targetDate)) {
    return {
      schoolDay: false,
      reason: isHoliday(targetDate) ? 'holiday' : 'weekend',
      reasonLabel: describeOffSchoolReason(targetDate),
      date,
      schoolName,
      meal: { menu: [], available: false },
      timetable: { rows: [], available: false },
      errored: false,
    }
  }

  // 2) 학교 등록이 안 된 사용자 → 데이터 호출 자체가 불가능
  if (!hasSchoolProfile) {
    return {
      schoolDay: false,
      reason: 'no-school-profile',
      reasonLabel: null,
      date,
      schoolName,
      meal: { menu: [], available: false },
      timetable: { rows: [], available: false },
      errored: false,
    }
  }

  // 3) NEIS 동시 호출
  const [mealResult, timetableResult] = await Promise.all([
    fetchMealInfo(profile.school, date),
    fetchTimetableInfo(profile.school, grade, classNum, date),
  ])

  const mealAvailable = mealResult.menu.length > 0
  const timetableAvailable = timetableResult.rows.length > 0
  const anyDataAvailable = mealAvailable || timetableAvailable
  const callFailed = !mealResult.ok && !timetableResult.ok

  if (callFailed) {
    return {
      schoolDay: false,
      reason: 'error',
      reasonLabel: null,
      date,
      schoolName,
      meal: { menu: [], available: false },
      timetable: { rows: [], available: false },
      errored: true,
    }
  }

  // 4) 평일 + API 정상 + 데이터 0건 → 재량휴업·시험·방학 등 학교 안 가는 날로 간주
  if (!anyDataAvailable) {
    return {
      schoolDay: false,
      reason: 'no-data',
      reasonLabel: null,
      date,
      schoolName,
      meal: { menu: [], available: false },
      timetable: { rows: [], available: false },
      errored: false,
    }
  }

  return {
    schoolDay: true,
    reason: 'school',
    reasonLabel: null,
    date,
    schoolName,
    meal: { menu: mealResult.menu, available: mealAvailable },
    timetable: {
      rows: timetableResult.rows.map((row, index) => ({
        period: row.period || `${index + 1}교시`,
        subject: row.subject,
      })),
      available: timetableAvailable,
    },
    errored: false,
  }
}

export function getSchoolSummary(profile) {
  const schoolName = profile?.school?.name || '학교 미설정'
  const region = profile?.school?.address?.split(' ').slice(0, 2).join(' ') || '지역 미설정'
  const grade = profile?.grade || '-'
  const classNum = profile?.classNum || '-'
  const focusOptions = ['집중도 높은 자습실', '축제 참여율 높음', '동아리 활동 활발']
  const seed = (schoolName.length + Number(classNum || 0)) % focusOptions.length

  return {
    schoolName,
    region,
    homeroom: `${grade}학년 ${classNum}반`,
    summary: `${region} ${grade}학년 ${classNum}반 기준으로 오늘 정보를 보여주고 있어요.`,
    focus: focusOptions[seed],
  }
}
