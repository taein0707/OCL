import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon } from '../../components/icons/TabIcons.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppSettings } from '../../context/AppSettingsContext.jsx'
import ProfileAvatar from '../../components/ProfileAvatar.jsx'
import {
  BUTTON_COLOR_OPTIONS,
  TAB_DEFINITIONS,
  DEFAULT_APP_SETTINGS,
  ALL_TAB_IDS,
} from '../../constants/appSettings.js'
import { searchSchools, fetchMaxClassCount } from '../../services/neis.js'
import FieldError from '../../components/FieldError.jsx'

const activeClass = 'option-active border px-4 py-3 text-sm font-black transition'
const idleClass = 'option-idle border px-4 py-3 text-sm font-black transition'

function SettingsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const {
    profile,
    updateProfile,
    updateLoginId,
    changePasswordWithCurrent,
    authProviderType,
    canChangePassword,
    updateProfilePhoto,
    clearProfilePhoto,
  } = useAuth()
  const { patchSettings, resetLivePatch } = useAppSettings()
  const [appSettings, setAppSettings] = useState({
    ...DEFAULT_APP_SETTINGS,
    ...(profile?.appSettings || {}),
  })
  const [profileForm, setProfileForm] = useState({
    id: profile?.id || '',
    nickname: profile?.nickname || '',
    school: profile?.school || null,
    grade: profile?.grade || 1,
    classNum: profile?.classNum || 1,
  })
  const [credentials, setCredentials] = useState({
    currentPasswordForId: '',
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  })
  const [search, setSearch] = useState('')
  const [schoolResults, setSchoolResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [maxClass, setMaxClass] = useState(6)
  const [error, setError] = useState('')

  const accountDescription = useMemo(() => {
    if (authProviderType === 'google.com') return 'Google 계정으로 로그인 중'
    if (authProviderType === 'apple.com') return 'Apple 계정으로 로그인 중'
    return '아이디/비밀번호 계정'
  }, [authProviderType])

  useEffect(() => {
    if (!profile) return
    setAppSettings({
      ...DEFAULT_APP_SETTINGS,
      ...(profile.appSettings || {}),
    })
    setProfileForm({
      id: profile.id || '',
      nickname: profile.nickname || '',
      school: profile.school || null,
      grade: profile.grade || 1,
      classNum: profile.classNum || 1,
    })
  }, [profile])

  useEffect(() => () => resetLivePatch(), [resetLivePatch])

  useEffect(() => {
    if (!profileForm.school) return
    fetchMaxClassCount(profileForm.school, profileForm.grade).then(setMaxClass)
  }, [profileForm.school, profileForm.grade])

  const classNumbers = useMemo(
    () => Array.from({ length: maxClass }, (_, index) => index + 1),
    [maxClass],
  )

  const updateLocalSettings = (partial) => {
    setAppSettings((prev) => {
      const next = { ...prev, ...partial }
      patchSettings(partial)
      return next
    })
  }

  const updateProfileForm = (partial) => {
    setProfileForm((prev) => ({ ...prev, ...partial }))
  }

  const doSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    setError('')
    try {
      setSchoolResults(await searchSchools(search))
    } catch {
      setSchoolResults([])
      setError('학교 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSearching(false)
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPG, PNG, WEBP 이미지만 올릴 수 있어요.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('프로필 사진은 5MB 이하만 올릴 수 있어요.')
      event.target.value = ''
      return
    }

    try {
      setError('')
      await updateProfilePhoto(file)
    } catch (err) {
      setError(err.message || '프로필 사진을 올리지 못했습니다.')
    } finally {
      event.target.value = ''
    }
  }

  const save = async () => {
    setError('')

    if (profileForm.nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.')
      return
    }

    const nextProfileData = {
      nickname: profileForm.nickname.trim(),
      school: profileForm.school,
      grade: profileForm.grade,
      classNum: profileForm.classNum,
      appSettings,
    }

    try {
      const idChanged = profileForm.id.trim() !== (profile?.id || '')
      if (idChanged) {
        if (canChangePassword) {
          await updateLoginId(credentials.currentPasswordForId, profileForm.id.trim())
        } else {
          await updateProfile({ id: profileForm.id.trim() })
        }
      }

      if (canChangePassword && credentials.nextPassword) {
        if (credentials.nextPassword !== credentials.confirmPassword) {
          throw new Error('새 비밀번호 확인이 일치하지 않습니다.')
        }
        await changePasswordWithCurrent(credentials.currentPassword, credentials.nextPassword)
      }

      await updateProfile(nextProfileData)
      resetLivePatch()
      navigate(-1)
    } catch (err) {
      setError(err.message || '설정을 저장하지 못했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-24 animate-[slideUpFade_0.3s_ease-out]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            resetLivePatch()
            navigate(-1)
          }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mono-200 bg-white text-ink transition hover:bg-mono-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-mono-500">설정</p>
          <h1 className="sys-text text-2xl font-black text-ink">개인정보 · 화면 설정</h1>
        </div>
      </header>

      <FieldError message={error} />

      <section className="neo-card flex flex-col gap-5 p-5">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-mono-500">계정</p>
          <h2 className="mt-2 text-2xl font-black text-ink">개인정보 수정</h2>
          <p className="mt-2 text-sm font-semibold text-mono-500">{accountDescription}</p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-mono-200 bg-mono-50 px-4 py-5 text-center">
          <ProfileAvatar
            profile={profile}
            size="lg"
            editable
            onEdit={() => fileInputRef.current?.click()}
            onRemove={async () => {
              await clearProfilePhoto()
            }}
          />
          <p className="max-w-sm text-sm font-semibold leading-6 text-mono-500">
            사진은 바로 바꿀 수 있고, 없으면 기본 사람 아바타가 보여요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-black text-ink">
            아이디
            <input
              className="neo-input"
              value={profileForm.id}
              onChange={(e) => updateProfileForm({ id: e.target.value })}
              placeholder="아이디"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-black text-ink">
            닉네임
            <input
              className="neo-input"
              value={profileForm.nickname}
              onChange={(e) => updateProfileForm({ nickname: e.target.value })}
              placeholder="닉네임"
            />
          </label>
        </div>

        {canChangePassword && profileForm.id.trim() !== (profile?.id || '') && (
          <label className="flex flex-col gap-2 text-sm font-black text-ink">
            아이디 변경 비밀번호
            <input
              type="password"
              className="neo-input"
              value={credentials.currentPasswordForId}
              onChange={(e) => setCredentials((prev) => ({ ...prev, currentPasswordForId: e.target.value }))}
              placeholder="현재 비밀번호"
            />
          </label>
        )}

        <div className="flex flex-col gap-3">
          <span className="text-xs font-black tracking-[0.18em] text-mono-500">학교</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="neo-input flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="학교명"
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
            <button type="button" className="neo-btn sm:min-w-[120px]" onClick={doSearch} disabled={searching}>
              {searching ? '검색 중...' : '검색'}
            </button>
          </div>

          {profileForm.school && (
            <div className="rounded-[22px] border border-mono-200 bg-mono-50 px-4 py-3 text-sm font-semibold text-ink">
              <p className="text-xs font-black text-mono-500">선택한 학교</p>
              <p className="mt-1 truncate">{profileForm.school.name}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 md:max-h-72 md:overflow-y-auto hide-scrollbar">
            {schoolResults.map((school) => (
              <button
                key={school.id}
                type="button"
                className="rounded-[22px] border border-mono-200 bg-white px-4 py-4 text-left transition hover:bg-mono-100"
                onClick={() => updateProfileForm({ school })}
              >
                <span className="block font-black text-ink">{school.name}</span>
                <span className="mt-1 block text-xs font-semibold text-mono-500 line-clamp-2">{school.address}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black tracking-[0.18em] text-mono-500">학년</span>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={profileForm.grade === grade ? activeClass : idleClass}
                  onClick={() => updateProfileForm({ grade })}
                >
                  {grade}학년
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-black tracking-[0.18em] text-mono-500">반</span>
            <div className="grid grid-cols-4 gap-3">
              {classNumbers.map((classNum) => (
                <button
                  key={classNum}
                  type="button"
                  className={profileForm.classNum === classNum ? activeClass : idleClass}
                  onClick={() => updateProfileForm({ classNum })}
                >
                  {classNum}반
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-mono-200 bg-mono-50 px-4 py-4">
          <p className="text-[11px] font-black tracking-[0.16em] text-mono-500">비밀번호</p>
          {canChangePassword ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <input
                type="password"
                className="neo-input"
                value={credentials.currentPassword}
                onChange={(e) => setCredentials((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="현재 비밀번호"
              />
              <input
                type="password"
                className="neo-input"
                value={credentials.nextPassword}
                onChange={(e) => setCredentials((prev) => ({ ...prev, nextPassword: e.target.value }))}
                placeholder="새 비밀번호"
              />
              <input
                type="password"
                className="neo-input"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="새 비밀번호 확인"
              />
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-mono-500">비밀번호는 Google/Apple 계정에서 관리돼요.</p>
          )}
        </div>
      </section>

      <section className="neo-card flex flex-col gap-4 p-5">
        <span className="text-xs font-black tracking-[0.18em] text-mono-500">포인트 컬러</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {BUTTON_COLOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`theme-swatch ${appSettings.buttonColor === option.id ? 'theme-swatch-active' : ''}`}
              onClick={() => updateLocalSettings({ buttonColor: option.id })}
            >
              <span className="theme-swatch-chip" style={{ backgroundColor: option.hex }} />
              <span className="text-left text-xs font-black text-ink">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="neo-card flex flex-col gap-4 p-5">
        <span className="text-xs font-black tracking-[0.18em] text-mono-500">글씨 크기</span>
        <div className="grid grid-cols-3 gap-3">
          {['small', 'medium', 'large'].map((f) => (
            <button
              key={f}
              type="button"
              className={appSettings.fontSize === f ? activeClass : idleClass}
              onClick={() => updateLocalSettings({ fontSize: f })}
            >
              {f === 'small' ? '작게' : f === 'medium' ? '보통' : '크게'}
            </button>
          ))}
        </div>
      </section>

      <section className="neo-card flex flex-col gap-3 p-5">
        <span className="text-xs font-black tracking-[0.18em] text-mono-500">탭 순서 · 표시</span>
        {ALL_TAB_IDS.map((tabId) => {
          const tab = TAB_DEFINITIONS[tabId]
          if (!tab) return null
          const isRequired = tab.required || tabId === 'create'
          const enabled = appSettings.enabledTabs.includes(tabId)
          const idx = appSettings.tabOrder.indexOf(tabId)
          const isFixed = tab.fixedIndex !== undefined
          return (
            <div key={tabId} className="flex flex-wrap items-center gap-2 rounded-[22px] border border-mono-200 bg-mono-50 px-3 py-3 text-sm font-bold text-ink">
              <button
                type="button"
                className={`min-w-[56px] rounded-full border px-3 py-1 text-xs font-black transition ${
                  enabled ? 'chip-active' : 'chip-idle'
                }`}
                onClick={() => {
                  if (isRequired || isFixed) return
                  const nextEnabled = enabled
                    ? appSettings.enabledTabs.filter((id) => id !== tabId)
                    : [...appSettings.enabledTabs, tabId]
                  updateLocalSettings({ enabledTabs: nextEnabled })
                }}
                disabled={isRequired || isFixed}
              >
                {enabled ? 'ON' : 'OFF'}
              </button>
              <span className="flex-1 font-black">{tab.label}</span>
              {isFixed && (
                <span className="rounded-full border border-mono-200 bg-white px-2 py-1 text-[10px] font-black text-mono-500">
                  위치 고정
                </span>
              )}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                onClick={() => {
                  if (isFixed) return
                  const order = [...appSettings.tabOrder]
                  if (idx > 0 && !TAB_DEFINITIONS[order[idx - 1]]?.fixedIndex) {
                    ;[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
                  }
                  updateLocalSettings({ tabOrder: order })
                }}
                disabled={idx <= 0 || isFixed || TAB_DEFINITIONS[appSettings.tabOrder[idx - 1]]?.fixedIndex}
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-mono-200 bg-white text-ink transition hover:bg-mono-100 disabled:opacity-40"
                onClick={() => {
                  if (isFixed) return
                  const order = [...appSettings.tabOrder]
                  if (idx >= 0 && idx < order.length - 1 && !TAB_DEFINITIONS[order[idx + 1]]?.fixedIndex) {
                    ;[order[idx + 1], order[idx]] = [order[idx], order[idx + 1]]
                  }
                  updateLocalSettings({ tabOrder: order })
                }}
                disabled={
                  idx < 0 ||
                  idx === appSettings.tabOrder.length - 1 ||
                  isFixed ||
                  TAB_DEFINITIONS[appSettings.tabOrder[idx + 1]]?.fixedIndex
                }
              >
                <ArrowDownIcon className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </section>

      <button type="button" className="neo-btn self-end" onClick={save}>
        저장
      </button>
    </div>
  )
}

export default SettingsPage
