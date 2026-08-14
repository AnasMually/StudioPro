(() => {
  'use strict';
  const S=window.StudioPro;
  if(!S)return;

  const BASE_BORDER=16;
  const MIN_BORDER=2;
  const MAX_BORDER=64;
  const clamp=v=>Math.max(MIN_BORDER,Math.min(MAX_BORDER,Number(v)||BASE_BORDER));
  const parseRounded=id=>{
    const m=String(id||'').match(/^rounded(?:\|fs=(\d+))?$/);
    return m?{isRounded:true,scale:m[1]?Math.max(.125,Math.min(4,Number(m[1])/100)):1}:{isRounded:false,scale:1};
  };
  const encodeRounded=width=>`rounded|fs=${Math.round(clamp(width)/BASE_BORDER*100)}`;

  const previousGetFrame=S.getFrameDefinition.bind(S);
  S.getFrameDefinition=id=>{
    const parsed=parseRounded(id),def=previousGetFrame(id);
    if(!parsed.isRounded&&def?.kind!=='rounded')return def;
    const scale=parsed.isRounded?parsed.scale:(Number(def?.frameScale)||1);
    return {
      ...def,
      id:'rounded',
      baseId:'rounded',
      kind:'phone',
      cutout:'none',
      bezel:BASE_BORDER*scale,
      frameScale:scale,
      softRounded:true
    };
  };

  const grid=document.getElementById('deviceGrid');
  if(!grid)return;
  const box=document.createElement('div');
  box.className='rounded-border-control';
  box.hidden=true;
  box.innerHTML=`
    <label class="field-label">سُمك حدود الإطار الناعم</label>
    <div class="rounded-border-stepper">
      <button type="button" id="roundedBorderDown" aria-label="تقليل سُمك الحدود">−</button>
      <div class="rounded-border-value"><input type="number" id="roundedBorderValue" min="${MIN_BORDER}" max="${MAX_BORDER}" step="1" value="${BASE_BORDER}"><span>px</span></div>
      <button type="button" id="roundedBorderUp" aria-label="زيادة سُمك الحدود">＋</button>
    </div>
    <input type="range" id="roundedBorderRange" min="${MIN_BORDER}" max="${MAX_BORDER}" step="1" value="${BASE_BORDER}">
    <div class="rounded-border-note">يتحكم في عرض الحد حول الصورة عند اختيار الإطار الناعم.</div>
  `;
  const style=document.createElement('style');
  style.textContent=`
    .rounded-border-control{display:grid;gap:8px;margin-top:9px;padding:10px;border:1px solid var(--border);border-radius:11px;background:var(--panel-soft)}
    .rounded-border-control[hidden]{display:none!important}
    .rounded-border-stepper{display:grid;grid-template-columns:40px minmax(0,1fr) 40px;gap:8px;direction:ltr;align-items:center}
    .rounded-border-stepper button{min-height:38px;border:1px solid var(--border);border-radius:10px;background:#fff;color:var(--text);font-size:18px;font-weight:800;cursor:pointer}
    .rounded-border-value{display:grid;grid-template-columns:1fr auto;align-items:center;min-height:38px;border:1px solid var(--border);border-radius:10px;background:#fff;padding-inline:10px}
    .rounded-border-value input{min-height:34px!important;border:0!important;padding:0!important;text-align:center;font-weight:800;direction:ltr;outline:0!important}
    .rounded-border-value span{color:var(--muted);font-size:10px;font-weight:800}
    .rounded-border-note{color:var(--muted);font-size:9px;line-height:1.55}
    @media(max-width:780px){.rounded-border-stepper{grid-template-columns:44px minmax(0,1fr) 44px}.rounded-border-stepper button{min-height:42px;font-size:20px}}
  `;
  document.head.appendChild(style);

  const frameScaleWrap=grid.nextElementSibling?.classList?.contains('frame-scale-wrap')?grid.nextElementSibling:null;
  (frameScaleWrap||grid).insertAdjacentElement('afterend',box);

  const range=box.querySelector('#roundedBorderRange');
  const value=box.querySelector('#roundedBorderValue');
  const currentWidth=el=>Number.isFinite(el?.roundedBorderWidth)?clamp(el.roundedBorderWidth):BASE_BORDER;
  const apply=(width,save=true)=>{
    const el=S.getActiveElement();
    if(!el||el.type!=='image'||!parseRounded(el.frame).isRounded)return;
    const w=clamp(width);
    el.roundedBorderWidth=w;
    el.frame=encodeRounded(w);
    range.value=w;value.value=w;
    S.render();S.syncInspectorUI?.();
    if(save)S.saveState();
  };
  range.addEventListener('input',e=>apply(e.target.value,false));
  range.addEventListener('change',e=>apply(e.target.value,true));
  value.addEventListener('change',e=>apply(e.target.value,true));
  box.querySelector('#roundedBorderDown').onclick=()=>{const el=S.getActiveElement();if(el)apply(currentWidth(el)-2,true);};
  box.querySelector('#roundedBorderUp').onclick=()=>{const el=S.getActiveElement();if(el)apply(currentWidth(el)+2,true);};

  const previousSync=S.syncInspectorUI?.bind(S);
  if(previousSync){
    S.syncInspectorUI=()=>{
      previousSync();
      const el=S.getActiveElement();
      const rounded=!!el&&el.type==='image'&&parseRounded(el.frame).isRounded;
      box.hidden=!rounded;
      if(!rounded)return;
      const w=currentWidth(el);
      if(!Number.isFinite(el.roundedBorderWidth)){
        el.roundedBorderWidth=w;
        const desired=encodeRounded(w);
        if(el.frame!==desired){el.frame=desired;queueMicrotask(()=>S.render());}
      }
      range.value=w;value.value=w;
    };
  }

  S.syncInspectorUI?.();
  S.render();
})();

(() => {
  const script=document.createElement('script');
  script.src='desktop-stage-enhancements.js?v=20260815-1';
  document.body.appendChild(script);
})();
