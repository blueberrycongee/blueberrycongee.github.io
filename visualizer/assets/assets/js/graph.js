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
    this.distOverlay = document.getElementById('dist-overlay');
    this.distList = document.getElementById('dist-list');
    this.graph = new Graph(false);
    this.currentAlgo = null; // 当前运行的算法标识，用于叠加层切换
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
      if (!u || !v) { this.addLog('请输入两个有效的节点标签', 'error'); return; }
      if (!this.graph.nodes.has(u) || !this.graph.nodes.has(v)) { this.addLog('节点不存在，无法添加边', 'error'); return; }
      this.graph.addEdge(u, v, Number.isFinite(w) ? w : 1);
      document.getElementById('edge-from-input').value = '';
      document.getElementById('edge-to-input').value = '';
      document.getElementById('edge-weight-input').value = '';
      this.addLog(`添加边：${u} → ${v}（权重 ${Number.isFinite(w) ? w : 1}）`);
      this.renderGraph();
      this.updateDisplay();
    });

    document.getElementById('random-graph-btn').addEventListener('click', () => {
      const typeSel = document.getElementById('random-graph-type');
      const nInput = document.getElementById('random-node-count');
      const mInput = document.getElementById('random-edge-count');
      const type = typeSel ? typeSel.value : 'basic';
      const nVal = nInput ? parseInt(nInput.value, 10) : NaN;
      const mVal = mInput ? parseInt(mInput.value, 10) : NaN;
      const n = Number.isFinite(nVal) && nVal > 1 ? nVal : undefined;
      const m = Number.isFinite(mVal) && mVal > 0 ? mVal : undefined;
      this.randomGraph(type, n, m);
    });

    document.getElementById('clear-graph-btn').addEventListener('click', () => {
      this.clearGraph();
    });

    // 算法按钮
    document.getElementById('run-dijkstra-btn').addEventListener('click', () => {
      const s = document.getElementById('algo-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) { this.addLog('起点无效，请输入已存在的节点', 'error'); return; }
      this.runDijkstra(s);
    });
    document.getElementById('run-prim-btn').addEventListener('click', () => {
      const s = document.getElementById('prim-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) { this.addLog('起点无效，请输入已存在的节点', 'error'); return; }
      this.runPrim(s);
    });
    const krBtn = document.getElementById('run-kruskal-btn');
    if (krBtn) {
      krBtn.addEventListener('click', () => {
        this.runKruskal();
      });
    }
    const floydBtn = document.getElementById('run-floyd-btn');
    if (floydBtn) {
      floydBtn.addEventListener('click', () => {
        this.runFloyd();
      });
    }
    const bellmanBtn = document.getElementById('run-bellman-btn');
    if (bellmanBtn) {
      bellmanBtn.addEventListener('click', () => {
        const s = document.getElementById('bellman-start-input').value.trim() || this.graph.labels()[0];
        if (!s || !this.graph.nodes.has(s)) { this.addLog('起点无效，请输入已存在的节点', 'error'); return; }
        this.runBellmanFord(s);
      });
    }
    const topoBtn = document.getElementById('run-topo-btn');
    if (topoBtn) {
      topoBtn.addEventListener('click', () => {
        this.runTopological();
      });
    }
    document.getElementById('run-bfs-btn').addEventListener('click', () => {
      const s = document.getElementById('bfs-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) { this.addLog('起点无效，请输入已存在的节点', 'error'); return; }
      this.runBFS(s);
    });
    document.getElementById('run-dfs-btn').addEventListener('click', () => {
      const s = document.getElementById('dfs-start-input').value.trim() || this.graph.labels()[0];
      if (!s || !this.graph.nodes.has(s)) { this.addLog('起点无效，请输入已存在的节点', 'error'); return; }
      this.runDFS(s);
    });

    const prevBtn = document.getElementById('step-prev-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (prevBtn && nextBtn) this.stepController.bindControls(prevBtn, nextBtn);
    this.stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });
  }

  clearGraph() {
    this.graph.clear();
    this.nodeContainer.innerHTML = '';
    this.canvas.innerHTML = '';
    this.operationLog.innerHTML = '<p class="log-empty">暂无步骤</p>';
    this.stepController.clear();
    if (this.distList) this.distList.innerHTML = '<span class="dist-item">尚未运行</span>';
    this.updateDisplay();
  }

  randomGraph(type = 'basic', n = 6, m) {
    // 根据类型选择是否强制有向/无向
    const forceDirected = (t) => t === 'directed' || t === 'dag' || t === 'neg_weight' || t === 'neg_cycle';
    const forceUndirected = (t) => t === 'undirected_connected';

    // 设定模式并同步 UI 单选框
    const setDirectedMode = (dir) => {
      const undirectedRadio = this.modeGroup?.querySelector('input[value="undirected"]');
      const directedRadio = this.modeGroup?.querySelector('input[value="directed"]');
      if (dir) {
        if (directedRadio) directedRadio.checked = true;
      } else {
        if (undirectedRadio) undirectedRadio.checked = true;
      }
      this.graph.directed = !!dir;
    };

    if (forceDirected(type)) setDirectedMode(true);
    else if (forceUndirected(type)) setDirectedMode(false);

    // 清空并生成节点
    this.graph.clear();
    const N = Math.max(2, Math.min(26, n));
    for (let i = 0; i < N; i++) this.graph.addNode();
    const labels = this.graph.labels();

    // 工具函数
    const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    const randPosW = () => randInt(1, 9);
    const randNegOrPosW = () => (Math.random() < 0.35 ? -randInt(1, 6) : randPosW());
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const maxEdges = this.graph.directed ? N * (N - 1) : (N * (N - 1)) / 2;

    // 默认边数按类型设置
    let defaultM;
    switch (type) {
      case 'undirected_connected':
        defaultM = N + Math.floor(N / 2);
        break;
      case 'directed':
        defaultM = Math.max(N + 2, Math.floor(N * 1.5));
        break;
      case 'dag':
      case 'neg_weight':
        defaultM = N + Math.floor(N / 2);
        break;
      case 'neg_cycle':
        defaultM = N + 2;
        break;
      case 'dense':
        defaultM = Math.floor(maxEdges * 0.7);
        break;
      case 'sparse':
        defaultM = Math.max(N - 1, Math.floor(N));
        break;
      default:
        defaultM = Math.max(7, N + 1);
    }
    const targetM = Math.max(1, Math.min(maxEdges, m ?? defaultM));

    const edgeSet = new Set();
    const makeKey = (u, v) => {
      if (this.graph.directed) return `${u}->${v}`;
      return u < v ? `${u}|${v}` : `${v}|${u}`;
    };
    const addUniqueEdge = (u, v, w) => {
      if (u === v) return false;
      const key = makeKey(u, v);
      if (edgeSet.has(key)) return false;
      edgeSet.add(key);
      this.graph.addEdge(u, v, w);
      return true;
    };

    // 生成不同类型的边
    if (type === 'undirected_connected') {
      // 无向连通：先造生成树，再加随机边
      setDirectedMode(false);
      const order = shuffle(labels.slice());
      for (let i = 1; i < N; i++) {
        addUniqueEdge(order[i - 1], order[i], randPosW());
      }
      let attempts = 0;
      while (edgeSet.size < targetM && attempts < maxEdges * 2) {
        const a = labels[randInt(0, N - 1)];
        const b = labels[randInt(0, N - 1)];
        addUniqueEdge(a, b, randPosW());
        attempts++;
      }
    } else if (type === 'dag') {
      // 有向无环：仅从较小索引指向较大索引
      setDirectedMode(true);
      const order = shuffle(labels.slice());
      let attempts = 0;
      while (edgeSet.size < targetM && attempts < maxEdges * 2) {
        const i = randInt(0, N - 2);
        const j = randInt(i + 1, N - 1);
        const u = order[i], v = order[j];
        addUniqueEdge(u, v, randPosW());
        attempts++;
      }
    } else if (type === 'neg_weight') {
      // 含负权（无负环）：用 DAG 结构，但权重可负
      setDirectedMode(true);
      const order = shuffle(labels.slice());
      let attempts = 0;
      while (edgeSet.size < targetM && attempts < maxEdges * 2) {
        const i = randInt(0, N - 2);
        const j = randInt(i + 1, N - 1);
        const u = order[i], v = order[j];
        addUniqueEdge(u, v, randNegOrPosW());
        attempts++;
      }
    } else if (type === 'neg_cycle') {
      // 含负权环：明确构造一个负环，其余随机
      setDirectedMode(true);
      const order = shuffle(labels.slice());
      const a = order[0], b = order[1], c = order[2] ?? order[0];
      // 构造 a->b->c->a 总权重为负
      addUniqueEdge(a, b, 2);
      addUniqueEdge(b, c, 2);
      addUniqueEdge(c, a, -6);
      let attempts = 0;
      while (edgeSet.size < targetM && attempts < maxEdges * 2) {
        const u = labels[randInt(0, N - 1)];
        const v = labels[randInt(0, N - 1)];
        const w = Math.random() < 0.25 ? -randInt(1, 5) : randPosW();
        addUniqueEdge(u, v, w);
        attempts++;
      }
    } else {
      // 其他类型：根据当前模式生成稀疏/稠密/基本/有向
      if (type === 'directed') setDirectedMode(true);
      if (type === 'basic') {
        // 保持当前模式，正权随机
      }
      let attempts = 0;
      while (edgeSet.size < targetM && attempts < maxEdges * 2) {
        const a = labels[randInt(0, N - 1)];
        const b = labels[randInt(0, N - 1)];
        addUniqueEdge(a, b, randPosW());
        attempts++;
      }
    }

    const typeLabelMap = {
      basic: '基本随机',
      undirected_connected: '无向连通（MST）',
      directed: '有向图',
      dag: '有向无环（DAG）',
      neg_weight: '含负权（无负环）',
      neg_cycle: '含负权环',
      sparse: '稀疏图',
      dense: '稠密图'
    };
    const typeLabel = typeLabelMap[type] || type;
    this.addLog(`生成随机图（类型：${typeLabel}，N=${N}，M=${this.graph.edges.length}）`);
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

  updateDistOverlay(dist, current) {
    if (!this.distOverlay || !this.distList || !dist) return;
    const labels = this.graph.labels().slice();
    const html = labels.map(l => {
      const val = dist[l];
      const valStr = Number.isFinite(val) ? String(val) : '∞';
      const cls = (current === l) ? 'dist-item current' : 'dist-item';
      return `<span class="${cls}" title="到 ${l} 的当前最短距离">${l}: ${valStr}</span>`;
    }).join('');
    this.distList.innerHTML = html || '<span class="dist-item">尚未运行</span>';
  }

  updateAlgoOverlay(snapshot) {
    const titleEl = document.getElementById('dist-title');
    if (!this.distOverlay || !this.distList || !titleEl || !snapshot) return;
    const labels = this.graph.labels().slice();
    let title = '变量状态';
    let html = '';

    switch (this.currentAlgo) {
      case 'Dijkstra':
      case 'Bellman-Ford': {
        const dist = snapshot.dist;
        title = 'dist[] 实时状态';
        if (dist && labels.length && typeof dist[labels[0]] === 'number') {
          html = labels.map(l => {
            const val = dist[l];
            const valStr = Number.isFinite(val) ? String(val) : '∞';
            const cls = (snapshot.current === l) ? 'dist-item current' : 'dist-item';
            return `<span class="${cls}" title="到 ${l} 的当前最短距离">${l}: ${valStr}</span>`;
          }).join('');
        } else {
          html = '<span class="dist-item">尚无 dist[]</span>';
        }
        break;
      }
      case 'Prim':
      case 'Kruskal': {
        title = 'MST 边集';
        const mst = snapshot.mst || [];
        if (mst.length) {
          html = mst.map(e => {
            const isCur = snapshot.currentEdge && ((snapshot.currentEdge[0] === e.u && snapshot.currentEdge[1] === e.v) || (snapshot.currentEdge[0] === e.v && snapshot.currentEdge[1] === e.u));
            const cls = isCur ? 'dist-item current' : 'dist-item';
            return `<span class="${cls}" title="MST 边">${e.u}—${e.v}(${e.w})</span>`;
          }).join('');
        } else {
          html = '<span class="dist-item">暂无 MST 边</span>';
        }
        break;
      }
      case 'Floyd': {
        title = 'Floyd 距离矩阵（行 k）';
        const D = snapshot.dist; // 嵌套矩阵
        const k = snapshot.currentK;
        if (D && k && D[k]) {
          const row = D[k];
          html = labels.map(j => {
            const val = row[j];
            const cls = (snapshot.current === j) ? 'dist-item current' : 'dist-item';
            return `<span class="${cls}" title="d[${k}][${j}]">${k}→${j}: ${val}</span>`;
          }).join('');
        } else {
          html = '<span class="dist-item">选择中间点后展示该行</span>';
        }
        break;
      }
      case 'BFS': {
        title = 'BFS 队列/访问';
        const q = snapshot.queue || [];
        const order = snapshot.order || [];
        html = `<span class="dist-item" title="队列">Q: [${q.join(', ')}]</span>` +
               `<span class="dist-item" title="访问序">Order: [${order.join(', ')}]</span>`;
        if (snapshot.current) html += `<span class="dist-item current" title="当前节点">当前: ${snapshot.current}</span>`;
        break;
      }
      case 'DFS': {
        title = 'DFS 栈/访问';
        const stack = snapshot.stack || [];
        const order = snapshot.order || [];
        html = `<span class="dist-item" title="栈">Stack: [${stack.join(', ')}]</span>` +
               `<span class="dist-item" title="访问序">Order: [${order.join(', ')}]</span>`;
        if (snapshot.current) html += `<span class="dist-item current" title="当前节点">当前: ${snapshot.current}</span>`;
        break;
      }
      case 'Topo': {
        title = '入度/输出序列';
        const indeg = snapshot.indeg || {};
        const keys = Object.keys(indeg);
        html = (keys.length ? keys.map(l => {
          const v = indeg[l];
          const cls = (v === 0) ? 'dist-item current' : 'dist-item';
          return `<span class="${cls}" title="入度">${l}: ${v}</span>`;
        }).join('') : '<span class="dist-item">暂无入度数据</span>') +
        `<span class="dist-item" title="输出序">输出: [${(snapshot.order || []).join(', ')}]</span>`;
        break;
      }
      default: {
        title = '变量状态';
        html = '<span class="dist-item">尚未运行</span>';
      }
    }

    titleEl.textContent = title;
    this.distList.innerHTML = html || '<span class="dist-item">尚未运行</span>';
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
      text.classList.add('graph-weight');
      text.dataset.key = `${u}->${v}`;
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
    this.currentAlgo = 'Dijkstra';
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
    this.currentAlgo = 'Prim';
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
      steps.push({ message: `选择权重最小的边 ${best.u} — ${best.v}（${best.w}）加入 MST`, highlightEdges: [[best.u, best.v]], highlightNodes: [best.u, best.v], snapshot: { visited: Array.from(visited), mst: mst.slice(), currentEdge: [best.u, best.v] } });
    }
    steps.push({ message: 'Prim 完成', snapshot: { visited: Array.from(visited), mst: mst.slice() } });
    this.stepController.setSteps(`Prim（起点 ${start}）`, steps);
    this.addLog('Prim 执行完成', 'step');
  }

  runKruskal() {
    this.currentAlgo = 'Kruskal';
    const labels = this.graph.labels();
    if (!labels.length) return;
    const steps = [];
    if (this.graph.directed) {
      steps.push({ message: '当前为有向图，Kruskal 通常用于无向图，这里将边按无向处理', snapshot: { mst: [] } });
    } else {
      steps.push({ message: '开始 Kruskal：按权重递增选择边，避免成环', snapshot: { mst: [] } });
    }

    // 并查集（DSU）初始化
    const parent = new Map();
    const rank = new Map();
    for (const l of labels) { parent.set(l, l); rank.set(l, 0); }
    const find = (x) => {
      let p = parent.get(x);
      if (p !== x) { p = find(p); parent.set(x, p); }
      return p;
    };
    const union = (a, b) => {
      let ra = find(a), rb = find(b);
      if (ra === rb) return false;
      const rka = rank.get(ra) || 0, rkb = rank.get(rb) || 0;
      if (rka < rkb) parent.set(ra, rb);
      else if (rka > rkb) parent.set(rb, ra);
      else { parent.set(rb, ra); rank.set(ra, rka + 1); }
      return true;
    };

    // 复制并排序边
    const edges = this.graph.edges.slice().sort((a, b) => a.w - b.w);
    const mst = [];
    for (const e of edges) {
      const u = e.u, v = e.v, w = e.w;
      const ru = find(u), rv = find(v);
      if (ru !== rv) {
        union(u, v);
        mst.push({ u, v, w });
        steps.push({ message: `选择边 ${u} — ${v}（${w}）加入 MST`, highlightEdges: [[u, v]], highlightNodes: [u, v], snapshot: { mst: mst.slice(), currentEdge: [u, v] } });
        if (mst.length === labels.length - 1) break;
      } else {
        steps.push({ message: `跳过边 ${u} — ${v}（${w}），避免成环`, highlightEdges: [[u, v]], highlightNodes: [u, v], snapshot: { mst: mst.slice() } });
      }
    }
    if (mst.length < labels.length - 1) {
      steps.push({ message: 'Kruskal 完成（图可能不连通，MST 不包含全部节点）', snapshot: { mst: mst.slice() } });
    } else {
      steps.push({ message: 'Kruskal 完成', snapshot: { mst: mst.slice() } });
    }
    this.stepController.setSteps('Kruskal（最小生成树）', steps);
    this.addLog('Kruskal 执行完成', 'step');
  }

  runBellmanFord(start) {
    this.currentAlgo = 'Bellman-Ford';
    const labels = this.graph.labels();
    if (!labels.length) return;
    const dist = {};
    const prev = {};
    labels.forEach(l => { dist[l] = Infinity; prev[l] = null; });
    dist[start] = 0;

    const steps = [{
      message: `初始化：所有节点设为 ∞，起点 ${start} 设为 0`,
      snapshot: { dist: { ...dist }, prev: { ...prev }, current: null }
    }];

    const relaxEdge = (u, v, w) => {
      steps.push({
        message: `尝试松弛边 ${u} → ${v}（权重 ${w}）`,
        highlightNodes: [u, v],
        highlightEdges: [[u, v]],
        snapshot: { dist: { ...dist }, prev: { ...prev }, current: v }
      });
      if (Number.isFinite(dist[u]) && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        steps.push({
          message: `松弛成功：更新 dist(${v})=${dist[v]}，前驱=${u}`,
          highlightNodes: [u, v],
          highlightEdges: [[u, v]],
          snapshot: { dist: { ...dist }, prev: { ...prev }, current: v }
        });
      }
    };

    // 进行 V-1 次全边松弛
    for (let i = 1; i <= labels.length - 1; i++) {
      steps.push({ message: `第 ${i} 轮松弛开始`, snapshot: { dist: { ...dist }, prev: { ...prev }, current: null } });
      for (const e of this.graph.edges) {
        relaxEdge(e.u, e.v, e.w);
        if (!this.graph.directed) relaxEdge(e.v, e.u, e.w);
      }
      steps.push({ message: `第 ${i} 轮松弛结束`, snapshot: { dist: { ...dist }, prev: { ...prev }, current: null } });
    }

    // 检测负环
    let hasNegCycle = false;
    for (const e of this.graph.edges) {
      if (Number.isFinite(dist[e.u]) && dist[e.u] + e.w < dist[e.v]) {
        hasNegCycle = true;
        steps.push({
          message: `检测到负权环：边 ${e.u} → ${e.v} 可继续松弛`,
          highlightNodes: [e.u, e.v],
          highlightEdges: [[e.u, e.v]],
          snapshot: { dist: { ...dist }, prev: { ...prev }, current: e.v }
        });
        break;
      }
      if (!this.graph.directed && Number.isFinite(dist[e.v]) && dist[e.v] + e.w < dist[e.u]) {
        hasNegCycle = true;
        steps.push({
          message: `检测到负权环：边 ${e.v} → ${e.u} 可继续松弛`,
          highlightNodes: [e.v, e.u],
          highlightEdges: [[e.v, e.u]],
          snapshot: { dist: { ...dist }, prev: { ...prev }, current: e.u }
        });
        break;
      }
    }

    steps.push({ message: hasNegCycle ? 'Bellman-Ford 结束（存在负权环）' : 'Bellman-Ford 完成', snapshot: { dist: { ...dist }, prev: { ...prev }, current: null } });
    this.stepController.setSteps(`Bellman-Ford（起点 ${start}）`, steps);
    this.addLog('Bellman-Ford 执行完成', 'step');
  }

  runTopological() {
    this.currentAlgo = 'Topo';
    const labels = this.graph.labels();
    if (!labels.length) return;
    const steps = [];
    if (!this.graph.directed) {
      steps.push({ message: '当前为无向图，拓扑排序仅适用于有向无环图（DAG）', snapshot: {} });
      this.stepController.setSteps('拓扑排序（不可用）', steps);
      this.addLog('拓扑排序不可用（无向图）', 'info');
      return;
    }

    const indeg = new Map();
    for (const l of labels) indeg.set(l, 0);
    for (const e of this.graph.edges) {
      // 仅计算有向图的入度
      indeg.set(e.v, (indeg.get(e.v) || 0) + 1);
    }

    const q = [];
    for (const l of labels) if ((indeg.get(l) || 0) === 0) q.push(l);
    const order = [];
    steps.push({ message: `初始化入度，入度为 0 的节点入队：${q.join('、') || '（无）'}` , snapshot: { indeg: Object.fromEntries(indeg), order: order.slice() } });

    while (q.length) {
      const u = q.shift();
      order.push(u);
      steps.push({ message: `输出 ${u}` , highlightNodes: [u], snapshot: { indeg: Object.fromEntries(indeg), order: order.slice(), current: u } });
      for (const nb of this.graph.neighbors(u)) {
        const v = nb.to;
        indeg.set(v, (indeg.get(v) || 0) - 1);
        steps.push({ message: `边 ${u} → ${v} 导致 ${v} 入度减一，现为 ${indeg.get(v)}` , highlightNodes: [u, v], highlightEdges: [[u, v]], snapshot: { indeg: Object.fromEntries(indeg), order: order.slice(), current: v } });
        if (indeg.get(v) === 0) {
          q.push(v);
          steps.push({ message: `${v} 入度为 0，入队` , highlightNodes: [v], snapshot: { indeg: Object.fromEntries(indeg), order: order.slice(), current: v } });
        }
      }
    }

    if (order.length < labels.length) {
      steps.push({ message: '存在环：无法得到完整的拓扑序', snapshot: { order: order.slice() } });
      this.stepController.setSteps('拓扑排序（检测到环）', steps);
      this.addLog('拓扑排序失败：图中存在环', 'step');
    } else {
      steps.push({ message: `拓扑排序完成，序列：${order.join('→')}` , snapshot: { order: order.slice() } });
      this.stepController.setSteps('拓扑排序（Kahn）', steps);
      this.addLog('拓扑排序执行完成', 'step');
    }
  }

  runFloyd() {
    this.currentAlgo = 'Floyd';
    const labels = this.graph.labels();
    if (!labels.length) return;
    const steps = [];

    // 初始化距离矩阵
    const dist = {};
    labels.forEach(i => {
      dist[i] = {};
      labels.forEach(j => { dist[i][j] = (i === j) ? 0 : Infinity; });
    });
    // 由边初始化，处理有向/无向
    for (const e of this.graph.edges) {
      const u = e.u, v = e.v, w = e.w;
      dist[u][v] = Math.min(dist[u][v], w);
      if (!this.graph.directed) dist[v][u] = Math.min(dist[v][u], w);
    }

    const makeSnapshot = (extras = {}) => {
      const snap = {};
      labels.forEach(i => {
        snap[i] = {};
        labels.forEach(j => {
          const val = dist[i][j];
          snap[i][j] = Number.isFinite(val) ? val : '∞';
        });
      });
      return { dist: snap, ...extras };
    };

    steps.push({ message: '初始化距离矩阵', snapshot: makeSnapshot() });
    // 三重循环松弛
    for (const k of labels) {
      steps.push({ message: `以中间点 ${k} 进行松弛`, highlightNodes: [k], snapshot: makeSnapshot({ currentK: k }) });
      for (const i of labels) {
        for (const j of labels) {
          const dik = dist[i][k];
          const dkj = dist[k][j];
          if (Number.isFinite(dik) && Number.isFinite(dkj) && dik + dkj < dist[i][j]) {
            const old = dist[i][j];
            dist[i][j] = dik + dkj;
            steps.push({
              message: `更新 ${i} → ${j}：${Number.isFinite(old) ? old : '∞'} → ${dist[i][j]}（通过 ${k}）`,
              highlightNodes: [i, k, j],
              highlightEdges: [[i, k], [k, j]],
              snapshot: makeSnapshot({ currentK: k, updatePair: { i, j }, current: j })
            });
          }
        }
      }
    }
    steps.push({ message: 'Floyd 完成', snapshot: makeSnapshot() });
    this.stepController.setSteps('Floyd（全源最短路）', steps);
    this.addLog('Floyd 执行完成', 'step');
  }

  runBFS(start) {
    this.currentAlgo = 'BFS';
    const visited = new Set([start]);
    const q = [start];
    const order = [];
    const steps = [{ message: `起点 ${start} 入队`, highlightNodes: [start], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice(), current: start } }];
    while (q.length) {
      const u = q.shift();
      order.push(u);
      steps.push({ message: `访问 ${u}` , highlightNodes: [u], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice(), current: u } });
      for (const nb of this.graph.neighbors(u)) {
        if (!visited.has(nb.to)) {
          visited.add(nb.to);
          q.push(nb.to);
          steps.push({ message: `${nb.to} 未访问，入队（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice(), current: nb.to } });
        } else {
          steps.push({ message: `${nb.to} 已访问，跳过（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), queue: q.slice(), order: order.slice(), current: nb.to } });
        }
      }
    }
    steps.push({ message: `BFS 完成，访问序列：${order.join('→')}` , snapshot: { visited: Array.from(visited), queue: [], order: order.slice(), current: null } });
    this.stepController.setSteps(`BFS（起点 ${start}）`, steps);
    this.addLog('BFS 执行完成', 'step');
  }

  runDFS(start) {
    this.currentAlgo = 'DFS';
    const visited = new Set();
    const stack = [start];
    const order = [];
    const steps = [{ message: `起点 ${start} 入栈`, highlightNodes: [start], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice(), current: start } }];
    while (stack.length) {
      const u = stack.pop();
      if (visited.has(u)) { continue; }
      visited.add(u);
      order.push(u);
      steps.push({ message: `访问 ${u}` , highlightNodes: [u], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice(), current: u } });
      const nbrs = this.graph.neighbors(u).slice().reverse(); // 反向入栈更直观
      for (const nb of nbrs) {
        if (!visited.has(nb.to)) {
          stack.push(nb.to);
          steps.push({ message: `${nb.to} 未访问，入栈（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice(), current: nb.to } });
        } else {
          steps.push({ message: `${nb.to} 已访问，跳过（边 ${u} → ${nb.to}）` , highlightNodes: [u, nb.to], highlightEdges: [[u, nb.to]], snapshot: { visited: Array.from(visited), stack: stack.slice(), order: order.slice(), current: nb.to } });
        }
      }
    }
    steps.push({ message: `DFS 完成，访问序列：${order.join('→')}`, snapshot: { visited: Array.from(visited), stack: [], order: order.slice(), current: null } });
    this.stepController.setSteps(`DFS（起点 ${start}）`, steps);
    this.addLog('DFS 执行完成', 'step');
  }

  // ----- 步骤回调与高亮渲染 -----
  onStepChange(step) {
    if (!step) return;
    this.clearHighlights();
    if (step.snapshot) this.renderSnapshot(step.snapshot);
    this.highlightNodes(step.highlightNodes || []);
    this.highlightEdges(step.highlightEdges || []);
  }

  clearHighlights() {
    this.nodeContainer.querySelectorAll('.graph-node.rotating').forEach(el => el.classList.remove('rotating'));
    this.canvas.querySelectorAll('line.graph-edge.rotating').forEach(el => el.classList.remove('rotating'));
    this.canvas.querySelectorAll('text.graph-weight.rotating').forEach(el => el.classList.remove('rotating'));
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
    // 按当前算法类型更新变量叠加层，仅高亮对应变量
    this.updateAlgoOverlay(snapshot);
    // 算法步骤不改变图结构，这里不重绘画布，避免覆盖高亮
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
      const weight = this.canvas.querySelector(`text.graph-weight[data-key="${u}->${v}"]`) || this.canvas.querySelector(`text.graph-weight[data-key="${v}->${u}"]`);
      if (line) line.classList.add('rotating');
      if (weight) weight.classList.add('rotating');
    });
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

let graphVisualizer;
document.addEventListener('DOMContentLoaded', () => { graphVisualizer = new GraphVisualizer(); });
