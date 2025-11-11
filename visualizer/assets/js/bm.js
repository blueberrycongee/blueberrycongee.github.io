// BM 算法可视化：构建 BC/GS 表，右向左匹配与移动距离回放

class BMAlgo {
  // 坏字符表：字符 -> 在模式串中的最后一次出现位置
  static buildBC(pattern) {
    const bc = new Map();
    const p = Array.from(pattern);
    for (let i = 0; i < p.length; i++) bc.set(p[i], i);
    return bc; // 未出现的字符视为 -1
  }

  // 生成 suffix 与 prefix，用于 GS 移动
  static buildSuffixPrefix(pattern) {
    const p = Array.from(pattern);
    const m = p.length;
    const suffix = new Array(m).fill(-1); // suffix[k]：长度为 k 的后缀在模式串中能匹配的起始位置
    const prefix = new Array(m).fill(false);
    for (let i = 0; i < m - 1; i++) {
      let j = i;
      let k = 0;
      while (j >= 0 && p[j] === p[m - 1 - k]) {
        j--; k++;
        suffix[k] = j + 1;
      }
      if (j === -1) prefix[k] = true;
    }
    return { suffix, prefix };
  }

  // GS 规则：失配发生在 j，返回需要移动的距离
  static moveByGS(j, m, suffix, prefix) {
    const k = m - 1 - j; // 已匹配的后缀长度
    if (k <= 0) return 0;
    if (suffix[k] !== -1) {
      return j - suffix[k] + 1;
    }
    for (let r = j + 2; r <= m - 1; r++) { // 尝试匹配模式串的前缀与后缀对齐
      if (prefix[m - r]) return r;
    }
    return m;
  }

  static buildGS(pattern) {
    const p = Array.from(pattern);
    const m = p.length;
    const { suffix, prefix } = this.buildSuffixPrefix(p);
    const gs = new Array(m).fill(m);
    for (let j = 0; j < m; j++) {
      gs[j] = this.moveByGS(j, m, suffix, prefix) || 0;
    }
    return { gs, suffix, prefix };
  }

  // 生成匹配步骤，包含比较、失配、平移与成功
  static match(text, pattern, bc, gs, mode = 'both') {
    const t = Array.from(text);
    const p = Array.from(pattern);
    const n = t.length;
    const m = p.length;
    const steps = [];
    const log = (msg) => steps.push({ type: 'log', message: msg });
    if (!m) { log('空模式串，视为匹配成功'); steps.push({ type: 'success', start: 0, length: 0 }); return steps; }

    let i = 0; // 滑窗起点
    log('开始 BM 匹配：从右向左比较，每步移动为 max(BC, GS)');
    while (i <= n - m) {
      let j = m - 1;
      for (; j >= 0; j--) {
        steps.push({ type: 'compare', i, j, ti: i + j, pj: j, chars: { t: t[i + j], p: p[j] } });
        if (t[i + j] !== p[j]) break;
      }
      if (j < 0) {
        log(`匹配成功：起始位置 ${i}`);
        steps.push({ type: 'success', start: i, length: m });
        i += m; // 继续寻找下一个匹配，可选择 i += m 或 i++，此处用 m 简化避免重叠
        continue;
      }
      const badChar = t[i + j];
      const bcPos = bc.has(badChar) ? bc.get(badChar) : -1;
      const bcShift = Math.max(1, j - bcPos);
      const gsShift = gs[j] || 0;
      let shift;
      if (mode === 'bc') shift = Math.max(1, bcShift);
      else if (mode === 'gs') shift = Math.max(1, gsShift);
      else shift = Math.max(bcShift, gsShift);
      steps.push({ type: 'mismatch', i, j, ti: i + j, pj: j, badChar, bcPos, bcShift, gsShift, shift });
      log('失配：T[' + (i + j) + ']=' + badChar + ' 与 P[' + j + ']=' + p[j] + '；BC=' + bcShift + '，GS=' + gsShift + '，移动=' + shift + (mode==='bc'?'（仅坏字符）':(mode==='gs'?'（仅好后缀）':'（综合）')));
      i += shift;
      steps.push({ type: 'shift', newI: i });
    }
    log('匹配结束');
    return steps;
  }
}

class BMRenderer {
  constructor() {
    this.canvas = document.getElementById('bm-canvas');
    this.textRow = document.getElementById('text-row');
    this.patternRow = document.getElementById('pattern-row');
    this.bcKeysRow = document.getElementById('bc-keys-row');
    this.bcValuesRow = document.getElementById('bc-values-row');
    this.gsIndexRow = document.getElementById('gs-index-row');
    this.gsValueRow = document.getElementById('gs-value-row');
    this.operationLog = document.getElementById('operation-log');

    this.textLenLabel = document.getElementById('bm-text-len');
    this.patternLenLabel = document.getElementById('bm-pattern-len');
    this.iLabel = document.getElementById('bm-i');
    this.jLabel = document.getElementById('bm-j');
    this.shiftLabel = document.getElementById('bm-shift');

    this.tCells = []; this.pCells = []; this.bcKeyCells = []; this.bcValCells = []; this.gsIdxCells = []; this.gsValCells = [];
    this.cellW = 40; this.gap = 8; this.currentI = 0;
  }

  clearGrid() { this.textRow.innerHTML = ''; this.patternRow.innerHTML = ''; this.tCells = []; this.pCells = []; }
  clearTables() { this.bcKeysRow.innerHTML=''; this.bcValuesRow.innerHTML=''; this.bcKeyCells=[]; this.bcValCells=[]; this.gsIndexRow.innerHTML=''; this.gsValueRow.innerHTML=''; this.gsIdxCells=[]; this.gsValCells=[]; }
  clearLog() { this.operationLog.innerHTML = '<p class="log-empty">暂无步骤</p>'; }

  renderText(text) {
    this.clearGrid();
    Array.from(text).forEach((ch, idx) => {
      const cell = document.createElement('div');
      cell.className = 'bm-cell'; cell.textContent = ch; cell.setAttribute('data-idx', idx);
      this.textRow.appendChild(cell); this.tCells.push(cell);
    });
    this.textLenLabel.textContent = String(text.length);
    this.requestUpdateMetrics();
  }

  renderPattern(pattern) {
    // 先清空再渲染，避免多次点击导致 P 行累积
    this.patternRow.innerHTML = '';
    this.pCells = [];
    Array.from(pattern).forEach((ch, idx) => {
      const cell = document.createElement('div');
      cell.className = 'bm-cell'; cell.textContent = ch; cell.setAttribute('data-idx', idx);
      this.patternRow.appendChild(cell); this.pCells.push(cell);
    });
    this.patternLenLabel.textContent = String(pattern.length);
    this.setWindow(0, false);
    this.requestUpdateMetrics();
  }

  renderBC(bcMap) {
    // 按字符排序展示（模式串中出现的去重字符）
    const entries = Array.from(bcMap.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    for (const [ch, pos] of entries) {
      const k = document.createElement('div'); k.className = 'bm-cell bm-bc-key'; k.textContent = ch; this.bcKeysRow.appendChild(k); this.bcKeyCells.push(k);
      const v = document.createElement('div'); v.className = 'bm-cell bm-bc-value'; v.textContent = String(pos); v.setAttribute('data-key', ch); this.bcValuesRow.appendChild(v); this.bcValCells.push(v);
    }
  }

  renderGS(gs) {
    for (let j = 0; j < gs.length; j++) {
      const idx = document.createElement('div'); idx.className = 'bm-cell bm-index'; idx.textContent = String(j); this.gsIndexRow.appendChild(idx); this.gsIdxCells.push(idx);
      const val = document.createElement('div'); val.className = 'bm-cell bm-gs-value'; val.textContent = String(gs[j]); val.setAttribute('data-idx', j); this.gsValueRow.appendChild(val); this.gsValCells.push(val);
    }
  }

  setIJ(i, j) { this.iLabel.textContent = i===undefined?'—':String(i); this.jLabel.textContent = j===undefined?'—':String(j); }
  setShift(s) { this.shiftLabel.textContent = s===undefined?'—':String(s); }
  appendLog(text) { if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML=''; const p=document.createElement('p'); p.className='log-entry'; p.textContent=text; this.operationLog.appendChild(p); this.operationLog.scrollTop=this.operationLog.scrollHeight; }
  unmarkAll() { document.querySelectorAll('.bm-cell.rotating').forEach(el=>el.classList.remove('rotating')); }
  highlightCompare(i, j, ti) { this.unmarkAll(); if (this.tCells[ti]) this.tCells[ti].classList.add('rotating'); if (this.pCells[j]) this.pCells[j].classList.add('rotating'); }
  highlightBC(badChar) { const val = this.bcValCells.find(v=>v.getAttribute('data-key')===badChar); if (val) { this.unmarkAll(); val.classList.add('rotating'); } }
  highlightGS(j) { const val = this.gsValCells.find(v=>parseInt(v.getAttribute('data-idx'))===j); if (val) { this.unmarkAll(); val.classList.add('rotating'); } }

  requestUpdateMetrics() {
    requestAnimationFrame(() => this.updateMetrics());
  }
  updateMetrics() {
    const t0 = this.tCells[0]; const p0 = this.pCells[0];
    const w = (t0?.offsetWidth || p0?.offsetWidth || 40);
    try {
      const gapStr = getComputedStyle(this.textRow).gap || '8px';
      const g = parseFloat(gapStr);
      this.gap = isNaN(g) ? 8 : g;
    } catch(e) { this.gap = 8; }
    this.cellW = w;
  }
  setWindow(i, animate = true) {
    this.currentI = i;
    const offset = i * (this.cellW + this.gap);
    if (!animate) this.patternRow.style.transition = 'none';
    else this.patternRow.style.transition = '';
    this.patternRow.style.left = offset + 'px';
    if (!animate) requestAnimationFrame(() => { this.patternRow.style.transition = ''; });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const renderer = new BMRenderer();
  const stepController = new AnimationStepController({
    nodeContainer: document.getElementById('bm-grid'),
    canvas: document.getElementById('bm-canvas'),
    overlayParent: document.body,
    onStep: (s) => {
      if (!s) return;
      if (s.type === 'log') { renderer.appendLog(s.message); return; }
      if (s.type === 'compare') { renderer.setIJ(s.i, s.j); renderer.setWindow(s.i); renderer.appendLog(`比较：T[${s.ti}] 与 P[${s.pj}]`); renderer.highlightCompare(s.i, s.j, s.ti); return; }
      if (s.type === 'mismatch') {
        renderer.setIJ(s.i, s.j); renderer.setShift(s.shift);
        renderer.appendLog('失配点 j=' + s.j + '，BC=' + s.bcShift + '，GS=' + s.gsShift + '，移动=' + s.shift);
        // 高亮对应的 BC 或 GS 值
        if (_currentMode === 'bc') renderer.highlightBC(s.badChar);
        else if (_currentMode === 'gs') renderer.highlightGS(s.pj);
        else if (s.bcShift >= s.gsShift) renderer.highlightBC(s.badChar); else renderer.highlightGS(s.pj);
        return;
      }
      if (s.type === 'shift') { renderer.appendLog(`滑窗起点移动到 i=${s.newI}`); renderer.setIJ(s.newI, undefined); renderer.setShift(undefined); renderer.setWindow(s.newI); renderer.unmarkAll(); return; }
      if (s.type === 'success') { renderer.appendLog(`成功匹配：起始位置 ${s.start}，长度 ${s.length}`); renderer.unmarkAll(); for (let k=0;k<s.length;k++){ const ti=s.start+k; if (renderer.tCells[ti]) renderer.tCells[ti].classList.add('rotating'); if (renderer.pCells[k]) renderer.pCells[k].classList.add('rotating'); } return; }
    }
  });
  stepController.bindControls(document.getElementById('step-prev-btn'), document.getElementById('step-next-btn'));

  const textInput = document.getElementById('bm-text');
  const patternInput = document.getElementById('bm-pattern');
  const btnBuild = document.getElementById('bm-build-btn');
  const btnRun = document.getElementById('bm-run-btn');
  const btnRunBC = document.getElementById('bm-run-bc-btn');
  const btnRunGS = document.getElementById('bm-run-gs-btn');
  const btnClear = document.getElementById('bm-clear-btn');

  let _bc = null; let _gs = null; let _pattern = '';
  let _currentMode = 'both';

  const ensureInputs = () => {
    const T = (textInput.value||'').trim(); const P = (patternInput.value||'').trim();
    if (!T || !P) { alert('请输入文本串 T 与模式串 P'); return null; }
    return { t:T, p:P };
  };

  const buildTables = () => {
    const { p = '' } = { p: (patternInput.value||'').trim() };
    if (!p) { alert('请输入模式串 P'); return; }
    renderer.clearTables(); renderer.clearLog(); renderer.setShift(undefined); renderer.setIJ(undefined, undefined);
    _bc = BMAlgo.buildBC(p); const { gs } = BMAlgo.buildGS(p); _gs = gs; _pattern = p;
    renderer.renderPattern(p); // 保留/刷新模式行
    renderer.renderBC(_bc); renderer.renderGS(_gs);
    renderer.appendLog('已计算 BC 与 GS 表');
    stepController.setSteps('BM 匹配步骤', []);
  };

  const runMatch = (mode = 'both') => {
    const inp = ensureInputs(); if (!inp) return; const { t, p } = inp;
    if (!_bc || !_gs || _pattern !== p) { _bc = BMAlgo.buildBC(p); const { gs } = BMAlgo.buildGS(p); _gs = gs; renderer.clearTables(); renderer.renderBC(_bc); renderer.renderGS(_gs); }
    renderer.clearLog(); renderer.setShift(undefined);
    renderer.renderText(t); renderer.patternRow.innerHTML=''; renderer.renderPattern(p);
    _currentMode = mode;
    const steps = BMAlgo.match(t, p, _bc, _gs, mode);
    stepController.setSteps('BM 匹配步骤', steps);
    renderer.setWindow(0, false);
    stepController.goTo(0);
  };

  btnBuild.addEventListener('click', buildTables);
  btnRun.addEventListener('click', () => runMatch('both'));
  btnRunBC.addEventListener('click', () => runMatch('bc'));
  btnRunGS.addEventListener('click', () => runMatch('gs'));
  btnClear.addEventListener('click', () => {
    textInput.value=''; patternInput.value=''; renderer.clearGrid(); renderer.clearTables(); renderer.clearLog(); renderer.setIJ(undefined, undefined); renderer.setShift(undefined); stepController.setSteps('BM 匹配步骤', []); renderer.unmarkAll(); renderer.textLenLabel.textContent='0'; renderer.patternLenLabel.textContent='0';
    _bc=null; _gs=null; _pattern='';
  });
});