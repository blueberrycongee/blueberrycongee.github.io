// 堆（最小/最大）可视化器：插入、删除堆顶、查看堆顶，含步骤回放

class BinaryHeap {
  constructor(mode = 'min', visualizer = null) {
    this.mode = mode; // 'min' 或 'max'
    this.data = [];
    this.visualizer = visualizer;
  }

  setMode(mode) {
    this.mode = mode === 'max' ? 'max' : 'min';
    // 切换模式后重新堆化
    this.heapify();
  }

  compare(a, b) { return this.mode === 'min' ? a < b : a > b; }

  async insert(val, steps = []) {
    this.data.push(val);
    steps.push({ message: `插入 ${val}`, highlightValues: [val], snapshot: this.snapshotHeap() });
    await this.visualizer.renderHeap();
    await this.bubbleUp(this.data.length - 1, steps);
  }

  async extractRoot(steps = []) {
    if (this.data.length === 0) return null;
    const root = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      steps.push({ message: `用最后元素 ${last} 覆盖堆顶 ${root}`, highlightValues: [root, last], snapshot: this.snapshotHeap() });
      await this.visualizer.renderHeap();
      await this.bubbleDown(0, steps);
    }
    steps.push({ message: `删除完成，返回堆顶 ${root}`, highlightValues: [root], snapshot: this.snapshotHeap() });
    await this.visualizer.renderHeap();
    return root;
  }

  peek() { return this.data.length ? this.data[0] : null; }

  async bubbleUp(idx, steps) {
    while (idx > 0) {
      const p = Math.floor((idx - 1) / 2);
      if (this.compare(this.data[idx], this.data[p])) {
        const a = this.data[idx], b = this.data[p];
        [this.data[idx], this.data[p]] = [this.data[p], this.data[idx]];
        steps.push({ message: `上浮交换 ${a} ↔ ${b}`, highlightValues: [a, b], snapshot: this.snapshotHeap() });
        await this.visualizer.renderHeap();
        idx = p;
      } else break;
    }
  }

  async bubbleDown(idx, steps) {
    const n = this.data.length;
    while (true) {
      const l = 2 * idx + 1, r = l + 1;
      let best = idx;
      if (l < n && this.compare(this.data[l], this.data[best])) best = l;
      if (r < n && this.compare(this.data[r], this.data[best])) best = r;
      if (best !== idx) {
        const a = this.data[idx], b = this.data[best];
        [this.data[idx], this.data[best]] = [this.data[best], this.data[idx]];
        steps.push({ message: `下沉交换 ${a} ↔ ${b}`, highlightValues: [a, b], snapshot: this.snapshotHeap() });
        await this.visualizer.renderHeap();
        idx = best;
      } else break;
    }
  }

  heapify() {
    const n = this.data.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      // 非动画版本下沉，用于模式切换
      this._bubbleDownNoAnim(i);
    }
  }

  _bubbleDownNoAnim(idx) {
    const n = this.data.length;
    while (true) {
      const l = 2 * idx + 1, r = l + 1;
      let best = idx;
      if (l < n && this.compare(this.data[l], this.data[best])) best = l;
      if (r < n && this.compare(this.data[r], this.data[best])) best = r;
      if (best !== idx) { [this.data[idx], this.data[best]] = [this.data[best], this.data[idx]]; idx = best; } else break;
    }
  }

  snapshotHeap() { return { data: [...this.data] }; }
}

class HeapVisualizer {
  constructor() {
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.modeGroup = document.getElementById('mode-group');
    this.heap = new BinaryHeap('min', this);
    this.stepController = new AnimationStepController({
      nodeContainer: this.nodeContainer,
      canvas: this.canvas,
      onStep: this.onStepChange.bind(this),
      overlayParent: document.body,
      overlayAutoHideMs: 3000
    });
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDisplay();
    this.renderHeap();
  }

  setupEventListeners() {
    // 模式切换
    this.modeGroup.querySelectorAll('input[name="heap-mode"]').forEach(r => {
      r.addEventListener('change', () => {
        if (!r.checked) return;
        const mode = r.value === 'max' ? 'max' : 'min';
        this.heap.setMode(mode);
        this.updateDisplay();
        const label = mode === 'min' ? '最小堆' : '最大堆';
        this.addLog(`切换模式为 ${label}（已重建堆）`, 'info');
        // 记录一次快照以便回放看到切换后的状态
        const steps = [{ message: `模式切换为 ${label}`, snapshot: this.heap.snapshotHeap() }];
        this.stepController.setSteps(`堆模式切换（${label}）`, steps);
        this.renderHeap();
      });
    });

    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) { this.addLog('请输入有效整数', 'error'); return; }
      const label = this.heap.mode === 'min' ? '最小堆' : '最大堆';
      const steps = [{ message: `插入开始（${label}）`, snapshot: this.heap.snapshotHeap() }];
      await this.heap.insert(val, steps);
      steps.push({ message: `插入完成（${label}）`, highlightValues: [val], snapshot: this.heap.snapshotHeap() });
      this.stepController.setSteps(`堆插入（${label}）`, steps);
      this.addLog(`插入元素: ${val}`, 'insert');
      this.updateDisplay();
      valInput.value = '';
    });

    document.getElementById('extract-btn').addEventListener('click', async () => {
      if (this.heap.data.length === 0) { this.addLog('堆为空，无法删除堆顶', 'error'); return; }
      const label = this.heap.mode === 'min' ? '最小堆' : '最大堆';
      const steps = [{ message: `删除堆顶开始（${label}）`, snapshot: this.heap.snapshotHeap() }];
      const root = await this.heap.extractRoot(steps);
      this.stepController.setSteps(`删除堆顶（${label}）`, steps);
      this.addLog(`删除堆顶: ${root}`, 'extract');
      this.updateDisplay();
    });

    document.getElementById('peek-btn').addEventListener('click', () => {
      const x = this.heap.peek();
      this.addLog(x != null ? `堆顶元素：${x}` : '堆为空', 'info');
    });

    document.getElementById('clear-btn').addEventListener('click', () => this.clearHeap());

    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
    this.stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });
  }

  clearHeap() {
    this.heap = new BinaryHeap(this.heap.mode, this);
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    this.stepController.clear();
    this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>';
    this.updateDisplay();
  }

  async renderHeap() {
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    const n = this.heap.data.length;
    if (n === 0) return;
    const layout = this.calculateLayout(n);
    await this.createNodes(layout);
    this.redrawConnections(layout);
  }

  calculateLayout(n) {
    const layout = new Map();
    const vSpace = 100; // 层间距
    const containerRect = this.nodeContainer.getBoundingClientRect();
    const header = document.querySelector('.canvas-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const baseY = Math.max(headerHeight + 16, 140);
    const getLevel = (i) => Math.floor(Math.log2(i + 1));
    const getPosInLevel = (i) => i - (Math.pow(2, getLevel(i)) - 1);
    // 预估节点宽度用于中心对齐
    const nodeWidth = 44;
    for (let i = 0; i < n; i++) {
      const lvl = getLevel(i);
      const pos = getPosInLevel(i);
      const count = Math.pow(2, lvl);
      const slots = count + 1; // 居中分布
      const cx = containerRect.width * ((pos + 1) / slots);
      const cy = baseY + lvl * vSpace;
      layout.set(i, { x: cx - nodeWidth / 2, y: cy - 18, cx, cy });
    }
    return layout;
  }

  async createNodes(layout) {
    for (let i = 0; i < this.heap.data.length; i++) {
      const pos = layout.get(i);
      const el = document.createElement('div');
      el.className = 'heap-node';
      el.dataset.index = String(i);
      el.textContent = String(this.heap.data[i]);
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      this.nodeContainer.appendChild(el);
      await this.sleep(10);
      el.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    }
  }

  redrawConnections(layout) {
    const drawLine = (fromIdx, toIdx) => {
      const from = layout.get(fromIdx);
      const to = layout.get(toIdx);
      if (!from || !to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.cx);
      line.setAttribute('y1', from.cy + 10);
      line.setAttribute('x2', to.cx);
      line.setAttribute('y2', to.cy - 14);
      this.canvas.appendChild(line);
    };
    const n = this.heap.data.length;
    for (let i = 0; i < n; i++) {
      const l = 2 * i + 1, r = l + 1;
      if (l < n) drawLine(i, l);
      if (r < n) drawLine(i, r);
    }
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  updateDisplay() {
    const countEl = document.getElementById('node-count');
    const heightEl = document.getElementById('tree-height');
    const modeEl = document.getElementById('heap-mode-label');
    const n = this.heap.data.length;
    if (countEl) countEl.textContent = String(n);
    if (modeEl) modeEl.textContent = this.heap.mode === 'min' ? '最小堆' : '最大堆';
    if (heightEl) {
      const h = n === 0 ? 0 : (Math.floor(Math.log2(n)) + 1);
      heightEl.textContent = String(h);
    }
  }

  addLog(message, type = 'info') {
    if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML = '';
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    this.operationLog.insertBefore(logEntry, this.operationLog.firstChild);
    while (this.operationLog.children.length > 20) this.operationLog.removeChild(this.operationLog.lastChild);
  }

  onStepChange(step) {
    if (!step) return;
    this.renderSnapshot(step.snapshot).then(() => {
      this.highlightValues(step.highlightValues || []);
    });
  }

  async renderSnapshot(snapshot) {
    if (!snapshot || !snapshot.data) return;
    this.heap.data = [...snapshot.data];
    await this.renderHeap();
  }

  snapshotHeap() { return this.heap.snapshotHeap(); }

  findContainersByValues(values) {
    const set = new Set(values.map(v => String(v)));
    const elements = Array.from(this.nodeContainer.querySelectorAll('.heap-node'));
    return elements.filter(el => set.has(el.textContent));
  }

  highlightValues(values) {
    const containers = this.findContainersByValues(values);
    if (containers.length) this.stepController.markNodes(containers);
  }
}

let heapVisualizer;
document.addEventListener('DOMContentLoaded', () => { heapVisualizer = new HeapVisualizer(); });
