import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppSettings } from '../../context/AppSettingsContext.jsx'
import { fetchMaxClassCount } from '../../services/neis.js'
import { ArrowUpIcon, ArrowDownIcon } from '../../components/icons/TabIcons.jsx'
import {
  BUTTON_COLOR_OPTIONS,
  TAB_DEFINITIONS,
  DEFAULT_APP_SETTINGS,
  ALL_TAB_IDS,
} from '../../constants/appSettings.js'
import FieldError from '../../components/FieldError.jsx'

const STEPS = ['nickname', 'grade', 'class', 'settings', 'boards']
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
  const [step, setStep] = useState('nickname')
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
      await completeOnboarding({
        nickname: form.nickname,
        school: form.school,
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
    const tab = TAB_DEFINITIONS[tabId]
    if (tab?.fixedIndex !== undefined) return

    setAppSettings((s) => {
      const order = [...s.tabOrder]
      const idx = order.indexOf(tabId)
      if (idx < 0) return s
      const swap = idx + dir
      if (swap < 0 || swap >= order.length) return s
      if (TAB_DEFINITIONS[order[swap]]?.fixedIndex !== undefined) return s
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
                <button type="button" className="neo-btn w-full sm:w-auto sm:self-end" onClick={next}>
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
                  <span className="text-xs font-black tracking-[0.18em] text-mono-500">글씨 두께</span>
                  <div className="grid grid-cols-3 gap-3">
                    {['normal', 'bold', 'black'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={`${stepButtonClass} ${appSettings.fontWeight === w ? selectActive : selectIdle}`}
                        onClick={() => applySettings({ fontWeight: w })}
                      >
                        {w}
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
                      const isFixed = tab.fixedIndex !== undefined
                      return (
                        <div key={tabId} className="flex flex-wrap items-center gap-2 rounded-[24px] border border-mono-200 bg-mono-50 px-3 py-3">
                          <button
                            type="button"
                            className={`min-w-[56px] rounded-full border px-3 py-1 text-xs font-black transition ${
                              on ? 'chip-active' : 'chip-idle'
                            }`}
                            onClick={() => !tab.required && !isFixed && toggleTab(tabId)}
                            disabled={tab.required || isFixed}
                          >
                            {on ? 'ON' : 'OFF'}
                          </button>
                          <span className="flex-1 text-sm font-black text-ink">{tab.label}</span>
                          {isFixed && (
                            <span className="rounded-full border border-mono-200 bg-white px-2 py-1 text-[10px] font-black text-mono-500">
                              위치 고정
                            </span>
                          )}
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                            onClick={() => moveTab(tabId, -1)}
                            disabled={idx <= 0 || isFixed}
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                            onClick={() => moveTab(tabId, 1)}
                            disabled={idx < 0 || idx === appSettings.tabOrder.length - 1 || isFixed}
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
