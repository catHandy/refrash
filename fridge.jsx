// fridge.jsx — 왼쪽: 냉장고 단면 뷰 + 아이템 상세 모달
const fridgeFA = window.FridgeApp;

function fridgeChunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function expiryInfo(expiry, threshold) {
  const d = fridgeFA.daysLeft(expiry);
  const expired = d !== null && d < 0;
  const soon = d !== null && d >= 0 && d <= threshold;
  let badge = null;
  if (expired) badge = '만료';
  else if (soon) badge = d === 0 ? 'D-DAY' : 'D-' + d;
  return { d: d, expired: expired, soon: soon, dim: expired || soon, badge: badge };
}

function QtyIndicator({ item }) {
  if (item.qtyType === 'count') {
    return <span className="chip-qty">{item.qty}{item.unit || '개'}</span>;
  }
  return (
    <span className="chip-bar"><i style={{ width: item.qty + '%' }}></i></span>
  );
}

function ItemChip({ item, threshold, showLabels, onClick }) {
  const ex = expiryInfo(item.expiry, threshold);
  return (
    <button type="button" className="chip" onClick={onClick} title={item.name}>
      <span className="chip-tilebox">
        <span className={'chip-tile' + (ex.dim ? ' dim' : '')}>{item.emoji}</span>
        {ex.badge ? <span className={'chip-badge ' + (ex.expired ? 'red' : 'amber')}>{ex.badge}</span> : null}
      </span>
      {showLabels ? <span className="chip-name">{item.name}</span> : null}
      <QtyIndicator item={item}></QtyIndicator>
    </button>
  );
}

function Compartment({ comp, items, perShelf, threshold, showLabels, onSelect }) {
  const rows = fridgeChunk(items, perShelf);
  return (
    <section className={'comp comp-' + comp.key} data-screen-label={comp.label}>
      <div className="comp-head">
        <span className="comp-en">{comp.en}</span>
        <span className="comp-ko">{comp.label}</span>
        <span className="comp-count">{String(items.length).padStart(2, '0')}</span>
      </div>
      {items.length === 0 ? (
        <div className="comp-empty">비어 있어요</div>
      ) : (
        rows.map(function (row, i) {
          return (
            <div className="shelf" key={i}>
              <div className="shelf-items">
                {row.map(function (it) {
                  return (
                    <ItemChip key={it.id} item={it} threshold={threshold} showLabels={showLabels}
                      onClick={function () { onSelect(it.id); }}></ItemChip>
                  );
                })}
              </div>
              <div className="shelf-board"></div>
            </div>
          );
        })
      )}
    </section>
  );
}

function FridgeUnit({ items, threshold, showLabels, onSelect }) {
  const by = function (k) { return items.filter(function (i) { return i.location === k; }); };
  const L = fridgeFA.LOCATIONS;
  return (
    <div className="appliance" data-screen-label="냉장고 단면">
      <div className="cabinet">
        <Compartment comp={L[0]} items={by('pantry')} perShelf={4} threshold={threshold}
          showLabels={showLabels} onSelect={onSelect}></Compartment>
        <span className="knob kl"></span>
        <span className="knob kr"></span>
      </div>
      <div className="fridge-shell">
        <span className="handle h-fz"></span>
        <span className="handle h-fr"></span>
        <Compartment comp={L[1]} items={by('freezer')} perShelf={4} threshold={threshold}
          showLabels={showLabels} onSelect={onSelect}></Compartment>
        <Compartment comp={L[2]} items={by('fridge')} perShelf={4} threshold={threshold}
          showLabels={showLabels} onSelect={onSelect}></Compartment>
      </div>
      <div className="feet"><i></i><i></i></div>
      <p className="legend">유통기한이 임박하거나 지난 재료는 흑백으로 표시돼요</p>
    </div>
  );
}

function ItemModal({ item, threshold, onClose, onSave, onDelete }) {
  const [f, setF] = React.useState({
    name: item.name, location: item.location, category: item.category,
    expiry: item.expiry || '', qty: item.qty
  });
  const [confirming, setConfirming] = React.useState(false);
  const set = function (k, v) { setF(function (p) { const n = Object.assign({}, p); n[k] = v; return n; }); };
  const ex = expiryInfo(f.expiry || null, threshold);
  const statusText = !f.expiry ? '유통기한 없음'
    : ex.expired ? fridgeFA.fmtK(f.expiry) + ' · 기한이 지났어요'
    : ex.d === 0 ? '오늘까지! 서둘러 사용하세요'
    : fridgeFA.fmtK(f.expiry) + ' · ' + ex.d + '일 남음';
  const statusTone = !f.expiry ? '' : ex.expired ? ' red' : ex.soon ? ' amber' : ' ok';

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={function (e) { e.stopPropagation(); }} data-screen-label="아이템 상세 모달">
        <div className="modal-head">
          <span className={'modal-emoji' + (ex.dim ? ' dim' : '')}>{item.emoji}</span>
          <div className="modal-title">
            <input className="inp inp-name" value={f.name} aria-label="이름"
              onChange={function (e) { set('name', e.target.value); }}></input>
            <span className={'modal-status' + statusTone}>{statusText}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="field">
          <label>위치</label>
          <div className="seg">
            {fridgeFA.LOCATIONS.map(function (l) {
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
              {fridgeFA.CATEGORIES.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          <div className="field">
            <label>유통기한</label>
            <input className="inp" type="date" value={f.expiry}
              onChange={function (e) { set('expiry', e.target.value); }}></input>
          </div>
        </div>

        <div className="field">
          <label>남은 양</label>
          {item.qtyType === 'count' ? (
            <div className="stepper">
              <button type="button" onClick={function () { set('qty', Math.max(0, f.qty - 1)); }}>−</button>
              <span>{f.qty}{item.unit || '개'}</span>
              <button type="button" onClick={function () { set('qty', f.qty + 1); }}>＋</button>
            </div>
          ) : (
            <div className="pct-ctl">
              <input type="range" min="0" max="100" step="5" value={f.qty}
                onChange={function (e) { set('qty', Number(e.target.value)); }}></input>
              <span>{f.qty}%</span>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {confirming ? (
            <div className="confirm-row">
              <span>정말 삭제할까요?</span>
              <button type="button" className="btn btn-danger" onClick={function () { onDelete(item.id); }}>삭제</button>
              <button type="button" className="btn btn-ghost" onClick={function () { setConfirming(false); }}>취소</button>
            </div>
          ) : (
            <React.Fragment>
              <button type="button" className="btn btn-ghost danger-text" onClick={function () { setConfirming(true); }}>삭제</button>
              <button type="button" className="btn btn-accent" disabled={!f.name.trim()}
                onClick={function () {
                  onSave(item.id, {
                    name: f.name.trim(), location: f.location, category: f.category,
                    expiry: f.expiry || null, qty: f.qty
                  });
                }}>저장</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FridgeUnit: FridgeUnit, ItemModal: ItemModal, expiryInfo: expiryInfo });
