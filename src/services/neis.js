const NEIS_KEY = import.meta.env.VITE_NEIS_API_KEY

function neisUrl(hub, params) {
  const q = new URLSearchParams({ KEY: NEIS_KEY, Type: 'json', ...params })
  return `https://open.neis.go.kr/hub/${hub}?${q}`
}

export async function searchSchools(keyword) {
  if (!keyword?.trim() || !NEIS_KEY) return []
  const res = await fetch(
    neisUrl('schoolInfo', {
      pIndex: '1',
      pSize: '100',
      SCHUL_NM: keyword.trim(),
    }),
  )
  const data = await res.json()
  const rows = data?.schoolInfo?.[1]?.row
  if (!rows) return []

  return rows
    .filter((s) => ['초등학교', '중학교', '고등학교'].includes(s.SCHUL_KND_SC_NM))
    .map((s) => ({
      id: s.SD_SCHUL_CODE,
      name: s.SCHUL_NM,
      address: s.ORG_RDNMA || s.ORG_RDNDA,
      type: s.SCHUL_KND_SC_NM,
      eduCode: s.ATPT_OFCDC_SC_CODE,
    }))
}

export async function fetchMaxClassCount(school, grade = 1) {
  if (!school) return 6

  if (NEIS_KEY && school.eduCode && school.id) {
    try {
      const y = new Date().getFullYear()
      const res = await fetch(
        neisUrl('classInfo', {
          pIndex: '1',
          pSize: '100',
          ATPT_OFCDC_SC_CODE: school.eduCode,
          SD_SCHUL_CODE: school.id,
          AY: String(y),
          GRADE: String(grade),
        }),
      )
      const data = await res.json()
      const rows = data?.classInfo?.[1]?.row
      if (rows?.length) {
        const nums = rows
          .map((r) => parseInt(r.CLASS_NM, 10))
          .filter((n) => !Number.isNaN(n))
        if (nums.length) return Math.max(...nums)
      }
    } catch {
      /* heuristic fallback */
    }
  }

  const name = school.name || ''
  if (name.includes('고등학교')) return 10
  if (name.includes('중학교')) return 8
  return 6
}

export async function fetchMealInfo(school, dateKey) {
  if (!school?.eduCode || !school?.id || !NEIS_KEY) return []

  try {
    const res = await fetch(
      neisUrl('mealServiceDietInfo', {
        ATPT_OFCDC_SC_CODE: school.eduCode,
        SD_SCHUL_CODE: school.id,
        MLSV_YMD: dateKey,
      }),
    )
    const data = await res.json()
    const rows = data?.mealServiceDietInfo?.[1]?.row || []
    const raw = rows[0]?.DDISH_NM || ''
    // 교육청 API는 <br/> 또는 <BR/> 로 메뉴 구분, 괄호 안 알레르기 코드 제거
    return raw
      .split(/<br\s*\/>/i)
      .map((s) => s.replace(/\([^)]*\)/g, '').replace(/[^가-힣\s]/g, '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function fetchTimetableInfo(school, grade, classNum, dateKey) {
  if (!school?.eduCode || !school?.id || !NEIS_KEY) return []

  const tableHub = school.name?.includes('초등학교')
    ? 'elsTimetable'
    : school.name?.includes('중학교')
      ? 'misTimetable'
      : 'hisTimetable'

  try {
    const res = await fetch(
      neisUrl(tableHub, {
        ATPT_OFCDC_SC_CODE: school.eduCode,
        SD_SCHUL_CODE: school.id,
        ALL_TI_YMD: dateKey,
        GRADE: String(grade),
        CLASS_NM: String(classNum),
      }),
    )
    const data = await res.json()
    const root = data?.[tableHub]?.[1]?.row || []
    return root.map((row) => ({
      period: `${row.PERIO || row.PERIOD || row.PERIOD_NO || row.PERIOD_NM || ''}교시`.replace('교시교시', '교시'),
      subject: row.ITRT_CNTNT || row.SBTR_DD_SC_NM || row.SUBJECT || '수업',
    }))
  } catch {
    return []
  }
}
