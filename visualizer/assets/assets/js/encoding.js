// 指令与编码演示脚本

function padBitsFromBigInt(bi, width) {
  const s = bi.toString(2);
  if (s.length >= width) return s.slice(-width);
  return '0'.repeat(width - s.length) + s;
}

function groupBits(bits, size = 4) {
  let out = '';
  for (let i = 0; i < bits.length; i++) {
    out += bits[i];
    if ((i + 1) % size === 0 && i < bits.length - 1) out += ' ';
  }
  return out;
}

function updateBases() {
  const inputEl = document.getElementById('bases-input');
  const radixEl = document.getElementById('bases-radix');
  const outB2 = document.getElementById('bases-output-b2');
  const outB10 = document.getElementById('bases-output-b10');
  const outB16 = document.getElementById('bases-output-b16');
  const s = (inputEl.value || '').trim();
  if (!s) {
    outB2.textContent = '';
    outB10.textContent = '';
    outB16.textContent = '';
    return;
  }
  try {
    let bi;
    const rsel = radixEl.value;
    if (rsel === 'auto') {
      // BigInt 支持 0b/0o/0x 前缀或十进制
      bi = BigInt(s);
    } else {
      const r = parseInt(rsel, 10);
      let pref = r === 2 ? '0b' : r === 8 ? '0o' : r === 16 ? '0x' : '';
      if (r === 10) {
        bi = BigInt(s);
      } else {
        const trimmed = s.replace(/^[-+]/, '');
        const sign = s.trim().startsWith('-') ? '-' : '';
        bi = BigInt(sign + pref + trimmed);
      }
    }
    outB2.textContent = groupBits(bi.toString(2));
    outB10.textContent = bi.toString(10);
    outB16.textContent = bi.toString(16).toUpperCase();
  } catch (e) {
    outB2.textContent = '输入无效';
    outB10.textContent = '输入无效';
    outB16.textContent = '输入无效';
  }
}

function updateInteger() {
  const inEl = document.getElementById('int-input');
  const wEl = document.getElementById('int-width');
  const outUnsigned = document.getElementById('int-out-unsigned');
  const outSignMag = document.getElementById('int-out-signmag');
  const outOnes = document.getElementById('int-out-ones');
  const outTwos = document.getElementById('int-out-twos');
  const s = (inEl.value || '').trim();
  const w = parseInt(wEl.value, 10);
  if (!s) {
    outUnsigned.textContent = '';
    outSignMag.textContent = '';
    outOnes.textContent = '';
    outTwos.textContent = '';
    return;
  }
  try {
    let N = BigInt(s);
    const W = BigInt(w);
    const M = 1n << W;
    const maxMag = (1n << (W - 1n)) - 1n; // 原码/反码允许的最大数值
    // 无符号（按位宽截断）
    let U = ((N % M) + M) % M;
    outUnsigned.textContent = groupBits(padBitsFromBigInt(U, w));

    // 原码（符号-数值）
    const sign = N < 0n ? '1' : '0';
    const mag = N < 0n ? -N : N;
    if (mag > maxMag) {
      outSignMag.textContent = '溢出';
    } else {
      const magBits = padBitsFromBigInt(mag, w - 1);
      outSignMag.textContent = groupBits(sign + magBits);
    }

    // 反码（负数为正数按位取反；正数保持不变）
    if (mag > maxMag) {
      outOnes.textContent = '溢出';
    } else {
      const posBits = padBitsFromBigInt(mag, w);
      const onesBits = N >= 0n
        ? posBits
        : posBits.split('').map(ch => (ch === '0' ? '1' : '0')).join('');
      outOnes.textContent = groupBits(onesBits);
    }

    // 补码（两数之和为 2^w）
    const twosVal = ((N % M) + M) % M;
    outTwos.textContent = groupBits(padBitsFromBigInt(twosVal, w));
  } catch (e) {
    outUnsigned.textContent = '输入无效';
    outSignMag.textContent = '输入无效';
    outOnes.textContent = '输入无效';
    outTwos.textContent = '输入无效';
  }
}

function updateIEEEFromDecimal() {
  const decEl = document.getElementById('ieee-decimal');
  const precEl = document.getElementById('ieee-precision');
  const outSign = document.getElementById('ieee-out-sign');
  const outExp = document.getElementById('ieee-out-exp');
  const outFrac = document.getElementById('ieee-out-frac');
  const outBits = document.getElementById('ieee-out-bits');
  const outClass = document.getElementById('ieee-out-class');
  const s = (decEl.value || '').trim();
  if (!s) {
    outSign.textContent = '';
    outExp.textContent = '';
    outFrac.textContent = '';
    outBits.textContent = '';
    outClass.textContent = '';
    return;
  }
  let x;
  if (s.toLowerCase() === 'nan') x = NaN;
  else if (s.toLowerCase() === 'infinity' || s.toLowerCase() === '+infinity') x = Infinity;
  else if (s.toLowerCase() === '-infinity') x = -Infinity;
  else x = Number(s);

  const prec = parseInt(precEl.value, 10);
  if (prec === 32) {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setFloat32(0, x, false); // big-endian
    const bits = view.getUint32(0, false);
    const sign = (bits >>> 31) & 1;
    const exp = (bits >>> 23) & 0xff;
    const frac = bits & 0x7fffff;
    const bitStr = padBitsFromBigInt(BigInt(bits), 32);
    const bias = 127;
    const cls = exp === 0xff ? (frac === 0 ? (sign ? '-∞' : '+∞') : 'NaN') : (exp === 0 ? (frac === 0 ? '±0' : '次正规数') : '正规数');
    outSign.textContent = String(sign);
    outExp.textContent = `${padBitsFromBigInt(BigInt(exp), 8)}（E=${exp}, 偏移=${bias}, e=${exp - bias}）`;
    outFrac.textContent = padBitsFromBigInt(BigInt(frac), 23);
    // 分段位串填充
    try {
      document.getElementById('ieee-bits-s').textContent = bitStr.slice(0,1);
      document.getElementById('ieee-bits-e').textContent = groupBits(bitStr.slice(1,9), 4);
      document.getElementById('ieee-bits-f').textContent = groupBits(bitStr.slice(9), 4);
      outBits.textContent = '';
    } catch (_) { outBits.textContent = groupBits(bitStr, 4); }
    outClass.textContent = cls;
    // 分类胶囊样式
    outClass.className = 'pill ' + (cls === '正规数' ? 'pill-normal' : cls === '次正规数' ? 'pill-subnormal' : cls === 'NaN' ? 'pill-nan' : (cls === '±0' ? 'pill-zero' : 'pill-inf'));
  } else {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, x, false);
    const hi = view.getUint32(0, false);
    const lo = view.getUint32(4, false);
    const bits = (BigInt(hi) << 32n) | BigInt(lo);
    const sign = Number((bits >> 63n) & 1n);
    const exp = Number((bits >> 52n) & 0x7ffn);
    const frac = bits & ((1n << 52n) - 1n);
    const bitStr = padBitsFromBigInt(bits, 64);
    const bias = 1023;
    const cls = exp === 0x7ff ? (frac === 0n ? (sign ? '-∞' : '+∞') : 'NaN') : (exp === 0 ? (frac === 0n ? '±0' : '次正规数') : '正规数');
    outSign.textContent = String(sign);
    outExp.textContent = `${padBitsFromBigInt(BigInt(exp), 11)}（E=${exp}, 偏移=${bias}, e=${exp - bias}）`;
    outFrac.textContent = padBitsFromBigInt(frac, 52);
    try {
      document.getElementById('ieee-bits-s').textContent = bitStr.slice(0,1);
      document.getElementById('ieee-bits-e').textContent = groupBits(bitStr.slice(1,12), 4);
      document.getElementById('ieee-bits-f').textContent = groupBits(bitStr.slice(12), 4);
      outBits.textContent = '';
    } catch (_) { outBits.textContent = groupBits(bitStr, 4); }
    outClass.textContent = cls;
    outClass.className = 'pill ' + (cls === '正规数' ? 'pill-normal' : cls === '次正规数' ? 'pill-subnormal' : cls === 'NaN' ? 'pill-nan' : (cls === '±0' ? 'pill-zero' : 'pill-inf'));
  }
}

function updateIEEEDecodeBits() {
  const bitsEl = document.getElementById('ieee-bitstring');
  const precEl = document.getElementById('ieee-precision-bits');
  const outDec = document.getElementById('ieee-decoded');
  const s = (bitsEl.value || '').trim();
  if (!s) { outDec.textContent = ''; return; }
  const clean = s.replace(/\s+/g, '');
  const prec = parseInt(precEl.value, 10);
  try {
    if (prec === 32) {
      if (clean.length !== 32 || /[^01]/.test(clean)) throw new Error('长度或字符非法');
      const num = parseInt(clean, 2) >>> 0;
      const buf = new ArrayBuffer(4);
      const view = new DataView(buf);
      view.setUint32(0, num, false);
      const val = view.getFloat32(0, false);
      outDec.textContent = String(val);
    } else {
      if (clean.length !== 64 || /[^01]/.test(clean)) throw new Error('长度或字符非法');
      const bi = BigInt('0b' + clean);
      const hi = Number((bi >> 32n) & 0xffffffffn) >>> 0;
      const lo = Number(bi & 0xffffffffn) >>> 0;
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      view.setUint32(0, hi, false);
      view.setUint32(4, lo, false);
      const val = view.getFloat64(0, false);
      outDec.textContent = String(val);
    }
  } catch (e) {
    outDec.textContent = '输入无效';
  }
}

function buildHamming() {
  const inData = (document.getElementById('ham-data').value || '').trim();
  const errPosStr = (document.getElementById('ham-error').value || '').trim();
  const outCode = document.getElementById('ham-code');
  const outSyn = document.getElementById('ham-syndrome');
  const outCorr = document.getElementById('ham-corrected');
  if (!/^([01]{4})$/.test(inData)) {
    outCode.textContent = '请输入 4 位 0/1 串';
    outSyn.textContent = '';
    outCorr.textContent = '';
    return;
  }
  const d1 = parseInt(inData[0]);
  const d2 = parseInt(inData[1]);
  const d3 = parseInt(inData[2]);
  const d4 = parseInt(inData[3]);
  // 位置映射（1 基）：p1 p2 d1 p4 d2 d3 d4
  const code = new Array(8).fill(0); // 0..7 使用 1..7
  code[3] = d1;
  code[5] = d2;
  code[6] = d3;
  code[7] = d4;
  // 偶校验设置奇偶位
  const p1 = (code[3] + code[5] + code[7]) % 2; // 覆盖 3,5,7
  const p2 = (code[3] + code[6] + code[7]) % 2; // 覆盖 3,6,7
  const p4 = (code[5] + code[6] + code[7]) % 2; // 覆盖 5,6,7
  code[1] = p1;
  code[2] = p2;
  code[4] = p4;

  let codeStr = '';
  for (let i = 1; i <= 7; i++) codeStr += String(code[i]);
  outCode.textContent = codeStr;

  // 错误模拟：翻转指定位置
  let recv = code.slice();
  let errPos = 0;
  if (errPosStr) {
    const pos = parseInt(errPosStr, 10);
    if (pos >= 1 && pos <= 7) {
      recv[pos] = recv[pos] ^ 1;
      errPos = pos;
    }
  }

  // 计算综合症（偶校验）
  const s1 = (recv[1] + recv[3] + recv[5] + recv[7]) % 2; // p1 覆盖集
  const s2 = (recv[2] + recv[3] + recv[6] + recv[7]) % 2; // p2 覆盖集
  const s4 = (recv[4] + recv[5] + recv[6] + recv[7]) % 2; // p4 覆盖集
  const syndrome = s4 * 4 + s2 * 2 + s1;
  outSyn.textContent = `${s4}${s2}${s1}（位置=${syndrome || 0}）`;

  if (syndrome) recv[syndrome] = recv[syndrome] ^ 1; // 纠错
  let corrStr = '';
  for (let i = 1; i <= 7; i++) corrStr += String(recv[i]);
  outCorr.textContent = corrStr + (errPos ? `（已纠正第 ${errPos} 位）` : '');
}

function attachEvents() {
  const basesInput = document.getElementById('bases-input');
  const basesRadix = document.getElementById('bases-radix');
  if (basesInput) basesInput.addEventListener('input', updateBases);
  if (basesRadix) basesRadix.addEventListener('change', updateBases);
  const basesRun = document.getElementById('bases-run');
  if (basesRun) basesRun.addEventListener('click', runBases);

  const intInput = document.getElementById('int-input');
  const intWidth = document.getElementById('int-width');
  if (intInput) intInput.addEventListener('input', updateInteger);
  if (intWidth) intWidth.addEventListener('change', updateInteger);
  const intRun = document.getElementById('int-run');
  if (intRun) intRun.addEventListener('click', runInteger);

  const decIn = document.getElementById('ieee-decimal');
  const decPrec = document.getElementById('ieee-precision');
  if (decIn) decIn.addEventListener('input', updateIEEEFromDecimal);
  if (decPrec) decPrec.addEventListener('change', updateIEEEFromDecimal);
  const ieeeAnimBtn = document.getElementById('ieee-animate-btn');
  if (ieeeAnimBtn) ieeeAnimBtn.addEventListener('click', animateIEEEFromDecimal);

  const bitsIn = document.getElementById('ieee-bitstring');
  const bitsPrec = document.getElementById('ieee-precision-bits');
  if (bitsIn) bitsIn.addEventListener('input', updateIEEEDecodeBits);
  if (bitsPrec) bitsPrec.addEventListener('change', updateIEEEDecodeBits);

  const hamBtn = document.getElementById('ham-build');
  if (hamBtn) hamBtn.addEventListener('click', buildHamming);
}

document.addEventListener('DOMContentLoaded', attachEvents);

// --- 动画与“计算”按钮逻辑 ---
let _stepsController = null;
function clearAnimHighlights() {
  document.querySelectorAll('.anim-highlight, .anim-pulse').forEach(el => {
    el.classList.remove('anim-highlight');
    el.classList.remove('anim-pulse');
  });
}

function highlightEl(el) {
  if (!el) return;
  el.classList.add('anim-highlight');
  el.classList.add('anim-pulse');
  try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
}

function playSteps(title, steps, intervalMs = 900, actions = [], useOverlay = false) {
  _stepsController = (useOverlay && window.AnimationStepController)
    ? (_stepsController || new AnimationStepController({ overlayAutoHideMs: null }))
    : null;
  if (_stepsController) {
    _stepsController.setSteps(title, steps);
    _stepsController.index = -1;
  }
  function tick(i) {
    if (i >= steps.length) { clearAnimHighlights(); return; }
    clearAnimHighlights();
    if (actions[i]) { try { actions[i](); } catch (_) {} }
    if (_stepsController) _stepsController.next();
    setTimeout(() => tick(i + 1), intervalMs);
  }
  tick(0);
}

function runBases() {
  // 先做计算输出
  updateBases();
  const inputEl = document.getElementById('bases-input');
  const radixEl = document.getElementById('bases-radix');
  const outB2 = document.getElementById('bases-output-b2').textContent;
  const outB10 = document.getElementById('bases-output-b10').textContent;
  const outB16 = document.getElementById('bases-output-b16').textContent;
  const s = (inputEl?.value || '').trim();
  const rsel = radixEl?.value || 'auto';
  const steps = [
    { message: `识别输入与基数：${s || '(空)'}，模式=${rsel}` },
    { message: `解析为整数（十进制）→ ${outB10 || '输入无效'}` },
    { message: `转换二进制/十六进制 → ${outB2 || '输入无效'} / ${outB16 || '输入无效'}` },
  ];
  playSteps('进制转换 · 计算步骤', steps, 900, [], false);
  // 渲染手算过程画布
  renderBasesStepsCanvas();
}

function runInteger() {
  updateInteger();
  const w = document.getElementById('int-width')?.value || '32';
  const u = document.getElementById('int-out-unsigned')?.textContent || '';
  const sm = document.getElementById('int-out-signmag')?.textContent || '';
  const ones = document.getElementById('int-out-ones')?.textContent || '';
  const twos = document.getElementById('int-out-twos')?.textContent || '';
  const steps = [
    { message: `按位宽 w=${w} 进行截断，得到无符号位串：${u || '溢出/无效'}` },
    { message: `原码（符号-数值）→ ${sm || '溢出/无效'}` },
    { message: `反码（负数按位取反）→ ${ones || '溢出/无效'}` },
    { message: `补码（模 2^w）→ ${twos || '输入无效'}` },
  ];
  playSteps('整数表示 · 计算步骤', steps, 900, [], false);
  // 渲染手算过程画布
  renderIntegerStepsCanvas();
}

function animateIEEEFromDecimal() {
  updateIEEEFromDecimal();
  const prec = parseInt(document.getElementById('ieee-precision')?.value || '32', 10);
  const decInput = document.getElementById('ieee-decimal');
  const sIn = (decInput?.value || '').trim();
  if (!sIn) return;
  let x;
  if (sIn.toLowerCase() === 'nan') x = NaN;
  else if (sIn.toLowerCase() === 'infinity' || sIn.toLowerCase() === '+infinity') x = Infinity;
  else if (sIn.toLowerCase() === '-infinity') x = -Infinity;
  else x = Number(sIn);

  let signStr, expBitsStr, fracBitsStr, bitStr, E, bias, e, cls;
  if (prec === 32) {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setFloat32(0, x, false);
    const bits = view.getUint32(0, false);
    const sign = (bits >>> 31) & 1;
    const exp = (bits >>> 23) & 0xff;
    const frac = bits & 0x7fffff;
    signStr = String(sign);
    expBitsStr = padBitsFromBigInt(BigInt(exp), 8);
    fracBitsStr = padBitsFromBigInt(BigInt(frac), 23);
    bitStr = padBitsFromBigInt(BigInt(bits), 32);
    bias = 127; E = exp; e = exp - bias;
    cls = E === 0xff ? (frac === 0 ? (sign ? '-∞' : '+∞') : 'NaN') : (E === 0 ? (frac === 0 ? '±0' : '次正规数') : '正规数');
  } else {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, x, false);
    const hi = view.getUint32(0, false);
    const lo = view.getUint32(4, false);
    const bits = (BigInt(hi) << 32n) | BigInt(lo);
    const sign = Number((bits >> 63n) & 1n);
    const exp = Number((bits >> 52n) & 0x7ffn);
    const frac = bits & ((1n << 52n) - 1n);
    signStr = String(sign);
    expBitsStr = padBitsFromBigInt(BigInt(exp), 11);
    fracBitsStr = padBitsFromBigInt(frac, 52);
    bitStr = padBitsFromBigInt(bits, 64);
    bias = 1023; E = exp; e = exp - bias;
    cls = E === 0x7ff ? (frac === 0n ? (sign ? '-∞' : '+∞') : 'NaN') : (E === 0 ? (frac === 0n ? '±0' : '次正规数') : '正规数');
  }

  const outSign = document.getElementById('ieee-out-sign');
  const outExp = document.getElementById('ieee-out-exp');
  const outFrac = document.getElementById('ieee-out-frac');
  const outBits = document.getElementById('ieee-out-bits');
  const outClass = document.getElementById('ieee-out-class');
  const bitsS = document.getElementById('ieee-bits-s');
  const bitsE = document.getElementById('ieee-bits-e');
  const bitsF = document.getElementById('ieee-bits-f');

  const signToken = sIn.startsWith('-') ? '-' : (sIn.startsWith('+') ? '+' : '(隐含 +)');
  const steps = [
    { message: `识别输入 ${sIn}，高亮符号 '${signToken}' → S=${signStr}` },
    { message: `写入符号位：S=${signStr}` },
    { message: `阶码位段：E=${E}（bits=${expBitsStr}, bias=${bias}, e=${e}）` },
    { message: `尾数位段：F=${groupBits(fracBitsStr)}` },
    { message: `拼接位串：S | E | F → ${groupBits(bitStr)}` },
    { message: `分类：${cls}` },
  ];
  const actions = [
    () => { highlightEl(decInput); try { if (sIn[0] === '-' || sIn[0] === '+') { decInput.focus(); decInput.setSelectionRange(0, 1); } } catch (_) {} },
    () => highlightEl(outSign),
    () => highlightEl(outExp),
    () => highlightEl(outFrac),
    () => highlightEl(outBits),
    () => highlightEl(outClass),
  ];
  playSteps('IEEE 754 · 分步演示', steps, 1200, actions, false);

  // 渲染手算过程画布（E/F 计算公式与步骤）
  renderIEEEStepsCanvas(x, prec, signStr, E, bias, e, cls, fracBitsStr);
}

function renderIEEEStepsCanvas(x, prec, signStr, E, bias, e, cls, fracBitsStr) {
  const box = document.getElementById('ieee-calc-steps');
  if (!box) return;
  const lines = [];
  const wFrac = prec === 32 ? 23 : 52;
  if (Number.isNaN(x)) {
    lines.push(`输入为 NaN：E=全 1，F≠0（实现相关）`);
  } else if (!Number.isFinite(x)) {
    lines.push(`输入为 ${x > 0 ? '+∞' : '-∞'}：E=全 1，F=0`);
  } else if (x === 0) {
    lines.push(`输入为 ±0：S=${signStr}，E=0，F=0`);
  } else {
    const ax = Math.abs(x);
    lines.push(`取绝对值 |x|=${ax}`);

    if (Number.isInteger(ax) && ax >= 1) {
      // 整数场景：连续除以 2 取余
      let n = Math.trunc(ax);
      const divSteps = [];
      const rema = [];
      while (n > 0) {
        const q = Math.floor(n / 2);
        const r = n % 2;
        divSteps.push(`${n} ÷ 2 = ${q} 余 ${r}`);
        rema.push(r);
        n = q;
      }
      lines.push('将整数部分连续除以 2：');
      divSteps.forEach(s => lines.push(s));
      const bitsInt = rema.reverse().join('') || '0';
      lines.push(`倒序写余数得到二进制：${bitsInt}`);

      // 规格化与指数
      const k = bitsInt.length - 1; // 小数点左移位数
      lines.push(`规格化：${bitsInt} = 1.${bitsInt.slice(1)} × 2^${k}`);
      lines.push(`指数偏移量 bias=${bias} → E=k+bias=${k}+${bias}=${k + bias}`);
      // 尾数去掉隐含 1 并补齐到位宽
      let fbits = bitsInt.slice(1);
      if (fbits.length < wFrac) fbits = fbits + '0'.repeat(wFrac - fbits.length);
      lines.push(`尾数（去掉隐含 1，补齐 ${wFrac} 位）：${groupBits(fbits)}`);
      lines.push(`最终 F（${wFrac} 位）=${groupBits(fracBitsStr)}`);
    } else {
      // 通用场景：归一化与迭代生成小数位
      lines.push(`偏移量 bias=${bias}；已知阶码 E=${E} → e=E-bias=${e}`);
      const pow2e = Math.pow(2, e);
      let m = ax / pow2e; // 归一化尾数
      if (cls === '次正规数') {
        lines.push(`次正规数：E=0 → e=1-bias=${1 - bias}；使用 0.F 结构`);
        m = ax / Math.pow(2, 1 - bias);
      } else if (cls === '正规数') {
        lines.push(`归一化：m=|x|/2^e=${ax}/${pow2e}≈${m}`);
        lines.push(`分离小数：f=m-1≈${(m - 1)}`);
      }

      // 迭代生成前若干位演示（避免过长，仅展示前 8 步）
      let frac = cls === '次正规数' ? m : (m - 1);
      const stepCount = Math.min(8, wFrac);
      lines.push(`按位迭代生成前 ${stepCount} 位（f×2 → 取整）：`);
      for (let i = 1; i <= stepCount; i++) {
        let t = frac * 2;
        const bit = t >= 1 ? 1 : 0;
        frac = bit ? (t - 1) : t;
        lines.push(`第 ${i} 步：f×2=${t.toFixed(10)} → 位=${bit}，剩余 f≈${frac.toFixed(10)}`);
      }
      lines.push(`… 继续迭代至 ${wFrac} 位并按 IEEE 754 规则舍入`);
      lines.push(`最终 F（${wFrac} 位）=${groupBits(fracBitsStr)}`);
    }
  }
  // 拼接与十六进制表示
  try {
    const bitsConcat = (document.getElementById('ieee-bits-s')?.textContent || '') +
      (document.getElementById('ieee-bits-e')?.textContent || '').replace(/\s+/g, '') +
      (document.getElementById('ieee-bits-f')?.textContent || '').replace(/\s+/g, '');
    const hex = BigInt('0b' + bitsConcat).toString(16).toUpperCase().padStart(prec/4, '0');
    lines.push(`拼接 S|E|F → ${groupBits(bitsConcat)}`);
    lines.push(`十六进制表示：${hex}`);
  } catch (_) {}
  box.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
}

// 进制转换 · 手算演示
function renderBasesStepsCanvas() {
  const box = document.getElementById('bases-calc-steps');
  if (!box) return;
  const inputEl = document.getElementById('bases-input');
  const radixEl = document.getElementById('bases-radix');
  const s = (inputEl?.value || '').trim();
  if (!s) { box.innerHTML = ''; return; }
  const rsel = radixEl?.value || 'auto';
  let srcRadix = 10;
  let norm = s.toLowerCase();
  if (rsel !== 'auto') srcRadix = parseInt(rsel, 10);
  else {
    if (/^[+-]?0b[01]+$/i.test(norm)) srcRadix = 2;
    else if (/^[+-]?0o[0-7]+$/i.test(norm)) srcRadix = 8;
    else if (/^[+-]?0x[0-9a-f]+$/i.test(norm)) srcRadix = 16;
    else srcRadix = 10;
  }
  const lines = [];
  lines.push(`识别基数：${srcRadix}`);
  let bi;
  try {
    bi = BigInt(s);
  } catch(_) {
    box.innerHTML = `<div>输入无效</div>`;
    return;
  }
  lines.push(`解析为十进制整数：${bi.toString(10)}`);

  if (srcRadix === 10) {
    // 连续除以 2 取余
    let n = bi < 0n ? -bi : bi;
    const divSteps = [];
    const rema = [];
    while (n > 0n) {
      const q = n / 2n;
      const r = n % 2n;
      divSteps.push(`${n} ÷ 2 = ${q} 余 ${r}`);
      rema.push(r);
      n = q;
    }
    if (divSteps.length === 0) divSteps.push('0 的二进制为 0');
    lines.push('连续除以 2 取余：');
    divSteps.forEach(s => lines.push(s));
    const b2 = (rema.reverse().map(x=>x.toString()).join('') || '0');
    lines.push(`倒序写余数得到二进制：${groupBits(b2)}`);
    // 4 位分组映射十六进制
    const hex = bi.toString(16).toUpperCase();
    lines.push(`按 4 位分组映射十六进制：${hex}`);
  } else if (srcRadix === 2) {
    // 权重求和
    const bitStr = norm.replace(/^[+-]?0b/i,'').replace(/_/g,'');
    const sign = s.trim().startsWith('-') ? -1n : 1n;
    let sum = 0n;
    for (let i = 0; i < bitStr.length; i++) {
      if (bitStr[bitStr.length-1-i] === '1') sum += 1n << BigInt(i);
    }
    sum *= sign;
    lines.push(`权重求和：Σ(位×2^i) = ${sum.toString(10)}`);
    lines.push(`二进制分组显示：${groupBits(bitStr)}`);
    lines.push(`十六进制：${BigInt(s).toString(16).toUpperCase()}`);
  } else if (srcRadix === 16) {
    const hexStr = norm.replace(/^[+-]?0x/i,'');
    lines.push('每个十六进制数字映射为 4 位二进制：');
    for (const ch of hexStr) {
      const v = parseInt(ch, 16);
      lines.push(`${ch} → ${padBitsFromBigInt(BigInt(v), 4)}`);
    }
    lines.push(`组合得到二进制：${groupBits(BigInt(s).toString(2))}`);
    lines.push(`十进制：${BigInt(s).toString(10)}`);
  } else if (srcRadix === 8) {
    const octStr = norm.replace(/^[+-]?0o/i,'');
    lines.push('每个八进制数字映射为 3 位二进制：');
    for (const ch of octStr) {
      const v = parseInt(ch, 8);
      lines.push(`${ch} → ${padBitsFromBigInt(BigInt(v), 3)}`);
    }
    lines.push(`组合得到二进制：${groupBits(BigInt(s).toString(2))}`);
    lines.push(`十进制：${BigInt(s).toString(10)}`);
    lines.push(`十六进制：${BigInt(s).toString(16).toUpperCase()}`);
  }

  box.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
}

// 整数表示 · 手算演示
function renderIntegerStepsCanvas() {
  const box = document.getElementById('int-calc-steps');
  if (!box) return;
  const inEl = document.getElementById('int-input');
  const wEl = document.getElementById('int-width');
  const s = (inEl?.value || '').trim();
  const w = parseInt(wEl?.value || '32', 10);
  if (!s) { box.innerHTML = ''; return; }
  let N;
  try { N = BigInt(s); } catch(_) { box.innerHTML = '<div>输入无效</div>'; return; }
  const W = BigInt(w);
  const M = 1n << W;
  const maxMag = (1n << (W - 1n)) - 1n;
  const lines = [];
  lines.push(`位宽 w=${w}`);
  // 无符号
  const U = ((N % M) + M) % M;
  lines.push(`无符号：取模 2^w → ${groupBits(padBitsFromBigInt(U, w))}`);
  // 原码
  const sign = N < 0n ? '1' : '0';
  const mag = N < 0n ? -N : N;
  if (mag > maxMag) {
    lines.push('原码：溢出（绝对值超过最大表示）');
  } else {
    lines.push(`原码：符号=${sign}，数值=${padBitsFromBigInt(mag, w-1)} → ${groupBits(sign + padBitsFromBigInt(mag, w-1))}`);
  }
  // 反码
  if (mag > maxMag) {
    lines.push('反码：溢出');
  } else {
    const posBits = padBitsFromBigInt(mag, w);
    const onesBits = N >= 0n ? posBits : posBits.split('').map(ch => (ch === '0' ? '1' : '0')).join('');
    lines.push(`反码：${N >= 0n ? '正数保持不变' : '对正数位串按位取反'} → ${groupBits(onesBits)}`);
  }
  // 补码
  const twosVal = ((N % M) + M) % M;
  if (N >= 0n) {
    lines.push(`补码（非负）：与无符号一致 → ${groupBits(padBitsFromBigInt(twosVal, w))}`);
  } else {
    const posMag = padBitsFromBigInt(mag, w);
    const inv = posMag.split('').map(ch => (ch === '0' ? '1' : '0')).join('');
    const inc = (BigInt('0b' + inv) + 1n) & ((1n << BigInt(w)) - 1n);
    lines.push(`补码（负数）：取反 + 1 → ${groupBits(padBitsFromBigInt(inc, w))}`);
  }
  box.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
}