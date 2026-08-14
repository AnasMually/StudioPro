(() => {
  'use strict';

  const S = window.StudioPro;
  if (!S || !S.canvas) return;

  const canvas = S.canvas;
  const ctx = S.ctx;

  const css = `
    .transform-extra { display:grid; gap:9px; }
    .rotation-stepper,.frame-scale-stepper {
      display:grid; grid-template-columns:40px minmax(0,1fr) 40px; gap:8px; align-items:center; direction:ltr;
    }
    .rotation-stepper button,.frame-scale-stepper button {
      min-height:38px; border:1px solid var(--border); border-radius:10px; background:var(--panel-soft); color:var(--text);
      font-size:18px; font-weight:800; cursor:pointer;
    }
    .rotation-stepper button:hover,.frame-scale-stepper button:hover { background:#f0f2f7; border-color:var(--border-strong); }
    .transform-value {
      display:grid; grid-template-columns:1fr auto; align-items:center; min-height:38px; border:1px solid var(--border); border-radius:10px;
      background:#fff; padding-inline:10px;
    }
    .transform-value input { min-height:34px !important; border:0 !important; padding:0 !important; text-align:center; font-weight:800; direction:ltr; outline:0 !important; }
    .transform-value span { color:var(--muted); font-size:10px; font-weight:800; }
    .transform-reset { width:100%; }
    .frame-scale-wrap { display:grid; gap:8px; margin-top:8px; }
    .frame-scale-wrap[hidden] { display:none !important; }
    .frame-scale-note { color:var(--muted); font-size:9px; line-height:1.55; }
    @media (max-width:780px) {
      .rotation-stepper,.frame-scale-stepper { grid-template-columns:44px minmax(0,1fr) 44px; }
      .rotation-stepper button,.frame-scale-stepper button { min-height:42px; font-size:20px; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const normalizeDeg = value => {
    let v = Number(value) || 0;
    v = ((v + 180) % 360 + 360) % 360 - 180;
    return Math.abs(v) < 0.0001 ? 0 : v;
  };

  const canvasPoint = e => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * canvas.width / rect.width,
      y: (e.clientY - rect.top) * canvas.height / rect.height
    };
  };

  const centerOf = el => ({ x: canvas.width / 2 + el.x, y: canvas.height / 2 + el.y });

  const baseGetFrameDefinition = S.getFrameDefinition.bind(S);

  const parseFrame = value => {
    const raw = String(value || 'none');
    const match = raw.match(/^([^|]+)(?:\|fs=(\d+))?$/);
    return {
      base: match ? match[1] : raw,
      scale: match && match[2] ? Math.max(.25, Math.min(4, Number(match[2]) / 100)) : 1
    };
  };

  const encodeFrame = (base, scale) => {
    const clean = base || 'none';
    const s = Math.max(.25, Math.min(4, Number(scale) || 1));
    return Math.abs(s - 1) < .001 ? clean : `${clean}|fs=${Math.round(s * 100)}`;
  };

  S.getFrameDefinition = id => {
    const parsed = parseFrame(id);
    const def = baseGetFrameDefinition(parsed.base);
    if (!def || parsed.scale === 1 || def.kind === 'none' || def.kind === 'rounded') return {...def, id:String(id || def.id), baseId:def.id, frameScale:parsed.scale};
    return {
      ...def,
      id:String(id),
      baseId:def.id,
      frameScale:parsed.scale,
      bezel:Math.max(1, (def.bezel || 8) * parsed.scale)
    };
  };

  const ensureFrameScale = el => {
    if (!el || el.type !== 'image') return 1;
    const parsed = parseFrame(el.frame);
    if (!Number.isFinite(el.frameScale)) el.frameScale = parsed.scale;
    el.frameScale = Math.max(.25, Math.min(4, el.frameScale));
    const base = parsed.base;
    el.frame = encodeFrame(base, el.frameScale);
    return el.frameScale;
  };

  S.state.elements.forEach(ensureFrameScale);

  S.getRotationHandle = el => {
    if (!el || !S.viewState.showSelection) return null;
    const geo = S.getSelectionGeometry(el);
    const n = geo.handles.find(h => h.id === 'n');
    if (!n) return null;
    const c = centerOf(el);
    let dx = n.x - c.x, dy = n.y - c.y;
    let len = Math.hypot(dx, dy);
    if (len < 1) {
      const r = (el.rotation || 0) * Math.PI / 180;
      dx = Math.sin(r); dy = -Math.cos(r); len = 1;
    }
    const offset = S.canvasUnitsForCssPx(32);
    return {
      x:n.x + dx / len * offset,
      y:n.y + dy / len * offset,
      anchorX:n.x,
      anchorY:n.y
    };
  };

  S.hitTestRotationHandle = (point, el = S.getActiveElement()) => {
    const h = S.getRotationHandle(el);
    if (!h) return false;
    return Math.hypot(point.x - h.x, point.y - h.y) <= S.canvasUnitsForCssPx(16);
  };

  const previousDrawSelection = S.drawSelectionOverlay.bind(S);
  S.drawSelectionOverlay = el => {
    previousDrawSelection(el);
    if (!el || el.id !== S.state.activeElementId || !S.viewState.showSelection) return;
    const h = S.getRotationHandle(el);
    if (!h) return;
    const line = S.canvasUnitsForCssPx(2);
    const radius = S.canvasUnitsForCssPx(10);
    const iconSize = S.canvasUnitsForCssPx(11);
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5b5ce2';
    ctx.lineWidth = line;
    ctx.beginPath(); ctx.moveTo(h.anchorX, h.anchorY); ctx.lineTo(h.x, h.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(h.x, h.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#5b5ce2'; ctx.stroke();
    ctx.fillStyle = '#5b5ce2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${iconSize}px system-ui, sans-serif`;
    ctx.fillText('↻', h.x, h.y + iconSize * .04);
    ctx.restore();
  };

  let rotateGesture = null;
  canvas.addEventListener('pointerdown', e => {
    const el = S.getActiveElement();
    if (!el || !S.hitTestRotationHandle(canvasPoint(e), el)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    canvas.setPointerCapture?.(e.pointerId);
    const p = canvasPoint(e), c = centerOf(el);
    rotateGesture = {
      pointerId:e.pointerId,
      elementId:el.id,
      lastAngle:Math.atan2(p.y - c.y, p.x - c.x),
      value:Number(el.rotation) || 0
    };
    canvas.style.cursor = 'grabbing';
  }, true);

  canvas.addEventListener('pointermove', e => {
    if (!rotateGesture || rotateGesture.pointerId !== e.pointerId) {
      if (e.pointerType === 'mouse') {
        const el = S.getActiveElement();
        canvas.style.cursor = el && S.hitTestRotationHandle(canvasPoint(e), el) ? 'grab' : '';
      }
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    const el = S.state.elements.find(x => x.id === rotateGesture.elementId);
    if (!el) return;
    const p = canvasPoint(e), c = centerOf(el);
    const angle = Math.atan2(p.y - c.y, p.x - c.x);
    let delta = angle - rotateGesture.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    rotateGesture.value += delta * 180 / Math.PI;
    rotateGesture.lastAngle = angle;
    el.rotation = normalizeDeg(rotateGesture.value);
    S.render();
    S.syncInspectorUI?.();
  }, true);

  const endRotation = e => {
    if (!rotateGesture || rotateGesture.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    rotateGesture = null;
    canvas.style.cursor = '';
    S.saveState();
    S.syncAllUI();
  };
  canvas.addEventListener('pointerup', endRotation, true);
  canvas.addEventListener('pointercancel', endRotation, true);

  const rotationRange = document.getElementById('elementRotation');
  if (rotationRange) {
    rotationRange.min = '-180';
    rotationRange.max = '180';
    rotationRange.step = '1';

    const rotationBox = document.createElement('div');
    rotationBox.className = 'transform-extra';
    rotationBox.innerHTML = `
      <div class="rotation-stepper" aria-label="التحكم بالدوران">
        <button type="button" id="rotationDown" title="إنقاص 5 درجات">−</button>
        <div class="transform-value"><input type="number" id="rotationValue" min="-180" max="180" step="1" value="0"><span>°</span></div>
        <button type="button" id="rotationUp" title="زيادة 5 درجات">＋</button>
      </div>
      <button type="button" class="btn btn-secondary transform-reset" id="rotationReset">إعادة تعيين الدوران</button>
    `;
    rotationRange.parentElement.insertAdjacentElement('afterend', rotationBox);

    const applyRotation = (value, save = true) => {
      const el = S.getActiveElement();
      if (!el) return;
      el.rotation = normalizeDeg(value);
      S.render(); S.syncInspectorUI?.();
      if (save) S.saveState();
    };
    document.getElementById('rotationDown').onclick = () => { const el=S.getActiveElement(); if(el) applyRotation((el.rotation||0)-5); };
    document.getElementById('rotationUp').onclick = () => { const el=S.getActiveElement(); if(el) applyRotation((el.rotation||0)+5); };
    document.getElementById('rotationReset').onclick = () => applyRotation(0);
    document.getElementById('rotationValue').addEventListener('change', e => applyRotation(e.target.value));
  }

  const deviceGrid = document.getElementById('deviceGrid');
  let frameScaleWrap = null;
  if (deviceGrid) {
    frameScaleWrap = document.createElement('div');
    frameScaleWrap.className = 'frame-scale-wrap';
    frameScaleWrap.innerHTML = `
      <label class="field-label">سُمك إطار الهاتف</label>
      <div class="frame-scale-stepper">
        <button type="button" id="frameScaleDown" title="إطار أنحف">−</button>
        <div class="transform-value"><input type="number" id="frameScaleValue" min="25" max="400" step="5" value="100"><span>%</span></div>
        <button type="button" id="frameScaleUp" title="إطار أسمك">＋</button>
      </div>
      <input type="range" id="frameScaleRange" min="25" max="400" step="5" value="100">
      <div class="frame-scale-note">يغيّر سُمك جسم الهاتف حول لقطة الشاشة بدون تغيير حجم لقطة الشاشة نفسها.</div>
    `;
    deviceGrid.insertAdjacentElement('afterend', frameScaleWrap);

    const applyFrameScale = (pct, save = true) => {
      const el = S.getActiveElement();
      if (!el || el.type !== 'image') return;
      const parsed = parseFrame(el.frame);
      const def = baseGetFrameDefinition(parsed.base);
      if (!def || def.kind === 'none' || def.kind === 'rounded') return;
      el.frameScale = Math.max(.25, Math.min(4, (Number(pct) || 100) / 100));
      el.frame = encodeFrame(parsed.base, el.frameScale);
      S.render(); S.syncInspectorUI?.();
      if (save) S.saveState();
    };
    document.getElementById('frameScaleRange').addEventListener('input', e => applyFrameScale(e.target.value, false));
    document.getElementById('frameScaleRange').addEventListener('change', e => applyFrameScale(e.target.value, true));
    document.getElementById('frameScaleValue').addEventListener('change', e => applyFrameScale(e.target.value, true));
    document.getElementById('frameScaleDown').onclick = () => { const el=S.getActiveElement(); if(el?.type==='image') applyFrameScale((ensureFrameScale(el)*100)-10); };
    document.getElementById('frameScaleUp').onclick = () => { const el=S.getActiveElement(); if(el?.type==='image') applyFrameScale((ensureFrameScale(el)*100)+10); };

    deviceGrid.addEventListener('click', e => {
      const btn = e.target.closest('[data-frame]');
      const el = S.getActiveElement();
      if (!btn || !el || el.type !== 'image') return;
      e.preventDefault(); e.stopImmediatePropagation();
      const def = baseGetFrameDefinition(btn.dataset.frame);
      const scale = Number.isFinite(el.frameScale) ? el.frameScale : 1;
      el.frame = encodeFrame(def.id, scale);
      if (def.kind !== 'none') el.borderRadius = def.radius;
      S.render(); S.syncAllUI(); S.saveState();
    }, true);
  }

  const oldSyncInspector = S.syncInspectorUI?.bind(S);
  if (oldSyncInspector) {
    S.syncInspectorUI = () => {
      oldSyncInspector();
      const el = S.getActiveElement();
      const rotationValue = document.getElementById('rotationValue');
      if (rotationValue) rotationValue.value = el ? Math.round(normalizeDeg(el.rotation || 0)) : 0;
      if (rotationRange && el) rotationRange.value = Math.round(normalizeDeg(el.rotation || 0));

      if (frameScaleWrap) {
        const show = !!el && el.type === 'image' && !['none','rounded'].includes(parseFrame(el.frame).base);
        frameScaleWrap.hidden = !show;
        if (show) {
          const pct = Math.round(ensureFrameScale(el) * 100);
          const value = document.getElementById('frameScaleValue');
          const range = document.getElementById('frameScaleRange');
          if (value) value.value = pct;
          if (range) range.value = pct;
          document.querySelectorAll('#deviceGrid [data-frame]').forEach(btn => btn.classList.toggle('active', btn.dataset.frame === parseFrame(el.frame).base));
        }
      }
    };
  }

  S.syncInspectorUI?.();
  S.render();
})();
