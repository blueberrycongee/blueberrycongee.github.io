// 锦标赛树（赢家树）可视化
// 支持最小/最大赢家树，构建与叶子更新回溯动画

(function(){
  const svg = document.getElementById('t-canvas');
  const nodeContainer = document.getElementById('t-node-container');

  const addBtn = document.getElementById('t-add-btn');
  const insertInput = document.getElementById('t-insert-input');
  const clearListBtn = document.getElementById('t-clear-list-btn');
  const randomBtn = document.getElementById('t-random-btn');
  const buildBtn = document.getElementById('t-build-btn');
  const clearTreeBtn = document.getElementById('t-clear-tree-btn');
  const updateIndexInput = document.getElementById('t-update-index');
  const updateValueInput = document.getElementById('t-update-value');
  const updateBtn = document.getElementById('t-update-btn');
  const modeGroup = document.getElementById('t-mode-group');
  const stepPrevBtn = document.getElementById('step-prev-btn');
  const stepNextBtn = document.getElementById('step-next-btn');

  const leafCountEl = document.getElementById('t-leaf-count');
  const heightEl = document.getElementById('t-height');
  const winnerEl = document.getElementById('t-winner');
  const modeLabelEl = document.getElementById('t-mode-label');
  const opLogEl = document.getElementById('operation-log');

  // 动画步进控制器集成
  const Animator = new window.AnimationStepController({
    nodeContainer,
    canvas: svg,
    overlayParent: document.body,
    overlayAutoHideMs: 3000,
    onStep: (step) => {
      if (!step) return;
      renderer.clear(); // 保持清理高亮后再渲染，以免残留
      renderer.render();
      if (typeof step.node === 'number') renderer.highlightCompare(step.node);
    }
  });
  Animator.bindControls(stepPrevBtn, stepNextBtn);

  // 赢家树模型
  class TournamentTree {
    constructor(isMin = true){
      this.isMin = isMin; // true: 最小赢家树；false: 最大赢家树
      this.leaves = [];   // 叶子数组
      this.tree = [];     // 完整树数组（满二叉树），内部节点保存赢家值
      this.height = 0;
    }

    setMode(isMin){ this.isMin = isMin; }

    addLeaf(val){
      if (typeof val !== 'number' || Number.isNaN(val)) return false;
      this.leaves.push(val);
      return true;
    }

    clearLeaves(){ this.leaves = []; }

    clearTree(){ this.tree = []; this.height = 0; }

    // 将叶子数量扩展到2的幂，便于满二叉树构建
    normalizedLeaves(){
      if (this.leaves.length === 0) return [];
      let n = 1;
      while (n < this.leaves.length) n <<= 1;
      const arr = this.leaves.slice();
      const pad = this.isMin ? Infinity : -Infinity;
      while (arr.length < n) arr.push(pad);
      return arr;
    }

    compare(a, b){
      if (this.isMin){
        return a <= b ? a : b; // 最小赢家树
      } else {
        return a >= b ? a : b; // 最大赢家树
      }
    }

    build(){
      const leaves = this.normalizedLeaves();
      const n = leaves.length;
      if (n === 0){ this.clearTree(); return; }

      // 完整数组表示：索引1为根；叶子从索引base开始
      const base = 1 << (Math.ceil(Math.log2(n)));
      const size = base << 1; // 简单开到2*base
      this.tree = new Array(size).fill(null);

      // 放置叶子
      for (let i=0;i<n;i++) this.tree[base+i] = leaves[i];

      // 自底向上计算赢家
      for (let i=base-1;i>=1;i--){
        const left = this.tree[i*2];
        const right = this.tree[i*2+1];
        this.tree[i] = this.compare(left, right);
      }

      this.height = Math.ceil(Math.log2(n)) + 1; // 包含叶层
    }

    // 更新某个叶子后沿父链回溯更新赢家
    updateLeaf(idx, val){
      const leaves = this.normalizedLeaves();
      const n = leaves.length;
      if (idx < 0 || idx >= n) return null;

      const base = 1 << (Math.ceil(Math.log2(n)));
      const size = base << 1;
      if (!this.tree || this.tree.length < size) this.build();

      this.tree[base+idx] = val;
      const path = [];
      let p = Math.floor((base+idx)/2);
      while (p >= 1){
        const left = this.tree[p*2];
        const right = this.tree[p*2+1];
        const winner = this.compare(left, right);
        path.push({ node: p, left, right, winner });
        this.tree[p] = winner;
        p = Math.floor(p/2);
      }
      return { path, base, n };
    }

    winner(){ return this.tree[1]; }
  }

  // 渲染器
  class TournamentRenderer {
    constructor(tree){
      this.tree = tree;
      this.positions = {}; // 索引 -> {x,y}
    }

    clear(){
      svg.innerHTML = '';
      nodeContainer.innerHTML = '';
      Animator.unmarkAll();
    }

    layout(){
      const leaves = this.tree.normalizedLeaves();
      const n = leaves.length;
      if (n === 0) return;
      const base = 1 << (Math.ceil(Math.log2(n)));
      const height = Math.ceil(Math.log2(n)) + 1;

      const width = nodeContainer.clientWidth;
      const heightPx = nodeContainer.clientHeight;
      const levelGap = Math.max(90, Math.floor((heightPx - 160) / (height-1)));

      // 叶子行位置
      const leafY = 120 + (height-1)*levelGap;
      const gap = Math.max(80, Math.floor((width - 160) / n));
      for (let i=0;i<n;i++){
        const x = 100 + i*gap;
        const y = leafY;
        this.positions[base+i] = {x,y};
      }

      // 向上计算每层的父节点位置
      for (let level=height-2; level>=0; level--){
        const start = 1 << level; // 该层起始索引（满二叉层）
        const count = 1 << level; // 该层节点数
        for (let k=0;k<count;k++){
          const i = start + k;
          // 左右孩子位置
          const leftPos = this.positions[i*2];
          const rightPos = this.positions[i*2+1];
          const x = leftPos && rightPos ? (leftPos.x + rightPos.x)/2 : (leftPos?leftPos.x:rightPos?rightPos.x:width/2);
          const y = 120 + level*levelGap;
          this.positions[i] = {x,y};
        }
      }
    }

    render(){
      this.clear();
      const leaves = this.tree.normalizedLeaves();
      const n = leaves.length;
      if (n === 0) return;
      const base = 1 << (Math.ceil(Math.log2(n)));

      this.layout();

      // 画连线（孩子指向父）
      const drawLine = (a,b)=>{
        const la = this.positions[a];
        const lb = this.positions[b];
        if (!la || !lb) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', la.x);
        line.setAttribute('y1', la.y);
        line.setAttribute('x2', lb.x);
        line.setAttribute('y2', lb.y);
        svg.appendChild(line);
        return line;
      };

      // 自底向上画线
      const maxIndex = base<<1;
      for (let i=1;i<maxIndex;i++){
        if (this.tree.tree[i] == null) continue;
        if (i*2 < maxIndex && this.tree.tree[i*2] != null){ drawLine(i*2, i); }
        if (i*2+1 < maxIndex && this.tree.tree[i*2+1] != null){ drawLine(i*2+1, i); }
      }

      // 画节点
      const drawNode = (i, val, internal)=>{
        const pos = this.positions[i];
        if (!pos) return;
        const el = document.createElement('div');
        el.className = 'tournament-node' + (internal ? ' internal' : '');
        el.style.left = (pos.x - 24) + 'px';
        el.style.top = (pos.y - 24) + 'px';
        el.textContent = val === Infinity ? '∞' : (val == null ? '—' : String(val));
        el.dataset.index = String(i);
        nodeContainer.appendChild(el);
        return el;
      };

      // 叶子
      for (let i=0;i<n;i++){
        drawNode(base+i, this.tree.tree[base+i], false);
      }
      // 内部节点
      for (let i=base-1;i>=1;i--){
        if (this.tree.tree[i] == null) continue;
        drawNode(i, this.tree.tree[i], true);
      }
    }

    // 高亮比较的孩子与父节点
    highlightCompare(nodeIndex){
      const parentNode = document.querySelector(`.tournament-node[data-index='${nodeIndex}']`);
      const leftNode = document.querySelector(`.tournament-node[data-index='${nodeIndex*2}']`);
      const rightNode = document.querySelector(`.tournament-node[data-index='${nodeIndex*2+1}']`);
      [parentNode, leftNode, rightNode].forEach(el=>{ if (el) el.classList.add('rotating'); });
      // 高亮连线
      const lines = svg.querySelectorAll('line');
      lines.forEach(line=>{
        const x1 = parseFloat(line.getAttribute('x1')); const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2')); const y2 = parseFloat(line.getAttribute('y2'));
        const p = this.positions[nodeIndex];
        const l = this.positions[nodeIndex*2];
        const r = this.positions[nodeIndex*2+1];
        const isLeft = l && x1===l.x && y1===l.y && x2===p.x && y2===p.y;
        const isRight = r && x1===r.x && y1===r.y && x2===p.x && y2===p.y;
        if (isLeft || isRight) line.classList.add('rotating');
      });
    }
  }

  // UI 控制
  const tree = new TournamentTree(true);
  const renderer = new TournamentRenderer(tree);

  function setModeFromUI(){
    const val = document.querySelector("input[name='t-mode']:checked").value;
    const isMin = val === 'min';
    tree.setMode(isMin);
    modeLabelEl.textContent = isMin ? '最小赢家树' : '最大赢家树';
  }

  function refreshPanel(){
    leafCountEl.textContent = String(tree.leaves.length);
    heightEl.textContent = String(tree.height || 0);
    winnerEl.textContent = tree.tree && tree.tree[1] != null ? (tree.tree[1]===Infinity?'∞':String(tree.tree[1])) : '—';
  }

  function logReset(){ opLogEl.innerHTML = '<p class="log-empty">暂无步骤</p>'; }
  function logAppend(msg, cls){
    if (opLogEl.querySelector('.log-empty')) opLogEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'log-entry ' + (cls || 'info');
    p.textContent = msg;
    opLogEl.appendChild(p);
    opLogEl.scrollTop = opLogEl.scrollHeight;
  }

  function rebuildAndRender(){
    tree.build();
    renderer.render();
    refreshPanel();
  }

  // 交互：添加、随机、清空、构建
  addBtn.addEventListener('click', ()=>{
    const val = Number(insertInput.value);
    if (Number.isNaN(val)) return;
    tree.addLeaf(val);
    insertInput.value = '';
    logAppend(`添加叶子：${val}`);
  });

  randomBtn.addEventListener('click', ()=>{
    tree.clearLeaves();
    const count = Math.floor(Math.random()*6)+5; // 5~10个
    for (let i=0;i<count;i++) tree.addLeaf(Math.floor(Math.random()*100));
    logAppend(`生成随机叶子 ${count} 个`);
  });

  clearListBtn.addEventListener('click', ()=>{
    tree.clearLeaves();
    logAppend('已清空叶子数据');
  });

  buildBtn.addEventListener('click', ()=>{
    setModeFromUI();
    logReset(); Animator.clear();
    rebuildAndRender();
    if (tree.tree && tree.tree.length){ logAppend('构建完成，开始自底向上的赢家计算', 'step'); }
  });

  clearTreeBtn.addEventListener('click', ()=>{
    tree.clearTree();
    renderer.clear();
    refreshPanel();
    logAppend('已清空树结构');
  });

  // 交互：更新叶子并回溯
  updateBtn.addEventListener('click', ()=>{
    const idx = Number(updateIndexInput.value);
    const val = Number(updateValueInput.value);
    if (Number.isNaN(idx) || Number.isNaN(val)) return;
    const result = tree.updateLeaf(idx, val);
    if (!result){ logAppend('索引无效或尚未构建', 'info'); return; }
    const { path } = result;
    logReset(); Animator.clear();
    rebuildAndRender();
    logAppend(`更新叶子[${idx}] = ${val}，回溯路径长度 ${path.length}`, 'info');
    const steps = path.map((p, i) => ({
      message: `比较节点#${p.node}：L=${formatVal(p.left)} R=${formatVal(p.right)} → 赢家 ${formatVal(p.winner)}`,
      node: p.node
    }));
    Animator.setSteps('更新与回溯', steps);
  });

  function formatVal(v){ return v===Infinity?'∞':String(v); }

  // 模式切换
  modeGroup.addEventListener('change', ()=>{
    setModeFromUI();
    if (tree.tree && tree.tree.length){
      rebuildAndRender();
      logAppend('切换模式并重算赢家', 'info');
    }
  });

  // 回放按钮
  // 按钮由 Animator.bindControls 已绑定，这里不再重复绑定

  // 初始渲染空状态
  renderer.render();
  refreshPanel();
})();