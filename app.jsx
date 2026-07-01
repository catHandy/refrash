// app.jsx — 메인 앱: 상태 관리 + 레이아웃 + Tweaks
const appFA = window.FridgeApp;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "쿨 메탈",
  "accent": "#3E6075",
  "threshold": 3,
  "showLabels": true
}/*EDITMODE-END*/;

const THEME_KEYS = { '쿨 메탈': 'cool', '따뜻한 우드': 'warm', '다크': 'dark' };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = React.useState(appFA.loadState);
  const [selectedId, setSelectedId] = React.useState(null);
  const [openSec, setOpenSec] = React.useState('add');
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);

  const showToast = function (msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(function () { setToast(null); }, 2600);
  };
  const commit = function (updater) {
    setState(function (prev) {
      const next = updater(prev);
      appFA.saveState(next);
      return next;
    });
  };

  const resetAll = function () {
    if (!window.confirm('모든 재료와 히스토리를 삭제할까요?\n되돌릴 수 없어요.')) return;
    const fresh = { items: [], history: [] };
    appFA.saveState(fresh);
    setState(fresh);
    showToast('전체 초기화했어요');
  };
  const addItem = function (item) {
    commit(function (s) { return { items: s.items.concat([item]), history: s.history }; });
    const loc = appFA.LOCATIONS.find(function (l) { return l.key === item.location; });
    showToast(item.emoji + ' ' + item.name + ' — ' + (loc ? loc.label : '') + '에 담았어요');
  };
  const saveItem = function (id, patch) {
    commit(function (s) {
      return {
        items: s.items.map(function (i) { return i.id === id ? Object.assign({}, i, patch) : i; }),
        history: s.history
      };
    });
    setSelectedId(null);
    showToast('저장했어요');
  };
  const deleteItem = function (id) {
    commit(function (s) {
      return { items: s.items.filter(function (i) { return i.id !== id; }), history: s.history };
    });
    setSelectedId(null);
    showToast('삭제했어요');
  };
  const logMeal = function (name, time, usages) {
    commit(function (s) {
      const used = [];
      const gone = [];
      const items = s.items.map(function (i) {
        const amt = usages[i.id];
        if (amt == null) return i;
        used.push({ emoji: i.emoji, name: i.name, amount: i.qtyType === 'count' ? amt + (i.unit || '개') : amt + '%' });
        const left = i.qty - amt;
        if (left <= 0) { gone.push(i.name); return null; }
        return Object.assign({}, i, { qty: left });
      }).filter(Boolean);
      const entry = { id: appFA.uid(), date: appFA.todayStr(), time: time, name: name, used: used };
      if (gone.length > 0) showToast('🍽️ ' + name + ' 기록! ' + gone.join(', ') + '은(는) 다 썼어요');
      else showToast('🍽️ ' + name + ' 기록! 잔량을 차감했어요');
      return { items: items, history: [entry].concat(s.history) };
    });
  };

  const toggleSec = function (id) {
    setOpenSec(function (p) { return p === id ? null : id; });
  };

  const selected = state.items.find(function (i) { return i.id === selectedId; });
  const theme = THEME_KEYS[t.theme] || 'cool';
  const dateLine = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className={'app theme-' + theme} style={{ '--accent': t.accent }}>
      <aside className="left" data-screen-label="냉장고 단면 영역">
        <header className="brand">
          <span className="kicker">KITCHEN · INVENTORY</span>
          <h1>우리집 부엌</h1>
          <p>{dateLine}</p>
        </header>
        <FridgeUnit items={state.items} threshold={t.threshold} showLabels={t.showLabels}
          onSelect={setSelectedId}></FridgeUnit>
      </aside>

      <main className="right" data-screen-label="현황판 영역">
        <StatusBar items={state.items} history={state.history} threshold={t.threshold}></StatusBar>
        <AccSection id="add" icon="01" title="재료 추가" open={openSec === 'add'} onToggle={toggleSec}>
          <AddItemForm onAdd={addItem}></AddItemForm>
        </AccSection>
        <AccSection id="meal" icon="02" title="식사 기록" open={openSec === 'meal'} onToggle={toggleSec}>
          <MealForm items={state.items} onLog={logMeal}></MealForm>
        </AccSection>
        <AccSection id="hist" icon="03" title="히스토리" badge={state.history.length}
          open={openSec === 'hist'} onToggle={toggleSec}>
          <HistoryList history={state.history}></HistoryList>
        </AccSection>
      </main>

      {selected ? (
        <ItemModal item={selected} threshold={t.threshold}
          onClose={function () { setSelectedId(null); }}
          onSave={saveItem} onDelete={deleteItem}></ItemModal>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}

      <TweaksPanel>
        <TweakSection label="스타일"></TweakSection>
        <TweakRadio label="테마" value={t.theme} options={['쿨 메탈', '따뜻한 우드', '다크']}
          onChange={function (v) { setTweak('theme', v); }}></TweakRadio>
        <TweakSection label="데이터"></TweakSection>
        <TweakButton label="전체 초기화" onClick={resetAll}></TweakButton>
        <TweakColor label="포인트 컬러" value={t.accent} options={['#3E6075', '#4C7A6B', '#C2603F', '#5B5E8C']}
          onChange={function (v) { setTweak('accent', v); }}></TweakColor>
        <TweakSection label="동작"></TweakSection>
        <TweakSlider label="임박 기준" value={t.threshold} min={1} max={7} unit="일"
          onChange={function (v) { setTweak('threshold', v); }}></TweakSlider>
        <TweakToggle label="아이템 이름 표시" value={t.showLabels}
          onChange={function (v) { setTweak('showLabels', v); }}></TweakToggle>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App></App>);
