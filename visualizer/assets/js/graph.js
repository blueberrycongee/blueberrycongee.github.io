// 图算法可视化：Dijkstra / Prim / BFS / DFS

class Graph {
  constructor(directed = false) {
    this.directed = directed; // true 表示有向
    this.nodes = new Map(); // label -> { label }
    this.edges = []; // [{ u, v, w }]
    this.nextAutoLabelCode = 'A'.charCodeAt(0);
  }

  addNode(label) {
    const l = (label || String.fromCharCode(this.nextAutoLabelCode++)).trim();
    if (!l) return null;
    if (this.nodes.has(l)) return this.nodes.get(l);
    const node = { label: l };
    this.nodes.set(l, node);
    return node;
  }

  addEdge(u, v, w = 1) {
    if (!this.nodes.has(u) || !this.nodes.has(v)) return false;
    const weight = Number(w);
    this.edges.push({ u, v, w: Number.isFinite(weight) ? weight : 1 });
    return true;
  }

  clear() {
    this.nodes.clear();
    this.edges = [];
    this.nextAutoLabelCode = 'A'.charCodeAt(0);
  }

  labels() { return Array.from(this.nodes.keys()); }

  neighbors(x) {
    const res = [];
    for (const e of this.edges) {
      if (e.u === x) res.push({ to: e.v, w: e.w });
      if (!this.directed && e.v === x) res.push({ to: e.u, w: e.w });
      if (this.directed && e.v === x) { /* 有向图仅 v<-u 不作为邻居 */ }
    }
    return res;
  }
}

class GraphVisualizer {
  constructor() {
    this.canvas = document.getElementById('graph-canvas');
    this.nodeContainer = document.getElementById('graph-node-container');
    this.operationLog = document.getElementById('operation-log');
    this.modeGroup = document.getElementById('graph-mode-group');
    this.graph = new Graph(false);
    this.positions = new Map(); // label -> { x, y, cx, cy }
    this.stepController = new AnimationStepController({
      nodeContainer: this.nodeContainer,
      canvas: this.canvas,
      overlayParent: document.body,
      onStep: this.onStepChange.bind(this),
      overlayAutoHideMs: 3000
    });
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDisplay();
    this.renderGraph();
  }

  setupEventListeners() {
    // 模式：有向/无向
    this.modeGroup.querySelectorAll('input[name="graph-directed"]').forEach(r => {
      r.addEventListener('change', () => {
        if (!r.checked) return;
        this.graph.directed = (r.value === 'directed');
        const label = this.graph.directed ? '有向图' : '无向图';
        this.addLog(`切换模式：${label}`);
        this.updateDisplay();
        this.renderGraph();
        const steps = [{ message: `模式切换为 ${label}` }];
        this.stepController.setSteps(`图模式切换（${label}）`, steps);
      });
    });

    document.getElementById('add-node-btn').addEventListener('click', () => {
      const input = document.getElementById('node-label-input');
      const node = this.graph.addNode(input.value);
      if (!node) return;
      input.value = '';
      this.addLog(`添加节点：${node.label}`);
      this.updateDisplay();
      this.renderGraph();
    });

    document.getElementById('add-edge-btn').addEventListener('click', () => {
      const u = document.getElementById('edge-from-input').value.trim();
      const v = document.getElementById('edge-to-input').value.trim();
      const w = parseFloat(document.getElementById('edge-weight-input').value.trim());
      if (!u || !v) return;
      if (!this.graph.nodes.has(u) || !this.graph.nodes.has(v)) return;
      this.graph.addEdge(u, v, Number.isFinite(w) ? w : 1);
      document.getElementById('edge-from-input').value = '';
      document.getElementById('edge-to-input').value = '';
      document.getElementById('edge-weight-input').value = '';
      this.addLog(`添加边：${u} → ${v}（权重 ${Number.isFinite(w) ? w : 1}）`);
      this.renderGraph();
      this.updateDisplay();
    });

    document.getElementById('random-graph-btn').addEventListener('click', () => {
      this.randomGraph();
    });

    document.getElementById('clear-graph-btn').addEventListener('click', () => {
      this.clearGraph();
    });

    // 算法按钮
    document.getElementById('run-dijkstra-btn').addEventListener('click', () => {
      const s = document.getElementById('algo-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) return;
      this.runDijkstra(s);
    });
    document.getElementById('run-prim-btn').addEventListener('click', () => {
      const s = document.getElementById('prim-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) return;
      this.runPrim(s);
    });
    document.getElementById('run-bfs-btn').addEventListener('click', () => {
      const s = document.getElementById('bfs-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) return;
      this.runBFS(s);
    });
    document.getElementById('run-dfs-btn').addEventListener('click', () => {
      const s = document.getElementById('dfs-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) return;
      this.runDFS(s);
    });

    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
  }

  clearGraph() {
    this.graph.clear();
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    this.operationLog.innerHTML = '<p class="log-empty">暂无步骤</p>';
    this.stepController.clear();
    this.updateDisplay();
  }

  randomGraph() {
    this.graph.clear();
    const n = 6;
    for (let i = 0; i < n; i++) this.graph.addNode();
    const labels = this.graph.labels();
    const m = 7;
    for (let i = 0; i < m; i++) {
      const a = labels[Math.floor(Math.random() * n)];
      let b = labels[Math.floor(Math.random() * n)];
      if (b === a) b = labels[(labels.indexOf(a) + 1) % n];
      const w = 1 + Math.floor(Math.random() * 9);
      this.graph.addEdge(a, b, w);
    }
    this.addLog('生成随机图');
    this.renderGraph();
    this.updateDisplay();
  }

  updateDisplay() {
    document.getElementById('graph-node-count').textContent = String(this.graph.nodes.size);
    document.getElementById('graph-edge-count').textContent = String(this.graph.edges.length);
    document.getElementById('graph-mode-label').textContent = this.graph.directed ? '有向图' : '无向图';
  }

  addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    if (this.operationLog.querySelector('.log-empty')) this.operationLog.innerHTML = '';
    this.operationLog.appendChild(entry);
    this.operationLog.scrollTop = this.operationLog.scrollHeight;
  }

  calculateLayout() {
    const labels = this.graph.labels();
    const n = labels.length;
    const layout = new Map();
    const containerRect = this.nodeContainer.getBoundingClientRect();
    const header = document.querySelector('.canvas-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const topOffset = Math.max(headerHeight + 24, 140);
    const w = containerRect.width;
    const h = containerRect.height - topOffset;
    const cx = w / 2;
    const cy = topOffset + Math.max(h / 2, 160);
    const radius = Math.max(80, Math.min(w, h) / 2 - 60);
    const nodeWidth = 46;
    if (n === 1) {
      layout.set(labels[0], { x: cx - nodeWidth / 2, y: cy - 18, cx, cy });
      return layout;
    }
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * i) / n;
      const px = cx + radius * Math.cos(ang);
      const py = cy + radius * Math.sin(ang);
      layout.set(labels[i], { x: px - nodeWidth / 2, y: py - 18, cx: px, cy: py });
    }
    return layout;
  }

  async renderGraph() {
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    const labels = this.graph.labels();
    if (!labels.length) return;
    const layout = this.calculateLayout();
    this.positions = layout;
    await this.createNodes(labels, layout);
    this.redrawEdges(layout);
  }

  async createNodes(labels, layout) {
    for (const l of labels) {
      const pos = layout.get(l);
      const el = document.createElement('div');
      el.className = 'graph-node';
      el.dataset.label = l;
      el.textContent = l;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      this.nodeContainer.appendChild(el);
      await this.sleep(8);
      el.style.transition = 'all 0.25s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    }
  }

  redrawEdges(layout) {
    const drawLine = (u, v, w) => {
      const pu = layout.get(u);
      const pv = layout.get(v);
      if (!pu || !pv) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pu.cx);
      line.setAttribute('y1', pu.cy);
      line.setAttribute('x2', pv.cx);
      line.setAttribute('y2', pv.cy);
      line.classList.add('graph-edge');
      line.dataset.key = `${u}->${v}`;
      this.canvas.appendChild(line);
      // 权重标签
      const midx = (pu.cx + pv.cx) / 2;
      const midy = (pu.cy + pv.cy) / 2;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(midx + 4));
      text.setAttribute('y', String(midy - 4));
      text.setAttribute('fill', '#444');
      text.setAttribute('font-size', '12');
      text.textContent = String(w);
      this.canvas.appendChild(text);
    };
    for (const e of this.graph.edges) {
      drawLine(e.u, e.v, e.w);
      if (!this.graph.directed) {
        // 为匹配高亮查找，添加反向 data-key 的虚拟线索（不绘制第二条线）
        // 高亮时同时检查 u->v 与 v->u
      }
    }
  }

  // ----- 算法实现 -----
  runDijkstra(start) {
    const labels = this.graph.labels();
    const dist = {};
    const prev = {};
    labels.forEach(l => { dist[l] = Infinity; prev[l] = null; });
    dist[start] = 0;
    const visited = new Set();
    const steps = [{ message: `初始化：将所有节点距离设为∞，起点 ${start} 距离设为 0`, snapshot: { dist: { ...dist }, prev: { ...prev }, visited: [], current: null } }];

    while (visited.size < labels.length) {
      // 选择未访问中 dist 最小的节点
      let u = null; let best = Infinity;
      for (const l of labels) {
        if (!visited.has(l) && dist[l] < best) { best = dist[l]; u = l; }
      }
      if (u == null) break; // 剩余不可达
      visited.add(u);
      steps.push({ message: `选择当前最小距离节点：${u}（${dist[u]}）并标记为已访问`, highlightNodes: [u], snapshot: { dist: { ...dist }, prev: { ...prev }, visited: Array.from(visited), current: u } });
      const nbrs = this.graph.neighbors(u);
      for (const nb of nbrs) {
        steps.push({ message: `考虑边 ${u} → ${nb.to}（权重 ${nb.w}）`, highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { dist: { ...dist }, prev: { ...prev }, visited: Array.from(visited), current: u } });
        const alt = dist[u] + nb.w;
        if (alt < dist[nb.to]) {
          dist[nb.to] = alt;
          prev[nb.to] = u;
          steps.push({ message: `松弛成功：更新 dist(${nb.to})=${alt}，前驱=${u}` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { dist: { ...dist }, prev: { ...prev }, visited: Array.from(visited), current: u } });
        }
      }
    }
    steps.push({ message: 'Dijkstra 完成', snapshot: { dist: { ...dist }, prev: { ...prev }, visited: Array.from(visited), current: null } });
    this.stepController.setSteps(`Dijkstra（起点 ${start}）`, steps);
    this.addLog('Dijkstra 执行完成', 'step');
  }

  runPrim(start) {
    const labels = this.graph.labels();
    if (!labels.length) return;
    const visited = new Set([start]);
    const mst = [];
    const steps = [{ message: `选择起点 ${start}` , highlightNodes: [start], snapshot: { visited: Array.from(visited), mst: [] } }];
    while (visited.size < labels.length) {
      let best = null;
      for (const e of this.graph.edges) {
        const inA = visited.has(e.u), inB = visited.has(e.v);
        if ((inA && !inB) || (!this.graph.directed && inB && !inA)) {
          if (!best || e.w < best.w) best = { ...e };
        }
      }
      if (!best) { steps.push({ message: '未找到可连接的边（可能图不连通），算法结束', snapshot: { visited: Array.from(visited), mst: mst.slice() } }); break; }
      mst.push(best);
      visited.add(visited.has(best.u) ? best.v : best.u);
      steps.push({ message: `选择权重最小的边 ${best.u} — ${best.v}（${best.w}）加入 MST`, highlightEdges: [[best.u, best.v]], highlightNodes: [best.u, best.v], snapshot: { visited: Array.from(visited), mst: mst.slice() } });
    }
    steps.push({ message: 'Prim 完成', snapshot: { visited: Array.from(visited), mst: mst.slice() } });
    this.stepController.setSteps(`Prim（起点 ${start}）`, steps);
    this.addLog('Prim 执行完成', 'step');
  }

  runBFS(start) {
    const visited = new Set([start]);
    const q = [start];
    const order = [];
    const steps = [{ message: `起点 ${start} 入队`, highlightNodes: [start], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice() } }];
    while (q.length) {
      const u = q.shift();
      order.push(u);
      steps.push({ message: `访问 ${u}` , highlightNodes: [u], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice() } });
      for (const nb of this.graph.neighbors(u)) {
        if (!visited.has(nb.to)) {
          visited.add(nb.to);
          q.push(nb.to);
          steps.push({ message: `${nb.to} 未访问，入队（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice() } });
        } else {
          steps.push({ message: `${nb.to} 已访问，跳过（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice() } });
        }
      }
    }
    steps.push({ message: `BFS 完成，访问序列：${order.join('→')}` , snapshot: { visited: Array.from(visited), queue: [], order: order.slice() } });
    this.stepController.setSteps(`BFS（起点 ${start}）`, steps);
    this.addLog('BFS 执行完成', 'step');
  }

  runDFS(start) {
    const visited = new Set();
    const stack = [start];
    const order = [];
    const steps = [{ message: `起点 ${start} 入栈`, highlightNodes: [start], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice() } }];
    while (stack.length) {
      const u = stack.pop();
      if (visited.has(u)) { continue; }
      visited.add(u);
      order.push(u);
      steps.push({ message: `访问 ${u}` , highlightNodes: [u], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice() } });
      const nbrs = this.graph.neighbors(u).slice().reverse(); // 反向入栈更直观
      for (const nb of nbrs) {
        if (!visited.has(nb.to)) {
          stack.push(nb.to);
          steps.push({ message: `${nb.to} 未访问，入栈（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice() } });
        } else {
          steps.push({ message: `${nb.to} 已访问，跳过（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice() } });
        }
      }
    }
    steps.push({ message: `DFS 完成，访问序列：${order.join('→')}`, snapshot: { visited: Array.from(visited), stack: [], order: order.slice() } });
    this.stepController.setSteps(`DFS（起点 ${start}）`, steps);
    this.addLog('DFS 执行完成', 'step');
  }

  // ----- 步骤回调与高亮渲染 -----
  onStepChange(step) {
    if (!step) return;
    if (step.snapshot) this.renderSnapshot(step.snapshot);
    this.highlightNodes(step.highlightNodes || []);
    this.highlightEdges(step.highlightEdges || []);
  }

  async renderSnapshot(snapshot) {
    // 可扩展在右栏展示 dist/prev/MST/队列等信息，这里简单按日志输出
    const parts = [];
    if (snapshot.dist) parts.push(`dist: ${JSON.stringify(snapshot.dist)}`);
    if (snapshot.prev) parts.push(`prev: ${JSON.stringify(snapshot.prev)}`);
    if (snapshot.visited) parts.push(`visited: ${JSON.stringify(snapshot.visited)}`);
    if (snapshot.mst) parts.push(`mst: ${snapshot.mst.map(e => `${e.u}-${e.v}(${e.w})`).join(', ')}`);
    if (snapshot.queue) parts.push(`queue: [${snapshot.queue.join(', ')}]`);
    if (snapshot.stack) parts.push(`stack: [${snapshot.stack.join(', ')}]`);
    if (snapshot.order) parts.push(`order: [${snapshot.order.join(', ')}]`);
    if (parts.length) this.addLog(parts.join(' | '), 'info');
    await this.renderGraph(); // 保持画布与最新节点/边一致
  }

  highlightNodes(labels) {
    labels.forEach(l => {
      const el = this.nodeContainer.querySelector(`.graph-node[data-label="${l}"]`);
      if (el) el.classList.add('rotating');
    });
  }

  highlightEdges(edges) {
    edges.forEach(([u, v]) => {
      const line = this.canvas.querySelector(`line.graph-edge[data-key="${u}->${v}"]`) || this.canvas.querySelector(`line.graph-edge[data-key="${v}->${u}"]`);
      if (line) line.classList.add('rotating');
    });
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

let graphVisualizer;
document.addEventListener('DOMContentLoaded', () => { graphVisualizer = new GraphVisualizer(); });