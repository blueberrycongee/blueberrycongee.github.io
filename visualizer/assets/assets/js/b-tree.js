// B 树可视化器（插入与查找，含分裂步骤回放）

class BTreeNode {
  constructor(t, leaf = true) {
    this.t = t; // 最小度
    this.keys = [];
    this.children = [];
    this.leaf = leaf;
    this.parent = null;
    this.domElement = null;
    this.x = 0; this.y = 0;
    this.id = `btree-${Date.now()}-${Math.random()}`;
  }
  maxKeys() { return 2 * this.t - 1; }
  minKeys() { return this.leaf ? 0 : this.t - 1; }
}

class BTree {
  constructor(t = 3, visualizer = null) {
    this.t = t;
    this.root = new BTreeNode(this.t, true);
    this.visualizer = visualizer;
  }

  setDegree(t) {
    this.t = Math.max(2, parseInt(t, 10) || 3);
    // 仅影响后续插入；现有节点 t 属性保留当前可视含义
  }

  search(k) {
    let x = this.root;
    while (true) {
      let i = 0; while (i < x.keys.length && k > x.keys[i]) i++;
      if (i < x.keys.length && k === x.keys[i]) return { node: x, index: i };
      if (x.leaf) return { node: x, index: -1 };
      x = x.children[i];
    }
  }

  async insert(k, steps = []) {
    let r = this.root;
    if (r.keys.length === r.maxKeys()) {
      const s = new BTreeNode(this.t, false);
      this.root = s; s.children[0] = r; r.parent = s;
      await this.splitChild(s, 0, steps, '根满，分裂根并提升中键');
      await this.insertNonFull(s, k, steps);
    } else {
      await this.insertNonFull(r, k, steps);
    }
  }

  async insertNonFull(x, k, steps) {
    let i = x.keys.length - 1;
    if (x.leaf) {
      // 插入到叶子
      while (i >= 0 && k < x.keys[i]) i--;
      x.keys.splice(i + 1, 0, k);
      steps.push({ message: `叶子插入键 ${k}`, highlightValues: [k], snapshot: this.visualizer.snapshotTree(this.root) });
      await this.visualizer.renderTree();
    } else {
      while (i >= 0 && k < x.keys[i]) i--;
      i += 1;
      if (x.children[i].keys.length === x.children[i].maxKeys()) {
        await this.splitChild(x, i, steps, '子节点满，分裂并可能调整插入位置');
        if (k > x.keys[i]) i += 1;
      }
      await this.insertNonFull(x.children[i], k, steps);
    }
  }

  async splitChild(x, i, steps, msg = '分裂子节点') {
    const t = this.t; const y = x.children[i]; const z = new BTreeNode(t, y.leaf);
    z.parent = x;
    // 移动后半部分键到 z
    z.keys = y.keys.slice(t);
    const midKey = y.keys[t - 1];
    y.keys = y.keys.slice(0, t - 1);
    // 移动后半部分孩子到 z
    if (!y.leaf) {
      z.children = y.children.slice(t);
      z.children.forEach(c => { c.parent = z; });
      y.children = y.children.slice(0, t);
    }
    // 在 x 中插入中键与新孩子 z
    x.children.splice(i + 1, 0, z);
    let j = x.keys.length - 1;
    while (j >= 0 && midKey < x.keys[j]) j--;
    x.keys.splice(j + 1, 0, midKey);
    steps.push({ message: `${msg}（提升中键 ${midKey}）`, highlightValues: [midKey], snapshot: this.visualizer.snapshotTree(this.root) });
    await this.visualizer.renderTree();
  }

  getAllNodes(root = this.root, nodes = []) {
    if (!root) return nodes;
    nodes.push(root);
    if (!root.leaf) root.children.forEach(c => this.getAllNodes(c, nodes));
    return nodes;
  }
}

class BTreeVisualizer {
  constructor() {
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.degreeInput = document.getElementById('degree-input');
    this.tree = new BTree(parseInt(this.degreeInput.value, 10) || 3, this);
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
    this.renderTree();
  }

  setupEventListeners() {
    this.degreeInput.addEventListener('change', () => {
      const t = Math.max(2, parseInt(this.degreeInput.value, 10) || 3);
      this.tree.setDegree(t);
      this.updateDisplay();
      this.addLog(`最小度 t 设为 ${t}`, 'info');
    });

    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      const steps = [{ message: '插入开始', snapshot: this.snapshotTree(this.tree.root) }];
      await this.tree.insert(val, steps);
      steps.push({ message: '插入完成', highlightValues: [val], snapshot: this.snapshotTree(this.tree.root) });
      this.stepController.setSteps('B 树插入', steps);
      this.addLog(`插入键: ${val}`, 'insert');
      this.updateDisplay();
      valInput.value = '';
    });

    document.getElementById('search-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('search-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      const steps = [{ message: '查找开始', snapshot: this.snapshotTree(this.tree.root) }];
      const result = this.tree.search(val);
      steps.push({ message: result.index >= 0 ? `命中键 ${val}` : `未找到，停在叶子`, highlightValues: [val], snapshot: this.snapshotTree(this.tree.root) });
      this.stepController.setSteps('B 树查找', steps);
      this.addLog(`查找键: ${val} ${result.index >= 0 ? '（命中）' : '（未命中）'}`, 'info');
      this.updateDisplay();
      valInput.value = '';
    });

    document.getElementById('clear-btn').addEventListener('click', () => this.clearTree());

    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
  }

  clearTree() {
    this.tree = new BTree(parseInt(this.degreeInput.value, 10) || 3, this);
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    this.stepController.clear();
    this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>';
    this.updateDisplay();
  }

  async renderTree() {
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    if (!this.tree.root) return;
    // 根为空叶子且无键时不渲染占位节点，避免初始被头部遮挡看起来“被挡住”
    if (this.tree.root.leaf && this.tree.root.keys.length === 0 && this.tree.root.children.length === 0) return;
    const layout = this.calculateLayout(this.tree.root);
    await this.createNodes(layout);
    this.redrawConnections();
  }

  async createNodes(layout) {
    const traverse = async (node) => {
      if (!node) return;
      const pos = layout.get(node);
      const el = document.createElement('div');
      el.className = 'btree-node';
      el.dataset.nodeId = node.id;
      el.style.left = `${pos.x}px`; el.style.top = `${pos.y}px`;
      el.style.opacity = '0'; el.style.transform = 'scale(0.95)';
      const keysWrap = document.createElement('div');
      node.keys.forEach(k => {
        const s = document.createElement('span'); s.className = 'key-item'; s.textContent = String(k); keysWrap.appendChild(s);
      });
      el.appendChild(keysWrap);
      node.domElement = el; node.x = pos.cx; node.y = pos.cy;
      this.nodeContainer.appendChild(el);
      await this.sleep(10);
      el.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)'; el.style.opacity = '1'; el.style.transform = 'scale(1)';
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
    const walk = (node) => {
      if (!node || node.leaf) return;
      node.children.forEach(c => drawLine(node, c));
      node.children.forEach(c => walk(c));
    };
    walk(this.tree.root);
  }

  // 计算布局：根据子树叶子数分配水平位置
  calculateLayout(root) {
    const layout = new Map();
    const vSpace = 110; const hSpaceUnit = 48; // 每个叶子占宽度单位
    const containerRect = this.nodeContainer.getBoundingClientRect();
    // 动态计算首层 Y 偏移，确保首节点不被头部遮挡
    const header = document.querySelector('.canvas-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const baseY = Math.max(headerHeight + 16, 140);
    const leafCount = (node) => {
      if (!node) return 0; if (node.leaf) return 1; return node.children.reduce((sum, c) => sum + leafCount(c), 0);
    };
    const place = (node, leftX, rightX, depth) => {
      if (!node) return;
      const widthLeaves = leafCount(node);
      const spanWidth = widthLeaves * hSpaceUnit;
      const cx = (leftX + rightX) / 2; const cy = baseY + depth * vSpace;
      const nodeWidth = Math.max(60, node.keys.length * 36 + 24);
      layout.set(node, { x: cx - nodeWidth / 2, y: cy - 18, cx, cy });
      if (!node.leaf) {
        let curLeft = leftX;
        for (const c of node.children) {
          const w = leafCount(c) * hSpaceUnit;
          place(c, curLeft, curLeft + w, depth + 1);
          curLeft += w;
        }
      }
    };
    const totalLeaves = leafCount(root);
    const totalWidth = Math.max(containerRect.width - 80, totalLeaves * hSpaceUnit);
    const left = (containerRect.width - totalWidth) / 2; const right = left + totalWidth;
    place(root, left, right, 0);
    return layout;
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  updateDisplay() {
    const nodeCountEl = document.getElementById('node-count');
    const heightEl = document.getElementById('tree-height');
    const degreeEl = document.getElementById('degree-label');
    const emptyRoot = this.tree.root && this.tree.root.leaf && this.tree.root.keys.length === 0 && this.tree.root.children.length === 0;
    if (nodeCountEl) nodeCountEl.textContent = String(emptyRoot ? 0 : this.tree.getAllNodes().length);
    if (degreeEl) degreeEl.textContent = String(this.tree.t);
    if (heightEl) {
      const h = emptyRoot ? 0 : (root => { const f = n => n ? (1 + (n.leaf ? 0 : Math.max(...n.children.map(f)))) : 0; return f(root); })(this.tree.root);
      heightEl.textContent = String(h);
    }
  }

  addLog(message, type = 'info') {
    if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML = '';
    const logEntry = document.createElement('div'); logEntry.className = `log-entry ${type}`; logEntry.textContent = message;
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
    this.tree.root = this.buildTreeFromSnapshot(snapshot);
    await this.renderTree();
  }

  snapshotTree(root) {
    if (!root) return null;
    const dfs = (node) => {
      if (!node) return null;
      return {
        t: node.t,
        keys: [...node.keys],
        leaf: node.leaf,
        children: node.leaf ? [] : node.children.map(c => dfs(c))
      };
    };
    return dfs(root);
  }

  buildTreeFromSnapshot(snapshot, parent = null) {
    if (!snapshot) return null;
    const node = new BTreeNode(snapshot.t, snapshot.leaf);
    node.parent = parent; node.keys = [...snapshot.keys];
    node.children = snapshot.leaf ? [] : snapshot.children.map(s => this.buildTreeFromSnapshot(s, node));
    return node;
  }

  findContainersByValues(values) {
    const set = new Set(values.map(v => String(v)));
    const nodes = this.tree.getAllNodes().filter(n => n.keys.some(k => set.has(String(k))));
    return nodes.map(n => n.domElement).filter(Boolean);
  }

  highlightValues(values) {
    const containers = this.findContainersByValues(values);
    if (containers.length) this.stepController.markNodes(containers);
  }
}

let btreeVisualizer;
document.addEventListener('DOMContentLoaded', () => { btreeVisualizer = new BTreeVisualizer(); });