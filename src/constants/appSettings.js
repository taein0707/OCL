export const BUTTON_COLOR_OPTIONS = [
  { id: 'signature-blue', label: '시그니처 블루', hex: '#2563eb' },
  { id: 'cyber-neon-blue', label: '사이버 네온 블루', hex: '#06b6d4' },
  { id: 'deep-violet', label: '딥 바이올렛', hex: '#7c3aed' },
  { id: 'midnight-indigo', label: '미드나잇 인디고', hex: '#4f46e5' },
  { id: 'neon-lime-green', label: '네온 라임 그린', hex: '#a3e635' },
  { id: 'minimal-emerald', label: '미니멀 에메랄드', hex: '#10b981' },
  { id: 'bold-red', label: '볼드 레드', hex: '#ef4444' },
  { id: 'peach-coral', label: '피치 코랄', hex: '#fb923c' },
  { id: 'vivid-pink', label: '비비드 핑크', hex: '#ec4899' },
  { id: 'black-base', label: '기본 블랙', hex: '#000000' },
]

export const LEGACY_BUTTON_COLOR_MAP = {
  black: 'black-base',
  'gray-900': 'black-base',
  'gray-700': 'midnight-indigo',
  'gray-500': 'signature-blue',
  'gray-300': 'peach-coral',
  white: 'black-base',
  'gray-100': 'cyber-neon-blue',
  'gray-200': 'minimal-emerald',
  charcoal: 'deep-violet',
  silver: 'vivid-pink',
}

export const TAB_DEFINITIONS = {
  home: { path: '/home', label: '홈', Icon: 'HomeIcon' },
  class: { path: '/class', label: '우리 반', Icon: 'ClassIcon' },
  create: { path: '/create', label: '작성', Icon: 'CreateIcon', center: true, required: true, fixedIndex: 2 },
  search: { path: '/search', label: '검색', Icon: 'SearchIcon' },
  my: { path: '/my', label: '프로필', Icon: 'MyIcon', required: true, fixedIndex: 4 },
}

export const ALL_TAB_IDS = ['home', 'class', 'create', 'search', 'my']
export const REQUIRED_TAB_IDS = ['create', 'my']

export const DEFAULT_APP_SETTINGS = {
  theme: 'light',
  buttonColor: 'black-base',
  fontSize: 'small',
  fontWeight: 'bold',
  tabOrder: ['home', 'class', 'create', 'search', 'my'],
  enabledTabs: ['home', 'class', 'create', 'search', 'my'],
  postStyle: 'card',
  animationLevel: 'default',
}

export const FONT_SIZE_CLASS = {
  small: 'font-size-small',
  medium: 'font-size-medium',
  large: 'font-size-large',
}

export const ANIMATION_CLASS = {
  none: 'motion-reduce',
  default: '',
  strong: 'motion-strong',
}

export const POPULAR_SEARCH_TERMS = [
  '급식',
  '시간표',
  '자유게시판',
  '중간고사',
  '동아리',
  '우리학교',
]

export function ensureRequiredTabs(settings) {
  const enabledTabs = Array.from(
    new Set([...(settings.enabledTabs || DEFAULT_APP_SETTINGS.enabledTabs), ...REQUIRED_TAB_IDS]),
  ).filter((tabId) => TAB_DEFINITIONS[tabId])

  let tabOrder = Array.from(new Set([...(settings.tabOrder || DEFAULT_APP_SETTINGS.tabOrder)]))
    .filter((tabId) => TAB_DEFINITIONS[tabId])

  ALL_TAB_IDS.forEach((tabId) => {
    if (enabledTabs.includes(tabId) && !tabOrder.includes(tabId)) tabOrder.push(tabId)
  })

  REQUIRED_TAB_IDS.forEach((requiredId) => {
    if (!tabOrder.includes(requiredId)) tabOrder.push(requiredId)
  })

  Object.entries(TAB_DEFINITIONS).forEach(([tabId, tab]) => {
    if (typeof tab.fixedIndex !== 'number') return
    tabOrder = tabOrder.filter((id) => id !== tabId)
    tabOrder.splice(Math.min(tab.fixedIndex, tabOrder.length), 0, tabId)
  })

  return {
    ...settings,
    enabledTabs,
    tabOrder,
  }
}
