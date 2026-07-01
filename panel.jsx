// panel.jsx — 오른쪽: 현황판 (요약 + 아코디언 섹션들)
const panelFA = window.FridgeApp;

function StatusBar({ items, history, threshold }) {
  const soon = items.filter(function (i) {
    const d = panelFA.daysLeft(i.expiry);
    return d !== null && d <= threshold;
  }).length;
  const weekAgo = panelFA.offsetDate(-7);
  const meals = history.filter(function (h) { return h.date >= weekAgo; }).length;
  return (
    <div className="stats" data-screen-label="현황판 요약">
      <div className={'stat stat-soon' + (soon > 0 ? ' alert' : '')}>
        <b>{soon}</b>
        <span>기한 임박</span>
        <span className="stat-hint">{soon > 0 ? '지금 확인하세요' : '여유 있어요'}</span>
      </div>
      <div className="stat"><b>{items.length}</b><span>보관 중</span></div>
      <div className="stat"><b>{meals}</b><span>이번 주 식사</span></div>
    </div>
  );
}

function AccSection({ id, icon, title, badge, open, onToggle, children }) {
  const innerRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  const mounted = React.useRef(false);
  const timerRef = React.useRef(null);

  React.useLayoutEffect(function () {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return;

    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    if (!mounted.current) {
      mounted.current = true;
      body.style.height = open ? 'auto' : '0px';
      return;
    }

    if (open) {
      const target = inner.scrollHeight;
      body.style.height = target + 'px';
      timerRef.current = setTimeout(function () {
        if (bodyRef.current === body) { body.style.height = 'auto'; }
        timerRef.current = null;
      }, 280);
    } else {
      const current = inner.scrollHeight;
      body.style.height = current + 'px';
      void body.offsetHeight;
      body.style.height = '0px';
    }

    return function () { if (timerRef.current) { clearTimeout(timerRef.current); } };
  }, [open]);

  return (
    <section className={'acc' + (open ? ' open' : '')} data-screen-label={title}>
      <button type="button" className="acc-head" onClick={function () { onToggle(id); }}>
        <span className="acc-icon">{icon}</span>
        <span className="acc-title">{title}</span>
        {badge != null ? <span className="acc-badge">{badge}</span> : null}
        <span className="acc-chev">▾</span>
      </button>
      <div className="acc-body" ref={bodyRef}>
        <div className="acc-inner" ref={innerRef}>{children}</div>
      </div>
    </section>
  );
}

function makeBlank() {
  return {
    name: '', emoji: '🍎', location: 'fridge', category: '채소',
    qtyType: 'percent', qty: 100, count: 1, unit: '개', expiry: panelFA.todayStr()
  };
}

function AddItemForm({ onAdd }) {
  const [f, setF] = React.useState(makeBlank);
  const set = function (k, v) { setF(function (p) { const n = Object.assign({}, p); n[k] = v; return n; }); };
  const submit = function () {
    if (!f.name.trim()) return;
    onAdd({
      id: panelFA.uid(), name: f.name.trim(), emoji: f.emoji,
      location: f.location, category: f.category,
      qtyType: f.qtyType,
      qty: f.qtyType === 'count' ? f.count : f.qty,
      unit: f.qtyType === 'count' ? f.unit : undefined,
      expiry: f.expiry || null
    });
    setF(makeBlank());
  };
  return (
    <div className="form">
      <div className="field">
        <label>이름</label>
        <div className="name-row">
          <span className="name-emoji">{f.emoji}</span>
          <input className="inp" placeholder="예: 애호박" value={f.name}
            onChange={function (e) { set('name', e.target.value); }}></input>
        </div>
      </div>
      <div className="field">
        <label>아이콘</label>
        <div className="egrid">
          {panelFA.EMOJI_CHOICES.map(function (em) {
            return (
              <button type="button" key={em} className={f.emoji === em ? 'on' : ''}
                onClick={function () {
                  const cat = panelFA.EMOJI_CATEGORY[em];
                  setF(function(p) { const n = Object.assign({}, p, {emoji: em}); if (cat) n.category = cat; return n; });
                }}>{em}</button>
            );
          })}
        </div>
      </div>
      <div className="field">
        <label>위치</label>
        <div className="seg">
          {panelFA.LOCATIONS.map(function (l) {
            return (
              <button type="button" key={l.key} className={f.location === l.key ? 'on' : ''}
                onClick={function () { set('location', l.key); }}>{l.label}</button>
            );
          })}
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>카테고리</label>
          <select className="inp" value={f.category} onChange={function (e) { set('category', e.target.value); }}>
            {panelFA.CATEGORIES.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
          </select>
        </div>
        <div className="field">
          <label>유통기한 <em>(선택)</em></label>
          <input className="inp" type="date" value={f.expiry}
            onChange={function (e) { set('expiry', e.target.value); }}></input>
        </div>
      </div>
      <div className="field">
        <label>수량 방식</label>
        <div className="seg">
          <button type="button" className={f.qtyType === 'percent' ? 'on' : ''}
            onClick={function () { set('qtyType', 'percent'); }}>잔량 %</button>
          <button type="button" className={f.qtyType === 'count' ? 'on' : ''}
            onClick={function () { set('qtyType', 'count'); }}>개수</button>
        </div>
      </div>
      {f.qtyType === 'count' ? (
        <div className="field-row">
          <div className="field">
            <label>개수</label>
            <div className="stepper">
              <button type="button" onClick={function () { set('count', Math.max(1, f.count - 1)); }}>−</button>
              <span>{f.count}</span>
              <button type="button" onClick={function () { set('count', f.count + 1); }}>＋</button>
            </div>
          </div>
          <div className="field">
            <label>단위</label>
            <select className="inp" value={f.unit} onChange={function (e) { set('unit', e.target.value); }}>
              {['개', '장', '봉', '팩', '병', '캔'].map(function (u) { return <option key={u} value={u}>{u}</option>; })}
            </select>
          </div>
        </div>
      ) : (
        <div className="field">
          <label>잔량</label>
          <div className="pct-ctl">
            <input type="range" min="5" max="100" step="5" value={f.qty}
              onChange={function (e) { set('qty', Number(e.target.value)); }}></input>
            <span>{f.qty}%</span>
          </div>
        </div>
      )}
      <button type="button" className="btn btn-accent btn-full" disabled={!f.name.trim()} onClick={submit}>
        냉장고에 담기
      </button>
    </div>
  );
}

function MealForm({ items, onLog }) {
  const [name, setName] = React.useState('');
  const [time, setTime] = React.useState('점심');
  const [sel, setSel] = React.useState({});
  const toggle = function (item) {
    setSel(function (p) {
      const n = Object.assign({}, p);
      if (n[item.id] != null) { delete n[item.id]; }
      else { n[item.id] = item.qtyType === 'count' ? 1 : Math.min(25, item.qty); }
      return n;
    });
  };
  const setAmt = function (id, v) {
    setSel(function (p) { const n = Object.assign({}, p); n[id] = v; return n; });
  };
  const count = Object.keys(sel).length;
  const submit = function () {
    if (!name.trim() || count === 0) return;
    onLog(name.trim(), time, sel);
    setName(''); setSel({});
  };
  const locIcon = function (k) {
    const l = panelFA.LOCATIONS.find(function (x) { return x.key === k; });
    return l ? l.icon : '';
  };
  return (
    <div className="form">
      <div className="field">
        <label>식사 이름</label>
        <input className="inp" placeholder="예: 김치볶음밥" value={name}
          onChange={function (e) { setName(e.target.value); }}></input>
      </div>
      <div className="field">
        <label>시간대</label>
        <div className="seg">
          {panelFA.MEAL_TIMES.map(function (tm) {
            return (
              <button type="button" key={tm} className={time === tm ? 'on' : ''}
                onClick={function () { setTime(tm); }}>{tm}</button>
            );
          })}
        </div>
      </div>
      <div className="field">
        <label>사용한 재료 <em>— 체크하면 잔량에서 자동으로 차감돼요</em></label>
        <div className="meal-list">
          {items.map(function (it) {
            const checked = sel[it.id] != null;
            return (
              <div key={it.id} className={'meal-row' + (checked ? ' on' : '')}>
                <label className="meal-main">
                  <input type="checkbox" checked={checked} onChange={function () { toggle(it); }}></input>
                  <span className="meal-emoji">{it.emoji}</span>
                  <span className="meal-name">{it.name}</span>
                  <span className="meal-left">{locIcon(it.location)} {it.qtyType === 'count' ? it.qty + (it.unit || '개') : it.qty + '%'} 남음</span>
                </label>
                {checked ? (
                  it.qtyType === 'count' ? (
                    <div className="stepper sm">
                      <button type="button" onClick={function () { setAmt(it.id, Math.max(1, sel[it.id] - 1)); }}>−</button>
                      <span>{sel[it.id]}{it.unit || '개'}</span>
                      <button type="button" onClick={function () { setAmt(it.id, Math.min(it.qty, sel[it.id] + 1)); }}>＋</button>
                    </div>
                  ) : (
                    <div className="pct-ctl sm">
                      <input type="range" min="5" max={Math.max(5, it.qty)} step="5" value={sel[it.id]}
                        onChange={function (e) { setAmt(it.id, Number(e.target.value)); }}></input>
                      <span>{sel[it.id]}%</span>
                    </div>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <button type="button" className="btn btn-accent btn-full" disabled={!name.trim() || count === 0} onClick={submit}>
        {count > 0 ? '재료 ' + count + '개 사용 — 기록하기' : '기록하기'}
      </button>
    </div>
  );
}

function HistoryList({ history }) {
  if (history.length === 0) {
    return <div className="hist-empty">아직 기록이 없어요. 식사를 기록해 보세요!</div>;
  }
  const groups = [];
  history.forEach(function (h) {
    let g = groups.find(function (x) { return x.date === h.date; });
    if (!g) { g = { date: h.date, rows: [] }; groups.push(g); }
    g.rows.push(h);
  });
  groups.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  const today = panelFA.todayStr();
  const yest = panelFA.offsetDate(-1);
  const label = function (d) {
    if (d === today) return '오늘';
    if (d === yest) return '어제';
    return panelFA.fmtK(d);
  };
  return (
    <div className="hist-wrap">
      {groups.map(function (g) {
        return (
          <div key={g.date} className="hist-group">
            <div className="hist-date">{label(g.date)}</div>
            {g.rows.map(function (h) {
              return (
                <div key={h.id} className="hist">
                  <span className="hist-time">{h.time}</span>
                  <div className="hist-body">
                    <b>{h.name}</b>
                    <div className="hist-used">
                      {h.used.map(function (u, i) {
                        return <span key={i} className="hist-chip">{u.emoji} {u.name} <em>{u.amount}</em></span>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      <p className="hist-note">기록은 30일이 지나면 자동으로 사라져요</p>
    </div>
  );
}

Object.assign(window, {
  StatusBar: StatusBar, AccSection: AccSection,
  AddItemForm: AddItemForm, MealForm: MealForm, HistoryList: HistoryList
});
