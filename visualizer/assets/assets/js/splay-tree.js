// 伸展树可视化器

class SplayNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.domElement = null;
    this.x = 0;
    this.y = 0;
    this.id = `splay-${Date.now()}-${Math.random()}`;
  }
}

class SplayTree {
  constructor(visualizer = null) {
    this.root = null;
    this.visualizer = visualizer;
  }

  // 基本旋转（与指针更新）
  rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  rotateRight(y) {
    const x = y.left;
    y.left = x.right;
    if (x.right) x.right.parent = y;
    x.parent = y.parent;
    if (!y.parent) this.root = x;
    else if (y === y.parent.left) y.parent.left = x;
    else y.parent.right = x;
    x.right = y;
    y.parent = x;
  }

  insertRaw(value) {
    let z = new SplayNode(value);
    let y = null;
    let x = this.root;
    while (x) {
      y = x;
      if (z.value < x.value) x = x.left; else if (z.value > x.value) x = x.right; else return null; // 已存在
    }
    z.parent = y;
    if (!y) this.root = z;
    else if (z.value < y.value) y.left = z; else y.right = z;
    return z;
  }

  async splayDoubleAnimated(x, steps = []) {
    if (!x) return;
    const highlight = (vals) => (Array.isArray(vals) ? vals : []);
    while (x.parent) {
      const p = x.parent;
      const g = p.parent;
      if (!g) {
        // Zig
        if (x === p.left) {
          this.rotateRight(p);
          await this.visualizer.renderTree();
          steps.push({
            message: 'Zig：父节点右旋',
            highlightValues: highlight([p.value, x.value]),
            snapshot: this.visualizer.snapshotTree(this.root)
          });
        } else {
          this.rotateLeft(p);
          await this.visualizer.renderTree();
          steps.push({
            message: 'Zig：父节点左旋',
            highlightValues: highlight([p.value, x.value]),
            snapshot: this.visualizer.snapshotTree(this.root)
          });
        }
      } else if (x === p.left && p === g.left) {
        // Zig-Zig (LL)
        this.rotateRight(g);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zig：祖父右旋',
          highlightValues: highlight([g.value, p.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
        this.rotateRight(p);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zig：父节点右旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      } else if (x === p.right && p === g.right) {
        // Zig-Zig (RR)
        this.rotateLeft(g);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zig：祖父左旋',
          highlightValues: highlight([g.value, p.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
        this.rotateLeft(p);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zig：父节点左旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      } else if (x === p.right && p === g.left) {
        // Zig-Zag (LR)
        this.rotateLeft(p);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zag：父节点左旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
        this.rotateRight(g);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zag：祖父右旋',
          highlightValues: highlight([g.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      } else {
        // Zig-Zag (RL)
        this.rotateRight(p);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zag：父节点右旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
        this.rotateLeft(g);
        await this.visualizer.renderTree();
        steps.push({
          message: 'Zig-Zag：祖父左旋',
          highlightValues: highlight([g.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      }
      await this.visualizer.sleep(400);
    }
  }

  async splaySingleAnimated(x, steps = []) {
    if (!x) return;
    const highlight = (vals) => (Array.isArray(vals) ? vals : []);
    while (x.parent) {
      const p = x.parent;
      if (x === p.left) {
        this.rotateRight(p);
        await this.visualizer.renderTree();
        steps.push({
          message: '单层 Zig：父节点右旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      } else {
        this.rotateLeft(p);
        await this.visualizer.renderTree();
        steps.push({
          message: '单层 Zig：父节点左旋',
          highlightValues: highlight([p.value, x.value]),
          snapshot: this.visualizer.snapshotTree(this.root)
        });
      }
      await this.visualizer.sleep(300);
    }
  }

  async splayAnimated(x, steps = []) {
    if (!x) return;
    if (this.visualizer && this.visualizer.splayMode === 'single') {
      await this.splaySingleAnimated(x, steps);
    } else {
      await this.splayDoubleAnimated(x, steps);
    }
  }

  getAllNodes(root = this.root, nodes = []) {
    if (!root) return nodes;
    nodes.push(root);
    this.getAllNodes(root.left, nodes);
    this.getAllNodes(root.right, nodes);
    return nodes;
  }
}

class SplayVisualizer {
  constructor() {
    this.tree = new SplayTree(this);
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.splayMode = 'double';
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
  }

  setupEventListeners() {
    // 模式切换
    const modeRadios = document.querySelectorAll('input[name="splay-mode"]');
    modeRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        const val = e.target.value;
        this.splayMode = val === 'single' ? 'single' : 'double';
        this.updateDisplay();
        this.addLog(`伸展模式切换为：${this.splayMode === 'double' ? '双层' : '单层'}`, 'info');
      });
    });

    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) { this.addLog('请输入有效整数', 'error'); return; }
      await this.insertValue(val);
      valInput.value = '';
    });

    document.getElementById('search-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('search-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) { this.addLog('请输入有效整数', 'error'); return; }
      await this.searchValue(val);
      valInput.value = '';
    });

    document.getElementById('clear-btn').addEventListener('click', () => this.clearTree());

    // 绑定步进按钮
    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
    this.stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });
  }

  async insertValue(value) {
    const steps = [];
    steps.push({ message: '插入前', snapshot: this.snapshotTree(this.tree.root) });
    const z = this.tree.insertRaw(value);
    if (!z) { this.addLog(`值 ${value} 已存在，忽略插入`, 'info'); return; }
    await this.renderTree();
    steps.push({ message: '插入后（未伸展）', highlightValues: [z.value], snapshot: this.snapshotTree(this.tree.root) });
    await this.tree.splayAnimated(z, steps);
    steps.push({ message: '伸展完成', highlightValues: [this.tree.root?.value].filter(Boolean), snapshot: this.snapshotTree(this.tree.root) });
    const modeLabel = this.splayMode === 'double' ? '双层' : '单层';
    this.stepController.setSteps(`插入与伸展（${modeLabel}）`, steps);
    this.addLog(`插入并伸展值: ${value}（${modeLabel}）`, 'insert');
    this.updateDisplay();
  }

  async searchValue(value) {
    const steps = [];
    steps.push({ message: '查找前', snapshot: this.snapshotTree(this.tree.root) });
    let x = this.tree.root; let last = null;
    while (x) { last = x; if (value === x.value) break; x = value < x.value ? x.left : x.right; }
    if (!last) { this.addLog('空树，无法查找', 'info'); return; }
    await this.tree.splayAnimated(x || last, steps);
    await this.renderTree();
    steps.push({ message: '伸展完成', highlightValues: [this.tree.root?.value].filter(Boolean), snapshot: this.snapshotTree(this.tree.root) });
    const modeLabel = this.splayMode === 'double' ? '双层' : '单层';
    this.stepController.setSteps(`查找并伸展（${modeLabel}）`, steps);
    this.addLog(`查找并伸展值: ${value}${x ? '（命中）' : '（最近节点）'}（${modeLabel}）`, 'info');
    this.updateDisplay();
  }

  clearTree() {
    this.tree.root = null;
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    this.stepController.clear();
    this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>';
    this.updateDisplay();
  }

  async renderTree() {
    // 清空旧图形
    this.nodeContainer.querySelectorAll('.splay-node').forEach(node => node.remove());
    this.canvas.querySelectorAll('line').forEach(line => line.remove());
    if (!this.tree.root) return;

    // 计算布局并创建节点
    const layout = this.calculateLayout(this.tree.root);
    await this.createNodesWithAnimation(this.tree.root, layout);
    this.redrawConnections();
  }

  async createNodesWithAnimation(root, layout) {
    const createNodeElement = async (node) => {
      const pos = layout.get(node); if (!pos) return;
      const el = document.createElement('div');
      el.className = 'splay-node';
      el.dataset.nodeId = node.id;
      el.setAttribute('data-value', String(node.value));
      el.innerHTML = `<div class="node-value">${node.value}</div>`;
      node.domElement = el;
      node.x = pos.x; node.y = pos.y;
      el.style.left = `${pos.x - 35}px`;
      el.style.top = `${pos.y - 35}px`;
      el.style.opacity = '0';
      el.style.transform = 'scale(0)';
      this.nodeContainer.appendChild(el);
      await this.sleep(10);
      el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    };

    const traverse = async (node) => {
      if (!node) return;
      await createNodeElement(node);
      await traverse(node.left);
      await traverse(node.right);
    };
    await traverse(root);
  }

  redrawConnections() {
    const drawLine = (from, to) => {
      if (!from || !to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      this.canvas.appendChild(line);
    };
    const walk = (node) => {
      if (!node) return;
      if (node.left) drawLine(node, node.left);
      if (node.right) drawLine(node, node.right);
      walk(node.left); walk(node.right);
    };
    walk(this.tree.root);
  }

  // 简单布局：递归根据子树宽度分配x
  calculateLayout(root) {
    const layout = new Map();
    const nodeW = 70, hSpace = 100, vSpace = 120;
    const getWidth = (node) => { if (!node) return 0; return Math.max(1, getWidth(node.left) + getWidth(node.right) + 1); };
    const containerRect = this.nodeContainer.getBoundingClientRect();
    const startX = containerRect.width / 2; const startY = 200;
    const place = (node, x, y) => {
      if (!node) return; layout.set(node, { x, y });
      const lw = getWidth(node.left); const rw = getWidth(node.right);
      if (node.left) place(node.left, x - (rw + 1) * hSpace, y + vSpace);
      if (node.right) place(node.right, x + (lw + 1) * hSpace, y + vSpace);
    };
    place(root, startX, startY); return layout;
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  updateDisplay() {
    const nodeCountEl = document.getElementById('node-count');
    if (nodeCountEl) nodeCountEl.textContent = String(this.tree.getAllNodes().length);
    const heightEl = document.getElementById('tree-height');
    if (heightEl) {
      const h = (root => { const f = n => n ? (1 + Math.max(f(n.left), f(n.right))) : 0; return f(root); })(this.tree.root);
      heightEl.textContent = String(h);
    }
    const modeEl = document.getElementById('splay-mode-label');
    if (modeEl) modeEl.textContent = this.splayMode === 'double' ? '双层' : '单层';
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
      return { value: node.value, left: dfs(node.left), right: dfs(node.right) };
    };
    return dfs(root);
  }

  buildTreeFromSnapshot(snapshot) {
    if (!snapshot) return null;
    const build = (snap, parent = null) => {
      if (!snap) return null;
      const n = new SplayNode(snap.value);
      n.parent = parent;
      n.left = build(snap.left, n);
      n.right = build(snap.right, n);
      return n;
    };
    return build(snapshot, null);
  }

  findNodeByValue(value) {
    let cur = this.tree.root; while (cur) { if (value === cur.value) return cur; cur = value < cur.value ? cur.left : cur.right; } return null;
  }

  highlightValues(values) {
    const nodes = (values || []).map(v => this.findNodeByValue(v)).filter(Boolean);
    if (nodes.length) this.stepController.markNodes(nodes);
  }
}

let splayVisualizer;
document.addEventListener('DOMContentLoaded', () => { splayVisualizer = new SplayVisualizer(); });
