// 앱 공통 선 아이콘 정의(24px 격자, 선 굵기 1.75, 둥근 끝). DESIGN.md 7장 Iconography: 한 아이콘 패밀리, 채움·선 혼용 금지.
// 각 아이콘은 SVG 도형 목록이다. 'M…'은 path, 'c:cx,cy,r'는 circle, 'r:x,y,w,h,rx'는 rect, 'e:cx,cy,rx,ry'는 ellipse다.
// 브랜드 심볼(components/brand/BrandMark.vue)과 따로 둔다. 로고를 일반 아이콘으로 쓰지 않는다.
export const ICONS = {
  home: ['M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z'],
  bell: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
  calendar: ['r:3.5,5,17,15.5,2', 'M3.5 9.5h17', 'M8 3v4', 'M16 3v4'],
  flag: ['M5.5 21V4', 'M5.5 4.5h11.5l-2.2 4 2.2 4H5.5'],
  at: ['c:12,12,3.5', 'M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8'],
  timeline: ['M5 4v16', 'M9 8h10', 'M9 16h6.5', 'c:18.5,16,1.6'],
  layers: ['M12 4 3.5 8.5 12 13l8.5-4.5z', 'M3.5 13 12 17.5l8.5-4.5'],
  board: ['r:3.5,4.5,17,15,2', 'M9.2 4.5v15', 'M14.8 4.5v9'],
  target: ['c:12,12,8.5', 'c:12,12,4.5', 'c:12,12,1'],
  users: ['c:9,8.5,3', 'M3.5 19.5a5.5 5.5 0 0 1 11 0', 'c:17,9.5,2.5', 'M15.8 14.3a4.5 4.5 0 0 1 4.7 5.2'],
  clock: ['c:12,12,8.5', 'M12 7.5V12l3 2'],
  check: ['r:4,4,16,16,3', 'M8.5 12.2l2.5 2.5 4.5-5'],
  repeat: ['M17 3.5 20 6.5l-3 3', 'M20 6.5H9a5 5 0 0 0-5 5', 'M7 20.5l-3-3 3-3', 'M4 17.5h11a5 5 0 0 0 5-5'],
  history: ['M3.5 12a8.5 8.5 0 1 0 2.5-6', 'M3.5 4.5V9H8', 'M12 8v4.5l3 1.5'],
  book: ['M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z', 'M5 20a1 1 0 0 0 1 1h13', 'M9 7.5h6'],
  doc: ['M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  note: ['M5 4h14v10.5L14.5 19H5z', 'M14.5 19v-4.5H19'],
  hash: ['M9.5 4 8 20', 'M16 4l-1.5 16', 'M4.5 9h15.5', 'M4 15h15.5'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  wallet: ['r:3.5,6,17,13,2', 'M3.5 10h17', 'M15.5 14.5h2'],
  bars: ['M4 20h16', 'M7.5 16.5v-5', 'M12 16.5v-10', 'M16.5 16.5v-7'],
  pie: ['M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z', 'M15 3.9A8.5 8.5 0 0 1 20.1 9H15z'],
  pulse: ['M3 12h4l2.5-6 5 12 2.5-6h4'],
  compare: ['M7 4 3.5 7.5 7 11', 'M3.5 7.5H17', 'M17 13l3.5 3.5L17 20', 'M20.5 16.5H7'],
  star: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'],
  sparkle: ['M12 3.5v4', 'M12 16.5v4', 'M3.5 12h4', 'M16.5 12h4', 'M6.3 6.3l2.4 2.4', 'M15.3 15.3l2.4 2.4', 'M6.3 17.7l2.4-2.4', 'M15.3 8.7l2.4-2.4'],
  briefcase: ['r:3.5,7,17,12.5,2', 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7', 'M3.5 12.5h17'],
  archive: ['r:3.5,4,17,4.5,1', 'M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5', 'M10 12.5h4'],
  calculator: ['r:5,3,14,18,2', 'M8.5 7h7', 'M8.5 11.5h.01', 'M12 11.5h.01', 'M15.5 11.5h.01', 'M8.5 15.5h.01', 'M12 15.5h.01', 'M15.5 15.5h.01'],
  tree: ['r:9,3,6,4.5,1', 'r:3.5,16.5,6,4.5,1', 'r:14.5,16.5,6,4.5,1', 'M12 7.5v4.5', 'M6.5 16.5V12h11v4.5'],
  bookOpen: ['M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z', 'M12 6.5V20'],
  lock: ['r:5,10.5,14,10,2', 'M8 10.5v-3a4 4 0 0 1 8 0v3'],
  share: ['c:6,12,2.5', 'c:18,6,2.5', 'c:18,18,2.5', 'M8.2 10.8l7.6-3.6', 'M8.2 13.2l7.6 3.6'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'c:12,12,3'],
  clip: ['M20 11.5l-7.8 7.8a5 5 0 0 1-7-7l8.3-8.3a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6'],
  image: ['r:3.5,4.5,17,15,2', 'c:9,10,1.5', 'M20.5 16 15.5 11 7 19.5'],
  ban: ['c:12,12,8.5', 'M6 6l12 12'],
  contacts: ['r:4.5,3.5,15,17,2', 'c:12,10,2.5', 'M8 17a4 4 0 0 1 8 0'],
  message: ['M4.5 5h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4.5 3.5V17h-1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],
  globe: ['c:12,12,8.5', 'M3.5 12h17', 'M12 3.5c2.4 2.4 3.5 5.5 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.5-3.5-8.5s1.1-6.1 3.5-8.5z'],
  plusSquare: ['r:4,4,16,16,3', 'M12 8.5v7', 'M8.5 12h7'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 6H5.5a2.5 2.5 0 0 0 2.6 3.4', 'M16 6h2.5a2.5 2.5 0 0 1-2.6 3.4', 'M12 13v4', 'M8.5 20h7', 'M10 17h4'],
  medal: ['c:12,14.5,5', 'M9 3.5l3 5.5 3-5.5'],
  sync: ['M20 11a8 8 0 0 0-14.5-4.5L4 8', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.5 4.5L20 16', 'M20 20v-4h-4'],
  sliders: ['M4 7h9', 'M17 7h3', 'c:15,7,2', 'M4 17h3', 'M11 17h9', 'c:9,17,2'],
  shield: ['M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z'],
  user: ['c:12,8.5,3.5', 'M5 20a7 7 0 0 1 14 0'],
  droplet: ['M12 3.5c3 3.5 6 6.8 6 10a6 6 0 0 1-12 0c0-3.2 3-6.5 6-10z'],
  grid: ['r:4,4,7,7,1.5', 'r:13,4,7,7,1.5', 'r:4,13,7,7,1.5', 'r:13,13,7,7,1.5'],
  pen: ['M15.5 4.5l4 4L9 19H5v-4z', 'M13 7l4 4'],
  zap: ['M13 3 5 13.5h6L10 21l9-11h-6z'],
  tag: ['M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0z', 'c:8,8,1.2'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  database: ['e:12,6,7,2.5', 'M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6', 'M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5'],
  trash: ['M4.5 7h15', 'M9.5 7V4.5h5V7', 'M6.5 7l1 13h9l1-13'],
  help: ['c:12,12,8.5', 'M9.6 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.8', 'M12 17h.01'],
  search: ['c:10.5,10.5,6', 'M15 15l5 5'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  plus: ['M12 5v14', 'M5 12h14'],
  mail: ['r:3.5,5.5,17,13,2', 'M4 7.5l8 5.5 8-5.5'],
  sun: ['c:12,12,4', 'M12 3v2', 'M12 19v2', 'M3 12h2', 'M19 12h2', 'M5.6 5.6 7 7', 'M17 17l1.4 1.4', 'M5.6 18.4 7 17', 'M17 7l1.4-1.4'],
  chevronLeft: ['M15 5l-7 7 7 7'],
  chevronRight: ['M9 5l7 7-7 7'],
  chevronDown: ['M6 9l6 6 6-6'],
}

// 사이드바 경로 → 아이콘. 없는 경로는 라우터의 글자 아이콘을 그대로 쓴다.
export const NAV_ICONS = {
  '/': 'home', '/notifications': 'bell', '/calendar': 'calendar', '/dday': 'flag', '/mentions': 'at',
  '/career': 'briefcase', '/career/activities': 'pen', '/career/applications': 'mail',
  '/planner': 'timeline', '/planner/templates': 'layers', '/planner/canvas': 'board', '/focus': 'target', '/focus/together': 'users',
  '/events': 'clock', '/events/dday': 'flag', '/events/templates': 'layers', '/tasks': 'check', '/routines': 'repeat', '/routines/history': 'history',
  '/diary': 'book', '/diary/summary': 'doc', '/memos': 'note', '/tags': 'hash', '/my-posts': 'list', '/money': 'wallet',
  '/stats': 'bars', '/stats/daily': 'pulse', '/stats/category': 'pie', '/stats/compare': 'compare', '/stats/godlife': 'star', '/insight': 'sparkle',
  '/work': 'briefcase', '/work/history': 'archive', '/work/labor': 'calculator', '/work/wbs': 'tree', '/work/wiki': 'bookOpen', '/work/career': 'lock',
  '/share': 'share', '/share/groups': 'users', '/share/visibility': 'eye', '/share/files': 'clip', '/share/preview': 'image', '/share/blocked': 'ban',
  '/address': 'contacts', '/chat': 'message', '/community': 'globe', '/community/new': 'plusSquare', '/community/ranking': 'trophy', '/community/challenge': 'medal',
  '/sync': 'sync',
  '/admin': 'user', '/admin/cs': 'message', '/admin/billing': 'wallet', '/admin/moderation': 'ban', '/admin/content': 'grid', '/admin/notices': 'bell',
  '/admin/stats': 'bars', '/admin/logs': 'pulse', '/admin/audit': 'history', '/admin/settings': 'sliders', '/sitemap': 'grid',
}

// 환경설정 섹션 id → 아이콘
export const SETTINGS_ICONS = {
  profile: 'user', security: 'shield', billing: 'star', env: 'sliders', forms: 'pen', theme: 'droplet', widgets: 'grid',
  notifications: 'bell', automation: 'zap', category: 'tag', integrations: 'link', data: 'database', trash: 'trash', support: 'help',
}

/** 도형 문자열을 SVG 요소 이름과 속성으로 바꾼다. */
export function shape(spec) {
  if (spec.startsWith('c:')) { const [cx, cy, r] = spec.slice(2).split(','); return ['circle', { cx, cy, r }] }
  if (spec.startsWith('r:')) { const [x, y, width, height, rx] = spec.slice(2).split(','); return ['rect', { x, y, width, height, rx }] }
  if (spec.startsWith('e:')) { const [cx, cy, rx, ry] = spec.slice(2).split(','); return ['ellipse', { cx, cy, rx, ry }] }
  return ['path', { d: spec }]
}
