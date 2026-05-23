import { toYmd } from '../utils/index.js'
import { fetchMealInfo, fetchTimetableInfo } from './neis.js'

const timetableMap = {
  1: ['국어', '수학', '영어', '사회', '체육', '창체'],
  2: ['영어', '수학', '과학', '국어', '미술', '창체'],
  3: ['수학', '국어', '영어', '한국사', '체육', '자율'],
}

export async function getMealForSchool(profile, targetDate = new Date()) {
  const schoolName = profile?.school?.name || '우리 학교'
  const date = toYmd(targetDate)
  const liveMenu = await fetchMealInfo(profile?.school, date)

  if (liveMenu.length) {
    return { date, schoolName, menu: liveMenu, source: 'neis' }
  }

  return { date, schoolName, menu: [], source: 'no-data' }
}

export async function getTimetableForSchool(profile, targetDate = new Date()) {
  const grade = Number(profile?.grade || 1)
  const classNum = Number(profile?.classNum || 1)
  const date = toYmd(targetDate)
  const liveRows = await fetchTimetableInfo(profile?.school, grade, classNum, date)

  if (liveRows.length) {
    return liveRows.map((row, index) => ({
      period: row.period || `${index + 1}교시`,
      subject: row.subject,
      room: `${grade}${String(classNum).padStart(2, '0')}-${index + 1}`,
      source: 'neis',
    }))
  }

  const subjects = timetableMap[grade] || timetableMap[1]
  return ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'].map((period, index) => ({
    period,
    subject: subjects[(index + classNum - 1) % subjects.length],
    room: `${grade}${String(classNum).padStart(2, '0')}-${index + 1}`,
    source: 'fallback',
  }))
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
