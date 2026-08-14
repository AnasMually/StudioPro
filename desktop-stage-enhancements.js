(() => {
  'use strict';
  const S = window.StudioPro;
  if (!S || !S.canvas || !S.canvasArea) return;

  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 781px) {
      html, body, .app { height: 100%; overflow: hidden; }
      .workspace-grid {
        height: calc(100vh - var(--topbar-h)) !important;
        max-height: calc(100vh - var(--topbar-h)) !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .stage-column {
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .stage {
        min-height: 0 !important;
        overflow: hidden !important;
        padding: 28px 32px 82px !important;
      }
      #mainCanvas {
        max-width: none !important;
        max-height: none !important;
      }
      .desktop-stage-zoom {
        position: absolute;
        z-index: 22;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        direction: ltr;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px;
        border: 1px solid var(--border);
        border-radius: 13px;
        background: color-mix(in srgb, var(--panel) 92%, transparent);
        box-shadow: 0 10px 32px rgba(15, 23, 42, .14);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      .desktop-stage-zoom button {
        min-width: 38px;
        height: 36px;
        border: 1px solid transparent;
        border-radius: 9px;
        background: transparent;
        color: var(--text);
        cursor: pointer;
        font-size: 18px;
        font-weight: 800;
        display: grid;
        place-items: center;
      }
      .desktop-stage-zoom button:hover {
        background: var(--panel-soft);
        border-color: var(--border);
      }
      .desktop-stage-zoom .desktop-fit-btn {
        width: auto;
        padding: 0 10px;
        font-size: 10px;
        font-weight: 800;
      }
      .desktop-stage-zoom .desktop-zoom-value {
        min-width: 54px;
        padding: 0 7px;
        text-align: center;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        user-select: none;
      }
    }
    @media (max-width: 780px) {
      .desktop-stage-zoom { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  const stage = S.canvasArea;
  let bar = document.querySelector('.desktop-stage-zoom');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'desktop-stage-zoom';
    bar.setAttribute('aria-label', 'تكبير وتصغير مساحة العمل');
    bar.innerHTML = `
      <button type="button" class="desktop-zoom-out" title="تصغير">−</button>
      <span class="desktop-zoom-value">100%</span>
      <button type="button" class="desktop-zoom-in" title="تكبير">＋</button>
      <button type="button" class="desktop-fit-btn" title="احتواء التصميم داخل مساحة العمل">احتواء</button>
    `;
    stage.appendChild(bar);
  }

  const value = bar.querySelector('.desktop-zoom-value');
  const syncZoomLabels = () => {
    const label = `${Math.round(S.viewState.zoom || 100)}%`;
    if (value) value.textContent = label;
    const legacy = document.getElementById('zoomDisplay');
    if (legacy) legacy.textContent = label;
  };

  S.fitCanvasToStage = () => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    const visibleHeight = Math.max(180, Math.min(rect.height, viewportHeight - rect.top));
    const desktop = window.innerWidth > 780;

    const horizontalPadding = desktop ? 72 : 28;
    const verticalPadding = desktop ? 112 : 34;
    const availableWidth = Math.max(160, rect.width - horizontalPadding);
    const availableHeight = Math.max(160, visibleHeight - verticalPadding);

    const fitScale = Math.min(
      availableWidth / S.canvas.width,
      availableHeight / S.canvas.height
    );

    const breathingRoom = desktop ? 0.94 : 1;
    const zoom = Math.max(30, Math.min(300, Number(S.viewState.zoom) || 100));
    const scale = Math.max(0.02, fitScale * breathingRoom * (zoom / 100));

    S.canvas.style.width = `${Math.max(1, Math.round(S.canvas.width * scale))}px`;
    S.canvas.style.height = `${Math.max(1, Math.round(S.canvas.height * scale))}px`;
    syncZoomLabels();
    S.render();
  };

  const setZoom = next => {
    S.viewState.zoom = Math.max(30, Math.min(300, Number(next) || 100));
    S.fitCanvasToStage();
  };
  S.setZoom = setZoom;

  bar.querySelector('.desktop-zoom-out').addEventListener('click', () => setZoom(S.viewState.zoom - 10));
  bar.querySelector('.desktop-zoom-in').addEventListener('click', () => setZoom(S.viewState.zoom + 10));
  bar.querySelector('.desktop-fit-btn').addEventListener('click', () => setZoom(100));

  const initialFit = () => {
    if (window.innerWidth > 780) S.viewState.zoom = 100;
    S.fitCanvasToStage();
  };
  requestAnimationFrame(() => requestAnimationFrame(initialFit));
  window.addEventListener('load', initialFit, { once: true });
  window.visualViewport?.addEventListener('resize', S.fitCanvasToStage);
})();

(() => {
  if (document.querySelector('script[data-site-preferences]')) return;
  const script = document.createElement('script');
  script.src = 'site-preferences.js?v=20260815-1';
  script.dataset.sitePreferences = '1';
  document.body.appendChild(script);
})();
