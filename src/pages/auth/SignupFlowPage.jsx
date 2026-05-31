import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppSettings } from '../../context/AppSettingsContext.jsx'
import { fetchMaxClassCount, searchSchools } from '../../services/neis.js'
import { ArrowUpIcon, ArrowDownIcon } from '../../components/icons/TabIcons.jsx'
import {
  BUTTON_COLOR_OPTIONS,
  TAB_DEFINITIONS,
  DEFAULT_APP_SETTINGS,
  ALL_TAB_IDS,
} from '../../constants/appSettings.js'
import FieldError from '../../components/FieldError.jsx'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/index.js'

const STEPS = ['terms', 'nickname', 'school', 'grade', 'class', 'settings', 'boards']
const ALL_BOARDS = ['자유', '질문', '공부', '급식', '고민상담', '동아리', '취미', '일상', '유머', '정보']
const DEFAULT_BOARDS = ['자유', '질문', '공부', '급식']
const RELOAD_GUARD_KEY = 'ocl:onboarding-reload-time-origin'

const selectActive = 'option-active text-center'
const selectIdle = 'option-idle text-center'
const stepButtonClass = 'rounded-[22px] border px-4 py-3 text-left font-black transition'

function SignupFlowPage() {
  const navigate = useNavigate()
  const {
    profile,
    firebaseUser,
    loading,
    profileStatus,
    updateProfile,
    completeOnboarding,
  } = useAuth()
  const { patchSettings } = useAppSettings()
  const [step, setStep] = useState('terms')
  const [form, setForm] = useState({
    nickname: profile?.nickname || '',
    school: profile?.school || null,
    grade: profile?.grade || 1,
    classNum: profile?.classNum || 1,
  })
  const [maxClass, setMaxClass] = useState(6)
  const [tempBoards, setTempBoards] = useState(profile?.selectedBoards || [])
  const [appSettings, setAppSettings] = useState({
    ...DEFAULT_APP_SETTINGS,
    ...(profile?.appSettings || {}),
  })
  const [error, setError] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')
  const [schoolResults, setSchoolResults] = useState([])
  const [schoolSearching, setSchoolSearching] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [tosExpanded, setTosExpanded] = useState(false)
  const [ppExpanded, setPpExpanded] = useState(false)
  const [termsOfService, setTermsOfService] = useState('')
  const [privacyPolicy, setPrivacyPolicy] = useState('')
  const [termsLoading, setTermsLoading] = useState(false)

  const allTermsAgreed = termsAgreed && privacyAgreed && ageConfirmed
  const handleAllAgree = (checked) => {
    setTermsAgreed(checked)
    setPrivacyAgreed(checked)
    setAgeConfirmed(checked)
  }

  useEffect(() => {
    if (!db) return
    setTermsLoading(true)
    getDoc(doc(db, 'terms', 'lHWvJI0tZ41E514X7NKf'))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const clean = (v) => (typeof v === 'string' ? v : '').replace(/\\n/g, '\n')
          setTermsOfService(clean(data.termsOfService || data.content || data.text))
          setPrivacyPolicy(clean(data.privacyPolicy || ''))
        }
      })
      .catch(() => {})
      .finally(() => setTermsLoading(false))
  }, [])

  const stepIndex = STEPS.indexOf(step)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0]
    const navigationType = navigationEntry?.type
    const timeOrigin = String(window.performance?.timeOrigin || Date.now())
    const storedTimeOrigin = window.sessionStorage.getItem(RELOAD_GUARD_KEY)

    if (navigationType === 'reload' && storedTimeOrigin !== timeOrigin) {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, timeOrigin)
      navigate('/loading', {
        replace: true,
        state: { notice: '화면을 새로 고쳐서 다시 안전하게 연결하고 있어요.' },
      })
    }
  }, [navigate])

  useEffect(() => {
    if (!loading && (!firebaseUser || profileStatus === 'recovery' || profileStatus === 'guest')) {
      navigate('/loading', { replace: true })
    }
  }, [firebaseUser, loading, navigate, profileStatus])

  useEffect(() => {
    if (!profile) return
    setForm({
      nickname: profile.nickname || '',
      school: profile.school || null,
      grade: profile.grade || 1,
      classNum: profile.classNum || 1,
    })
    setTempBoards(profile.selectedBoards || [])
    setAppSettings({
      ...DEFAULT_APP_SETTINGS,
      ...(profile.appSettings || {}),
    })
  }, [profile])

  const applySettings = useCallback(
    (partial) => {
      setAppSettings((s) => {
        const next = { ...s, ...partial }
        patchSettings(partial)
        return next
      })
    },
    [patchSettings],
  )

  useEffect(() => {
    if (!form.school) return
    fetchMaxClassCount(form.school, form.grade).then(setMaxClass)
  }, [form.school, form.grade])

  const classNumbers = useMemo(
    () => Array.from({ length: maxClass }, (_, i) => i + 1),
    [maxClass],
  )

  const doSchoolSearch = async () => {
    if (!schoolSearch.trim()) return
    setSchoolSearching(true)
    setError('')
    try {
      setSchoolResults(await searchSchools(schoolSearch))
    } catch {
      setSchoolResults([])
      setError('학교 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSchoolSearching(false)
    }
  }

  const next = () => {
    const i = STEPS.indexOf(step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1])
  }

  const goSafeEntry = (message) => {
    navigate('/loading', {
      replace: true,
      state: message ? { notice: message } : undefined,
    })
  }

  const runWithRecovery = async (work) => {
    try {
      await work()
    } catch (err) {
      const message = err.message || '세션을 다시 확인한 뒤 이어서 진행해 주세요.'
      setError(message)
      goSafeEntry(message)
    }
  }

  const saveSettingsAndNext = async () => {
    await runWithRecovery(async () => {
      await updateProfile({ appSettings })
      patchSettings(appSettings)
      next()
    })
  }

  const finish = async () => {
    const boards = Array.from(new Set(tempBoards))
    await runWithRecovery(async () => {
      const s = form.school
      const cleanSchool = s ? { id: String(s.id || ''), name: String(s.name || ''), address: String(s.address || ''), type: String(s.type || ''), eduCode: String(s.eduCode || '') } : null
      await completeOnboarding({
        nickname: form.nickname,
        school: cleanSchool,
        grade: form.grade,
        classNum: form.classNum,
        selectedBoards: boards.length ? boards : DEFAULT_BOARDS,
        appSettings,
        schoolSkipped: !form.school,
      })
      navigate('/loading', { replace: true })
    })
  }

  const toggleTab = (tabId) => {
    setAppSettings((s) => {
      const isOn = s.enabledTabs.includes(tabId)
      const nextEnabled = isOn
        ? s.enabledTabs.filter((t) => t !== tabId)
        : [...s.enabledTabs, tabId]
      if (nextEnabled.length < 2) return s
      const next = { ...s, enabledTabs: nextEnabled }
      patchSettings(next)
      return next
    })
  }

  const moveTab = (tabId, dir) => {
    setAppSettings((s) => {
      const order = [...s.tabOrder]
      const idx = order.indexOf(tabId)
      if (idx < 0) return s
      const swap = idx + dir
      if (swap < 0 || swap >= order.length) return s
      ;[order[idx], order[swap]] = [order[swap], order[idx]]
      const next = { ...s, tabOrder: order }
      patchSettings({ tabOrder: order })
      return next
    })
  }

  return (
    <div className="auth-panel-shell">
      <div className="neo-card flex w-full max-w-2xl flex-col bg-white/[0.94] backdrop-blur animate-[slideUpFade_0.3s_ease-out]">
        <div className="border-b border-mono-200 bg-mono-50/[0.9] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-mono-500">처음 설정</p>
              <h1 className="sys-text mt-2 text-2xl font-black text-ink">내 공간을 맞춰볼게요</h1>
            </div>
            <div className="rounded-full border border-mono-200 bg-white px-3 py-1 text-sm font-semibold text-mono-500">
              {stepIndex + 1} / {STEPS.length}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-mono-200">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-5 py-6 sm:px-6 sm:py-7">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
            <FieldError message={error} />

            {step === 'terms' && (
              <>
                <div className="flex flex-col gap-1.5 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">약관 동의</span>
                  <h2 className="sys-text text-3xl font-black text-ink">서비스 이용에 동의해 주세요</h2>
                </div>

                {termsLoading ? (
                  <p className="text-sm font-semibold text-mono-500">약관을 불러오는 중입니다…</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* 모두 동의 */}
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/5 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allTermsAgreed}
                        onChange={(e) => handleAllAgree(e.target.checked)}
                        className="h-5 w-5 shrink-0 rounded accent-[var(--accent)]"
                      />
                      <span className="text-sm font-black text-ink">아래 약관에 모두 동의합니다</span>
                    </label>

                    <div className="h-px bg-mono-200" />

                    {/* 이용약관 */}
                    <div className="rounded-2xl border border-mono-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <label className="flex flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={termsAgreed}
                            onChange={(e) => setTermsAgreed(e.target.checked)}
                            className="h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                          />
                          <span className="text-sm font-semibold text-ink">이용약관 동의 <span className="text-mono-400 font-medium">(필수)</span></span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setTosExpanded((v) => !v)}
                          className="shrink-0 text-[11px] font-black text-mono-400 hover:text-ink transition"
                        >
                          {tosExpanded ? '접기' : '전문 보기'}
                        </button>
                      </div>
                      {tosExpanded && (
                        <div className="max-h-48 overflow-y-auto border-t border-mono-200 bg-mono-50/60 px-4 py-3">
                          {termsOfService ? (
                            <pre className="whitespace-pre-wrap text-[11px] font-medium leading-[1.7] text-mono-600">{termsOfService}</pre>
                          ) : (
                            <p className="text-[12px] text-mono-400">약관을 불러오지 못했습니다.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 개인정보 처리방침 */}
                    <div className="rounded-2xl border border-mono-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <label className="flex flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={privacyAgreed}
                            onChange={(e) => setPrivacyAgreed(e.target.checked)}
                            className="h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                          />
                          <span className="text-sm font-semibold text-ink">개인정보 처리방침 동의 <span className="text-mono-400 font-medium">(필수)</span></span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setPpExpanded((v) => !v)}
                          className="shrink-0 text-[11px] font-black text-mono-400 hover:text-ink transition"
                        >
                          {ppExpanded ? '접기' : '전문 보기'}
                        </button>
                      </div>
                      {ppExpanded && (
                        <div className="max-h-48 overflow-y-auto border-t border-mono-200 bg-mono-50/60 px-4 py-3">
                          {privacyPolicy ? (
                            <pre className="whitespace-pre-wrap text-[11px] font-medium leading-[1.7] text-mono-600">{privacyPolicy}</pre>
                          ) : (
                            <p className="text-[12px] text-mono-400">약관을 불러오지 못했습니다.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 만 14세 이상 */}
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-mono-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                      />
                      <span className="text-sm font-semibold text-ink">만 14세 이상이거나 보호자의 동의를 받았습니다.</span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  className="neo-btn w-full sm:w-auto sm:self-end"
                  disabled={!allTermsAgreed}
                  onClick={next}
                >
                  동의하고 시작하기
                </button>
              </>
            )}

            {step === 'nickname' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">프로필</span>
                  <h2 className="sys-text text-3xl font-black text-ink">이름을 정해요</h2>
                  <p className="text-sm font-semibold text-mono-500">커뮤니티에서 먼저 보이는 이름이에요.</p>
                </div>
                <input
                  className="neo-input"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="2~8자"
                />
                <button
                  type="button"
                  className="neo-btn w-full sm:w-auto sm:self-end"
                  disabled={form.nickname.length < 2}
                  onClick={() => runWithRecovery(async () => {
                    await updateProfile({ nickname: form.nickname })
                    next()
                  })}
                >
                  다음
                </button>
              </>
            )}

            {step === 'school' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">학교</span>
                  <h2 className="sys-text text-3xl font-black text-ink">학교를 찾아요</h2>
                  <p className="text-sm font-semibold text-mono-500">학교 이름으로 검색하면 돼요.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="neo-input flex-1"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    placeholder="학교명"
                    onKeyDown={(e) => e.key === 'Enter' && doSchoolSearch()}
                  />
                  <button
                    type="button"
                    className="neo-btn sm:min-w-[100px]"
                    onClick={doSchoolSearch}
                    disabled={schoolSearching}
                  >
                    {schoolSearching ? '검색 중...' : '검색'}
                  </button>
                </div>
                {form.school && (
                  <div className="rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-semibold text-ink">
                    <p className="text-xs font-black text-mono-500">선택한 학교</p>
                    <p className="mt-1 truncate">{form.school.name}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto hide-scrollbar">
                  {schoolResults.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      className="rounded-[22px] border border-mono-200 bg-white px-4 py-4 text-left transition hover:bg-mono-100"
                      onClick={() => setForm((f) => ({ ...f, school }))}
                    >
                      <span className="block font-black text-ink">{school.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-mono-500 line-clamp-2">{school.address}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="neo-btn w-full sm:w-auto sm:self-end"
                    disabled={!form.school}
                    onClick={() => runWithRecovery(async () => {
                      const s = form.school
                      const cleanSchool = { id: String(s.id || ''), name: String(s.name || ''), address: String(s.address || ''), type: String(s.type || ''), eduCode: String(s.eduCode || '') }
                      await updateProfile({ school: cleanSchool })
                      next()
                    })}
                  >
                    다음
                  </button>
                </div>
              </>
            )}

            {step === 'grade' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">학년</span>
                  <h2 className="sys-text text-3xl font-black text-ink">학년을 골라 주세요</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`${stepButtonClass} ${form.grade === g ? selectActive : selectIdle}`}
                      onClick={() => setForm({ ...form, grade: g })}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
                <button type="button" className="neo-btn w-full sm:w-auto sm:self-end" onClick={() => setStep('class')}>
                  다음
                </button>
              </>
            )}

            {step === 'class' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">반</span>
                  <h2 className="sys-text text-3xl font-black text-ink">반을 골라 주세요</h2>
                  <p className="text-sm font-semibold text-mono-500">
                    <span className="block">최대 {maxClass}반</span>
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:max-h-56 md:overflow-y-auto hide-scrollbar">
                  {classNumbers.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${stepButtonClass} ${form.classNum === c ? selectActive : selectIdle}`}
                      onClick={() => setForm({ ...form, classNum: c })}
                    >
                      {c}반
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="neo-btn w-full sm:w-auto sm:self-end"
                  onClick={() => runWithRecovery(async () => {
                    await updateProfile({ grade: form.grade, classNum: form.classNum })
                    next()
                  })}
                >
                  다음
                </button>
              </>
            )}

            {step === 'settings' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">앱 취향</span>
                  <h2 className="sys-text text-3xl font-black text-ink">포인트 색을 골라요</h2>
                  <p className="text-sm font-semibold text-mono-500">고르면 버튼과 탭에 바로 반영돼요.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">포인트 컬러</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {BUTTON_COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`theme-swatch ${appSettings.buttonColor === option.id ? 'theme-swatch-active' : ''}`}
                        onClick={() => applySettings({ buttonColor: option.id })}
                      >
                        <span className="theme-swatch-chip" style={{ backgroundColor: option.hex }} />
                        <span className="text-left text-xs font-black text-ink">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">글씨 크기</span>
                  <div className="grid grid-cols-3 gap-3">
                    {['small', 'medium', 'large'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`${stepButtonClass} ${appSettings.fontSize === f ? selectActive : selectIdle}`}
                        onClick={() => applySettings({ fontSize: f })}
                      >
                        {f === 'small' ? '작게' : f === 'medium' ? '보통' : '크게'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">탭 순서 · 표시</span>
                  <div className="flex flex-col gap-2">
                    {ALL_TAB_IDS.map((tabId) => {
                      const tab = TAB_DEFINITIONS[tabId]
                      if (!tab) return null
                      const on = appSettings.enabledTabs.includes(tabId)
                      const idx = appSettings.tabOrder.indexOf(tabId)
                      const isRequired = tab.required
                      return (
                        <div key={tabId} className="flex flex-wrap items-center gap-2 rounded-[24px] border border-mono-200 bg-mono-50 px-3 py-3">
                          <button
                            type="button"
                            className={`min-w-[56px] rounded-full border px-3 py-1 text-xs font-black transition ${
                              on ? 'chip-active' : 'chip-idle'
                            }`}
                            onClick={() => !isRequired && toggleTab(tabId)}
                            disabled={isRequired}
                          >
                            {on ? 'ON' : 'OFF'}
                          </button>
                          <span className="flex-1 text-sm font-black text-ink">{tab.label}</span>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                            onClick={() => moveTab(tabId, -1)}
                            disabled={idx <= 0}
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                            onClick={() => moveTab(tabId, 1)}
                            disabled={idx < 0 || idx === appSettings.tabOrder.length - 1}
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">게시물 스타일</span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: 'card', label: '카드형' },
                      { id: 'mini', label: '미니 리스트' },
                      { id: 'thumb', label: '큰 썸네일' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`${stepButtonClass} ${appSettings.postStyle === o.id ? selectActive : selectIdle}`}
                        onClick={() => applySettings({ postStyle: o.id })}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">애니메이션</span>
                  <div className="grid grid-cols-3 gap-3">
                    {['none', 'default', 'strong'].map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`${stepButtonClass} ${appSettings.animationLevel === a ? selectActive : selectIdle}`}
                        onClick={() => applySettings({ animationLevel: a })}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" className="neo-btn w-full sm:w-auto sm:self-end" onClick={saveSettingsAndNext}>
                  다음
                </button>
              </>
            )}

            {step === 'boards' && (
              <>
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-[11px] font-black tracking-[0.18em] text-mono-500">게시판 선택</span>
                  <h2 className="sys-text text-3xl font-black text-ink">보고 싶은 주제를 골라요</h2>
                  <p className="text-sm font-semibold text-mono-500">관심 있는 주제부터 스냅에 담아드릴게요.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_BOARDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                        tempBoards.includes(b) ? 'chip-active' : 'chip-idle'
                      }`}
                      onClick={() =>
                        setTempBoards((prev) =>
                          prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
                        )
                      }
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <button type="button" className="neo-btn w-full sm:w-auto sm:self-end" disabled={tempBoards.length === 0} onClick={finish}>
                  시작하기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupFlowPage
