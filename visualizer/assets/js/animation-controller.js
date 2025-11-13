// 通用动画步进控制器：支持“回退/前进一步”复用

class AnimationStepController {
  constructor({ nodeContainer, canvas, overlayParent = document.body, onStep, overlayAutoHideMs = null } = {}) {
    this.nodeContainer = nodeContainer;
    this.canvas = canvas;
    this.overlayParent = overlayParent;
    this.onStepCallback = typeof onStep === 'function' ? onStep : null;
    this.overlayAutoHideMs = (typeof overlayAutoHideMs === 'number' && overlayAutoHideMs > 0) ? overlayAutoHideMs : null;
    this.title = '';
    this.steps = [];
    this.index = -1; // 当前指向的步骤索引，-1 表示未开始
    this.overlay = null;
    this.stepEl = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.autoHideTimerId = null;
    this.keyboardTarget = null;
    this.keydownHandler = null;
  }

  bindControls(prevBtn, nextBtn) {
    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    this.updateButtons();
  }

  bindKeyboard({ targetEl = document, prevKey = 'ArrowLeft', nextKey = 'ArrowRight' } = {}) {
    const tgt = targetEl || document;
    if (this.keyboardTarget && this.keydownHandler) {
      try { this.keyboardTarget.removeEventListener('keydown', this.keydownHandler); } catch (_) {}
      this.keyboardTarget = null;
      this.keydownHandler = null;
    }
    const handler = (e) => {
      const el = e.target;
      const tag = (el && el.tagName) ? el.tagName.toLowerCase() : '';
      const editable = (el && (el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'));
      if (editable) return;
      if (e.key === prevKey) { e.preventDefault(); this.prev(); }
      else if (e.key === nextKey) { e.preventDefault(); this.next(); }
    };
    tgt.addEventListener('keydown', handler);
    this.keyboardTarget = tgt;
    this.keydownHandler = handler;
  }

  unbindKeyboard() {
    if (this.keyboardTarget && this.keydownHandler) {
      try { this.keyboardTarget.removeEventListener('keydown', this.keydownHandler); } catch (_) {}
      this.keyboardTarget = null;
      this.keydownHandler = null;
    }
  }

  setSteps(title, steps) {
    this.title = title || '';
    this.steps = Array.isArray(steps) ? steps : [];
    // 默认指向最后一步（当前状态），避免一设置步骤就跳到“插入前”导致画布清空
    this.index = this.steps.length ? (this.steps.length - 1) : -1;
    this.ensureOverlay();
    this.renderStep();
    this.updateButtons();
  }

  clear() {
    this.unmarkAll();
    this.steps = [];
    this.index = -1;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.stepEl = null;
    }
    this.updateButtons();
  }

  prev() {
    if (this.index <= 0) return false;
    this.index -= 1;
    this.renderStep();
    this.updateButtons();
    return true;
  }

  next() {
    if (this.index === -1 || this.index >= this.steps.length - 1) return false;
    this.index += 1;
    this.renderStep();
    this.updateButtons();
    return true;
  }

  goTo(idx) {
    const n = Number(idx);
    if (!Number.isInteger(n)) return false;
    if (n < 0 || n > this.steps.length - 1) return false;
    this.index = n;
    this.renderStep();
    this.updateButtons();
    return true;
  }

  ensureOverlay() {
    if (!this.overlay) {
      const overlay = document.createElement('div');
      overlay.className = 'animation-overlay show';
      overlay.innerHTML = `<div class="rotation-title"></div><div class="rotation-step"></div>`;
      this.overlayParent.appendChild(overlay);
      this.overlay = overlay;
      this.stepEl = overlay.querySelector('.rotation-step');
      try { overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'polite'); overlay.setAttribute('aria-atomic', 'true'); } catch (_) {}
    }
    this.showOverlay();
    const titleEl = this.overlay.querySelector('.rotation-title');
    if (titleEl) titleEl.textContent = this.title || '';
  }

  renderStep() {
    this.ensureOverlay();
    this.unmarkAll();
    if (this.index === -1 || !this.steps.length) {
      if (this.stepEl) this.stepEl.textContent = '';
      this.scheduleAutoHide(true);
      return;
    }
    const s = this.steps[this.index];
    if (this.stepEl) this.stepEl.textContent = s?.message || '';
    // 若提供自定义 onStep 回调，则交由可视化器处理（例如按值高亮并渲染快照）
    if (this.onStepCallback) {
      try { this.onStepCallback(s, this.index); } catch (e) {}
    } else {
      this.markNodes(s?.nodes || []);
    }
    this.scheduleAutoHide();
  }

  updateButtons() {
    const hasSteps = this.steps.length > 0;
    if (this.prevBtn) {
      this.prevBtn.disabled = !hasSteps || this.index <= 0;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = !hasSteps || this.index >= this.steps.length - 1;
    }
  }

  markNodes(nodes) {
    (nodes || []).forEach(n => {
      if (n && n.domElement) n.domElement.classList.add('rotating');
    });
    const lines = this.canvas?.querySelectorAll('line') || [];
    const containerRect = this.nodeContainer?.getBoundingClientRect?.();
    lines.forEach(line => {
      const x1 = parseFloat(line.getAttribute('x1'));
      const y1 = parseFloat(line.getAttribute('y1'));
      (nodes || []).forEach(n => {
        if (n && n.domElement && containerRect) {
          const rect = n.domElement.getBoundingClientRect();
          const nodeX = rect.left + rect.width / 2 - containerRect.left;
          const nodeY = rect.top + rect.height / 2 - containerRect.top;
          if (Math.abs(x1 - nodeX) < 5 && Math.abs(y1 - nodeY) < 5) {
            line.classList.add('rotating');
          }
        }
      });
    });
  }

  unmarkAll() {
    if (this.nodeContainer) {
      this.nodeContainer.querySelectorAll('.avl-node, .rbt-node, .splay-node, .btree-node, .bplus-node, .heap-node, .graph-node, .tournament-node').forEach(el => el.classList.remove('rotating'));
    }
    if (this.canvas) {
      this.canvas.querySelectorAll('line').forEach(line => line.classList.remove('rotating'));
    }
    // 支持 KMP 可视化格子高亮清理
    try {
      document.querySelectorAll('.kmp-cell.rotating').forEach(el => el.classList.remove('rotating'));
    } catch (_) {}
    // 支持 BM 可视化格子高亮清理
    try {
      document.querySelectorAll('.bm-cell.rotating').forEach(el => el.classList.remove('rotating'));
    } catch (_) {}
  }

  showOverlay() {
    if (!this.overlay) return;
    this.overlay.style.display = '';
    if (!this.overlay.classList.contains('show')) this.overlay.classList.add('show');
  }

  hideOverlay() {
    if (!this.overlay) return;
    this.overlay.style.display = 'none';
  }

  scheduleAutoHide(force = false) {
    if (!this.overlayAutoHideMs && !force) return;
    if (this.autoHideTimerId) {
      try { clearTimeout(this.autoHideTimerId); } catch (e) {}
      this.autoHideTimerId = null;
    }
    const ms = force ? (this.overlayAutoHideMs || 0) : this.overlayAutoHideMs;
    if (typeof ms === 'number') {
      this.autoHideTimerId = setTimeout(() => {
        this.hideOverlay();
        this.autoHideTimerId = null;
      }, ms);
    }
  }
}

window.AnimationStepController = AnimationStepController;
