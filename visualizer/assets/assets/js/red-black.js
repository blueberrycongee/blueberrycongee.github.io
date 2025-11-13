// 红黑树可视化器

class RBTNode {
  constructor(value, color = 'red') {
    this.value = value;
    this.color = color; // 'red' | 'black'
    this.left = null;
    this.right = null;
    this.parent = null;
    this.domElement = null;
    this.x = 0;
    this.y = 0;
    this.id = `rbt-${Date.now()}-${Math.random()}`;
  }
}

class RedBlackTree {
  constructor(visualizer = null) {
    this.root = null;
    this.visualizer = visualizer;
  }

  // 左旋
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

  // 右旋
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

  // 仅执行 BST 插入，不做修复；返回新节点 z
  insertRaw(value) {
    let z = new RBTNode(value, 'red');
    let y = null;
    let x = this.root;
    while (x) {
      y = x;
      if (z.value < x.value) x = x.left; else if (z.value > x.value) x = x.right; else return null; // 已存在，忽略
    }
    z.parent = y;
    if (!y) this.root = z;
    else if (z.value < y.value) y.left = z; else y.right = z;
    return z;
  }

  // 分步动画执行插入修复（需要已渲染），并记录每步后的结构快照
  async insertFixupAnimated(z, steps = []) {
    if (!z) return;
    const overlay = document.createElement('div');
    overlay.className = 'animation-overlay show';
    overlay.innerHTML = `<div class="rotation-title">插入修复</div><div class="rotation-step"></div>`;
    document.body.appendChild(overlay);
    const stepEl = overlay.querySelector('.rotation-step');

    const markNodes = (nodes) => {
      (nodes || []).forEach(n => {
        if (n && n.domElement) n.domElement.classList.add('rotating');
      });
    };
    const unmarkAll = () => {
      const all = this.visualizer.nodeContainer.querySelectorAll('.rbt-node');
      all.forEach(el => el.classList.remove('rotating'));
      this.visualizer.canvas.querySelectorAll('line').forEach(line => line.classList.remove('rotating'));
    };

    while (z.parent && z.parent.color === 'red') {
      const gp = z.parent.parent;
      if (!gp) break;
      if (z.parent === gp.left) {
        const y = gp.right; // 叔叔
        if (y && y.color === 'red') {
          stepEl.textContent = '父与叔变黑，祖父变红';
          unmarkAll();
          markNodes([z.parent, y, gp]);
          await this.visualizer.sleep(900);
          z.parent.color = 'black';
          y.color = 'black';
          gp.color = 'red';
          await this.visualizer.renderTree();
          steps.push({
            message: '父与叔变黑，祖父变红',
            highlightValues: [z.parent.value, y.value, gp.value],
            snapshot: this.visualizer.snapshotTree(this.root)
          });
          z = gp;
        } else {
          if (z === z.parent.right) {
            stepEl.textContent = '父节点左旋';
            unmarkAll();
            markNodes([z.parent, z]);
            await this.visualizer.sleep(900);
            this.rotateLeft(z.parent);
            await this.visualizer.renderTree();
            steps.push({
              message: '父节点左旋',
              highlightValues: [z.parent.value, z.value],
              snapshot: this.visualizer.snapshotTree(this.root)
            });
            z = z.left;
          }
          stepEl.textContent = '祖父右旋并重着色';
          unmarkAll();
          markNodes([gp, z.parent]);
          await this.visualizer.sleep(900);
          z.parent.color = 'black';
          gp.color = 'red';
          this.rotateRight(gp);
          await this.visualizer.renderTree();
          steps.push({
            message: '祖父右旋并重着色',
            highlightValues: [gp.value, z.parent.value],
            snapshot: this.visualizer.snapshotTree(this.root)
          });
        }
      } else {
        const y = gp.left;
        if (y && y.color === 'red') {
          stepEl.textContent = '父与叔变黑，祖父变红';
          unmarkAll();
          markNodes([z.parent, y, gp]);
          await this.visualizer.sleep(900);
          z.parent.color = 'black';
          y.color = 'black';
          gp.color = 'red';
          await this.visualizer.renderTree();
          steps.push({
            message: '父与叔变黑，祖父变红',
            highlightValues: [z.parent.value, y.value, gp.value],
            snapshot: this.visualizer.snapshotTree(this.root)
          });
          z = gp;
        } else {
          if (z === z.parent.left) {
            stepEl.textContent = '父节点右旋';
            unmarkAll();
            markNodes([z.parent, z]);
            await this.visualizer.sleep(900);
            this.rotateRight(z.parent);
            await this.visualizer.renderTree();
            steps.push({
              message: '父节点右旋',
              highlightValues: [z.parent.value, z.value],
              snapshot: this.visualizer.snapshotTree(this.root)
            });
            z = z.right;
          }
          stepEl.textContent = '祖父左旋并重着色';
          unmarkAll();
          markNodes([gp, z.parent]);
          await this.visualizer.sleep(900);
          z.parent.color = 'black';
          gp.color = 'red';
          this.rotateLeft(gp);
          await this.visualizer.renderTree();
          steps.push({
            message: '祖父左旋并重着色',
            highlightValues: [gp.value, z.parent.value],
            snapshot: this.visualizer.snapshotTree(this.root)
          });
        }
      }
    }
    // 根置黑
    if (this.root) {
      stepEl.textContent = '根节点着黑';
      await this.visualizer.sleep(600);
      this.root.color = 'black';
      await this.visualizer.renderTree();
      steps.push({
        message: '根节点着黑',
        highlightValues: [this.root.value],
        snapshot: this.visualizer.snapshotTree(this.root)
      });
    }
    unmarkAll();
    overlay.remove();
  }

  // 获取所有节点（渲染辅助）
  getAllNodes(root = this.root, nodes = []) {
    if (!root) return nodes;
    nodes.push(root);
    this.getAllNodes(root.left, nodes);
    this.getAllNodes(root.right, nodes);
    return nodes;
  }

  // ====== 删除相关辅助方法 ======
  colorOf(node) { return node ? node.color : 'black'; }

  find(value) {
    let cur = this.root;
    while (cur) {
      if (value === cur.value) return cur;
      cur = value < cur.value ? cur.left : cur.right;
    }
    return null;
  }

  transplant(u, v) {
    if (!u) return;
    if (!u.parent) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    if (v) v.parent = u.parent;
  }

  minimum(node) {
    let cur = node;
    while (cur && cur.left) cur = cur.left;
    return cur;
  }

  // 执行删除的结构调整，返回 { x, xParent, yOriginalColor }
  deleteStructural(z, steps) {
    let y = z;
    let yOriginalColor = y.color;
    let x = null;
    let xParent = null;

    if (!z.left) {
      x = z.right;
      xParent = z.parent;
      this.transplant(z, z.right);
      steps.push({ message: `删除节点 ${z.value}（无左子）`, highlightValues: [z.value], snapshot: this.visualizer.snapshotTree(this.root) });
    } else if (!z.right) {
      x = z.left;
      xParent = z.parent;
      this.transplant(z, z.left);
      steps.push({ message: `删除节点 ${z.value}（无右子）`, highlightValues: [z.value], snapshot: this.visualizer.snapshotTree(this.root) });
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      xParent = y.parent;
      if (y.parent === z) {
        xParent = y; // 若直接是被删节点的右孩子，则 x 的父视为 y
      } else {
        this.transplant(y, y.right);
        y.right = z.right;
        if (y.right) y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      if (y.left) y.left.parent = y;
      y.color = z.color;
      steps.push({ message: `用后继 ${y.value} 替换并调整结构`, highlightValues: [y.value, z.value], snapshot: this.visualizer.snapshotTree(this.root) });
    }

    return { x, xParent, yOriginalColor };
  }

  // 删除修复（动画版）：使用可视化器渲染并记录步骤
  async deleteFixupAnimated(x, parent, steps = []) {
    const overlay = document.createElement('div');
    overlay.className = 'animation-overlay show';
    overlay.innerHTML = `<div class="rotation-title">删除修复</div><div class="rotation-step"></div>`;
    document.body.appendChild(overlay);
    const stepEl = overlay.querySelector('.rotation-step');

    const markNodes = (nodes) => {
      (nodes || []).forEach(n => { if (n && n.domElement) n.domElement.classList.add('rotating'); });
    };
    const unmarkAll = () => {
      const all = this.visualizer.nodeContainer.querySelectorAll('.rbt-node');
      all.forEach(el => el.classList.remove('rotating'));
      this.visualizer.canvas.querySelectorAll('line').forEach(line => line.classList.remove('rotating'));
    };

    const color = (n) => (n ? n.color : 'black');

    let xNode = x;
    let p = parent;
    while (xNode !== this.root && color(xNode) === 'black') {
      if (xNode === (p ? p.left : null)) {
        let w = p ? p.right : null;
        if (color(w) === 'red') {
          stepEl.textContent = '兄弟为红：父染红，兄弟染黑，左旋父';
          unmarkAll(); markNodes([p, w]);
          await this.visualizer.sleep(700);
          w.color = 'black'; p.color = 'red'; this.rotateLeft(p);
          await this.visualizer.renderTree();
          steps.push({ message: '兄弟为红：父染红，兄弟染黑，左旋父', highlightValues: [p?.value, w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          w = p ? p.right : null;
        }
        if (color(w?.left) === 'black' && color(w?.right) === 'black') {
          stepEl.textContent = '兄弟与其子均黑：兄弟染红，向上修复';
          unmarkAll(); markNodes([w]);
          await this.visualizer.sleep(700);
          if (w) w.color = 'red';
          await this.visualizer.renderTree();
          steps.push({ message: '兄弟与其子均黑：兄弟染红，向上修复', highlightValues: [w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          xNode = p; p = xNode ? xNode.parent : null;
        } else {
          if (color(w?.right) === 'black') {
            stepEl.textContent = '兄弟右子为黑：兄弟染红，左子染黑，右旋兄弟';
            unmarkAll(); markNodes([w, w?.left].filter(Boolean));
            await this.visualizer.sleep(700);
            if (w?.left) w.left.color = 'black'; if (w) w.color = 'red'; this.rotateRight(w);
            await this.visualizer.renderTree();
            steps.push({ message: '兄弟右子为黑：右旋兄弟以转为 Case4', highlightValues: [w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
            w = p ? p.right : null;
          }
          stepEl.textContent = '兄弟右子为红：兄弟取父色，父染黑，兄弟右子染黑，左旋父';
          unmarkAll(); markNodes([p, w, w?.right].filter(Boolean));
          await this.visualizer.sleep(700);
          if (w) w.color = p?.color || 'black'; if (p) p.color = 'black'; if (w?.right) w.right.color = 'black'; this.rotateLeft(p);
          await this.visualizer.renderTree();
          steps.push({ message: '左旋父并重着色：修复完成', highlightValues: [p?.value, w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          xNode = this.root; // 结束循环
        }
      } else {
        let w = p ? p.left : null;
        if (color(w) === 'red') {
          stepEl.textContent = '兄弟为红：父染红，兄弟染黑，右旋父';
          unmarkAll(); markNodes([p, w]);
          await this.visualizer.sleep(700);
          w.color = 'black'; p.color = 'red'; this.rotateRight(p);
          await this.visualizer.renderTree();
          steps.push({ message: '兄弟为红：父染红，兄弟染黑，右旋父', highlightValues: [p?.value, w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          w = p ? p.left : null;
        }
        if (color(w?.left) === 'black' && color(w?.right) === 'black') {
          stepEl.textContent = '兄弟与其子均黑：兄弟染红，向上修复';
          unmarkAll(); markNodes([w]);
          await this.visualizer.sleep(700);
          if (w) w.color = 'red';
          await this.visualizer.renderTree();
          steps.push({ message: '兄弟与其子均黑：兄弟染红，向上修复', highlightValues: [w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          xNode = p; p = xNode ? xNode.parent : null;
        } else {
          if (color(w?.left) === 'black') {
            stepEl.textContent = '兄弟左子为黑：兄弟染红，右子染黑，左旋兄弟';
            unmarkAll(); markNodes([w, w?.right].filter(Boolean));
            await this.visualizer.sleep(700);
            if (w?.right) w.right.color = 'black'; if (w) w.color = 'red'; this.rotateLeft(w);
            await this.visualizer.renderTree();
            steps.push({ message: '兄弟左子为黑：左旋兄弟以转为 Case4', highlightValues: [w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
            w = p ? p.left : null;
          }
          stepEl.textContent = '兄弟左子为红：兄弟取父色，父染黑，兄弟左子染黑，右旋父';
          unmarkAll(); markNodes([p, w, w?.left].filter(Boolean));
          await this.visualizer.sleep(700);
          if (w) w.color = p?.color || 'black'; if (p) p.color = 'black'; if (w?.left) w.left.color = 'black'; this.rotateRight(p);
          await this.visualizer.renderTree();
          steps.push({ message: '右旋父并重着色：修复完成', highlightValues: [p?.value, w?.value].filter(Boolean), snapshot: this.visualizer.snapshotTree(this.root) });
          xNode = this.root; // 结束循环
        }
      }
    }
    if (xNode) {
      stepEl.textContent = '最终节点着黑';
      await this.visualizer.sleep(500);
      xNode.color = 'black';
      await this.visualizer.renderTree();
      steps.push({ message: '最终节点着黑', highlightValues: [xNode.value], snapshot: this.visualizer.snapshotTree(this.root) });
    }
    unmarkAll();
    overlay.remove();
  }
}

class RBTVisualizer {
  constructor() {
    this.tree = new RedBlackTree(this);
    this.canvas = document.getElementById('tree-canvas');
    this.nodeContainer = document.getElementById('node-container');
    this.operationLog = document.getElementById('operation-log');
    this.batchDeleteQueue = [];
    this.contextMenu = null;
    this.contextMenuTargetValue = null;
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
    this.setupContextMenu();
    this.renderQueue();
    this.updateDisplay();
  }

  setupEventListeners() {
    document.getElementById('insert-btn').addEventListener('click', async () => {
      const valInput = document.getElementById('insert-input');
      const val = parseInt(valInput.value, 10);
      if (Number.isNaN(val)) return;
      await this.insertValue(val);
      valInput.value = '';
    });
    document.getElementById('clear-btn').addEventListener('click', () => this.clearTree());

    // 删除
    const delBtn = document.getElementById('delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        const delInput = document.getElementById('delete-input');
        const val = parseInt(delInput.value, 10);
        if (Number.isNaN(val)) return;
        await this.deleteValue(val);
        delInput.value = '';
      });
    }

    // 绑定步进按钮
    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) {
      this.stepController.bindControls(prevBtn, nextBtn);
    }

    // 批量删除队列按钮
    const runBtn = document.getElementById('batch-run-btn');
    const clearBtn = document.getElementById('batch-clear-btn');
    if (runBtn) {
      runBtn.addEventListener('click', async () => {
        if (!this.batchDeleteQueue.length) return;
        this.addLog(`批量删除开始：${this.batchDeleteQueue.join(', ')}`, 'info');
        // 聚合所有删除步骤，支持完整回退到批量开始之前
        const aggregatedSteps = [];
        const batchStartSnap = this.snapshotTree(this.tree.root);
        aggregatedSteps.push({ message: '批量删除前（原树）', highlightValues: [], snapshot: batchStartSnap });
        for (const v of [...this.batchDeleteQueue]) {
          const steps = await this.deleteValue(v, { collectOnly: true });
          aggregatedSteps.push(...steps);
          await this.sleep(200);
        }
        this.batchDeleteQueue = [];
        this.renderQueue();
        this.addLog('批量删除完成', 'info');
        if (this.stepController) this.stepController.setSteps('批量删除过程', aggregatedSteps);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.batchDeleteQueue = [];
        this.renderQueue();
        this.addLog('已清空批量删除队列', 'info');
      });
    }
  }

  async insertValue(value) {
    // 记录插入前快照
    const beforeSnap = this.snapshotTree(this.tree.root);
    // 仅插入新节点，不修复
    const z = this.tree.insertRaw(value);
    if (!z) return; // 重复值忽略
    this.addLog(`插入节点: ${value}`, 'insert');
    // 先渲染出插入后的初始结构（未修复）
    await this.renderTree();
    // 记录插入后（未修复）快照
    const afterRawSnap = this.snapshotTree(this.tree.root);
    const steps = [
      { message: '插入前（原树）', highlightValues: [], snapshot: beforeSnap },
      { message: `插入后（未修复）：${value}`, highlightValues: [value], snapshot: afterRawSnap }
    ];
    // 分步修复并在每步后渲染（形成动画）
    await this.tree.insertFixupAnimated(z, steps);
    // 确保最终状态
    await this.renderTree();
    // 将完整步骤交给步进控制器（仅点击步进，多次点击多步）
    if (this.stepController) {
      this.stepController.setSteps('插入过程', steps);
    }
    this.updateDisplay();
  }

  async deleteValue(value, options = {}) {
    const { collectOnly = false } = options;
    if (!this.tree.root) return;
    const z = this.tree.find(value);
    if (!z) { this.addLog(`删除失败：未找到 ${value}`, 'info'); return; }
    this.addLog(`删除节点: ${value}`, 'delete');

    const beforeSnap = this.snapshotTree(this.tree.root);
    // 先执行结构调整
    const steps = [ { message: '删除前（原树）', highlightValues: [], snapshot: beforeSnap } ];
    const { x, xParent, yOriginalColor } = this.tree.deleteStructural(z, steps);
    await this.renderTree();
    // 若删除的是黑色节点，需要修复
    if (yOriginalColor === 'black') {
      await this.tree.deleteFixupAnimated(x, xParent, steps);
      await this.renderTree();
    }
    // 设置步骤集（批量收集时跳过设置，仅返回步骤）
    if (!collectOnly && this.stepController) this.stepController.setSteps('删除过程', steps);
    this.updateDisplay();
    return steps;
  }

  clearTree() {
    this.nodeContainer.querySelectorAll('.rbt-node').forEach(node => node.remove());
    this.canvas.querySelectorAll('line').forEach(line => line.remove());
    this.tree = new RedBlackTree(this);
    this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>';
    this.updateDisplay();
  }

  async renderTree() {
    // 清空旧图形
    this.nodeContainer.querySelectorAll('.rbt-node').forEach(node => node.remove());
    this.canvas.querySelectorAll('line').forEach(line => line.remove());
    if (!this.tree.root) return;

    // 计算布局
    const layout = this.calculateLayout(this.tree.root);
    // 创建节点
    await this.createNodesWithAnimation(this.tree.root, layout);
    // 画连线
    this.redrawConnections();
  }

  async createNodesWithAnimation(root, layout) {
    const createNodeElement = async (node) => {
      const pos = layout.get(node);
      if (!pos) return;
      const el = document.createElement('div');
      el.className = `rbt-node ${node.color}`;
      el.dataset.nodeId = node.id;
      el.innerHTML = `
        <div class="node-value">${node.value}</div>
        <div class="node-color">${node.color.toUpperCase()}</div>
      `;
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

      // 右键菜单
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.openContextMenu(e.pageX, e.pageY, node.value);
      });
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
      walk(node.left);
      walk(node.right);
    };
    walk(this.tree.root);
  }

  // 简单布局：递归根据子树宽度分配x
  calculateLayout(root) {
    const layout = new Map();
    const nodeW = 70, hSpace = 100, vSpace = 120;
    const getWidth = (node) => {
      if (!node) return 0;
      return Math.max(1, getWidth(node.left) + getWidth(node.right) + 1);
    };
    const containerRect = this.nodeContainer.getBoundingClientRect();
    const startX = containerRect.width / 2;
    const startY = 200;

    const place = (node, x, y) => {
      if (!node) return;
      layout.set(node, { x, y });
      const lw = getWidth(node.left);
      const rw = getWidth(node.right);
      if (node.left) place(node.left, x - (rw + 1) * hSpace, y + vSpace);
      if (node.right) place(node.right, x + (lw + 1) * hSpace, y + vSpace);
    };
    place(root, startX, startY);
    return layout;
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  updateDisplay() {
    // 更新节点数
    const nodeCountEl = document.getElementById('node-count');
    if (nodeCountEl) nodeCountEl.textContent = String(this.tree.getAllNodes().length);
    // 简单估计黑高度：沿最左路径统计黑节点数
    const blackHeightEl = document.getElementById('black-height');
    if (blackHeightEl) {
      let cur = this.tree.root;
      let bh = 0;
      while (cur) {
        if (cur.color === 'black') bh += 1;
        cur = cur.left;
      }
      blackHeightEl.textContent = String(bh);
    }
  }

  addLog(message, type = 'info') {
    if (this.operationLog.querySelector('.log-empty')) {
      this.operationLog.innerHTML = '';
    }
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    this.operationLog.insertBefore(logEntry, this.operationLog.firstChild);
    while (this.operationLog.children.length > 20) {
      this.operationLog.removeChild(this.operationLog.lastChild);
    }
  }

  // ====== 右键上下文菜单与批量删除队列 ======
  setupContextMenu() {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="delete">删除该节点</div>
      <div class="context-menu-item" data-action="enqueue">加入批量删除队列</div>
      <div class="context-menu-item" data-action="dequeue">从队列移除</div>
    `;
    document.body.appendChild(menu);
    this.contextMenu = menu;
    // 全局隐藏逻辑
    document.addEventListener('click', () => this.hideContextMenu());
    window.addEventListener('scroll', () => this.hideContextMenu(), { passive: true });
    window.addEventListener('resize', () => this.hideContextMenu());
    // 菜单点击
    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('.context-menu-item');
      if (!item) return;
      const action = item.dataset.action;
      const value = this.contextMenuTargetValue;
      this.hideContextMenu();
      if (value == null) return;
      if (action === 'delete') {
        await this.deleteValue(value);
      } else if (action === 'enqueue') {
        if (!this.batchDeleteQueue.includes(value)) {
          this.batchDeleteQueue.push(value);
          this.renderQueue();
          this.addLog(`加入队列：${value}`, 'info');
        }
      } else if (action === 'dequeue') {
        const idx = this.batchDeleteQueue.indexOf(value);
        if (idx >= 0) {
          this.batchDeleteQueue.splice(idx, 1);
          this.renderQueue();
          this.addLog(`从队列移除：${value}`, 'info');
        }
      }
    });
  }

  openContextMenu(x, y, value) {
    if (!this.contextMenu) return;
    this.contextMenuTargetValue = value;
    // 根据队列状态显示/隐藏 "dequeue"
    const inQueue = this.batchDeleteQueue.includes(value);
    const enqueueItem = this.contextMenu.querySelector('[data-action="enqueue"]');
    const dequeueItem = this.contextMenu.querySelector('[data-action="dequeue"]');
    if (enqueueItem) enqueueItem.style.display = inQueue ? 'none' : '';
    if (dequeueItem) dequeueItem.style.display = inQueue ? '' : 'none';
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = 'block';
  }

  hideContextMenu() {
    if (this.contextMenu) this.contextMenu.style.display = 'none';
    this.contextMenuTargetValue = null;
  }

  renderQueue() {
    const panel = document.getElementById('batch-delete-queue');
    const runBtn = document.getElementById('batch-run-btn');
    if (panel) {
      panel.innerHTML = '';
      if (!this.batchDeleteQueue.length) {
        const empty = document.createElement('div');
        empty.className = 'queue-empty';
        empty.textContent = '队列为空';
        panel.appendChild(empty);
      } else {
        this.batchDeleteQueue.forEach(v => {
          const chip = document.createElement('span');
          chip.className = 'queue-chip';
          chip.textContent = String(v);
          chip.title = '点击移除';
          chip.addEventListener('click', () => {
            const idx = this.batchDeleteQueue.indexOf(v);
            if (idx >= 0) {
              this.batchDeleteQueue.splice(idx, 1);
              this.renderQueue();
              this.addLog(`从队列移除：${v}`, 'info');
            }
          });
          panel.appendChild(chip);
        });
      }
    }
    if (runBtn) runBtn.disabled = !this.batchDeleteQueue.length;
  }

  // 步进控制器回调：根据步骤快照渲染，并按值高亮
  onStepChange(step) {
    if (!step) return;
    // 渲染快照
    this.renderSnapshot(step.snapshot).then(() => {
      this.highlightValues(step.highlightValues || []);
    });
  }

  // 根据当前树渲染快照（不保留旧节点 DOM）
  async renderSnapshot(snapshot) {
    this.tree.root = this.buildTreeFromSnapshot(snapshot);
    await this.renderTree();
  }

  // 生成结构快照（值+颜色+左右子树）
  snapshotTree(root) {
    if (!root) return null;
    const dfs = (node) => {
      if (!node) return null;
      return {
        value: node.value,
        color: node.color,
        left: dfs(node.left),
        right: dfs(node.right)
      };
    };
    return dfs(root);
  }

  // 从结构快照重建节点（带父指针）
  buildTreeFromSnapshot(snapshot) {
    if (!snapshot) return null;
    const build = (snap, parent = null) => {
      if (!snap) return null;
      const n = new RBTNode(snap.value, snap.color);
      n.parent = parent;
      n.left = build(snap.left, n);
      n.right = build(snap.right, n);
      return n;
    };
    return build(snapshot, null);
  }

  // 按值查找节点（当前树）
  findNodeByValue(value) {
    let cur = this.tree.root;
    while (cur) {
      if (value === cur.value) return cur;
      cur = value < cur.value ? cur.left : cur.right;
    }
    return null;
  }

  // 高亮一组值对应的节点及其连线
  highlightValues(values) {
    const nodes = (values || []).map(v => this.findNodeByValue(v)).filter(Boolean);
    if (nodes.length) {
      // 复用控制器的高亮逻辑
      this.stepController.markNodes(nodes);
    }
  }
}

let rbtVisualizer;
document.addEventListener('DOMContentLoaded', () => {
  rbtVisualizer = new RBTVisualizer();
});