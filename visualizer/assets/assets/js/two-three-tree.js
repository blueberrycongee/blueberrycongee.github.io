// 2-3 树可视化器（插入与查找，含分裂步骤回放）

class TwoThreeNode {
  constructor(leaf = true) {
    this.keys = [];         // 每个节点 1 或 2 个键（溢出为 3 时需要分裂）
    this.children = [];     // 内部节点 2 或 3 个孩子
    this.leaf = leaf;
    this.parent = null;
    this.domElement = null;
    this.x = 0; this.y = 0;
    this.id = `23tree-${Date.now()}-${Math.random()}`;
  }
}

class TwoThreeTree {
  constructor(visualizer = null) {
    this.root = new TwoThreeNode(true);
    this.visualizer = visualizer;
  }

  search(k) {
    let x = this.root;
    while (x) {
      // 2-3 节点：按键有序判断孩子分支
      let i = 0; while (i < x.keys.length && k > x.keys[i]) i++;
      if (i < x.keys.length && k === x.keys[i]) return { node: x, index: i };
      if (x.leaf) return { node: x, index: -1 };
      // 选择对应孩子：keys=[a] -> children[0 or 1]；keys=[a,b] -> children[0,1,2]
      const childIndex = Math.min(i, x.children.length - 1);
      x = x.children[childIndex];
    }
    return { node: null, index: -1 };
  }

  async insert(k, steps = []) {
    const r = this.root;
    // 空树直接插入根
    if (r.leaf && r.keys.length === 0) {
      r.keys.push(k);
      steps.push({ message: `根插入键 ${k}`, highlightValues: [k], snapshot: this.visualizer.snapshotTree(this.root) });
      await this.visualizer.renderTree();
      return;
    }
    // 找到叶子并插入
    let leaf = this.findLeafForKey(k);
    this.insertIntoNode(leaf, k);
    steps.push({ message: `叶子插入键 ${k}`, highlightValues: [k], snapshot: this.visualizer.snapshotTree(this.root) });
    await this.visualizer.renderTree();
    // 若节点溢出（3 键）则自底向上分裂
    await this.fixOverflow(leaf, steps);
  }

  findLeafForKey(k) {
    let x = this.root;
    while (!x.leaf) {
      let i = 0; while (i < x.keys.length && k > x.keys[i]) i++;
      const idx = Math.min(i, x.children.length - 1);
      x = x.children[idx];
    }
    return x;
  }

  insertIntoNode(node, k) {
    let i = node.keys.length - 1;
    while (i >= 0 && k < node.keys[i]) i--;
    node.keys.splice(i + 1, 0, k);
  }

  async fixOverflow(node, steps) {
    // 当节点含 3 个键时进行分裂，并将中键提升到父节点；若父节点溢出则继续分裂
    let x = node;
    while (x && x.keys.length > 2) {
      const midKey = x.keys[1];
      // 构造左右节点
      const left = new TwoThreeNode(x.leaf);
      const right = new TwoThreeNode(x.leaf);
      left.parent = x.parent; right.parent = x.parent;
      left.keys = [x.keys[0]]; right.keys = [x.keys[2]];
      if (!x.leaf) {
        // 原 children 为 4 个：c0,c1,c2,c3 -> 左节点(c0,c1)，右节点(c2,c3)
        left.children = [x.children[0], x.children[1]];
        right.children = [x.children[2], x.children[3]];
        left.children.forEach(c => { if (c) c.parent = left; });
        right.children.forEach(c => { if (c) c.parent = right; });
      }

      if (!x.parent) {
        // 分裂根：新根含中键，左右为孩子
        const newRoot = new TwoThreeNode(false);
        newRoot.keys = [midKey];
        newRoot.children = [left, right];
        left.parent = newRoot; right.parent = newRoot;
        this.root = newRoot;
        steps.push({ message: `根满，分裂根并提升中键 ${midKey}` , highlightValues: [midKey], snapshot: this.visualizer.snapshotTree(this.root) });
        await this.visualizer.renderTree();
        break;
      } else {
        // 将中键插入父节点，并用左右节点替换原位置
        const p = x.parent;
        const idx = p.children.indexOf(x);
        // 在父节点索引处插入中键，保证与孩子分裂位置一致
        p.keys.splice(idx, 0, midKey);
        // 替换孩子：将 x 替换为 [left, right]
        p.children.splice(idx, 1, left, right);
        left.parent = p; right.parent = p;
        steps.push({ message: `分裂节点，提升中键 ${midKey}` , highlightValues: [midKey], snapshot: this.visualizer.snapshotTree(this.root) });
        await this.visualizer.renderTree();
        // 继续向上检查父节点是否溢出
        x = p;
      }
    }
  }

  getAllNodes(root = this.root, nodes = []) {
    if (!root) return nodes;
    nodes.push(root);
    if (!root.leaf) root.children.forEach(c => this.getAllNodes(c, nodes));
    return nodes;
  }
}

class TwoThreeVisualizer {
  constructor() {
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.tree = new TwoThreeTree(this);
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
    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      const steps = [{ message: '插入开始', snapshot: this.snapshotTree(this.tree.root) }];
      await this.tree.insert(val, steps);
      steps.push({ message: '插入完成', highlightValues: [val], snapshot: this.snapshotTree(this.tree.root) });
      this.stepController.setSteps('2-3 树插入', steps);
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
      this.stepController.setSteps('2-3 树查找', steps);
      this.addLog(`查找键: ${val} ${result.index >= 0 ? '（命中）' : '（未命中）'}`, 'info');
      this.updateDisplay();
      valInput.value = '';
    });

    document.getElementById('clear-btn').addEventListener('click', () => this.clearTree());

    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
    this.stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });
  }

  clearTree() {
    this.tree = new TwoThreeTree(this);
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
      // 复用 .btree-node 以匹配动画控制器的高亮清理
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
    const emptyRoot = this.tree.root && this.tree.root.leaf && this.tree.root.keys.length === 0 && this.tree.root.children.length === 0;
    if (nodeCountEl) nodeCountEl.textContent = String(emptyRoot ? 0 : this.tree.getAllNodes().length);
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
        keys: [...node.keys],
        leaf: node.leaf,
        children: node.leaf ? [] : node.children.map(c => dfs(c))
      };
    };
    return dfs(root);
  }

  buildTreeFromSnapshot(snapshot, parent = null) {
    if (!snapshot) return null;
    const node = new TwoThreeNode(snapshot.leaf);
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

let twoThreeVisualizer;
document.addEventListener('DOMContentLoaded', () => { twoThreeVisualizer = new TwoThreeVisualizer(); });
