(() => {
  'use strict';

  const S = window.StudioPro;
  if (!S) throw new Error('StudioPro core is missing');

  let pointerMode=null, pointerStart=null, pointerElementStart=null, resizeHandle=null, activePointerId=null;
  let mobilePanel=null, saveDebounce=null, pinchState=null;
  const pointers=new Map();

  const scheduleSave=(delay=180)=>{clearTimeout(saveDebounce);saveDebounce=setTimeout(()=>S.saveState(),delay);};
  const clampPct=v=>Math.max(5,Math.min(1200,Number(v)||5));

  function renderBackgroundGallery(){
    const gallery=document.getElementById('bgGallery');gallery.innerHTML='';
    S.backgroundPresets.forEach(preset=>{const btn=document.createElement('button');btn.type='button';btn.className='bg-swatch';btn.dataset.bg=preset.id;btn.title=preset.name;btn.style.background=`linear-gradient(${preset.angle}deg, ${preset.colors.join(', ')})`;btn.addEventListener('click',()=>S.selectBackground(preset.id));gallery.appendChild(btn);});
    S.syncBackgroundUI();
  }

  function activateSection(name){
    document.querySelectorAll('.tool-section').forEach(section=>section.classList.toggle('active',section.dataset.section===name));
    document.querySelectorAll('.panel-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.panel===name));
    const titleMap={design:'التصميم',background:'الخلفية',elements:'العناصر',localization:'الترجمة'},title=document.getElementById('mobilePanelTitle');
    if(title)title.textContent=titleMap[name]||'الأدوات';
  }

  function closeMobilePanels(){
    document.getElementById('leftPanel').classList.remove('mobile-open');document.getElementById('inspectorPanel').classList.remove('mobile-open');
    mobilePanel=null;document.querySelectorAll('.mobile-tool').forEach(btn=>btn.classList.remove('active'));setTimeout(()=>S.fitCanvasToStage(),250);
  }

  function openMobilePanel(name){
    if(window.innerWidth>780)return;
    const left=document.getElementById('leftPanel'),inspector=document.getElementById('inspectorPanel');
    if(mobilePanel===name&&(left.classList.contains('mobile-open')||inspector.classList.contains('mobile-open'))){closeMobilePanels();return;}
    left.classList.remove('mobile-open');inspector.classList.remove('mobile-open');
    if(name==='inspector')inspector.classList.add('mobile-open');else{activateSection(name);left.classList.add('mobile-open');}
    mobilePanel=name;document.querySelectorAll('.mobile-tool').forEach(btn=>btn.classList.toggle('active',btn.dataset.mobilePanel===name));
  }

  async function addImages(files){
    const list=[...files];
    for(const file of list){try{const img=await S.loadImageFile(file);S.addImage(img,file.name.replace(/\.[^.]+$/,''));}catch(err){S.showToast(err.message||'تعذر إضافة الصورة.');}}
    if(list.length&&window.innerWidth<=780)closeMobilePanels();
  }

  function canvasPointFromEvent(e){
    const rect=S.canvas.getBoundingClientRect();
    return{x:(e.clientX-rect.left)*S.canvas.width/rect.width,y:(e.clientY-rect.top)*S.canvas.height/rect.height};
  }

  function beginPinch(){
    if(pointers.size<2)return false;
    const el=S.getActiveElement();if(!el)return false;
    const pair=[...pointers.entries()].slice(0,2),a=pair[0][1],b=pair[1][1],distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(distance<8)return false;
    pinchState={ids:[pair[0][0],pair[1][0]],startDistance:distance,startScales:{...S.getScales(el)},elementId:el.id};
    pointerMode=null;resizeHandle=null;activePointerId=null;
    return true;
  }

  function updatePinch(){
    if(!pinchState)return false;
    const a=pointers.get(pinchState.ids[0]),b=pointers.get(pinchState.ids[1]),el=S.state.elements.find(x=>x.id===pinchState.elementId);
    if(!a||!b||!el)return false;
    const distance=Math.hypot(a.x-b.x,a.y-b.y),factor=Math.max(.08,distance/pinchState.startDistance);
    S.setScales(el,pinchState.startScales.x*factor,pinchState.startScales.y*factor);
    S.render();S.syncInspectorUI();
    return true;
  }

  function resizeFromPointer(el,point){
    if(!resizeHandle||!pointerElementStart)return;
    const axes=S.canvasToElementAxes(el,point),startAxes=pointerElementStart.axes;
    const useX=resizeHandle.includes('e')||resizeHandle.includes('w'),useY=resizeHandle.includes('n')||resizeHandle.includes('s');
    const ratioX=useX?Math.max(.04,Math.abs(axes.x)/Math.max(1,Math.abs(startAxes.x))):1;
    const ratioY=useY?Math.max(.04,Math.abs(axes.y)/Math.max(1,Math.abs(startAxes.y))):1;
    if(el.aspectLocked!==false){
      let factor=1;
      if(useX&&useY)factor=Math.max(.04,Math.hypot(axes.x,axes.y)/Math.max(1,Math.hypot(startAxes.x,startAxes.y)));
      else factor=useX?ratioX:ratioY;
      S.setScales(el,pointerElementStart.scaleX*factor,pointerElementStart.scaleY*factor);
    }else{
      S.setScales(el,pointerElementStart.scaleX*ratioX,pointerElementStart.scaleY*ratioY);
    }
  }

  function bindPointerEditing(){
    S.canvas.addEventListener('pointerdown',e=>{
      e.preventDefault();S.canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});
      if(pointers.size>=2&&S.getActiveElement()){beginPinch();return;}

      const point=canvasPointFromEvent(e),active=S.getActiveElement(),handle=active?S.hitTestResizeHandle(point,active):null;
      if(handle){
        S.setActiveElement(active.id);pointerMode='resize';resizeHandle=handle;activePointerId=e.pointerId;pointerStart={x:e.clientX,y:e.clientY};
        const sc=S.getScales(active);pointerElementStart={x:active.x,y:active.y,rotation:active.rotation||0,scaleX:sc.x,scaleY:sc.y,axes:S.canvasToElementAxes(active,point)};
        return;
      }

      const hit=S.topHit(point);
      if(!hit){
        if(e.pointerType==='touch'&&active){pointerMode='pending-empty';activePointerId=e.pointerId;pointerStart={x:e.clientX,y:e.clientY};pointerElementStart=null;return;}
        S.setActiveElement(null);pointerMode=null;return;
      }
      S.setActiveElement(hit.id);pointerMode=e.shiftKey?'rotate':'move';activePointerId=e.pointerId;pointerStart={x:e.clientX,y:e.clientY};
      const sc=S.getScales(hit);pointerElementStart={x:hit.x,y:hit.y,rotation:hit.rotation||0,scaleX:sc.x,scaleY:sc.y};
    });

    S.canvas.addEventListener('pointermove',e=>{
      if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType});
      if(pinchState){updatePinch();return;}
      if(!pointerMode||activePointerId!==e.pointerId||!pointerStart)return;
      if(pointerMode==='pending-empty')return;
      const el=S.getActiveElement();if(!el)return;
      if(pointerMode==='resize'){
        resizeFromPointer(el,canvasPointFromEvent(e));
      }else{
        const rect=S.canvas.getBoundingClientRect(),dx=(e.clientX-pointerStart.x)*S.canvas.width/rect.width,dy=(e.clientY-pointerStart.y)*S.canvas.height/rect.height;
        if(pointerMode==='rotate')el.rotation=pointerElementStart.rotation+dx*.24;
        else{el.x=pointerElementStart.x+dx;el.y=pointerElementStart.y+dy;}
      }
      S.render();S.syncInspectorUI();
    });

    const finish=e=>{
      pointers.delete(e.pointerId);
      if(pinchState&&pointers.size<2){pinchState=null;S.saveState();S.syncAllUI();}
      if(activePointerId===e.pointerId&&pointerMode){
        const wasPending=pointerMode==='pending-empty';pointerMode=null;pointerStart=null;pointerElementStart=null;resizeHandle=null;activePointerId=null;
        if(wasPending)S.setActiveElement(null);else{S.saveState();S.syncAllUI();}
      }
    };
    S.canvas.addEventListener('pointerup',finish);S.canvas.addEventListener('pointercancel',finish);

    S.canvas.addEventListener('dblclick',e=>{
      const hit=S.topHit(canvasPointFromEvent(e));
      if(hit?.type==='text'){S.setActiveElement(hit.id);if(window.innerWidth<=780)openMobilePanel('inspector');document.getElementById('textContent').focus();}
    });
  }

  function bindKeyboard(){
    document.addEventListener('keydown',e=>{
      const tag=document.activeElement?.tagName,editing=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
      if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.code==='KeyZ'){e.preventDefault();S.undo();return;}
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==='KeyZ'){e.preventDefault();S.redo();return;}
      if(editing)return;
      const el=S.getActiveElement();
      if((e.key==='Delete'||e.key==='Backspace')&&el){e.preventDefault();S.deleteElement(el.id);return;}
      if(e.key==='Escape'){S.setActiveElement(null);return;}
      if(!el)return;
      if(e.key.toLowerCase()==='t'&&S.state.elements.length){const idx=S.state.elements.findIndex(x=>x.id===el.id);S.setActiveElement(S.state.elements[(idx+1)%S.state.elements.length].id);return;}
      if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();S.scaleElementByFactor(el,e.key==='ArrowUp'?1.05:.95);S.render();S.syncInspectorUI();scheduleSave();return;}
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const step=e.shiftKey?40:8;if(e.key==='ArrowUp')el.y-=step;if(e.key==='ArrowDown')el.y+=step;if(e.key==='ArrowLeft')el.x-=step;if(e.key==='ArrowRight')el.x+=step;S.render();S.syncInspectorUI();scheduleSave();}
    });
  }

  function bindInspector(){
    const onActive=fn=>e=>{const el=S.getActiveElement();if(!el)return;fn(el,e);S.render();S.syncInspectorUI();scheduleSave();};

    document.getElementById('textContent').addEventListener('input',onActive((el,e)=>{if(el.type==='text'){el.content=e.target.value;if(el.autoFit)S.fitTextElementToCanvas(el,{startFontSize:el.fontSize});}}));
    document.getElementById('fontSize').addEventListener('input',onActive((el,e)=>{if(el.type==='text')el.fontSize=Math.max(8,Math.min(1600,+e.target.value||8));}));
    document.getElementById('fontSizeDown').addEventListener('click',()=>{const el=S.getActiveElement();if(el?.type!=='text')return;el.fontSize=Math.max(8,el.fontSize-Math.max(2,Math.round(el.fontSize*.06)));S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('fontSizeUp').addEventListener('click',()=>{const el=S.getActiveElement();if(el?.type!=='text')return;el.fontSize=Math.min(1600,el.fontSize+Math.max(2,Math.round(el.fontSize*.06)));S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('textColor').addEventListener('input',onActive((el,e)=>{if(el.type==='text')el.color=e.target.value;}));
    document.getElementById('textAutoFit').addEventListener('change',onActive((el,e)=>{if(el.type==='text'){el.autoFit=e.target.checked;if(el.autoFit)S.fitTextElementToCanvas(el,{startFontSize:el.fontSize});}}));
    document.getElementById('translationKey').addEventListener('change',e=>{const el=S.getActiveElement();if(!el||el.type!=='text')return;const key=e.target.value.trim().replace(/[^a-zA-Z0-9_-]/g,'_')||el.translationKey,duplicate=S.getTextElements().some(x=>x.id!==el.id&&x.translationKey===key);if(duplicate){e.target.value=el.translationKey;S.showToast('معرّف الترجمة مستخدم لنص آخر.');return;}el.translationKey=key;e.target.value=key;S.syncAllUI();S.saveState();});

    const applyOverall=(el,pct)=>{
      const target=clampPct(pct)/100;
      if(el.aspectLocked!==false)S.setScales(el,target,target);
      else{const current=Math.max(.05,S.getUniformScale(el));S.scaleElementByFactor(el,target/current);}
    };
    document.getElementById('elementScale').addEventListener('input',onActive((el,e)=>applyOverall(el,e.target.value)));
    document.getElementById('elementScaleValue').addEventListener('change',e=>{const el=S.getActiveElement();if(!el)return;applyOverall(el,e.target.value);S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('elementScaleDown').addEventListener('click',()=>{const el=S.getActiveElement();if(!el)return;applyOverall(el,Math.round(S.getUniformScale(el)*100)-10);S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('elementScaleUp').addEventListener('click',()=>{const el=S.getActiveElement();if(!el)return;applyOverall(el,Math.round(S.getUniformScale(el)*100)+10);S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('elementScaleX').addEventListener('change',e=>{const el=S.getActiveElement();if(!el)return;const v=clampPct(e.target.value)/100,{y}=S.getScales(el);S.setScales(el,v,el.aspectLocked!==false?v:y);S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('elementScaleY').addEventListener('change',e=>{const el=S.getActiveElement();if(!el)return;const v=clampPct(e.target.value)/100,{x}=S.getScales(el);S.setScales(el,el.aspectLocked!==false?v:x,v);S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('aspectLock').addEventListener('change',e=>{const el=S.getActiveElement();if(!el)return;el.aspectLocked=e.target.checked;if(el.aspectLocked){const u=S.getUniformScale(el);S.setScales(el,u,u);}S.render();S.syncInspectorUI();S.saveState();});
    document.getElementById('elementRotation').addEventListener('input',onActive((el,e)=>{el.rotation=+e.target.value||0;}));

    document.getElementById('borderRadiusSlider').addEventListener('input',onActive((el,e)=>{if(el.type==='image')el.borderRadius=+e.target.value;}));
    document.getElementById('frameColorPicker').addEventListener('input',onActive((el,e)=>{if(el.type==='image')el.frameColor=e.target.value;}));
    document.getElementById('deviceGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-frame]'),el=S.getActiveElement();if(!btn||!el||el.type!=='image')return;const def=S.getFrameDefinition(btn.dataset.frame);el.frame=def.id;if(def.kind!=='none')el.borderRadius=def.radius;S.render();S.syncAllUI();S.saveState();});

    document.getElementById('shadowEnabled').addEventListener('change',onActive((el,e)=>{el.shadow=el.shadow||S.makeShadow(el.type);el.shadow.enabled=e.target.checked;}));
    document.getElementById('shadowBlur').addEventListener('input',onActive((el,e)=>{el.shadow.blur=+e.target.value;}));
    document.getElementById('shadowOpacity').addEventListener('input',onActive((el,e)=>{el.shadow.opacity=+e.target.value;}));
    document.getElementById('shadowX').addEventListener('input',onActive((el,e)=>{el.shadow.x=+e.target.value;}));
    document.getElementById('shadowY').addEventListener('input',onActive((el,e)=>{el.shadow.y=+e.target.value;}));
    document.getElementById('shadowColor').addEventListener('input',onActive((el,e)=>{el.shadow.color=e.target.value;}));
    document.getElementById('deleteInspectorBtn').addEventListener('click',()=>{const el=S.getActiveElement();if(el)S.deleteElement(el.id);});
    document.getElementById('centerXBtn').addEventListener('click',()=>S.centerElement('x'));
    document.getElementById('centerYBtn').addEventListener('click',()=>S.centerElement('y'));
  }

  function bindCanvasAndBackgroundControls(){
    const imageInput=document.getElementById('imageInput');
    document.getElementById('addImageBtn').addEventListener('click',()=>imageInput.click());document.getElementById('emptyAddImage').addEventListener('click',()=>imageInput.click());
    imageInput.addEventListener('change',async e=>{await addImages(e.target.files);e.target.value='';});
    document.getElementById('addTextBtn').addEventListener('click',()=>{S.addText('نص جديد');if(window.innerWidth<=780)openMobilePanel('inspector');});
    document.getElementById('deleteBtn').addEventListener('click',()=>{const el=S.getActiveElement();if(el)S.deleteElement(el.id);});
    document.querySelectorAll('.preset-btn[data-size]').forEach(btn=>btn.addEventListener('click',()=>{const[w,h]=btn.dataset.size.split('x').map(Number);S.setCanvasSize(w,h);}));
    document.getElementById('applyCustomSize').addEventListener('click',()=>{const w=Math.max(320,Math.min(7680,+document.getElementById('customWidth').value||1080)),h=Math.max(320,Math.min(7680,+document.getElementById('customHeight').value||1920));S.setCanvasSize(w,h);});
    document.getElementById('zoomIn').addEventListener('click',()=>S.setZoom(S.viewState.zoom+10));document.getElementById('zoomOut').addEventListener('click',()=>S.setZoom(S.viewState.zoom-10));document.getElementById('zoomReset').addEventListener('click',()=>S.setZoom(100));
    S.canvasArea.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();S.setZoom(S.viewState.zoom+(e.deltaY>0?-10:10));},{passive:false});
    document.getElementById('centerElementBtn').addEventListener('click',()=>S.centerElement('both'));document.getElementById('fitElementBtn').addEventListener('click',()=>S.fitElementToCanvas());
    const solid=document.getElementById('solidColor'),hex=document.getElementById('solidHex');
    solid.addEventListener('input',()=>{hex.value=solid.value.toUpperCase();S.useSolidBackground(solid.value);});
    hex.addEventListener('change',()=>{const v=hex.value.trim();if(/^#[0-9a-f]{6}$/i.test(v)){solid.value=v;S.useSolidBackground(v);}else hex.value=solid.value.toUpperCase();});
    document.getElementById('smartBgBtn').addEventListener('click',()=>S.suggestBackgroundFromImage());
    const bgInput=document.getElementById('bgImageInput');document.getElementById('bgImageBtn').addEventListener('click',()=>bgInput.click());
    bgInput.addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{S.useImageBackground(await S.loadImageFile(file));}catch(err){S.showToast(err.message);}e.target.value='';});
    document.getElementById('bgBlur').addEventListener('input',e=>{S.state.background.blur=+e.target.value;S.render();scheduleSave();});
    document.getElementById('bgOverlay').addEventListener('input',e=>{S.state.background.overlay=+e.target.value;S.render();scheduleSave();});
    document.getElementById('exportBtn').addEventListener('click',()=>S.exportCanvas());
  }

  function bindNavigation(){
    document.querySelectorAll('.panel-tab').forEach(tab=>tab.addEventListener('click',()=>activateSection(tab.dataset.panel)));
    document.querySelectorAll('.mobile-tool').forEach(btn=>btn.addEventListener('click',()=>openMobilePanel(btn.dataset.mobilePanel)));
    document.getElementById('closeMobilePanel').addEventListener('click',closeMobilePanels);document.getElementById('closeInspectorPanel').addEventListener('click',closeMobilePanels);
    window.addEventListener('resize',()=>{if(window.innerWidth>780){closeMobilePanels();document.querySelector('.mobile-tool[data-mobile-panel="design"]')?.classList.add('active');}S.fitCanvasToStage();});
  }

  renderBackgroundGallery();bindNavigation();bindCanvasAndBackgroundControls();bindInspector();bindPointerEditing();bindKeyboard();
  document.getElementById('undoBtn').addEventListener('click',S.undo);document.getElementById('redoBtn').addEventListener('click',S.redo);
  activateSection('design');S.syncAllUI();
})();
