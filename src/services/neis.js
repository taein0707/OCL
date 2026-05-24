const NEIS_KEY = import.meta.env.VITE_NEIS_API_KEY

function neisUrl(hub, params) {
  const base = new URLSearchParams({ Type: 'json', pIndex: '1', pSize: '100', ...params })
  // KEY 가 비어 있으면 NEIS 공개 API 는 호출 제한이 강해진다. 빈 키는 URL 에 붙이지 않는다.
  if (NEIS_KEY) base.set('KEY', NEIS_KEY)
  return `https://open.neis.go.kr/hub/${hub}?${base}`
}

function readResultCode(payload, hub) {
  // NEIS 응답 포맷:
  //   성공: { [hub]: [{ head: [..., { RESULT: { CODE, MESSAGE } }] }, { row: [...] }] }
  //   실패: { RESULT: { CODE, MESSAGE } }
  const direct = payload?.RESULT
  if (direct?.CODE) return direct
  const head = payload?.[hub]?.[0]?.head
  if (Array.isArray(head)) {
    const entry = head.find((h) => h?.RESULT)
    if (entry?.RESULT) return entry.RESULT
  }
  return null
}

async function neisRequest(hub, params) {
  if (!NEIS_KEY) {
    console.warn(`[neis] VITE_NEIS_API_KEY 가 비어 있어 ${hub} 요청을 건너뜁니다.`)
    return { rows: [], code: 'NO-KEY', ok: false }
  }
  try {
    const url = neisUrl(hub, params)
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[neis] ${hub} HTTP ${res.status}`)
      return { rows: [], code: `HTTP-${res.status}`, ok: false }
    }
    const data = await res.json()
    const result = readResultCode(data, hub)
    const rows = data?.[hub]?.[1]?.row || []
    const code = result?.CODE || 'INFO-000'
    if (!rows.length) {
      console.info(`[neis] ${hub} 결과 0건 (code=${code})`)
    }
    return { rows, code, ok: true }
  } catch (error) {
    console.error(`[neis] ${hub} fetch 실패:`, error)
    return { rows: [], code: 'NETWORK-ERROR', ok: false }
  }
}

export async function searchSchools(keyword) {
  if (!keyword?.trim() || !NEIS_KEY) return []
  const { rows } = await neisRequest('schoolInfo', { SCHUL_NM: keyword.trim() })

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
    const y = new Date().getFullYear()
    const { rows } = await neisRequest('classInfo', {
      ATPT_OFCDC_SC_CODE: school.eduCode,
      SD_SCHUL_CODE: school.id,
      AY: String(y),
      GRADE: String(grade),
    })
    if (rows.length) {
      const nums = rows.map((r) => parseInt(r.CLASS_NM, 10)).filter((n) => !Number.isNaN(n))
      if (nums.length) return Math.max(...nums)
    }
  }

  const name = school.name || ''
  if (name.includes('고등학교')) return 10
  if (name.includes('중학교')) return 8
  return 6
}

function parseMealRow(row) {
  const raw = row?.DDISH_NM || ''
  return raw
    .split(/<br\s*\/?>/i)
    .map((s) =>
      s
        .replace(/\([^)]*\)/g, '')
        .replace(/[0-9.·&]/g, '')
        .trim(),
    )
    .filter(Boolean)
}

/**
 * 해당 날짜의 급식 정보를 가져온다.
 * 반환:
 *   { menu: string[], ok: boolean, code: string }
 *     - menu: 메뉴 배열. 0건이면 빈 배열.
 *     - ok:   true  = 네트워크/API 정상 (단지 데이터가 없을 수도 있음)
 *             false = 호출 자체가 실패 (네트워크/HTTP/키 누락)
 *     - code: 'INFO-000' / 'INFO-200' / 'NO-KEY' / 'NETWORK-ERROR' / ...
 */
export async function fetchMealInfo(school, dateKey) {
  if (!school?.eduCode || !school?.id) {
    console.warn('[neis] fetchMealInfo: school.eduCode / school.id 가 비어 있어요. profile.school 등록이 필요해요.')
    return { menu: [], ok: false, code: 'NO-SCHOOL' }
  }

  const { rows, code, ok } = await neisRequest('mealServiceDietInfo', {
    ATPT_OFCDC_SC_CODE: school.eduCode,
    SD_SCHUL_CODE: school.id,
    MLSV_YMD: dateKey,
  })

  const lunch = rows.find((r) => r?.MMEAL_SC_NM === '중식') || rows[0]
  const menu = lunch ? parseMealRow(lunch) : []
  return { menu, ok, code }
}

/**
 * 해당 날짜의 시간표를 가져온다.
 * 반환:
 *   { rows: {period, subject}[], ok: boolean, code: string }
 */
export async function fetchTimetableInfo(school, grade, classNum, dateKey) {
  if (!school?.eduCode || !school?.id) {
    console.warn('[neis] fetchTimetableInfo: school.eduCode / school.id 가 비어 있어요.')
    return { rows: [], ok: false, code: 'NO-SCHOOL' }
  }

  const tableHub = school.name?.includes('초등학교')
    ? 'elsTimetable'
    : school.name?.includes('중학교')
      ? 'misTimetable'
      : 'hisTimetable'

  const { rows, code, ok } = await neisRequest(tableHub, {
    ATPT_OFCDC_SC_CODE: school.eduCode,
    SD_SCHUL_CODE: school.id,
    ALL_TI_YMD: dateKey,
    GRADE: String(grade),
    CLASS_NM: String(classNum),
  })

  const parsed = rows.map((row) => {
    const periodNumber = row.PERIO || row.PERIOD || row.PERIOD_NO || row.PERIOD_NM || ''
    const subject = row.ITRT_CNTNT || row.SBTR_DD_SC_NM || row.SUBJECT || '수업'
    return {
      period: periodNumber ? `${periodNumber}교시` : '',
      subject,
    }
  })

  return { rows: parsed, ok, code }
}
