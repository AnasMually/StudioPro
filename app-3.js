(() => {
  'use strict';
  const S=window.StudioPro,{state,canvas}=S;

  S.syncBackgroundUI=()=>{
    document.querySelectorAll('.bg-swatch').forEach(b=>b.classList.toggle('active',state.background.type==='preset'&&b.dataset.bg===state.background.presetId));
    const c=document.getElementById('solidColor'),h=document.getElementById('solidHex');
    if(c)c.value=state.background.solid||'#f3f4f8';
    if(h)h.value=(state.background.solid||'#f3f4f8').toUpperCase();
  };

  S.syncElementsUI=()=>{
    const list=document.getElementById('elementsList');if(!list)return;
    list.innerHTML='';
    if(!state.elements.length){list.innerHTML='<div class="section-help prominent">لا توجد عناصر بعد.</div>';return;}
    [...state.elements].reverse().forEach(el=>{
      const row=document.createElement('div');row.className='element-item'+(el.id===state.activeElementId?' active':'');
      const title=el.type==='text'?(el.content||'نص'):(el.name||'صورة');
      row.innerHTML=`<div class="element-main"><div class="element-badge">${el.type==='text'?'T':'IMG'}</div><div class="element-name"></div></div><button class="element-delete" title="حذف">×</button>`;
      row.querySelector('.element-name').textContent=title;
      row.onclick=e=>e.target.closest('.element-delete')?S.deleteElement(el.id):S.setActiveElement(el.id);
      list.appendChild(row);
    });
  };

  S.buildDeviceFrameUI=()=>{
    const grid=document.getElementById('deviceGrid');if(!grid)return;
    grid.innerHTML='';
    S.deviceFrames.forEach(frame=>{
      const btn=document.createElement('button');
      btn.type='button';btn.dataset.frame=frame.id;btn.className='frame-option';
      const icon=document.createElement('span');icon.className=`frame-icon frame-icon-${frame.kind}`;
      if(frame.cutout==='island')icon.dataset.cutout='island';
      else if(frame.cutout==='hole')icon.dataset.cutout='hole';
      const label=document.createElement('span');label.className='frame-label';label.textContent=frame.short;
      btn.title=frame.name;btn.append(icon,label);grid.appendChild(btn);
    });
  };

  S.syncInspectorUI=()=>{
    const el=S.getActiveElement(),empty=document.getElementById('inspectorEmpty'),content=document.getElementById('inspectorContent');
    if(!empty||!content)return;
    empty.hidden=!!el;content.hidden=!el;if(!el)return;
    S.ensureElementTransform(el);
    document.getElementById('activeElementType').textContent=el.type==='text'?'نص':'صورة';
    document.getElementById('activeElementName').textContent=el.type==='text'?(el.content||'نص'):el.name;
    document.getElementById('textInspector').hidden=el.type!=='text';
    document.getElementById('imageInspector').hidden=el.type!=='image';

    const {x:sx,y:sy}=S.getScales(el),uniform=Math.round(S.getUniformScale(el)*100);
    document.getElementById('elementScale').value=uniform;
    document.getElementById('elementScaleValue').value=uniform;
    document.getElementById('elementScaleX').value=Math.round(sx*100);
    document.getElementById('elementScaleY').value=Math.round(sy*100);
    document.getElementById('aspectLock').checked=el.aspectLocked!==false;
    document.getElementById('elementRotation').value=Math.round(el.rotation||0);

    const sh=el.shadow||S.makeShadow(el.type);
    document.getElementById('shadowEnabled').checked=!!sh.enabled;
    document.getElementById('shadowBlur').value=sh.blur||0;
    document.getElementById('shadowOpacity').value=sh.opacity||0;
    document.getElementById('shadowX').value=sh.x||0;
    document.getElementById('shadowY').value=sh.y||0;
    document.getElementById('shadowColor').value=sh.color||'#111827';
    document.getElementById('shadowControls').style.opacity=sh.enabled?'1':'.45';

    if(el.type==='text'){
      document.getElementById('textContent').value=el.content||'';
      document.getElementById('fontSize').value=Math.round(el.fontSize||64);
      document.getElementById('textColor').value=el.color||'#111827';
      document.getElementById('textAutoFit').checked=el.autoFit!==false;
      document.getElementById('translationKey').value=el.translationKey||'';
    }else{
      document.getElementById('borderRadiusSlider').value=el.borderRadius??46;
      document.getElementById('frameColorPicker').value=el.frameColor||'#111827';
      const normalized=S.getFrameDefinition(el.frame).id;
      document.querySelectorAll('#deviceGrid [data-frame]').forEach(b=>b.classList.toggle('active',b.dataset.frame===normalized));
    }
  };

  S.syncAllUI=()=>{
    S.updateUndoRedo();
    const label=document.getElementById('canvasSizeLabel');if(label)label.textContent=`${state.canvas.width} × ${state.canvas.height}`;
    document.querySelectorAll('.preset-btn[data-size]').forEach(b=>b.classList.toggle('active',b.dataset.size===`${state.canvas.width}x${state.canvas.height}`));
    const w=document.getElementById('customWidth'),h=document.getElementById('customHeight');if(w)w.value=state.canvas.width;if(h)h.value=state.canvas.height;
    S.syncElementsUI();S.syncInspectorUI();S.syncBackgroundUI();window.StudioProLocalization?.refreshTextItems?.();
  };

  const gallery=document.getElementById('bgGallery');
  gallery.innerHTML='';
  S.backgroundPresets.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='bg-swatch';b.dataset.bg=p.id;b.title=p.name;b.style.background=`linear-gradient(${p.angle}deg,${p.colors.join(',')})`;b.onclick=()=>S.selectBackground(p.id);gallery.appendChild(b);});

  S.buildDeviceFrameUI();
  const ro=new ResizeObserver(()=>S.fitCanvasToStage());ro.observe(S.canvasArea);
  canvas.width=state.canvas.width;canvas.height=state.canvas.height;S.render();S.syncAllUI();S.saveState();S.fitCanvasToStage();
})();
