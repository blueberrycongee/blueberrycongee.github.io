// KMP 可视化：计算 next/nextval，展示匹配过程

class KMP {
  static buildNext(pattern) {
    const p = Array.from(pattern);
    const next = new Array(p.length).fill(0);
    if (p.length === 0) return next;
    next[0] = -1;
    let j = 0; // 当前后缀末尾
    let k = -1; // 当前前缀末尾（亦是跳转位置）
    while (j < p.length - 1) {
      if (k === -1 || p[j] === p[k]) {
        j++; k++;
        next[j] = k;
      } else {
        k = next[k];
      }
    }
    return next;
  }

  static buildNextVal(pattern, next) {
    const p = Array.from(pattern);
    const nv = next.slice();
    for (let i = 0; i < p.length; i++) {
      if (nv[i] !== -1 && p[i] === p[nv[i]]) {
        nv[i] = nv[nv[i]];
      }
    }
    return nv;
  }

  // 使用给定的跳转表（next 或 nextval）进行匹配并生成步骤
  static matchWithTable(text, pattern, table, tableName = 'next') {
    const t = Array.from(text);
    const p = Array.from(pattern);
    let i = 0, j = 0;
    const steps = [];
    const log = (msg) => steps.push({ type: 'log', message: msg });

    log(`开始使用 ${tableName} 表进行匹配`);
    while (i < t.length && j < p.length) {
      steps.push({
        type: 'compare',
        i, j,
        chars: { ti: t[i], pj: p[j] },
        tableName,
      });
      if (j === -1 || t[i] === p[j]) {
        log(j === -1 ? `j = -1，i++，j=0` : `匹配：T[${i}] == P[${j}]，i++，j++`);
        i++; j++;
      } else {
        const oldJ = j;
        j = table[j];
        log(`失配：T[${i}] != P[${oldJ}]，j = ${tableName}[${oldJ}] -> ${j}`);
        steps.push({ type: 'jump', i, j, fromJ: oldJ, toJ: j, tableName });
      }
    }
    if (j === p.length) {
      log(`匹配成功：起始位置为 ${i - j}`);
      steps.push({ type: 'success', start: i - j, length: p.length });
    } else {
      log(`匹配失败：未找到完整匹配`);
      steps.push({ type: 'fail' });
    }
    return steps;
  }
}

class KMPRenderer {
  constructor() {
    this.canvas = document.getElementById('kmp-canvas');
    this.textRow = document.getElementById('text-row');
    this.patternRow = document.getElementById('pattern-row');
    this.nextIndexRow = document.getElementById('next-index-row');
    this.nextValueRow = document.getElementById('next-value-row');
    this.nextvalIndexRow = document.getElementById('nextval-index-row');
    this.nextvalValueRow = document.getElementById('nextval-value-row');
    this.operationLog = document.getElementById('operation-log');

    this.textLenLabel = document.getElementById('kmp-text-len');
    this.patternLenLabel = document.getElementById('kmp-pattern-len');
    this.iLabel = document.getElementById('kmp-i');
    this.jLabel = document.getElementById('kmp-j');
    this.matchCountLabel = document.getElementById('kmp-match-count');

    this.tCells = []; // 文本格子
    this.pCells = []; // 模式格子
    this.nextCells = []; // next 值格子
    this.nextIndexCells = []; // next 索引格子
    this.nextvalCells = []; // nextval 值格子
    this.nextvalIndexCells = []; // nextval 索引格子

    this.matches = 0;
    this.cellW = 40; this.gap = 8; this.currentStart = 0; // 用于滑动动画
  }

  clearGrid() {
    this.textRow.innerHTML = '';
    this.patternRow.innerHTML = '';
    this.tCells = []; this.pCells = [];
  }
  clearTables() {
    this.nextIndexRow.innerHTML = '';
    this.nextValueRow.innerHTML = '';
    this.nextvalIndexRow.innerHTML = '';
    this.nextvalValueRow.innerHTML = '';
    this.nextCells = []; this.nextIndexCells = [];
    this.nextvalCells = []; this.nextvalIndexCells = [];
  }
  clearLog() {
    this.operationLog.innerHTML = '<p class="log-empty">暂无步骤</p>';
  }

  renderText(text) {
    this.clearGrid();
    this.textRow.setAttribute('data-label', 'T:');
    Array.from(text).forEach((ch, idx) => {
      const cell = document.createElement('div');
      cell.className = 'kmp-cell';
      cell.textContent = ch;
      cell.setAttribute('data-idx', idx);
      this.textRow.appendChild(cell);
      this.tCells.push(cell);
    });
    this.textLenLabel.textContent = String(text.length);
    this.requestUpdateMetrics();
  }

  renderPattern(pattern) {
    this.patternRow.setAttribute('data-label', 'P:');
    this.patternRow.innerHTML = '';
    this.pCells = [];
    Array.from(pattern).forEach((ch, idx) => {
      const cell = document.createElement('div');
      cell.className = 'kmp-cell';
      cell.textContent = ch;
      cell.setAttribute('data-idx', idx);
      this.patternRow.appendChild(cell);
      this.pCells.push(cell);
    });
    this.patternLenLabel.textContent = String(pattern.length);
    this.setWindow(0, false);
    this.requestUpdateMetrics();
  }

  renderTable(indexRowEl, valueRowEl, indexCellsArr, valueCellsArr, values, type = 'next') {
    // 索引行
    for (let i = 0; i < values.length; i++) {
      const idxCell = document.createElement('div');
      idxCell.className = 'kmp-cell kmp-index';
      idxCell.textContent = String(i);
      indexRowEl.appendChild(idxCell);
      indexCellsArr.push(idxCell);

      const valCell = document.createElement('div');
      valCell.className = 'kmp-cell ' + (type === 'next' ? 'kmp-next-cell' : 'kmp-nextval-cell');
      valCell.textContent = String(values[i]);
      valCell.setAttribute('data-idx', i);
      valueRowEl.appendChild(valCell);
      valueCellsArr.push(valCell);
    }
  }

  renderNextTable(next) {
    this.clearTables();
    this.renderTable(this.nextIndexRow, this.nextValueRow, this.nextIndexCells, this.nextCells, next, 'next');
  }
  renderNextValTable(nextval) {
    this.renderTable(this.nextvalIndexRow, this.nextvalValueRow, this.nextvalIndexCells, this.nextvalCells, nextval, 'nextval');
  }

  setIJ(i, j) {
    this.iLabel.textContent = i === undefined ? '—' : String(i);
    this.jLabel.textContent = j === undefined ? '—' : String(j);
  }
  setMatchCount(n) { this.matchCountLabel.textContent = String(n); }

  appendLog(text) {
    if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'log-entry';
    p.textContent = text;
    this.operationLog.appendChild(p);
    this.operationLog.scrollTop = this.operationLog.scrollHeight;
  }

  unmarkAll() {
    document.querySelectorAll('.kmp-cell.rotating').forEach(el => el.classList.remove('rotating'));
  }

  highlightComparison(i, j) {
    this.unmarkAll();
    if (this.tCells[i]) this.tCells[i].classList.add('rotating');
    if (this.pCells[j]) this.pCells[j].classList.add('rotating');
  }

  highlightJump(fromJ, toJ, typeName = 'next') {
    this.unmarkAll();
    const arr = typeName === 'next' ? this.nextCells : this.nextvalCells;
    if (arr[fromJ]) arr[fromJ].classList.add('rotating');
    if (toJ >= 0 && arr[toJ]) arr[toJ].classList.add('rotating');
  }

  highlightSuccess(start, len) {
    this.unmarkAll();
    for (let k = 0; k < len; k++) {
      const i = start + k;
      if (this.tCells[i]) this.tCells[i].classList.add('rotating');
    }
    for (let k = 0; k < len; k++) {
      if (this.pCells[k]) this.pCells[k].classList.add('rotating');
    }
  }

  requestUpdateMetrics() { requestAnimationFrame(() => this.updateMetrics()); }
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
  setWindow(start, animate = true) {
    this.currentStart = start;
    const offset = start * (this.cellW + this.gap);
    if (!animate) this.patternRow.style.transition = 'none'; else this.patternRow.style.transition = '';
    this.patternRow.style.left = offset + 'px';
    if (!animate) requestAnimationFrame(() => { this.patternRow.style.transition = ''; });
  }
}

// 绑定 UI 与动画控制器
window.addEventListener('DOMContentLoaded', () => {
  const renderer = new KMPRenderer();
  const stepController = new AnimationStepController({
    nodeContainer: document.getElementById('kmp-grid'),
    canvas: document.getElementById('kmp-canvas'),
    overlayParent: document.body,
    onStep: (step) => {
      // 渲染与高亮
      if (!step) return;
      if (step.type === 'log') {
        renderer.appendLog(step.message);
        return;
      }
      if (step.type === 'compare') {
        renderer.setIJ(step.i, step.j);
        renderer.setWindow(step.i - step.j);
        renderer.appendLog(`比较：T[${step.i}]=${step.chars.ti} 与 P[${step.j}]=${step.chars.pj}`);
        renderer.highlightComparison(step.i, step.j);
        return;
      }
      if (step.type === 'jump') {
        renderer.setIJ(step.i, step.j);
        renderer.setWindow(step.i - step.j);
        renderer.appendLog(`跳转：j 从 ${step.fromJ} -> ${step.toJ}（${step.tableName}）`);
        renderer.highlightJump(step.fromJ, step.toJ, step.tableName);
        return;
      }
      if (step.type === 'success') {
        renderer.appendLog(`成功匹配：起始位置 ${step.start}，长度 ${step.length}`);
        renderer.setWindow(step.start);
        renderer.highlightSuccess(step.start, step.length);
        renderer.setMatchCount(renderer.matches + 1);
        return;
      }
      if (step.type === 'fail') {
        renderer.appendLog('匹配失败：未找到完整匹配');
        return;
      }
    }
  });
  stepController.bindControls(document.getElementById('step-prev-btn'), document.getElementById('step-next-btn'));
  stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });

  const textInput = document.getElementById('kmp-text');
  const patternInput = document.getElementById('kmp-pattern');
  const btnBuild = document.getElementById('kmp-build-btn');
  const btnRunNext = document.getElementById('kmp-run-next-btn');
  const btnRunNextVal = document.getElementById('kmp-run-nextval-btn');
  const btnClear = document.getElementById('kmp-clear-btn');

  let next = [];
  let nextval = [];

  const ensureInputs = () => {
    const T = textInput.value ?? ''; const P = patternInput.value ?? '';
    const t = T.trim(); const p = P.trim();
    if (!t || !p) { renderer.appendLog('请输入文本串 T 与模式串 P'); return null; }
    return { t, p };
  };

  const buildTables = () => {
    const T = textInput.value ?? ''; const P = patternInput.value ?? '';
    const t = T.trim(); const p = P.trim();
    if (!p) { renderer.appendLog('请输入模式串 P'); return; }
    renderer.clearLog(); renderer.matches = 0; renderer.setMatchCount(0);
    renderer.renderText(t); renderer.renderPattern(p);
    next = KMP.buildNext(p);
    nextval = KMP.buildNextVal(p, next);
    renderer.renderNextTable(next);
    renderer.renderNextValTable(nextval);
    renderer.appendLog('已计算 next 与 nextval 表');
    renderer.setIJ(undefined, undefined);
    stepController.setSteps('KMP 匹配步骤', []);
  };

  const runMatch = (useNextVal = false) => {
    const inp = ensureInputs(); if (!inp) return;
    const { t, p } = inp;
    if (!next.length || next.length !== p.length) {
      next = KMP.buildNext(p);
      nextval = KMP.buildNextVal(p, next);
      renderer.renderNextTable(next);
      renderer.renderNextValTable(nextval);
    }
    renderer.clearLog(); renderer.matches = 0; renderer.setMatchCount(0);
    renderer.renderText(t); renderer.renderPattern(p);
    const table = useNextVal ? nextval : next;
    const steps = KMP.matchWithTable(t, p, table, useNextVal ? 'nextval' : 'next');
    stepController.setSteps('KMP 匹配步骤', steps);
    // 初始展示第一步
    stepController.goTo(0);
  };

  btnBuild.addEventListener('click', buildTables);
  btnRunNext.addEventListener('click', () => runMatch(false));
  btnRunNextVal.addEventListener('click', () => runMatch(true));
  btnClear.addEventListener('click', () => {
    textInput.value = '';
    patternInput.value = '';
    renderer.clearGrid();
    renderer.clearTables();
    renderer.clearLog();
    renderer.setIJ(undefined, undefined);
    renderer.textLenLabel.textContent = '0';
    renderer.patternLenLabel.textContent = '0';
    renderer.setMatchCount(0);
    stepController.setSteps([]);
    renderer.unmarkAll();
  });
});
