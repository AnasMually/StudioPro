(() => {
  'use strict';

  const S=window.StudioPro;
  if(!S) throw new Error('StudioPro core is missing');

  const I18N={
    ar:{reorder:'اسحب لتغيير ترتيب الطبقة',zoomMove:'اسحب لنقل أدوات التكبير'},
    en:{reorder:'Drag to reorder layer',zoomMove:'Drag to move zoom controls'},
    es:{reorder:'Arrastra para reordenar la capa',zoomMove:'Arrastra para mover los controles de zoom'},
    hi:{reorder:'लेयर क्रम बदलने के लिए खींचें',zoomMove:'ज़ूम नियंत्रण ले जाने के लिए खींचें'},
    zh:{reorder:'拖动以调整图层顺序',zoomMove:'拖动以移动缩放控件'}
  };
  const uiLang=()=>{
    const raw=(document.documentElement.lang||navigator.language||'en').toLowerCase();
    if(raw.startsWith('ar'))return'ar';if(raw.startsWith('es'))return'es';if(raw.startsWith('hi'))return'hi';if(raw.startsWith('zh'))return'zh';return'en';
  };
  const tr=k=>I18N[uiLang()]?.[k]||I18N.en[k]||k;

  function installStyles(){
    if(document.getElementById('layerZoomEnhancementsStyle'))return;
    const style=document.createElement('style');style.id='layerZoomEnhancementsStyle';style.textContent=`
      #elementsList .element-item{grid-template-columns:auto minmax(0,1fr) auto;position:relative;transition:border-color .14s ease,background .14s ease,transform .14s ease,opacity .14s ease}
      .layer-drag-handle{width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--border);border-radius:9px;background:var(--panel-soft);color:var(--muted);cursor:grab;touch-action:none;user-select:none;font-size:15px;line-height:1;flex:0 0 auto}
      .layer-drag-handle:active{cursor:grabbing}
      .element-item.layer-dragging{opacity:.78;transform:scale(.99);border-color:var(--accent);background:var(--accent-soft);box-shadow:0 10px 28px rgba(31,41,55,.14);z-index:4}
      .element-item.layer-drop-before::before{content:'';position:absolute;left:6px;right:6px;top:-5px;height:3px;border-radius:999px;background:var(--accent);box-shadow:0 0 0 2px rgba(91,92,226,.10)}
      .element-item.layer-drop-after::after{content:'';position:absolute;left:6px;right:6px;bottom:-5px;height:3px;border-radius:999px;background:var(--accent);box-shadow:0 0 0 2px rgba(91,92,226,.10)}
      .stage-column{position:relative}
      .stage{overflow:auto!important;display:flex!important;align-items:safe center!important;justify-content:safe center!important;overscroll-behavior:contain;scrollbar-gutter:stable both-edges}
      .stage #mainCanvas{flex:0 0 auto}
      .workspace-zoom-float{position:absolute!important;z-index:36;display:flex!important;align-items:center;gap:6px!important;margin:0!important;padding:6px!important;border:1px solid var(--border)!important;border-radius:13px!important;background:rgba(255,255,255,.94)!important;backdrop-filter:blur(14px);box-shadow:0 10px 30px rgba(31,41,55,.14);direction:ltr;max-width:calc(100% - 16px);touch-action:auto}
      .workspace-zoom-float #zoomDisplay{min-width:38px!important}
      .workspace-zoom-drag{width:30px;height:30px;min-width:30px;display:grid;place-items:center;border:0;border-radius:8px;background:var(--panel-soft);color:var(--muted);cursor:grab;touch-action:none;user-select:none;font-size:16px;line-height:1;padding:0}
      .workspace-zoom-drag:active{cursor:grabbing;background:var(--accent-soft);color:var(--accent-strong)}
      .workspace-zoom-float.dragging{box-shadow:0 16px 38px rgba(31,41,55,.22)}
      .zoom-section-title-hidden{display:none!important}
      @media(max-width:780px){
        .workspace-zoom-float{padding:5px!important;gap:4px!important;border-radius:12px!important}
        .workspace-zoom-drag{width:28px;height:28px;min-width:28px}
        .workspace-zoom-float .icon-btn{width:32px!important;height:32px!important}
        .workspace-zoom-float .btn-ghost{height:32px!important;padding-inline:8px!important;font-size:9px!important}
        .layer-drag-handle{width:34px;height:34px}
      }
    `;document.head.appendChild(style);
  }

  function decorateLayerRows(){
    const list=document.getElementById('elementsList');if(!list)return;
    const visual=[...S.state.elements].reverse();
    [...list.querySelectorAll('.element-item')].forEach((row,index)=>{
      const el=visual[index];if(!el)return;
      row.dataset.elementId=el.id;
      if(!row.querySelector('.layer-drag-handle')){
        const handle=document.createElement('button');
        handle.type='button';handle.className='layer-drag-handle';handle.textContent='↕';
        handle.title=tr('reorder');handle.setAttribute('aria-label',tr('reorder'));
        row.prepend(handle);
      }else{
        const h=row.querySelector('.layer-drag-handle');h.title=tr('reorder');h.setAttribute('aria-label',tr('reorder'));
      }
    });
  }

  const originalSyncElementsUI=S.syncElementsUI;
  S.syncElementsUI=function(){
    const result=originalSyncElementsUI.apply(this,arguments);
    decorateLayerRows();
    return result;
  };

  function commitLayerOrder(list){
    const ids=[...list.querySelectorAll('.element-item[data-element-id]')].map(row=>row.dataset.elementId);
    if(ids.length!==S.state.elements.length)return;
    const byId=new Map(S.state.elements.map(el=>[el.id,el]));
    const reordered=ids.slice().reverse().map(id=>byId.get(id)).filter(Boolean);
    if(reordered.length!==S.state.elements.length)return;
    const changed=reordered.some((el,i)=>el!==S.state.elements[i]);
    if(!changed)return;
    S.state.elements=reordered;
    S.render();
    S.saveState();
    S.syncAllUI();
  }

  function bindLayerReordering(){
    const list=document.getElementById('elementsList');if(!list||list.dataset.reorderBound==='1')return;
    list.dataset.reorderBound='1';
    let drag=null,suppressClickUntil=0;

    list.addEventListener('click',e=>{
      if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}
    },true);

    list.addEventListener('pointerdown',e=>{
      const handle=e.target.closest('.layer-drag-handle');if(!handle)return;
      const row=handle.closest('.element-item');if(!row)return;
      e.preventDefault();e.stopPropagation();
      handle.setPointerCapture?.(e.pointerId);
      drag={pointerId:e.pointerId,row,startX:e.clientX,startY:e.clientY,active:false,lastY:e.clientY};
    });

    list.addEventListener('pointermove',e=>{
      if(!drag||drag.pointerId!==e.pointerId)return;
      drag.lastY=e.clientY;
      if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
      if(!drag.active){drag.active=true;drag.row.classList.add('layer-dragging');}
      e.preventDefault();

      const rows=[...list.querySelectorAll('.element-item')].filter(r=>r!==drag.row);
      rows.forEach(r=>r.classList.remove('layer-drop-before','layer-drop-after'));
      let before=null;
      for(const r of rows){
        const rect=r.getBoundingClientRect();
        if(e.clientY<rect.top+rect.height/2){before=r;break;}
      }
      if(before){
        list.insertBefore(drag.row,before);
        before.classList.add('layer-drop-before');
      }else{
        const last=rows.at(-1);
        list.appendChild(drag.row);
        last?.classList.add('layer-drop-after');
      }

      const panel=list.closest('.panel');
      if(panel){
        const pr=panel.getBoundingClientRect(),edge=44,speed=14;
        if(e.clientY<pr.top+edge)panel.scrollTop-=speed;
        else if(e.clientY>pr.bottom-edge)panel.scrollTop+=speed;
      }
    });

    const finish=e=>{
      if(!drag||drag.pointerId!==e.pointerId)return;
      const wasActive=drag.active;
      drag.row.classList.remove('layer-dragging');
      [...list.querySelectorAll('.element-item')].forEach(r=>r.classList.remove('layer-drop-before','layer-drop-after'));
      drag=null;
      if(wasActive){
        suppressClickUntil=performance.now()+350;
        commitLayerOrder(list);
      }
    };
    list.addEventListener('pointerup',finish);
    list.addEventListener('pointercancel',finish);
  }

  const ZOOM_POS_KEY='studiopro.workspaceZoomPosition.v1';

  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function zoomBounds(host,palette){
    const hr=host.getBoundingClientRect(),pr=palette.getBoundingClientRect();
    const minX=8,maxX=Math.max(8,hr.width-pr.width-8),minY=50,maxY=Math.max(minY,hr.height-pr.height-8);
    return{minX,maxX,minY,maxY};
  }
  function saveZoomPosition(host,palette){
    const b=zoomBounds(host,palette),x=parseFloat(palette.style.left)||b.maxX,y=parseFloat(palette.style.top)||b.maxY;
    const rx=b.maxX===b.minX?0:(x-b.minX)/(b.maxX-b.minX),ry=b.maxY===b.minY?0:(y-b.minY)/(b.maxY-b.minY);
    try{localStorage.setItem(ZOOM_POS_KEY,JSON.stringify({rx:clamp(rx,0,1),ry:clamp(ry,0,1)}));}catch(_){}
  }
  function restoreZoomPosition(host,palette){
    const b=zoomBounds(host,palette);let pos=null;
    try{pos=JSON.parse(localStorage.getItem(ZOOM_POS_KEY)||'null');}catch(_){}
    const rx=Number.isFinite(pos?.rx)?clamp(pos.rx,0,1):1,ry=Number.isFinite(pos?.ry)?clamp(pos.ry,0,1):1;
    palette.style.left=`${Math.round(b.minX+(b.maxX-b.minX)*rx)}px`;
    palette.style.top=`${Math.round(b.minY+(b.maxY-b.minY)*ry)}px`;
    palette.style.right='auto';palette.style.bottom='auto';
  }

  function removeLegacyZoomBars(){
    document.querySelectorAll('.desktop-stage-zoom').forEach(el=>el.remove());
  }

  function keepOnlyMovableZoom(){
    removeLegacyZoomBars();
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(!(node instanceof Element))continue;
          if(node.matches?.('.desktop-stage-zoom'))node.remove();
          node.querySelectorAll?.('.desktop-stage-zoom').forEach(el=>el.remove());
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function makeZoomPaletteDraggable(){
    const row=document.querySelector('.zoom-row'),host=document.querySelector('.stage-column');
    if(!row||!host||row.dataset.floatingZoom==='1')return;
    row.dataset.floatingZoom='1';
    const title=row.previousElementSibling;
    if(title?.classList.contains('section-title'))title.classList.add('zoom-section-title-hidden');
    row.classList.add('workspace-zoom-float');
    host.appendChild(row);

    const handle=document.createElement('button');handle.type='button';handle.className='workspace-zoom-drag';handle.textContent='⠿';handle.title=tr('zoomMove');handle.setAttribute('aria-label',tr('zoomMove'));row.prepend(handle);

    requestAnimationFrame(()=>restoreZoomPosition(host,row));

    let drag=null;
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;
      e.preventDefault();e.stopPropagation();handle.setPointerCapture?.(e.pointerId);
      const rr=row.getBoundingClientRect(),hr=host.getBoundingClientRect();
      drag={id:e.pointerId,offsetX:e.clientX-rr.left,offsetY:e.clientY-rr.top,hostLeft:hr.left,hostTop:hr.top};
      row.classList.add('dragging');
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      e.preventDefault();
      const b=zoomBounds(host,row);
      const x=clamp(e.clientX-drag.hostLeft-drag.offsetX,b.minX,b.maxX),y=clamp(e.clientY-drag.hostTop-drag.offsetY,b.minY,b.maxY);
      row.style.left=`${Math.round(x)}px`;row.style.top=`${Math.round(y)}px`;
    });
    const finish=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      drag=null;row.classList.remove('dragging');saveZoomPosition(host,row);
    };
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);

    const ro=new ResizeObserver(()=>restoreZoomPosition(host,row));ro.observe(host);
  }

  function enableScrollableZoomedStage(){
    const stage=document.getElementById('canvasArea'),canvas=S.canvas;
    if(!stage||!canvas||stage.dataset.panBound==='1')return;
    stage.dataset.panBound='1';

    // Mouse wheel / trackpad scrolls the zoomed canvas naturally.
    stage.addEventListener('wheel',e=>{
      if(stage.scrollHeight<=stage.clientHeight&&stage.scrollWidth<=stage.clientWidth)return;
      if(e.ctrlKey)return;
      if(Math.abs(e.deltaX)>0||Math.abs(e.deltaY)>0){
        e.preventDefault();
        stage.scrollLeft+=e.deltaX;
        stage.scrollTop+=e.deltaY;
      }
    },{passive:false});

    // On touch, dragging an empty part of the canvas pans the workspace.
    let pan=null;
    const canvasPoint=e=>{
      const r=canvas.getBoundingClientRect();
      return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
    };
    canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch')return;
      const hit=S.topHit?.(canvasPoint(e));
      if(hit)return;
      if(stage.scrollHeight<=stage.clientHeight&&stage.scrollWidth<=stage.clientWidth)return;
      e.preventDefault();e.stopImmediatePropagation();
      canvas.setPointerCapture?.(e.pointerId);
      pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:stage.scrollLeft,top:stage.scrollTop};
    },true);
    canvas.addEventListener('pointermove',e=>{
      if(!pan||pan.id!==e.pointerId)return;
      e.preventDefault();e.stopImmediatePropagation();
      stage.scrollLeft=pan.left-(e.clientX-pan.x);
      stage.scrollTop=pan.top-(e.clientY-pan.y);
    },true);
    const end=e=>{if(pan&&pan.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();pan=null;}};
    canvas.addEventListener('pointerup',end,true);
    canvas.addEventListener('pointercancel',end,true);
  }

  installStyles();
  keepOnlyMovableZoom();
  enableScrollableZoomedStage();
  decorateLayerRows();
  bindLayerReordering();
  makeZoomPaletteDraggable();
  removeLegacyZoomBars();

  const langObserver=new MutationObserver(()=>{
    document.querySelectorAll('.layer-drag-handle').forEach(h=>{h.title=tr('reorder');h.setAttribute('aria-label',tr('reorder'));});
    const zh=document.querySelector('.workspace-zoom-drag');if(zh){zh.title=tr('zoomMove');zh.setAttribute('aria-label',tr('zoomMove'));}
  });
  langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
})();