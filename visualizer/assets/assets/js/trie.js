// Trie 可视化与步进控制

class TrieNode {
  constructor(char = '') {
    this.char = char;
    this.children = {}; // char -> TrieNode
    this.end = false;
    this.id = `n_${Math.random().toString(36).slice(2, 8)}`;
    this.level = 0; // root: 0
    this.xIndex = 0; // 横向索引用于简单布局
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode('');
    this.words = [];
  }
  setWords(words) { this.words = words; }

  // 生成构建步骤（逐字符）
  buildSteps() {
    const steps = [];
    for (const word of this.words) {
      let node = this.root;
      steps.push({ type: 'log', text: `开始插入: ${word}` });
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const path = word.slice(0, i + 1);
        const exists = !!node.children[ch];
        steps.push({ type: 'highlight', nodeChar: node.char, level: node.level, text: `定位到节点: '${node.char}'` });
        if (!exists) {
          steps.push({ type: 'createNode', parentId: node.id, char: ch, level: node.level + 1, note: `创建节点 '${ch}'（路径 ${path}）` });
        }
        steps.push({ type: 'link', parentId: node.id, char: ch, text: `连接边 '${node.char}' → '${ch}'` });
        node = node.children[ch] || (node.children[ch] = new TrieNode(ch));
        node.level = node.level || (steps[steps.length - 2]?.level ?? (node.level));
      }
      node.end = true;
      steps.push({ type: 'markEnd', nodeId: node.id, text: `标记单词结束: ${word}` });
    }
    steps.push({ type: 'log', text: '构建完成' });
    return steps;
  }

  // 查找步骤（完整匹配）
  searchSteps(query) {
    const steps = [{ type: 'log', text: `开始查找: ${query}` }];
    let node = this.root;
    for (let i = 0; i < query.length; i++) {
      const ch = query[i];
      steps.push({ type: 'highlight', nodeId: node.id, text: `在 '${node.char}' 查找 '${ch}'` });
      if (!node.children[ch]) {
        steps.push({ type: 'log', text: `未找到路径 '${ch}'，查找失败` });
        return steps;
      }
      steps.push({ type: 'linkHighlight', parentId: node.id, char: ch });
      node = node.children[ch];
      steps.push({ type: 'nodeHighlight', nodeId: node.id });
    }
    steps.push({ type: 'log', text: node.end ? '匹配成功（到达终止节点）' : '只到达前缀，非完整匹配' });
    return steps;
  }
}

class TrieRenderer {
  constructor(root, nodesLayer, edgesSvg, logEl, dictEl) {
    this.root = root;
    this.nodesLayer = nodesLayer;
    this.edgesSvg = edgesSvg;
    this.logEl = logEl;
    this.dictEl = dictEl;
    this.nodePos = new Map(); // nodeId -> {x,y}
    this.levelSlots = []; // 每层已用的 xIndex
    this.cellW = 72; this.cellH = 90; this.marginX = 48; this.marginY = 60;
    this.ensureNode(root, 0, 0);
  }

  log(text) {
    const p = document.createElement('p');
    p.textContent = text;
    this.logEl.appendChild(p);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  updateDict(words) {
    this.dictEl.innerHTML = words.map(w => `<span class="dict-chip">${w}</span>`).join('');
  }

  ensureNode(node, level, xIndex) {
    node.level = level;
    node.xIndex = xIndex;
    if (!this.nodePos.has(node.id)) {
      const x = this.marginX + xIndex * this.cellW;
      const y = this.marginY + level * this.cellH;
      this.nodePos.set(node.id, { x, y });
      const el = document.createElement('div');
      el.className = `node ${node.char === '' ? 'root' : ''}`;
      el.id = node.id;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.textContent = node.char === '' ? '∅' : node.char;
      this.nodesLayer.appendChild(el);
    }
  }

  drawEdge(parentId, childId) {
    const p = this.nodePos.get(parentId);
    const c = this.nodePos.get(childId);
    if (!p || !c) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(p.x + 21));
    line.setAttribute('y1', String(p.y + 21));
    line.setAttribute('x2', String(c.x + 21));
    line.setAttribute('y2', String(c.y + 21));
    line.setAttribute('class', 'edge');
    this.edgesSvg.appendChild(line);
    return line;
  }

  highlightNode(nodeId, flag = true) {
    const el = document.getElementById(nodeId);
    if (el) el.classList.toggle('highlight', flag);
  }

  markEnd(nodeId) {
    const el = document.getElementById(nodeId);
    if (el) el.classList.add('end');
  }

  handleStep(step, trie) {
    switch (step.type) {
      case 'log':
        this.log(step.text);
        break;
      case 'highlight': {
        // 通过父节点字符与层级近似定位高亮（构建期）
        const target = [...this.nodePos.keys()].find(id => {
          const el = document.getElementById(id);
          return el && el.textContent === (step.nodeChar === '' ? '∅' : step.nodeChar) && (step.level === undefined || step.level === (el.dataset?.level || 0));
        });
        if (target) this.highlightNode(target, true);
        break;
      }
      case 'createNode': {
        // 分配一个新的横向位置（简单：使用层级计数）
        const lvl = step.level;
        this.levelSlots[lvl] = (this.levelSlots[lvl] || 0) + 1;
        const xIdx = this.levelSlots[lvl] - 1;
        const parentEl = document.getElementById(step.parentId);
        const node = new TrieNode(step.char);
        node.level = lvl;
        node.xIndex = xIdx;
        // 把节点挂到父节点 children（渲染层记录即可）
        // 实际结构已在 Trie.buildSteps 中分配，这里只负责显示
        this.ensureNode(node, lvl, xIdx);
        this.log(step.note || `创建节点 ${step.char}`);
        // 保存映射：使用 step 的派生 id 不覆盖真实结构 id
        step._createdId = node.id;
        break;
      }
      case 'link': {
        // 获取孩子 id：优先使用已存在节点，否则使用最近创建的 id
        let childId;
        // 尝试通过字符与层级搜索已有节点
        const candidates = [...this.nodePos.keys()].filter(id => {
          const el = document.getElementById(id);
          return el && el.textContent === step.char;
        });
        childId = candidates[candidates.length - 1];
        if (!childId && step._createdId) childId = step._createdId;
        if (childId) this.drawEdge(step.parentId, childId);
        break;
      }
      case 'markEnd':
        this.markEnd(step.nodeId);
        break;
      case 'linkHighlight': {
        // 简化为高亮父节点
        this.highlightNode(step.parentId, true);
        break;
      }
      case 'nodeHighlight':
        this.highlightNode(step.nodeId, true);
        break;
      default:
        break;
    }
  }
}

function parseWords(input) {
  return input
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function main() {
  const nodesLayer = document.getElementById('nodes');
  const edgesSvg = document.getElementById('edges');
  const logEl = document.getElementById('log');
  const dictEl = document.getElementById('dictList');
  const canvas = document.getElementById('canvas');
  const stepPrev = document.getElementById('step-prev');
  const stepNext = document.getElementById('step-next');

  const trie = new Trie();
  const renderer = new TrieRenderer(trie.root, nodesLayer, edgesSvg, logEl, dictEl);

  const stepController = new AnimationStepController({
    nodeContainer: nodesLayer,
    canvas,
    overlayParent: canvas,
    onStep: (step, i) => {
      if (!step) return;
      renderer.handleStep(step, trie);
    }
  });
  stepController.bindControls(stepPrev, stepNext);
  stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });

  function setSteps(steps, title) {
    stepController.setSteps(title || 'Trie 操作回放', steps);
    // 从第一步开始回放，避免默认指向最后一步
    stepController.goTo(0);
  }

  const wordInput = document.getElementById('wordInput');
  const addWordsBtn = document.getElementById('addWordsBtn');
  const buildTrieBtn = document.getElementById('buildTrieBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const prefixBtn = document.getElementById('prefixBtn');

  let dict = [];

  function refreshDict() { renderer.updateDict(dict); }

  addWordsBtn.addEventListener('click', () => {
    const words = parseWords(wordInput.value);
    if (words.length === 0) return;
    dict = dict.concat(words);
    refreshDict();
  });

  buildTrieBtn.addEventListener('click', () => {
    // 清理画布
    nodesLayer.innerHTML = '';
    edgesSvg.innerHTML = '';
    logEl.innerHTML = '';
    // 重建结构
    const words = dict.length ? dict : parseWords(wordInput.value);
    if (words.length === 0) return;
    trie.root = new TrieNode('');
    trie.setWords(words);
    renderer.root = trie.root;
    renderer.nodePos.clear();
    renderer.levelSlots = [];
    renderer.ensureNode(trie.root, 0, 0);
    const steps = trie.buildSteps();
    setSteps(steps, '构建字典树');
  });

  clearBtn.addEventListener('click', () => {
    dict = [];
    refreshDict();
    nodesLayer.innerHTML = '';
    edgesSvg.innerHTML = '';
    logEl.innerHTML = '';
    trie.root = new TrieNode('');
    renderer.root = trie.root;
    renderer.nodePos.clear();
    renderer.levelSlots = [];
    renderer.ensureNode(trie.root, 0, 0);
  });

  searchBtn.addEventListener('click', () => {
    const q = (searchInput.value || '').trim();
    if (!q) return;
    const steps = trie.searchSteps(q);
    setSteps(steps, `查找: ${q}`);
  });

  prefixBtn.addEventListener('click', () => {
    const q = (searchInput.value || '').trim();
    if (!q) return;
    const steps = trie.searchSteps(q);
    setSteps(steps, `前缀查找: ${q}`);
  });
}

document.addEventListener('DOMContentLoaded', main);
