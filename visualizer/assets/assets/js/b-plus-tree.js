// B+ 树可视化器（插入与查找，叶子链渲染，含分裂回放）

class BPlusNode {
  constructor(t, leaf = true) {
    this.t = t;
    this.keys = [];
    this.children = [];
    this.leaf = leaf;
    this.parent = null;
    this.next = null; // 叶子链
    this.domElement = null; this.x = 0; this.y = 0;
    this.id = `bplus-${Date.now()}-${Math.random()}`;
  }
  maxKeys() { return 2 * this.t - 1; }
}

class BPlusTree {
  constructor(t = 3, visualizer = null) {
    this.t = t; this.visualizer = visualizer;
    this.root = new BPlusNode(t, true);
  }
  setDegree(t) { this.t = Math.max(2, parseInt(t, 10) || 3); }

  findLeaf(k) {
    let x = this.root;
    while (!x.leaf) {
      let i = 0; while (i < x.keys.length && k >= x.keys[i]) i++;
      x = x.children[i];
    }
    return x;
  }

  async insert(k, steps = []) {
    let leaf = this.findLeaf(k);
    // 插入到叶子
    let i = leaf.keys.length - 1; while (i >= 0 && k < leaf.keys[i]) i--; leaf.keys.splice(i + 1, 0, k);
    steps.push({ message: `叶子插入键 ${k}`, highlightValues: [k], snapshot: this.visualizer.snapshotTree(this.root) });
    await this.visualizer.renderTree();
    // 如果叶子溢出，分裂
    if (leaf.keys.length > leaf.maxKeys()) {
      await this.splitLeaf(leaf, steps);
    }
  }

  async splitLeaf(leaf, steps) {
    const t = this.t; const right = new BPlusNode(t, true);
    const mid = t; const move = leaf.keys.splice(mid); // 右侧 t 个键
    right.keys = move; right.next = leaf.next; leaf.next = right; right.parent = leaf.parent;
    const upKey = right.keys[0];
    if (!leaf.parent) {
      // 创建新根
      const newRoot = new BPlusNode(t, false);
      newRoot.keys = [upKey]; newRoot.children = [leaf, right]; leaf.parent = newRoot; right.parent = newRoot; this.root = newRoot;
      steps.push({ message: `叶子分裂，创建新根并提升分隔键 ${upKey}`, highlightValues: [upKey], snapshot: this.visualizer.snapshotTree(this.root) });
      await this.visualizer.renderTree();
    } else {
      await this.insertUp(leaf.parent, upKey, right, steps);
    }
  }

  async insertUp(parent, key, rightChild, steps) {
    let i = parent.keys.length - 1; while (i >= 0 && key < parent.keys[i]) i--; i += 1;
    parent.keys.splice(i, 0, key); parent.children.splice(i + 1, 0, rightChild); rightChild.parent = parent;
    steps.push({ message: `父节点插入分隔键 ${key}`, highlightValues: [key], snapshot: this.visualizer.snapshotTree(this.root) });
    await this.visualizer.renderTree();
    if (parent.keys.length > parent.maxKeys()) {
      await this.splitInternal(parent, steps);
    }
  }

  async splitInternal(node, steps) {
    const t = this.t; const right = new BPlusNode(t, false);
    const midIndex = t - 1; const upKey = node.keys[midIndex];
    const leftKeys = node.keys.slice(0, midIndex);
    const rightKeys = node.keys.slice(midIndex + 1);
    const leftChildren = node.children.slice(0, midIndex + 1);
    const rightChildren = node.children.slice(midIndex + 1);
    // 应用切分
    right.keys = rightKeys; right.children = rightChildren; rightChildren.forEach(c => c.parent = right);
    node.keys = leftKeys; node.children = leftChildren;
    if (!node.parent) {
      const newRoot = new BPlusNode(t, false);
      newRoot.keys = [upKey]; newRoot.children = [node, right]; node.parent = newRoot; right.parent = newRoot; this.root = newRoot;
      steps.push({ message: `内部节点分裂，创建新根并提升键 ${upKey}`, highlightValues: [upKey], snapshot: this.visualizer.snapshotTree(this.root) });
      await this.visualizer.renderTree();
    } else {
      await this.insertUp(node.parent, upKey, right, steps);
    }
  }

  search(k) {
    const leaf = this.findLeaf(k);
    const idx = leaf.keys.findIndex(x => x === k);
    return { node: leaf, index: idx };
  }

  getAllNodes(root = this.root, nodes = []) {
    if (!root) return nodes;
    nodes.push(root);
    if (!root.leaf) root.children.forEach(c => this.getAllNodes(c, nodes));
    return nodes;
  }
}

class BPlusVisualizer {
  constructor() {
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.degreeInput = document.getElementById('degree-input');
    this.tree = new BPlusTree(parseInt(this.degreeInput.value, 10) || 3, this);
    this.stepController = new AnimationStepController({
      nodeContainer: this.nodeContainer,
      canvas: this.canvas,
      onStep: this.onStepChange.bind(this),
      overlayParent: document.body,
      overlayAutoHideMs: 3000
    });
    this.init();
  }

  init() { this.setupEventListeners(); this.updateDisplay(); this.renderTree(); }

  setupEventListeners() {
    this.degreeInput.addEventListener('change', () => {
      const t = Math.max(2, parseInt(this.degreeInput.value, 10) || 3);
      this.tree.setDegree(t); this.updateDisplay();
      this.addLog(`最小度 t 设为 ${t}`, 'info');
    });

    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      const steps = [{ message: '插入开始', snapshot: this.snapshotTree(this.tree.root) }];
      await this.tree.insert(val, steps);
      steps.push({ message: '插入完成', highlightValues: [val], snapshot: this.snapshotTree(this.tree.root) });
      this.stepController.setSteps('B+ 树插入', steps);
      this.addLog(`插入键: ${val}`, 'insert');
      this.updateDisplay(); valInput.value = '';
    });

    document.getElementById('search-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('search-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      const steps = [{ message: '查找开始', snapshot: this.snapshotTree(this.tree.root) }];
      const result = this.tree.search(val);
      steps.push({ message: result.index >= 0 ? `命中键 ${val}` : `未找到，停在叶子`, highlightValues: [val], snapshot: this.snapshotTree(this.tree.root) });
      this.stepController.setSteps('B+ 树查找', steps);
      this.addLog(`查找键: ${val} ${result.index >= 0 ? '（命中）' : '（未命中）'}`, 'info');
      this.updateDisplay(); valInput.value = '';
    });

    document.getElementById('clear-btn').addEventListener('click', () => this.clearTree());
    const prevBtn = document.getElementById('step-prev-btn'); const nextBtn = document.getElementById('step-next-btn'); if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
  }

  clearTree() {
    this.tree = new BPlusTree(parseInt(this.degreeInput.value, 10) || 3, this);
    this.nodeContainer.innerHTML = ''; this.canvas.innerHTML = ''; this.stepController.clear(); this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>'; this.updateDisplay();
  }

  async renderTree() {
    this.nodeContainer.innerHTML = ''; this.canvas.innerHTML = '';
    if (!this.tree.root) return;
    // 空树（根是叶子且无键）不渲染初始占位节点，避免初始被头部遮挡看起来“被挡住”
    if (this.tree.root.leaf && this.tree.root.keys.length === 0 && this.tree.root.children.length === 0) return;
    const layout = this.calculateLayout(this.tree.root);
    await this.createNodes(layout);
    this.redrawConnections();
    this.drawLeafLinks(layout);
  }

  async createNodes(layout) {
    const traverse = async (node) => {
      if (!node) return;
      const pos = layout.get(node);
      const el = document.createElement('div'); el.className = 'bplus-node'; el.dataset.nodeId = node.id;
      el.style.left = `${pos.x}px`; el.style.top = `${pos.y}px`; el.style.opacity = '0'; el.style.transform = 'scale(0.95)';
      const keysWrap = document.createElement('div'); node.keys.forEach(k => { const s = document.createElement('span'); s.className = 'key-item'; s.textContent = String(k); keysWrap.appendChild(s); });
      el.appendChild(keysWrap); node.domElement = el; node.x = pos.cx; node.y = pos.cy; this.nodeContainer.appendChild(el);
      await this.sleep(10); el.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)'; el.style.opacity = '1'; el.style.transform = 'scale(1)';
      if (!node.leaf) for (const c of node.children) await traverse(c);
    };
    await traverse(this.tree.root);
  }

  redrawConnections() {
    const drawLine = (from, to) => {
      if (!from || !to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y + 10);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y - 14);
      this.canvas.appendChild(line);
    };
    const walk = (node) => { if (!node || node.leaf) return; node.children.forEach(c => drawLine(node, c)); node.children.forEach(c => walk(c)); };
    walk(this.tree.root);
  }

  drawLeafLinks(layout) {
    // 收集叶子并按 x 排序，绘制虚线连接
    const leaves = []; const collect = (n) => { if (!n) return; if (n.leaf) leaves.push(n); else n.children.forEach(collect); }; collect(this.tree.root);
    leaves.sort((a, b) => a.x - b.x);
    for (let i = 0; i < leaves.length - 1; i++) {
      const from = leaves[i]; const to = leaves[i + 1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y + 36);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y + 36);
      line.setAttribute('class', 'leaf-link');
      this.canvas.appendChild(line);
    }
  }

  // 计算布局：同 B 树
  calculateLayout(root) {
    const layout = new Map(); const vSpace = 110; const hSpaceUnit = 48; const containerRect = this.nodeContainer.getBoundingClientRect();
    // 动态计算首层 Y 偏移，确保首节点不被头部遮挡
    const header = document.querySelector('.canvas-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const baseY = Math.max(headerHeight + 16, 140);
    const leafCount = (node) => { if (!node) return 0; if (node.leaf) return 1; return node.children.reduce((sum, c) => sum + leafCount(c), 0); };
    const place = (node, leftX, rightX, depth) => {
      if (!node) return; const widthLeaves = leafCount(node); const spanWidth = widthLeaves * hSpaceUnit; const cx = (leftX + rightX) / 2; const cy = baseY + depth * vSpace; const nodeWidth = Math.max(60, node.keys.length * 36 + 24);
      layout.set(node, { x: cx - nodeWidth / 2, y: cy - 18, cx, cy });
      if (!node.leaf) { let curLeft = leftX; for (const c of node.children) { const w = leafCount(c) * hSpaceUnit; place(c, curLeft, curLeft + w, depth + 1); curLeft += w; } }
    };
    const totalLeaves = leafCount(root); const totalWidth = Math.max(containerRect.width - 80, totalLeaves * hSpaceUnit); const left = (containerRect.width - totalWidth) / 2; const right = left + totalWidth; place(root, left, right, 0); return layout;
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  updateDisplay() {
    const nodeCountEl = document.getElementById('node-count'); const heightEl = document.getElementById('tree-height'); const degreeEl = document.getElementById('degree-label');
    const emptyRoot = this.tree.root && this.tree.root.leaf && this.tree.root.keys.length === 0 && this.tree.root.children.length === 0;
    if (nodeCountEl) nodeCountEl.textContent = String(emptyRoot ? 0 : this.tree.getAllNodes().length);
    if (degreeEl) degreeEl.textContent = String(this.tree.t);
    if (heightEl) { const h = emptyRoot ? 0 : (root => { const f = n => n ? (1 + (n.leaf ? 0 : Math.max(...n.children.map(f)))) : 0; return f(root); })(this.tree.root); heightEl.textContent = String(h); }
  }

  addLog(message, type = 'info') {
    if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML = '';
    const logEntry = document.createElement('div'); logEntry.className = `log-entry ${type}`; logEntry.textContent = message; this.operationLog.insertBefore(logEntry, this.operationLog.firstChild); while (this.operationLog.children.length > 20) this.operationLog.removeChild(this.operationLog.lastChild);
  }

  onStepChange(step) { if (!step) return; this.renderSnapshot(step.snapshot).then(() => { this.highlightValues(step.highlightValues || []); }); }

  async renderSnapshot(snapshot) { this.tree.root = this.buildTreeFromSnapshot(snapshot); await this.renderTree(); }

  snapshotTree(root) {
    if (!root) return null;
    const dfs = (node) => { if (!node) return null; return { t: node.t, keys: [...node.keys], leaf: node.leaf, children: node.leaf ? [] : node.children.map(c => dfs(c)) }; };
    return dfs(root);
  }

  buildTreeFromSnapshot(snapshot, parent = null) {
    if (!snapshot) return null; const node = new BPlusNode(snapshot.t, snapshot.leaf); node.parent = parent; node.keys = [...snapshot.keys]; node.children = snapshot.leaf ? [] : snapshot.children.map(s => this.buildTreeFromSnapshot(s, node)); return node;
  }

  findContainersByValues(values) { const set = new Set(values.map(v => String(v))); const nodes = this.tree.getAllNodes().filter(n => n.keys.some(k => set.has(String(k)))); return nodes.map(n => n.domElement).filter(Boolean); }
  highlightValues(values) { const containers = this.findContainersByValues(values); if (containers.length) this.stepController.markNodes(containers); }
}

let bplusVisualizer; document.addEventListener('DOMContentLoaded', () => { bplusVisualizer = new BPlusVisualizer(); });