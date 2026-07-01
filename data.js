// 냉장고 인벤토리 — 데이터 모델 & 헬퍼
(function () {
  const DAY = 86400000;
  const pad = function (n) { return String(n).padStart(2, '0'); };
  const fmt = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const todayStr = function () { return fmt(new Date()); };
  const offsetDate = function (days) { return fmt(new Date(Date.now() + days * DAY)); };
  const daysLeft = function (dateStr) {
    if (!dateStr) return null;
    const t = new Date(todayStr() + 'T00:00:00').getTime();
    const e = new Date(dateStr + 'T00:00:00').getTime();
    return Math.round((e - t) / DAY);
  };
  const fmtK = function (dateStr) {
    if (!dateStr) return '없음';
    const d = new Date(dateStr + 'T00:00:00');
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  };
  let _uid = Date.now() % 100000;
  const uid = function () { return 'i' + (_uid++).toString(36) + Math.random().toString(36).slice(2, 6); };

  const LOCATIONS = [
    { key: 'pantry', label: '찬장', icon: '🫙', en: 'PANTRY' },
    { key: 'freezer', label: '냉동실', icon: '❄️', en: 'FREEZER' },
    { key: 'fridge', label: '냉장실', icon: '🧊', en: 'FRIDGE' }
  ];
  const CATEGORIES = ['채소', '과일', '육류', '해산물', '유제품', '곡물·면', '통조림·가공', '간식', '기타'];
  const MEAL_TIMES = ['아침', '점심', '저녁', '간식'];
  const EMOJI_CHOICES = ['🍎', '🍌', '🍇', '🍅', '🥬', '🥕', '🧅', '🥔', '🌽', '🥦', '🍄', '🫐',
    '🥩', '🍗', '🐟', '🦐', '🥚', '🥛', '🧀', '🧈', '🍚', '🍜', '🍝', '🍞',
    '🥫', '🫙', '🥣', '🍯', '🥟', '🍨', '🍪', '🧃'];
  const EMOJI_CATEGORY = {
    '🍎': '과일', '🍌': '과일', '🍇': '과일', '🫐': '과일',
    '🍅': '채소', '🥬': '채소', '🥕': '채소', '🧅': '채소', '🥔': '채소', '🌽': '채소', '🥦': '채소', '🍄': '기타',
    '🥩': '육류', '🍗': '육류',
    '🐟': '해산물', '🦐': '해산물',
    '🥚': '유제품', '🥛': '유제품', '🧀': '유제품', '🧈': '유제품',
    '🍚': '곡물·면', '🍜': '곡물·면', '🍝': '곡물·면', '🍞': '곡물·면', '🥟': '곡물·면',
    '🥫': '통조림·가공', '🫙': '통조림·가공',
    '🥣': '간식', '🍨': '간식', '🍪': '간식', '🧃': '간식',
    '🍯': '기타'
  };

  function seedItems() {
    const o = offsetDate;
    return [
      // 찬장
      { id: uid(), name: '쌀', emoji: '🍚', location: 'pantry', category: '곡물·면', qtyType: 'percent', qty: 70, expiry: null },
      { id: uid(), name: '라면', emoji: '🍜', location: 'pantry', category: '곡물·면', qtyType: 'count', qty: 5, unit: '개', expiry: o(120) },
      { id: uid(), name: '참치캔', emoji: '🥫', location: 'pantry', category: '통조림·가공', qtyType: 'count', qty: 3, unit: '개', expiry: o(300) },
      { id: uid(), name: '식빵', emoji: '🍞', location: 'pantry', category: '곡물·면', qtyType: 'count', qty: 1, unit: '봉', expiry: o(2) },
      { id: uid(), name: '시리얼', emoji: '🥣', location: 'pantry', category: '간식', qtyType: 'percent', qty: 30, expiry: o(45) },
      { id: uid(), name: '꿀', emoji: '🍯', location: 'pantry', category: '기타', qtyType: 'percent', qty: 80, expiry: null },
      { id: uid(), name: '파스타면', emoji: '🍝', location: 'pantry', category: '곡물·면', qtyType: 'percent', qty: 50, expiry: o(200) },
      // 냉동실
      { id: uid(), name: '만두', emoji: '🥟', location: 'freezer', category: '곡물·면', qtyType: 'percent', qty: 60, expiry: o(90) },
      { id: uid(), name: '냉동새우', emoji: '🦐', location: 'freezer', category: '해산물', qtyType: 'percent', qty: 40, expiry: o(60) },
      { id: uid(), name: '삼겹살', emoji: '🥩', location: 'freezer', category: '육류', qtyType: 'percent', qty: 100, expiry: o(30) },
      { id: uid(), name: '아이스크림', emoji: '🍨', location: 'freezer', category: '간식', qtyType: 'percent', qty: 25, expiry: o(150) },
      { id: uid(), name: '블루베리', emoji: '🫐', location: 'freezer', category: '과일', qtyType: 'percent', qty: 50, expiry: o(80) },
      // 냉장실
      { id: uid(), name: '우유', emoji: '🥛', location: 'fridge', category: '유제품', qtyType: 'percent', qty: 60, expiry: o(4) },
      { id: uid(), name: '계란', emoji: '🥚', location: 'fridge', category: '기타', qtyType: 'count', qty: 8, unit: '개', expiry: o(12) },
      { id: uid(), name: '김치', emoji: '🫙', location: 'fridge', category: '채소', qtyType: 'percent', qty: 45, expiry: o(40) },
      { id: uid(), name: '대파', emoji: '🥬', location: 'fridge', category: '채소', qtyType: 'percent', qty: 30, expiry: o(2) },
      { id: uid(), name: '토마토', emoji: '🍅', location: 'fridge', category: '채소', qtyType: 'count', qty: 3, unit: '개', expiry: o(-1) },
      { id: uid(), name: '사과', emoji: '🍎', location: 'fridge', category: '과일', qtyType: 'count', qty: 4, unit: '개', expiry: o(15) },
      { id: uid(), name: '치즈', emoji: '🧀', location: 'fridge', category: '유제품', qtyType: 'count', qty: 6, unit: '장', expiry: o(25) },
      { id: uid(), name: '버터', emoji: '🧈', location: 'fridge', category: '유제품', qtyType: 'percent', qty: 70, expiry: o(60) }
    ];
  }

  function seedHistory() {
    return [
      { id: uid(), date: offsetDate(-1), time: '저녁', name: '김치찌개', used: [
        { emoji: '🫙', name: '김치', amount: '20%' },
        { emoji: '🥩', name: '삼겹살', amount: '15%' },
        { emoji: '🥬', name: '대파', amount: '10%' }
      ] },
      { id: uid(), date: offsetDate(-1), time: '아침', name: '토스트와 우유', used: [
        { emoji: '🍞', name: '식빵', amount: '2장' },
        { emoji: '🥛', name: '우유', amount: '10%' },
        { emoji: '🧈', name: '버터', amount: '5%' }
      ] },
      { id: uid(), date: offsetDate(-3), time: '저녁', name: '새우 파스타', used: [
        { emoji: '🍝', name: '파스타면', amount: '25%' },
        { emoji: '🦐', name: '냉동새우', amount: '20%' }
      ] }
    ];
  }

  const KEY = 'pantry-proto-v1';
  function loadState() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    if (!s || !Array.isArray(s.items)) s = { items: seedItems(), history: seedHistory() };
    const cutoff = offsetDate(-30);
    s.history = (s.history || []).filter(function (h) { return h.date >= cutoff; });
    return s;
  }
  function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
  }

  window.FridgeApp = {
    todayStr: todayStr, offsetDate: offsetDate, daysLeft: daysLeft, fmtK: fmtK, uid: uid,
    LOCATIONS: LOCATIONS, CATEGORIES: CATEGORIES, MEAL_TIMES: MEAL_TIMES, EMOJI_CHOICES: EMOJI_CHOICES, EMOJI_CATEGORY: EMOJI_CATEGORY,
    seedItems: seedItems, seedHistory: seedHistory, loadState: loadState, saveState: saveState
  };
})();
