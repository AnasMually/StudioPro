(() => {
  'use strict';

  const S = window.StudioPro;
  if (!S) throw new Error('StudioPro core is missing');

  const PROJECT_SCHEMA = 2;
  const PROJECT_EXT = '.studiopro';
  const imageSource = el => el?._sourceImage || el?.image || null;

  function injectUI(){
    const topActions=document.querySelector('.top-actions');
    if(topActions&&!document.getElementById('saveProjectBtn')){
      const save=document.createElement('button');save.className='btn btn-secondary';save.id='saveProjectBtn';save.textContent='حفظ المشروع';
      const load=document.createElement('button');load.className='btn btn-secondary';load.id='loadProjectBtn';load.textContent='استيراد مشروع';
      const input=document.createElement('input');input.type='file';input.id='projectInput';input.accept='.studiopro,application/zip';input.hidden=true;
      topActions.insertBefore(save,document.getElementById('exportBtn'));
      topActions.insertBefore(load,document.getElementById('exportBtn'));
      topActions.appendChild(input);
    }

    const imageInspector=document.getElementById('imageInspector');
    if(imageInspector&&!document.getElementById('shapeMode')){
      const box=document.createElement('div');box.className='shape-pro-controls';box.innerHTML=`
        <div class="group-title">شكل الصورة</div>
        <label class="field-label" for="shapeMode">نمط الحواف</label>
        <select id="shapeMode" class="shape-select">
          <option value="original">افتراضي / بدون قص إضافي</option>
          <option value="rounded">زوايا دائرية</option>
          <option value="squircle">Squircle — نمط One UI</option>
        </select>
        <div id="squircleControls">
          <label class="field-label" for="shapeSmoothness">نعومة Squircle <span id="shapeSmoothnessValue">58%</span></label>
          <input type="range" id="shapeSmoothness" min="0" max="100" step="1" value="58">
          <p class="section-help">يوزع الانحناء على امتداد الأضلاع بدل حصره في الزوايا فقط.</p>
        </div>`;
      const frameRow=imageInspector.querySelector('.field-row.two');
      frameRow?.insertAdjacentElement('afterend',box);
    }

    if(!document.getElementById('shapeProStyle')){
      const style=document.createElement('style');style.id='shapeProStyle';style.textContent=`
        .shape-pro-controls{margin-top:14px;padding-top:14px;border-top:1px solid rgba(127,127,127,.16)}
        .shape-select{width:100%;min-height:42px;border:1px solid var(--border,#dfe3ec);border-radius:10px;background:var(--surface,#fff);color:inherit;padding:0 10px;margin:7px 0 12px;font:inherit}
        .shape-pro-controls input[type=range]{width:100%}
        @media(max-width:780px){.top-actions #saveProjectBtn,.top-actions #loadProjectBtn{padding-inline:9px;font-size:12px}}
      `;document.head.appendChild(style);
    }
  }

  function superellipsePath(ctx,x,y,w,h,power){
    const a=Math.abs(w)/2,b=Math.abs(h)/2,cx=x+w/2,cy=y+h/2,n=Math.max(2.01,Math.min(8,power||4.3));
    const steps=96;
    ctx.beginPath();
    for(let i=0;i<=steps;i++){
      const t=i/steps*Math.PI*2,ct=Math.cos(t),st=Math.sin(t);
      const px=cx+a*Math.sign(ct)*Math.pow(Math.abs(ct),2/n);
      const py=cy+b*Math.sign(st)*Math.pow(Math.abs(st),2/n);
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();
  }

  function roundedPath(ctx,x,y,w,h,r){
    r=Math.min(Math.max(0,r),Math.abs(w)/2,Math.abs(h)/2);
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }

  function sourceDimensions(src){
    return {w:src?.naturalWidth||src?.videoWidth||src?.width||1,h:src?.naturalHeight||src?.videoHeight||src?.height||1};
  }

  function ensureShapeImage(el){
    if(!el||el.type!=='image'||!el.image)return;
    if(!el.shapeMode)el.shapeMode='original';
    if(!Number.isFinite(el.shapeSmoothness))el.shapeSmoothness=58;

    if(el.shapeMode==='original'){
      if(el._sourceImage)el.image=el._sourceImage;
      el._shapeCacheKey='original';
      return;
    }

    const src=el._sourceImage||el.image;
    if(!el._sourceImage)el._sourceImage=src;
    const {w,h}=sourceDimensions(src);
    const key=[el.shapeMode,el.shapeSmoothness,el.borderRadius,w,h].join('|');
    if(el._shapeCacheKey===key&&el.image!==src)return;

    const off=document.createElement('canvas');off.width=Math.max(1,Math.round(w));off.height=Math.max(1,Math.round(h));
    const c=off.getContext('2d');
    if(el.shapeMode==='squircle'){
      const power=2.15+(Math.max(0,Math.min(100,el.shapeSmoothness))/100)*3.75;
      superellipsePath(c,0,0,off.width,off.height,power);
    }else{
      const designW=Math.max(1,el.baseWidth||off.width),scale=off.width/designW;
      roundedPath(c,0,0,off.width,off.height,(el.borderRadius??46)*scale);
    }
    c.clip();c.drawImage(src,0,0,off.width,off.height);
    el.image=off;el._shapeCacheKey=key;
  }

  function refreshAllShapes(){S.state.elements.forEach(ensureShapeImage);}

  const originalRender=S.render;
  S.render=function(){refreshAllShapes();return originalRender.apply(this,arguments);};

  const originalSyncInspector=S.syncInspectorUI;
  S.syncInspectorUI=function(){
    const result=originalSyncInspector.apply(this,arguments),el=S.getActiveElement();
    const mode=document.getElementById('shapeMode'),smooth=document.getElementById('shapeSmoothness'),value=document.getElementById('shapeSmoothnessValue'),controls=document.getElementById('squircleControls');
    if(el?.type==='image'&&mode){
      mode.value=el.shapeMode||'original';smooth.value=Number.isFinite(el.shapeSmoothness)?el.shapeSmoothness:58;value.textContent=`${smooth.value}%`;controls.style.display=mode.value==='squircle'?'block':'none';
    }
    return result;
  };

  function invalidateShape(el){if(!el)return;el._shapeCacheKey='';ensureShapeImage(el);S.render();S.syncInspectorUI();}

  function bindShapeControls(){
    const mode=document.getElementById('shapeMode'),smooth=document.getElementById('shapeSmoothness');
    mode?.addEventListener('change',()=>{
      const el=S.getActiveElement();if(el?.type!=='image')return;
      el.shapeMode=mode.value;
      if(el.shapeMode!=='original'&&S.getFrameDefinition(el.frame).kind!=='none')el.frame='none';
      invalidateShape(el);S.syncAllUI();S.saveState();
    });
    smooth?.addEventListener('input',()=>{
      const el=S.getActiveElement();if(el?.type!=='image')return;
      el.shapeSmoothness=+smooth.value;document.getElementById('shapeSmoothnessValue').textContent=`${smooth.value}%`;invalidateShape(el);
    });
    smooth?.addEventListener('change',()=>S.saveState());

    const radius=document.getElementById('borderRadiusSlider');
    radius?.addEventListener('input',()=>{const el=S.getActiveElement();if(el?.type==='image'&&el.shapeMode==='rounded')invalidateShape(el);});

    document.getElementById('deviceGrid')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-frame]'),el=S.getActiveElement();if(!btn||el?.type!=='image')return;
      if(S.getFrameDefinition(btn.dataset.frame).kind!=='none'&&el.shapeMode!=='original'){
        el.shapeMode='original';invalidateShape(el);S.syncInspectorUI();
      }
    });
  }

  function canvasToBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('تعذر تحويل الصورة.')),'image/png',1));}
  async function sourceToBlob(src){
    if(!src)throw new Error('مصدر صورة غير صالح.');
    if(src instanceof HTMLCanvasElement)return canvasToBlob(src);
    if(src.src?.startsWith('data:'))return (await fetch(src.src)).blob();
    const {w,h}=sourceDimensions(src),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(src,0,0,w,h);return canvasToBlob(c);
  }

  async function loadImageBlob(blob){
    const url=URL.createObjectURL(blob);
    try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('تعذر قراءة أحد أصول المشروع.'));img.src=url;});}
    finally{setTimeout(()=>URL.revokeObjectURL(url),0);}
  }

  function cleanElement(el){
    const out={};
    Object.entries(el).forEach(([k,v])=>{if(!['image','_sourceImage','_shapeCacheKey'].includes(k))out[k]=v;});
    return out;
  }

  S.exportProject=async()=>{
    try{
      S.showToast('جارٍ تجهيز ملف المشروع…');
      const zip=new JSZip(),assets=zip.folder('assets');
      const project={schemaVersion:PROJECT_SCHEMA,app:'StudioPro',createdAt:new Date().toISOString(),canvas:{...S.state.canvas},background:{...S.state.background,image:undefined},activeElementId:S.state.activeElementId,elements:[]};
      if(S.state.background.image){const name='background.png';assets.file(name,await sourceToBlob(S.state.background.image));project.background.imageAsset=`assets/${name}`;}
      let i=0;
      for(const el of S.state.elements){
        const data=cleanElement(el);
        if(el.type==='image'&&el.image){const name=`image_${++i}.png`;assets.file(name,await sourceToBlob(imageSource(el)));data.imageAsset=`assets/${name}`;}
        project.elements.push(data);
      }
      zip.file('project.json',JSON.stringify(project,null,2));
      const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`StudioPro_${new Date().toISOString().replace(/[:.]/g,'-')}${PROJECT_EXT}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);S.showToast('تم حفظ المشروع بكامل طبقاته وأصوله.');
    }catch(err){console.error(err);S.showToast(err.message||'تعذر حفظ المشروع.');}
  };

  S.importProject=async file=>{
    try{
      const zip=await JSZip.loadAsync(file),entry=zip.file('project.json');if(!entry)throw new Error('ملف المشروع لا يحتوي على project.json.');
      const data=JSON.parse(await entry.async('string'));if(!data||!data.canvas||!Array.isArray(data.elements))throw new Error('بنية ملف المشروع غير صالحة.');
      if((data.schemaVersion||1)>PROJECT_SCHEMA)throw new Error('هذا المشروع أُنشئ بإصدار أحدث من StudioPro.');
      const background={...data.background,image:null};
      if(data.background?.imageAsset){const f=zip.file(data.background.imageAsset);if(!f)throw new Error('صورة الخلفية مفقودة من المشروع.');background.image=await loadImageBlob(await f.async('blob'));}
      const elements=[];
      for(const item of data.elements){
        const el={...item,shadow:{...(item.shadow||S.makeShadow(item.type))}};
        delete el.imageAsset;
        if(item.type==='image'){
          const f=zip.file(item.imageAsset||'');if(!f)throw new Error(`أصل الصورة مفقود للطبقة: ${item.name||item.id}`);
          el.image=await loadImageBlob(await f.async('blob'));el._sourceImage=el.image;el._shapeCacheKey='';
        }
        S.ensureElementTransform(el);elements.push(el);
      }
      const restored={canvas:{width:+data.canvas.width||1080,height:+data.canvas.height||1920},background,elements,activeElementId:data.activeElementId&&elements.some(x=>x.id===data.activeElementId)?data.activeElementId:(elements.at(-1)?.id||null)};
      S.history.states=[];S.history.index=-1;S.restoreState(restored);refreshAllShapes();S.render();S.syncAllUI();S.saveState();S.fitCanvasToStage();S.showToast('تم استيراد المشروع واستعادة جميع الطبقات.');
    }catch(err){console.error(err);S.showToast(err.message||'تعذر استيراد المشروع.');}
  };

  function bindProjectControls(){
    document.getElementById('saveProjectBtn')?.addEventListener('click',()=>S.exportProject());
    const input=document.getElementById('projectInput');document.getElementById('loadProjectBtn')?.addEventListener('click',()=>input?.click());
    input?.addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(file)await S.importProject(file);});
  }

  injectUI();bindShapeControls();bindProjectControls();S.syncAllUI();
})();