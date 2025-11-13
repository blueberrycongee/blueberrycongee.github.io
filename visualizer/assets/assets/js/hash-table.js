// 哈希表可视化（开放寻址：线性/平方试探 + 懒惰删除）

class HashTable {
  constructor(bucketCount = 8, probingMethod = 'linear') {
    this.bucketCount = Math.max(1, bucketCount | 0);
    this.slots = Array.from({ length: this.bucketCount }, () => null);
    this.size = 0; // 活跃元素（不含墓碑）
    this.probingMethod = probingMethod === 'quadratic' ? 'quadratic' : 'linear';
  }

  setProbingMethod(method) {
    this.probingMethod = method === 'quadratic' ? 'quadratic' : 'linear';
  }

  hash(key) {
    const n = parseInt(String(key), 10);
    const m = this.bucketCount;
    const idx = ((n % m) + m) % m; // 支持负数键，取正余数
    return idx;
  }

  probeIndex(h, j) {
    if (this.probingMethod === 'quadratic') {
      return (h + j * j) % this.bucketCount;
    }
    return (h + j) % this.bucketCount; // 线性试探
  }

  search(key) {
    const sKey = String(key);
    const h = this.hash(sKey);
    for (let j = 0; j < this.bucketCount; j++) {
      const idx = this.probeIndex(h, j);
      const slot = this.slots[idx];
      if (slot == null) {
        return { index: idx, found: false, entry: null, probes: j + 1 };
      }
      if (!slot.deleted && String(slot.key) === sKey) {
        return { index: idx, found: true, entry: slot, probes: j + 1 };
      }
    }
    return { index: -1, found: false, entry: null, probes: this.bucketCount };
  }

  insert(key, value = '') {
    const sKey = String(key);
    const h = this.hash(sKey);
    let firstTomb = -1;
    for (let j = 0; j < this.bucketCount; j++) {
      const idx = this.probeIndex(h, j);
      const slot = this.slots[idx];
      if (slot == null) {
        const placeIdx = firstTomb >= 0 ? firstTomb : idx;
        this.slots[placeIdx] = { key: parseInt(sKey, 10), value: String(value), deleted: false };
        this.size += 1;
        return { index: placeIdx, updated: false, probes: j + 1, tombstoneUsed: firstTomb >= 0 };
      }
      if (!slot.deleted && String(slot.key) === sKey) {
        slot.value = String(value);
        return { index: idx, updated: true, probes: j + 1 };
      }
      if (slot.deleted && firstTomb < 0) firstTomb = idx;
    }
    return { index: -1, updated: false, probes: this.bucketCount, full: true };
  }

  delete(key) {
    const res = this.search(key);
    if (res.found) {
      if (!this.slots[res.index].deleted) {
        this.slots[res.index].deleted = true;
        this.size -= 1;
      }
      return { index: res.index, removed: true, probes: res.probes };
    }
    return { index: res.index, removed: false, probes: res.probes };
  }

  resize(newBucketCount) {
    this.rehash(newBucketCount);
  }

  rehash(newBucketCount) {
    const newCount = Math.max(1, newBucketCount | 0);
    const entries = [];
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (s && !s.deleted) entries.push({ key: s.key, value: s.value });
    }
    this.bucketCount = newCount;
    this.slots = Array.from({ length: newCount }, () => null);
    this.size = 0;
    for (const e of entries) this.insert(e.key, e.value);
  }
}

class HashTableVisualizer {
  constructor() {
    this.canvas = document.getElementById('hash-canvas');
    this.bucketContainer = document.getElementById('bucket-container');
    this.operationLog = document.getElementById('operation-log');
    this.propBuckets = document.getElementById('prop-buckets');
    this.propSize = document.getElementById('prop-size');
    this.propLoad = document.getElementById('prop-load');
    this.propASLSuccess = document.getElementById('prop-asl-success');
    this.propASLFail = document.getElementById('prop-asl-fail');
    const initialBucketCount = parseInt(document.getElementById('bucket-count')?.value || '8', 10) || 8;
    const initialMethod = document.getElementById('probing-quadratic')?.checked ? 'quadratic' : 'linear';
    this.table = new HashTable(initialBucketCount, initialMethod);
    this.probingMethod = initialMethod;

    this.stepController = new AnimationStepController({
      nodeContainer: this.bucketContainer,
      canvas: this.canvas,
      overlayParent: document.body,
      overlayAutoHideMs: 3000,
      onStep: this.onStepChange.bind(this)
    });

    this.init();
  }

  init() {
    this.renderTable();
    // 事件绑定
    document.getElementById('insert-btn')?.addEventListener('click', () => {
      const keyStr = document.getElementById('key-input').value.trim();
      const value = document.getElementById('value-input').value.trim();
      if (!/^[-]?\d+$/.test(keyStr)) { this.addLog('info', '键必须为整数'); return; }
      const key = parseInt(keyStr, 10);
      this.insertAnimated(key, value);
    });

    document.getElementById('search-btn')?.addEventListener('click', () => {
      const keyStr = document.getElementById('query-input').value.trim();
      if (!/^[-]?\d+$/.test(keyStr)) { this.addLog('info', '键必须为整数'); return; }
      const key = parseInt(keyStr, 10);
      this.searchAnimated(key);
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      const keyStr = document.getElementById('query-input').value.trim();
      if (!/^[-]?\d+$/.test(keyStr)) { this.addLog('info', '键必须为整数'); return; }
      const key = parseInt(keyStr, 10);
      this.deleteAnimated(key);
    });

    document.getElementById('clear-btn')?.addEventListener('click', () => {
      this.table = new HashTable(this.table.bucketCount, this.probingMethod);
      this.addLog('info', '清空哈希表');
      this.renderTable();
      this.stepController.clear();
    });

    document.getElementById('resize-btn')?.addEventListener('click', () => {
      const val = parseInt(document.getElementById('bucket-count').value || '8', 10) || 8;
      this.resizeAnimated(val);
    });

    // 探查方式切换
    document.getElementById('probing-linear')?.addEventListener('change', () => this.changeProbing('linear'));
    document.getElementById('probing-quadratic')?.addEventListener('change', () => this.changeProbing('quadratic'));

    // 步进按钮
    this.stepController.bindControls(
      document.getElementById('step-prev-btn'),
      document.getElementById('step-next-btn')
    );
    this.stepController.bindKeyboard({ prevKey: 'ArrowLeft', nextKey: 'ArrowRight' });
  }

  changeProbing(method) {
    this.probingMethod = method;
    this.table.setProbingMethod(method);
    const pre = this.snapshotTable();
    const steps = [];
    steps.push({ message: `切换探查方式为 ${method === 'linear' ? '线性试探' : '平方试探'}`, highlightBuckets: [], snapshot: pre });
    this.table.rehash(this.table.bucketCount);
    const after = this.snapshotTable();
    steps.push({ message: '依据新探查方式完成重哈希', highlightBuckets: [], snapshot: after });
    this.stepController.setSteps('切换探查方式', steps);
    this.addLog('info', `探查方式切换为 ${method === 'linear' ? '线性' : '平方'}`);
    this.renderTable();
  }

  // 步进回调：渲染快照并高亮
  onStepChange(step) {
    if (step && step.snapshot) {
      this.renderSnapshot(step.snapshot);
      if (Array.isArray(step.highlightValues)) this.highlightValues(step.highlightValues);
      if (Array.isArray(step.highlightBuckets)) this.highlightBuckets(step.highlightBuckets);
    }
  }

  // 渲染当前表结构
  renderTable() {
    const snapshot = this.snapshotTable();
    this.renderSnapshot(snapshot);
  }

  // 根据快照重建并渲染
  renderSnapshot(snapshot) {
    // 更新内部状态（用于属性显示）
    this.table.bucketCount = snapshot.bucketCount;
    this.table.size = snapshot.size;
    this.table.slots = snapshot.slots.map(s => s ? { key: String(s.key), value: String(s.value || ''), deleted: !!s.deleted } : null);

    // 属性
    this.propBuckets.textContent = String(this.table.bucketCount);
    this.propSize.textContent = String(this.table.size);
    const load = this.table.bucketCount > 0 ? (this.table.size / this.table.bucketCount) : 0;
    this.propLoad.textContent = load.toFixed(2);
    if (this.propASLSuccess) this.propASLSuccess.textContent = this.computeASLSuccess().toFixed(2);
    if (this.propASLFail) this.propASLFail.textContent = this.computeASLFail().toFixed(2);

    // 生成DOM
    const grid = document.createElement('div');
    grid.className = 'bucket-grid';
    for (let i = 0; i < this.table.bucketCount; i++) {
      const bucket = document.createElement('div');
      bucket.className = 'bucket';
      bucket.dataset.index = String(i);
      const header = document.createElement('div');
      header.className = 'bucket-header';
      const s = snapshot.slots[i];
      let state = '空';
      if (s) state = s.deleted ? '墓碑' : '占用';
      header.innerHTML = `<span class="bucket-title">桶 ${i}</span><span class="bucket-state">状态 ${state}</span>`;
      const entries = document.createElement('div');
      entries.className = 'bucket-entries';
      if (s && !s.deleted) {
        const item = document.createElement('div');
        item.className = 'entry';
        item.dataset.key = String(s.key);
        item.innerHTML = `<span class="entry-key">${s.key}</span><span class="entry-value">${s.value ?? ''}</span>`;
        entries.appendChild(item);
      } else if (s && s.deleted) {
        const item = document.createElement('div');
        item.className = 'entry deleted';
        item.innerHTML = `<span class="entry-key">墓碑</span>`;
        entries.appendChild(item);
      }
      bucket.appendChild(header);
      bucket.appendChild(entries);
      grid.appendChild(bucket);
    }
    this.bucketContainer.innerHTML = '';
    this.bucketContainer.appendChild(grid);
  }

  highlightValues(values) {
    const keys = values.map(v => String(v));
    this.bucketContainer.querySelectorAll('.entry').forEach(el => el.classList.remove('highlight'));
    keys.forEach(k => {
      this.bucketContainer.querySelectorAll(`.entry[data-key="${CSS.escape(k)}"]`).forEach(el => el.classList.add('highlight'));
    });
  }

  highlightBuckets(indices) {
    const idxs = (indices || []).map(i => String(i));
    this.bucketContainer.querySelectorAll('.bucket').forEach(el => el.classList.remove('highlight'));
    idxs.forEach(i => {
      const el = this.bucketContainer.querySelector(`.bucket[data-index="${CSS.escape(i)}"]`);
      if (el) el.classList.add('highlight');
    });
  }

  computeASLSuccess() {
    let total = 0;
    let count = 0;
    for (let i = 0; i < this.table.slots.length; i++) {
      const s = this.table.slots[i];
      if (s && !s.deleted) {
        const res = this.table.search(s.key);
        total += res.probes;
        count += 1;
      }
    }
    return count ? total / count : 0;
  }

  computeASLFail() {
    const m = this.table.bucketCount | 0;
    if (m <= 0) return 0;
    let total = 0;
    for (let h = 0; h < m; h++) {
      let probes = 0;
      for (let j = 0; j < m; j++) {
        probes += 1;
        const idx = this.table.probeIndex(h, j);
        const slot = this.table.slots[idx];
        if (slot == null) break; // 遇到空位即失败结束
        // 墓碑与占用均继续试探
      }
      total += probes;
    }
    return total / m;
  }

  snapshotTable() {
    return {
      bucketCount: this.table.bucketCount,
      size: this.table.size,
      slots: this.table.slots.map(s => s ? { key: String(s.key), value: String(s.value || ''), deleted: !!s.deleted } : null)
    };
  }

  addLog(type, text) {
    if (!this.operationLog) return;
    const empty = this.operationLog.querySelector('.log-empty');
    if (empty) empty.remove();
    const p = document.createElement('p');
    p.className = `log-entry ${type}`;
    p.textContent = text;
    this.operationLog.appendChild(p);
    this.operationLog.scrollTop = this.operationLog.scrollHeight;
  }

  insertAnimated(key, value = '') {
    const sKey = String(key);
    const h = this.table.hash(sKey);
    const steps = [];
    const pre = this.snapshotTable();
    steps.push({ message: `计算哈希：key=${sKey} → h=${h}`, highlightValues: [sKey], snapshot: pre });

    for (let j = 0; j < this.table.bucketCount; j++) {
      const idx = this.table.probeIndex(h, j);
      const slot = this.table.slots[idx];
      const label = slot == null ? '空' : (slot.deleted ? '墓碑' : `占用(${slot.key})`);
      steps.push({ message: `第 ${j + 1} 次试探 → 位置 ${idx}：${label}`,
        highlightBuckets: [idx], snapshot: pre });
      if (slot == null || (!slot.deleted && String(slot.key) === sKey)) break;
    }

    const info = this.table.insert(sKey, value);
    const after = this.snapshotTable();
    if (info.full) {
      steps.push({ message: '插入失败：表已满', highlightBuckets: [], snapshot: after });
    } else if (info.updated) {
      steps.push({ message: `更新成功：覆盖键 ${sKey} 的值`, highlightBuckets: [info.index], highlightValues: [sKey], snapshot: after });
    } else {
      steps.push({ message: `插入成功：位置 ${info.index}${info.tombstoneUsed ? '（使用墓碑）' : ''}`,
        highlightBuckets: [info.index], highlightValues: [sKey], snapshot: after });
    }
    steps.push({ message: '插入完成', highlightBuckets: [], highlightValues: [sKey], snapshot: after });

    this.stepController.setSteps('插入过程', steps);
    this.addLog('insert', `插入 key=${sKey}${value ? `, value=${value}` : ''}`);
    this.renderTable();
  }

  searchAnimated(key) {
    const sKey = String(key);
    const h = this.table.hash(sKey);
    const steps = [];
    const pre = this.snapshotTable();
    steps.push({ message: `计算哈希：key=${sKey} → h=${h}`, highlightValues: [sKey], snapshot: pre });
    let found = false;
    let foundIndex = -1;
    for (let j = 0; j < this.table.bucketCount; j++) {
      const idx = this.table.probeIndex(h, j);
      const slot = this.table.slots[idx];
      const label = slot == null ? '空' : (slot.deleted ? '墓碑' : `占用(${slot.key})`);
      steps.push({ message: `第 ${j + 1} 次试探 → 位置 ${idx}：${label}`, highlightBuckets: [idx], snapshot: pre });
      if (slot == null) break; // 空位提前失败
      if (!slot.deleted && String(slot.key) === sKey) { found = true; foundIndex = idx; break; }
    }
    if (found) {
      steps.push({ message: `查找成功：位置 ${foundIndex}`, highlightBuckets: [foundIndex], highlightValues: [sKey], snapshot: pre });
    } else {
      steps.push({ message: '查找失败：未命中', highlightBuckets: [], snapshot: pre });
    }
    this.stepController.setSteps('查找过程', steps);
    this.addLog('search', `查找 key=${sKey}`);
  }

  deleteAnimated(key) {
    const sKey = String(key);
    const h = this.table.hash(sKey);
    const steps = [];
    const pre = this.snapshotTable();
    steps.push({ message: `计算哈希：key=${sKey} → h=${h}`, highlightValues: [sKey], snapshot: pre });
    let foundIndex = -1;
    for (let j = 0; j < this.table.bucketCount; j++) {
      const idx = this.table.probeIndex(h, j);
      const slot = this.table.slots[idx];
      const label = slot == null ? '空' : (slot.deleted ? '墓碑' : `占用(${slot.key})`);
      steps.push({ message: `第 ${j + 1} 次试探 → 位置 ${idx}：${label}`, highlightBuckets: [idx], snapshot: pre });
      if (slot == null) break; // 空位提前失败
      if (!slot.deleted && String(slot.key) === sKey) { foundIndex = idx; break; }
    }
    const info = this.table.delete(sKey);
    const after = this.snapshotTable();
    if (info.removed) {
      steps.push({ message: `删除成功：位置 ${info.index} 标记墓碑`, highlightBuckets: [info.index], highlightValues: [sKey], snapshot: after });
    } else {
      steps.push({ message: '删除失败：未命中', highlightBuckets: [], snapshot: after });
    }
    steps.push({ message: '删除操作完成', highlightBuckets: [], snapshot: after });
    this.stepController.setSteps('删除过程', steps);
    this.addLog('delete', `删除 key=${sKey}`);
    this.renderTable();
  }

  resizeAnimated(newCount) {
    const pre = this.snapshotTable();
    const steps = [];
    steps.push({ message: `调整桶数量至 ${newCount}，开始重哈希`, highlightValues: [], snapshot: pre });
    this.table.resize(newCount);
    const after = this.snapshotTable();
    steps.push({ message: '重哈希完成', highlightValues: [], snapshot: after });
    this.stepController.setSteps('调整桶数量', steps);
    this.addLog('info', `调整桶数量为 ${newCount}`);
    this.renderTable();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HashTableVisualizer();
});
