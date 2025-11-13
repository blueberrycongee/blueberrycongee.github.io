// 简化的五级流水线可视化：IF/ID/EX/MEM/WB
// 支持：转发（EX/MEM→EX）、分支代价（ID=1/EX=2），数据冒险 RAW，load-use 特殊处理

function parseInst(line) {
  const s = line.trim().replace(/\s+/g, ' ').toUpperCase();
  if (!s) return null;
  const opTok = s.split(' ')[0];
  function regNormalize(r) { return r.replace(/[^A-Z0-9]/g, ''); }
  // 算术（寄存器名支持 Rn / Xn 风格）
  if (['ADD','SUB','MUL','AND','OR','XOR'].includes(opTok)) {
    const m = s.match(/^[A-Z]+\s+([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)$/);
    if (!m) return null;
    return { type:'ALU', op: opTok, dest: regNormalize(m[1]), src: [regNormalize(m[2]), regNormalize(m[3])], text: line.trim() };
  }
  // 载入：允许 IW 作为 LW 的别名（宽容输入）
  if (opTok === 'LW' || opTok === 'IW') {
    const m = s.match(/^(LW|IW)\s+([^,]+)\s*,\s*([+-]?\d+)\(([^)]+)\)$/);
    if (!m) return null;
    return { type:'LW', op:'LW', dest: regNormalize(m[2]), src: [regNormalize(m[4])], text: line.trim() };
  }
  // 存储
  if (opTok === 'SW') {
    const m = s.match(/^SW\s+([^,]+)\s*,\s*([+-]?\d+)\(([^)]+)\)$/);
    if (!m) return null;
    return { type:'SW', op:'SW', dest: null, src: [regNormalize(m[1]), regNormalize(m[3])], text: line.trim() };
  }
  // 分支
  if (opTok === 'BEQ') {
    const m = s.match(/^BEQ\s+([^,]+)\s*,\s*([^,]+)\s*,\s*(T|NT)$/);
    if (!m) return null;
    return { type:'BR', op:'BEQ', dest:null, src:[regNormalize(m[1]), regNormalize(m[2])], taken: m[3] === 'T', text: line.trim() };
  }
  return { type:'ALU', op: opTok, dest:null, src:[], text: line.trim() }; // 宽容解析：未知算术类按 ALU 处理
}

function schedule(insts, opts) {
  const { forwarding, branchPenalty } = opts;
  const rows = []; // 每条指令的阶段起始周期
  const hazards = [];
  let nextIF = 1;
  for (let j = 0; j < insts.length; j++) {
    const I = insts[j];
    if (!I) continue;

    // 基础起始周期（顺序取指）
    const startIFBase = nextIF;

    // 控制冒险：上一条分支取跳转，IF 需要插入 penalty 个气泡
    let ctrlStall = 0;
    const prevRow = rows[rows.length - 1];
    if (prevRow && prevRow.type === 'BR' && prevRow.taken) {
      ctrlStall = branchPenalty;
      hazards.push({ kind:'CTRL', message:`第 ${j+1} 条因上一条分支取跳转插入 ${branchPenalty} 个气泡` });
    }

    // 数据冒险：按照无转发“ID 与 WB 可同周期读写”的规则计算 stall
    let dataStall = 0;
    const id0 = startIFBase + ctrlStall + 1; // 原始 ID 周期
    const ex0 = startIFBase + ctrlStall + 2; // 原始 EX 周期
    for (const sr of (I.src || [])) {
      // 找到最近写该寄存器的生产者
      let producer = null;
      for (let k = rows.length - 1; k >= 0; k--) {
        const P = rows[k];
        if (P && P.dest && P.dest === sr) { producer = P; break; }
      }
      if (!producer) continue;
      let need = 0;
      if (forwarding) {
        const ready = (producer.type === 'LW') ? producer.MEM : producer.EX;
        const requiredEX = ready + 1; // 下一周期在 EX 使用到
        need = requiredEX - ex0;
        if (need > 0) hazards.push({ kind:'RAW', message:`${producer.text} → ${I.text} 依赖 ${sr}：启用转发需插入 ${need} 个气泡` });
      } else {
        const requiredID = producer.WB; // ID 与 WB 可同周期（WB 前半写，ID 后半读）
        need = requiredID - id0;
        if (need > 0) hazards.push({ kind:'RAW', message:`${producer.text} → ${I.text} 依赖 ${sr}：禁用转发需插入 ${need} 个气泡（ID 与 WB 可同周期）` });
      }
      if (need > 0) dataStall = Math.max(dataStall, need);
    }

    // 计算最终阶段周期
    const IF = startIFBase + ctrlStall;
    const ID = id0 + dataStall;
    const EX = ex0 + dataStall;
    const MEM = IF + 3 + dataStall;
    const WB = IF + 4 + dataStall;

    // 记录气泡显示位置：控制气泡在 IF 前，数据气泡在 ID 阶段
    const stalls = [];
    for (let c = startIFBase; c < startIFBase + ctrlStall; c++) stalls.push(c); // 控制气泡
    for (let c = id0; c < id0 + dataStall; c++) stalls.push(c); // ID 阶段的停顿

    rows.push({ type: I.type, text: I.text, dest: I.dest, IF, ID, EX, MEM, WB, taken: I.taken, stalls });
    // ID 停顿会冻结 IF，因此下一条的 IF 也随之推后
    nextIF = IF + 1 + dataStall;
  }

  const totalCycles = rows.reduce((m, r) => Math.max(m, r.WB), 0);
  return { rows, hazards, totalCycles };
}

function render(schedule, opts) {
  const chipsEl = document.getElementById('pipe-chips');
  const gridEl = document.getElementById('pipe-grid');
  const hzEl = document.getElementById('pipe-hazards');
  if (!chipsEl || !gridEl || !hzEl) return;

  chipsEl.innerHTML = '';
  const c1 = document.createElement('div'); c1.className='chip ' + (opts.forwarding ? 'green' : 'gray'); c1.textContent = opts.forwarding ? '启用转发' : '禁用转发'; chipsEl.appendChild(c1);
  const c2 = document.createElement('div'); c2.className='chip blue'; c2.textContent = `分支代价 ${opts.branchPenalty} 周期`; chipsEl.appendChild(c2);

  const tbl = document.createElement('table'); tbl.className = 'pipeline';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  const th0 = document.createElement('th'); th0.className='sticky'; th0.textContent='指令'; htr.appendChild(th0);
  for (let c = 1; c <= schedule.totalCycles; c++) { const th = document.createElement('th'); th.textContent = String(c); htr.appendChild(th); }
  thead.appendChild(htr); tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const r of schedule.rows) {
    const tr = document.createElement('tr');
    const th = document.createElement('td'); th.className='sticky'; th.textContent = r.text; tr.appendChild(th);
    for (let c = 1; c <= schedule.totalCycles; c++) {
      const td = document.createElement('td');
      let cell = '';
      let cls = '';
      const isStall = r.stalls && r.stalls.includes(c);
      if (isStall) { cell='ST'; cls='stage stage-stall'; }
      else if (c === r.IF) { cell='IF'; cls='stage stage-if'; }
      else if (c === r.ID) { cell='ID'; cls='stage stage-id'; }
      else if (c === r.EX) { cell='EX'; cls='stage stage-ex'; }
      else if (c === r.MEM) { cell='MEM'; cls='stage stage-mem'; }
      else if (c === r.WB) { cell='WB'; cls='stage stage-wb'; }
      td.innerHTML = cell ? `<span class="${cls}">${cell}</span>` : '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  gridEl.innerHTML = '';
  const inner = document.createElement('div'); inner.className = 'grid-inner';
  inner.appendChild(tbl);
  gridEl.appendChild(inner);

  // 智能内容缩放：适配 1280×720 等视窗，不滚动完整显示
  applyAutoScale();

  hzEl.innerHTML = '<div class="chip gray">冲突列表</div>' + (schedule.hazards.length ? '' : '<div class="item">无</div>');
  schedule.hazards.forEach(h => {
    const div = document.createElement('div'); div.className='item'; div.textContent = (h.kind==='RAW'?'[数据冒险] ':'[控制冒险] ') + h.message; hzEl.appendChild(div);
  });
}

function applyAutoScale() {
  const gridWrap = document.getElementById('pipe-grid');
  const auto = (document.getElementById('pipe-autofit')?.value === 'on');
  if (!gridWrap) return;
  const inner = gridWrap.querySelector('.grid-inner');
  const tbl = gridWrap.querySelector('table.pipeline');
  if (!inner || !tbl) return;
  // 关闭自动适配：移除缩放并恢复滚动
  if (!auto) { inner.style.transform=''; gridWrap.style.overflow='auto'; return; }
  // 先重置缩放以获取自然尺寸
  inner.style.transform = '';
  // 使用边界尺寸确保含 sticky 列宽度
  const cw = gridWrap.getBoundingClientRect().width - 12; // 预留内边距
  const ch = gridWrap.getBoundingClientRect().height - 12;
  const tw = tbl.getBoundingClientRect().width;
  const th = tbl.getBoundingClientRect().height;
  // 若内容已小于容器，直接不缩放
  if (tw <= cw && th <= ch) { inner.style.transform = ''; gridWrap.style.overflow='auto'; return; }
  let scaleX = cw / (tw || cw);
  let scaleY = ch / (th || ch);
  let scale = Math.min(scaleX, scaleY);
  if (!isFinite(scale) || scale <= 0) scale = 1;
  // 限制最大为 1（不放大），最小为 0.6（可读性）
  scale = Math.min(1, Math.max(0.6, scale));
  inner.style.transformOrigin = 'top left';
  inner.style.transform = `scale(${scale})`;
  // 保持滚动条可用，以防极端情况下仍超出
  gridWrap.style.overflow = 'auto';
}

function runPipeline() {
  const txt = document.getElementById('pipe-input').value || '';
  const forwarding = (document.getElementById('pipe-forwarding').value === 'on');
  const branchPenalty = parseInt(document.getElementById('pipe-branch-penalty').value, 10);
  const lines = txt.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
  const insts = lines.map(parseInst).filter(Boolean);
  const sched = schedule(insts, { forwarding, branchPenalty });
  render(sched, { forwarding, branchPenalty });
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('pipe-run');
  if (btn) btn.addEventListener('click', runPipeline);
  const autofit = document.getElementById('pipe-autofit');
  if (autofit) autofit.addEventListener('change', () => { runPipeline(); });
  // 视窗尺寸变化时重新计算缩放
  window.addEventListener('resize', () => { applyAutoScale(); });

  // 标签页交互与无障碍
  const tabs = [
    {btn: document.getElementById('tab-visual'), panel: document.getElementById('panel-visual')},
    {btn: document.getElementById('tab-hazards'), panel: document.getElementById('panel-hazards')},
    {btn: document.getElementById('tab-docs'), panel: document.getElementById('panel-docs')},
  ].filter(t => t.btn && t.panel);
  tabs.forEach((t, idx) => {
    t.btn.addEventListener('click', () => {
      tabs.forEach(tt => { tt.btn.setAttribute('aria-selected','false'); tt.panel.hidden = true; });
      t.btn.setAttribute('aria-selected','true');
      t.panel.hidden = false;
    });
    t.btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        const dir = (ev.key === 'ArrowRight') ? 1 : -1;
        const next = tabs[(idx + dir + tabs.length) % tabs.length];
        next.btn.focus();
      }
    });
  });
});