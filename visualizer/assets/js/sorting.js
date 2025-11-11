// 排序总览：算法元数据与筛选逻辑

const ALGORITHMS = [
  // 比较型（Comparison)
  { id: 'bubble', name: '冒泡排序', aliases:['起泡排序'], family:'swap', type: 'comparison', stable: true, inPlace: true, online: false, time: { best:'O(n)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '相邻元素交换；简单但慢', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: true },
  { id: 'selection', name: '选择排序', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'O(n^2)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '每次选择最小/最大；不稳定', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: false },
  { id: 'insertion', name: '插入排序', aliases:['直接插入排序'], family:'insertion', type: 'comparison', stable: true, inPlace: true, online: true, time: { best:'O(n)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '局部有序时优秀；在线稳定', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: true },
  { id: 'binaryInsertion', name: '折半插入排序', aliases:['二分插入排序'], family:'insertion', type: 'comparison', stable: true, inPlace: true, online: true, time: { best:'O(n log n)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '用二分定位插入位置，移动成本仍为 O(n)', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: true },
  { id: 'shell', name: '希尔排序', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'视增量', avg:'视增量', worst:'视增量' }, space: 'O(1)', note: '分组插入；不稳定', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: false },
  { id: 'merge', name: '归并排序', family:'merge', type: 'comparison', stable: true, inPlace: false, online: false, time: { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)' }, space: 'O(n)', note: '分治合并；稳定但需额外空间', recursive: true, parallelizable: true, requiresExtraArray: true, adaptive: false },
  { id: 'quick', name: '快速排序', aliases:['快排'], family:'swap', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'O(n log n)', avg:'O(n log n)', worst:'O(n^2)' }, space: 'O(log n)', note: '分治划分；平均优秀', recursive: true, parallelizable: true, requiresExtraArray: false, adaptive: false },
  { id: 'heap', name: '堆排序', family:'selection', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)' }, space: 'O(1)', note: '堆结构选择；不稳定原地', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: false },
  { id: 'bst', name: '树排序（平衡）', type: 'comparison', stable: false, inPlace: false, online: true, time: { best:'O(n log n)', avg:'O(n log n)', worst:'O(n^2)' }, space: 'O(n)', note: '插入二叉搜索树；在线但需结构', recursive: true, parallelizable: false, requiresExtraArray: true, adaptive: false },
  { id: 'comb', name: '梳排序', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'O(n log n)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '改进冒泡；不稳定', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: false },
  { id: 'gnome', name: '地精排序', family:'insertion', type: 'comparison', stable: true, inPlace: true, online: false, time: { best:'O(n)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '与插入相似；稳定', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: true },
  { id: 'tournament', name: '锦标赛树排序', aliases:['赢家树排序'], family:'selection', type: 'comparison', stable: false, inPlace: false, online: false, time: { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)' }, space: 'O(n)', note: '构建赢家树，逐步选出最值', recursive: false, parallelizable: false, requiresExtraArray: true, adaptive: false },
  { id: 'cycle', name: '循环排序（Cycle Sort）', family:'selection', type: 'comparison', stable: false, inPlace: true, online: false, time: { best:'O(n^2)', avg:'O(n^2)', worst:'O(n^2)' }, space: 'O(1)', note: '最少写入次数；适合写入代价较高场景', recursive: false, parallelizable: false, requiresExtraArray: false, adaptive: false },

  // 非比较型（Non-Comparison)
  { id: 'counting', name: '计数排序', family:'nonComparison', type: 'nonComparison', stable: true, inPlace: false, online: false, time: { best:'O(n + k)', avg:'O(n + k)', worst:'O(n + k)' }, space: 'O(n + k)', note: '整数范围有限时高效；稳定', recursive: false, parallelizable: true, requiresExtraArray: true, adaptive: false },
  { id: 'bucket', name: '桶排序', family:'nonComparison', type: 'nonComparison', stable: true, inPlace: false, online: false, time: { best:'O(n)', avg:'视分布', worst:'O(n^2)' }, space: 'O(n + k)', note: '需分布假设；稳定性取决于桶内排序', recursive: false, parallelizable: true, requiresExtraArray: true, adaptive: false },
  { id: 'radix', name: '基数排序', family:'nonComparison', type: 'nonComparison', stable: true, inPlace: false, online: false, time: { best:'O(d(n + k))', avg:'O(d(n + k))', worst:'O(d(n + k))' }, space: 'O(n + k)', note: '按位处理；常配计数排序', recursive: false, parallelizable: true, requiresExtraArray: true, adaptive: false },

  // 图的拓扑“排序”（有向无环图）
  { id: 'topological', name: '拓扑排序（DAG）', family:'graphOrder', type: 'comparison', stable: false, inPlace: false, online: false, time: { best:'O(V+E)', avg:'O(V+E)', worst:'O(V+E)' }, space: 'O(V+E)', note: '对有向无环图进行线性化；Kahn/DFS 两种实现', recursive: true, parallelizable: false, requiresExtraArray: true, adaptive: false },
];

const state = {
  search: '',
  filters: {
    type: new Set(), // 'comparison' | 'nonComparison'
    stable: false,
    inPlace: false,
    online: false,
    timeWorst: new Set(), // 'linear' | 'nlogn' | 'quadratic' | 'nk' | 'other'
    space: new Set(),     // 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n + k)' | 'other'
    recursive: false,
    parallelizable: false,
    requiresExtraArray: false,
    adaptive: false,
    family: new Set(),    // 'insertion' | 'selection' | 'swap' | 'merge' | 'heap' | 'nonComparison' | 'graphOrder'
  },
};

function categorizeTime(expr) {
  if (!expr) return 'other';
  const s = expr.toLowerCase();
  if (s.includes('n + k')) return 'nk';
  if (s.includes('d(n + k)')) return 'nk';
  if (s.includes('n log n')) return 'nlogn';
  if (s.includes('n^2')) return 'quadratic';
  if (s.includes('o(n)')) return 'linear';
  if (s.includes('视增量') || s.includes('depends')) return 'other';
  return 'other';
}

function categorizeSpace(expr) {
  if (!expr) return 'other';
  const s = expr.toLowerCase();
  if (s.includes('o(1)')) return 'O(1)';
  if (s.includes('o(log n)')) return 'O(log n)';
  if (s.includes('o(n + k)')) return 'O(n + k)';
  if (s.includes('o(n)')) return 'O(n)';
  return 'other';
}

function renderStats(list) {
  const total = list.length;
  const comparison = list.filter(a => a.type === 'comparison').length;
  const nonComparison = list.filter(a => a.type === 'nonComparison').length;
  const stable = list.filter(a => a.stable).length;
  const inPlace = list.filter(a => a.inPlace).length;
  const online = list.filter(a => a.online).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-comparison').textContent = comparison;
  document.getElementById('stat-nonComparison').textContent = nonComparison;
  document.getElementById('stat-stable').textContent = stable;
  document.getElementById('stat-inPlace').textContent = inPlace;
  document.getElementById('stat-online').textContent = online;
}

function algoCardHTML(a) {
  const typeLabel = a.type === 'comparison' ? '比较型' : '非比较型';
  const familyMap = { insertion:'插入系', selection:'选择系', swap:'交换系', merge:'归并系', heap:'堆系', nonComparison:'非比较', graphOrder:'图拓扑' };
  const familyLabel = a.family ? (familyMap[a.family] || a.family) : undefined;
  const badges = [
    { text: typeLabel, cls: 'badge' },
    { text: a.stable ? '稳定' : '不稳定', cls: a.stable ? 'badge success' : 'badge danger' },
    { text: a.inPlace ? '原地' : '非原地', cls: a.inPlace ? 'badge success' : 'badge warn' },
    { text: a.online ? '在线' : '离线', cls: a.online ? 'badge success' : 'badge' },
    ...(familyLabel ? [{ text: familyLabel, cls: 'badge' }] : []),
  ];
  const complexities = `时间：最优 ${a.time.best}，平均 ${a.time.avg}，最坏 ${a.time.worst} ｜ 空间：${a.space}`;
  return `
    <div class="algo-card">
      <div class="algo-title">${a.name}</div>
      <div class="algo-sub">${a.note || ''}${a.aliases ? `（别名：${a.aliases.join('、')}）` : ''}</div>
      <div class="badge-row">${badges.map(b => `<span class="${b.cls}">${b.text}</span>`).join('')}</div>
      <div class="complexity">${complexities}</div>
    </div>
  `;
}

function applyFilters() {
  const q = state.search.trim().toLowerCase();
  const activeTypes = state.filters.type; // Set
  const requireStable = state.filters.stable;
  const requireInPlace = state.filters.inPlace;
  const requireOnline = state.filters.online;
  const worstCats = state.filters.timeWorst; // Set
  const spaceCats = state.filters.space;     // Set
  const requireRecursive = state.filters.recursive;
  const requireParallel = state.filters.parallelizable;
  const requireExtraArray = state.filters.requiresExtraArray;
  const requireAdaptive = state.filters.adaptive;
  let list = ALGORITHMS.filter(a => {
    if (q && !a.name.toLowerCase().includes(q)) return false;
    if (q && a.aliases && a.aliases.some(x => x.toLowerCase().includes(q))) {
      // alias match allowed, do not early return false
    } else if (q && !a.name.toLowerCase().includes(q)) {
      return false;
    }
    if (activeTypes.size > 0 && !activeTypes.has(a.type)) return false;
    if (requireStable && !a.stable) return false;
    if (requireInPlace && !a.inPlace) return false;
    if (requireOnline && !a.online) return false;
    if (worstCats.size > 0) {
      const wc = categorizeTime(a.time?.worst);
      if (!worstCats.has(wc)) return false;
    }
    if (spaceCats.size > 0) {
      const sc = categorizeSpace(a.space);
      if (!spaceCats.has(sc)) return false;
    }
    if (requireRecursive && !a.recursive) return false;
    if (requireParallel && !a.parallelizable) return false;
    if (requireExtraArray && !a.requiresExtraArray) return false;
    if (requireAdaptive && !a.adaptive) return false;
    if (state.filters.family.size > 0) {
      const fam = a.family || 'other';
      if (!state.filters.family.has(fam)) return false;
    }
    return true;
  });

  const grid = document.getElementById('grid');
  if (!grid) return;
  renderStats(list);
  grid.innerHTML = list.length
    ? list.map(algoCardHTML).join('')
    : `<div class="empty">没有匹配的算法，试试调整筛选条件。</div>`;
}

function toggleChipActive(el) {
  el.classList.toggle('active');
}

function init() {
  // 绑定搜索
  const search = document.getElementById('search');
  search.addEventListener('input', () => { state.search = search.value; applyFilters(); });

  // 绑定筛选 chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      toggleChipActive(chip);
      const filter = chip.dataset.filter;
      const value = chip.dataset.value;
      if (filter === 'type') {
        if (chip.classList.contains('active')) state.filters.type.add(value);
        else state.filters.type.delete(value);
      } else if (filter === 'timeWorst') {
        if (chip.classList.contains('active')) state.filters.timeWorst.add(value);
        else state.filters.timeWorst.delete(value);
      } else if (filter === 'space') {
        if (chip.classList.contains('active')) state.filters.space.add(value);
        else state.filters.space.delete(value);
      } else if (filter === 'family') {
        if (chip.classList.contains('active')) state.filters.family.add(value);
        else state.filters.family.delete(value);
      } else {
        const flag = chip.classList.contains('active');
        state.filters[filter] = flag && value === 'true';
      }
      applyFilters();
    });
  });

  // 清空筛选
  const clearBtn = document.getElementById('clearFilters');
  clearBtn.addEventListener('click', () => {
    state.search = '';
    state.filters.type.clear();
    state.filters.stable = false;
    state.filters.inPlace = false;
    state.filters.online = false;
    state.filters.timeWorst.clear();
    state.filters.space.clear();
    state.filters.family.clear();
    state.filters.recursive = false;
    state.filters.parallelizable = false;
    state.filters.requiresExtraArray = false;
    state.filters.adaptive = false;
    document.getElementById('search').value = '';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    applyFilters();
  });

  applyFilters();
}

document.addEventListener('DOMContentLoaded', init);