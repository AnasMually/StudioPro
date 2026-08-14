(() => {
  'use strict';

  const S = window.StudioPro;
  if (!S || !S.canvas || !S.ctx) return;
  const { canvas, ctx, state, viewState } = S;

  const style = document.createElement('style');
  style.textContent = `
    .context-style-card{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--panel-soft)}
    .context-style-card[hidden]{display:none!important}
    .format-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
    .format-btn{min-height:38px;border:1px solid var(--border);border-radius:9px;background:#fff;color:var(--muted);font-weight:800;cursor:pointer}
    .format-btn.active{border-color:rgba(91,92,226,.45);background:var(--accent-soft);color:var(--accent-strong)}
    .format-btn.italic{font-style:italic}
    .align-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .align-grid .format-btn{font-size:11px}
    .hex-color-row{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:8px;direction:ltr;align-items:center}
    .hex-color-row input[type=text]{direction:ltr;text-align:center;text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:700}
    .hex-preview{width:42px;height:38px;border:1px solid var(--border);border-radius:10px;background:#111827}
    .palette-tools{display:grid;gap:8px;padding-top:2px}
    .palette-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .palette-head select{width:auto;min-width:110px;min-height:34px;padding:5px 8px;font-size:10px}
    .palette-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;min-height:34px}
    .palette-swatch{aspect-ratio:1;border-radius:9px;border:2px solid #fff;outline:1px solid var(--border);cursor:pointer;box-shadow:0 2px 8px rgba(31,41,55,.08)}
    .palette-swatch:hover{transform:translateY(-1px);outline-color:var(--accent)}
    .palette-empty{grid-column:1/-1;color:var(--muted);font-size:9px;line-height:1.6}
    .line-height-row{display:grid;grid-template-columns:1fr 46px;gap:8px;align-items:center}
    .line-height-value{text-align:center;color:var(--muted);font-size:10px;font-weight:800;direction:ltr}
    .context-note{color:var(--muted);font-size:9px;line-height:1.65}
    .inspector-content[data-element-type="text"] #imageInspector{display:none!important}
    .inspector-content[data-element-type="image"] #textInspector{display:none!important}
    @media(max-width:780px){.palette-grid{grid-template-columns:repeat(6,1fr)}.format-btn{min-height:42px}.context-style-card{padding:11px}}
    @media(max-width:390px){.palette-grid{grid-template-columns:repeat(5,1fr)}}
  `;
  document.head.appendChild(style);

  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const normalizeHex = value => {
    let v=String(value||'').trim();
    if(!v.startsWith('#'))v='#'+v;
    if(/^#[0-9a-f]{3}$/i.test(v))v='#'+v.slice(1).split('').map(c=>c+c).join('');
    return /^#[0-9a-f]{6}$/i.test(v)?v.toUpperCase():null;
  };
  const rgbHex=(r,g,b)=>'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

  const ensureTextStyle = el => {
    if(!el||el.type!=='text')return el;
    if(!Number.isFinite(el.fontWeight))el.fontWeight=700;
    el.fontWeight=clamp(Math.round(el.fontWeight/100)*100,400,800);
    if(typeof el.italic!=='boolean')el.italic=false;
    if(!['left','center','right'].includes(el.textAlign))el.textAlign='center';
    if(!Number.isFinite(el.lineHeight))el.lineHeight=1.25;
    el.lineHeight=clamp(el.lineHeight,.8,2.2);
    return el;
  };

  const fontSpec=(el,size=el.fontSize)=>`${el.italic?'italic ':''}${el.fontWeight||700} ${Math.max(1,size||1)}px 'Cairo',system-ui,sans-serif`;

  S.state.elements.forEach(ensureTextStyle);

  S.getTextMetrics = (el,fontSize=el.fontSize) => {
    ensureTextStyle(el);
    const fs=Math.max(1,Number(fontSize)||1);
    ctx.save();ctx.font=fontSpec(el,fs);
    const lines=String(el.content||'').split('\n');
    const width=Math.max(1,...lines.map(line=>ctx.measureText(line||' ').width));
    const lineHeight=fs*(el.lineHeight||1.25);
    ctx.restore();
    return {lines,width,height:Math.max(lineHeight,lines.length*lineHeight),lineHeight};
  };

  const applyShadow = el => {
    const sh=el.shadow||{};
    if(!sh.enabled||sh.opacity<=0||sh.blur<=0){ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;return;}
    ctx.shadowColor=S.rgba(sh.color||'#111827',sh.opacity??30);
    ctx.shadowBlur=sh.blur||0;ctx.shadowOffsetX=sh.x||0;ctx.shadowOffsetY=sh.y||0;
  };

  const drawStyledText = el => {
    ensureTextStyle(el);
    const m=S.getTextMetrics(el),align=el.textAlign||'center';
    ctx.font=fontSpec(el);ctx.fillStyle=el.color||'#111827';ctx.textBaseline='middle';ctx.textAlign=align;ctx.direction=S.detectDirection(el.content);
    applyShadow(el);
    const x=align==='left'?-m.width/2:align==='right'?m.width/2:0;
    m.lines.forEach((line,i)=>ctx.fillText(line,x,i*m.lineHeight-(m.lines.length-1)*m.lineHeight/2));
    ctx.shadowColor='transparent';
  };

  const baseRender=S.render.bind(S);
  S.render=()=>{
    const texts=S.getTextElements(),saved=texts.map(el=>({el,content:el.content})),show=viewState.showSelection;
    viewState.showSelection=false;
    saved.forEach(x=>x.el.content='');
    try{baseRender();}finally{saved.forEach(x=>x.el.content=x.content);viewState.showSelection=show;}
    texts.forEach(el=>{
      ensureTextStyle(el);S.ensureElementTransform(el);
      const sc=S.getScales(el);
      ctx.save();ctx.translate(canvas.width/2+el.x,canvas.height/2+el.y);ctx.rotate((el.rotation||0)*Math.PI/180);ctx.scale(sc.x,sc.y);drawStyledText(el);ctx.restore();
    });
    S.drawSelectionOverlay?.(S.getActiveElement());
    document.getElementById('emptyState')?.classList.toggle('hidden',state.elements.length>0);
  };

  const textInspector=document.getElementById('textInspector');
  const imageInspector=document.getElementById('imageInspector');
  const inspectorContent=document.getElementById('inspectorContent');

  let textExtra=null,imageExtra=null;
  if(textInspector){
    textExtra=document.createElement('div');textExtra.className='context-style-card';
    textExtra.innerHTML=`
      <div class="group-title">تنسيق النص</div>
      <div class="format-grid" id="textWeightGroup">
        <button type="button" class="format-btn" data-weight="400">Regular</button>
        <button type="button" class="format-btn" data-weight="600">Semi</button>
        <button type="button" class="format-btn" data-weight="700">Bold</button>
        <button type="button" class="format-btn" data-weight="800">Extra</button>
      </div>
      <button type="button" class="format-btn italic" id="textItalicBtn"><strong>I</strong> Italic</button>
      <div class="align-grid" id="textAlignGroup">
        <button type="button" class="format-btn" data-align="right">يمين</button>
        <button type="button" class="format-btn" data-align="center">وسط</button>
        <button type="button" class="format-btn" data-align="left">يسار</button>
      </div>
      <label class="field-label">تباعد الأسطر</label>
      <div class="line-height-row"><input type="range" id="textLineHeight" min="80" max="220" step="5" value="125"><span class="line-height-value" id="textLineHeightValue">1.25×</span></div>
      <label class="field-label">لون النص بالشفرة HEX</label>
      <div class="hex-color-row"><input type="text" id="textColorHex" value="#111827" maxlength="7"><span class="hex-preview" id="textColorHexPreview"></span></div>
      <div class="palette-tools">
        <div class="palette-head"><button type="button" class="btn btn-secondary compact" id="extractTextPalette">ألوان من الصورة</button><select id="textPaletteTarget"><option value="primary">لون النص</option><option value="shadow">لون الظل</option></select></div>
        <div class="palette-grid" id="textPalette"><div class="palette-empty">استخرج لوحة ألوان من لقطة الشاشة ثم اختر لونًا بنقرة واحدة.</div></div>
      </div>
      <div class="context-note">يستخدم اللون المتوسط للصورة مع أبرز الألوان الموجودة فيها. إذا كان التصميم يحتوي عدة صور، تُستخدم أكبر صورة كمرجع.</div>
    `;
    const anchor=textInspector.querySelector('.switch-row')||textInspector.lastElementChild;
    anchor?.insertAdjacentElement('beforebegin',textExtra);
  }

  if(imageInspector){
    imageExtra=document.createElement('div');imageExtra.className='context-style-card';
    imageExtra.innerHTML=`
      <div class="group-title">ألوان الصورة والإطار</div>
      <label class="field-label">لون الإطار بالشفرة HEX</label>
      <div class="hex-color-row"><input type="text" id="frameColorHex" value="#111827" maxlength="7"><span class="hex-preview" id="frameColorHexPreview"></span></div>
      <div class="palette-tools">
        <div class="palette-head"><button type="button" class="btn btn-secondary compact" id="extractImagePalette">استخراج الألوان</button><select id="imagePaletteTarget"><option value="primary">لون الإطار</option><option value="shadow">لون الظل</option></select></div>
        <div class="palette-grid" id="imagePalette"><div class="palette-empty">استخرج الألوان من الصورة المحددة ثم اختر اللون الذي تريده.</div></div>
      </div>
    `;
    imageInspector.appendChild(imageExtra);
  }

  const shadowColor=document.getElementById('shadowColor');
  let shadowHex=null;
  if(shadowColor){
    shadowHex=document.createElement('div');shadowHex.className='hex-color-row';shadowHex.innerHTML='<input type="text" id="shadowColorHex" value="#111827" maxlength="7"><span class="hex-preview" id="shadowColorHexPreview"></span>';
    shadowColor.insertAdjacentElement('afterend',shadowHex);
  }

  const setPreview=(id,color)=>{const e=document.getElementById(id);if(e)e.style.background=color;};
  const renderPalette=(containerId,colors,targetSelectId)=>{
    const box=document.getElementById(containerId);if(!box)return;box.innerHTML='';
    colors.forEach((color,i)=>{const b=document.createElement('button');b.type='button';b.className='palette-swatch';b.style.background=color;b.title=(i===0?'اللون المتوسط: ':'لون بارز: ')+color;b.dataset.color=color;b.onclick=()=>applyPaletteColor(color,targetSelectId);box.appendChild(b);});
  };

  const findSourceImage=()=>{
    const active=S.getActiveElement();if(active?.type==='image'&&active.image)return active;
    return [...state.elements].filter(x=>x.type==='image'&&x.image).sort((a,b)=>(b.baseWidth||0)*(b.baseHeight||0)-(a.baseWidth||0)*(a.baseHeight||0))[0]||null;
  };

  const extractPalette=el=>{
    const img=el?.image;if(!img)throw new Error('لا توجد صورة لاستخراج الألوان منها.');
    const off=document.createElement('canvas');off.width=off.height=72;
    const c=off.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,72,72);c.drawImage(img,0,0,72,72);
    const d=c.getImageData(0,0,72,72).data,buckets=new Map();let ar=0,ag=0,ab=0,count=0;
    for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<80)continue;const r=d[i],g=d[i+1],b=d[i+2];ar+=r;ag+=g;ab+=b;count++;const qr=Math.min(255,(r>>5)*32+16),qg=Math.min(255,(g>>5)*32+16),qb=Math.min(255,(b>>5)*32+16),key=`${qr},${qg},${qb}`;buckets.set(key,(buckets.get(key)||0)+1);}
    if(!count)throw new Error('تعذر قراءة ألوان الصورة.');
    const colors=[[ar/count,ag/count,ab/count]],sorted=[...buckets.entries()].sort((a,b)=>b[1]-a[1]);
    for(const [key] of sorted){const rgb=key.split(',').map(Number),mx=Math.max(...rgb),mn=Math.min(...rgb);if(mx>248&&mn>240)continue;if(mx<20)continue;if(colors.every(x=>distance(x,rgb)>58)){colors.push(rgb);if(colors.length>=6)break;}}
    while(colors.length<6&&sorted.length){const rgb=sorted.shift()[0].split(',').map(Number);if(colors.every(x=>distance(x,rgb)>28))colors.push(rgb);else if(!sorted.length)break;}
    return colors.slice(0,6).map(x=>rgbHex(...x));
  };

  const applyPaletteColor=(color,targetSelectId)=>{
    const el=S.getActiveElement();if(!el)return;const target=document.getElementById(targetSelectId)?.value||'primary';
    if(target==='shadow'){el.shadow=el.shadow||S.makeShadow(el.type);el.shadow.color=color;el.shadow.enabled=true;}
    else if(el.type==='text')el.color=color;
    else if(el.type==='image')el.frameColor=color;
    S.render();S.syncInspectorUI?.();S.saveState();
  };

  const doExtract=(container,target)=>{try{const source=findSourceImage(),colors=extractPalette(source);renderPalette(container,colors,target);S.showToast('تم استخراج لوحة الألوان من الصورة.');}catch(err){S.showToast(err.message);}};
  document.getElementById('extractTextPalette')?.addEventListener('click',()=>doExtract('textPalette','textPaletteTarget'));
  document.getElementById('extractImagePalette')?.addEventListener('click',()=>doExtract('imagePalette','imagePaletteTarget'));

  const applyTextStyle=(fn,save=true)=>{const el=S.getActiveElement();if(!el||el.type!=='text')return;ensureTextStyle(el);fn(el);S.render();S.syncInspectorUI?.();if(save)S.saveState();};
  document.getElementById('textWeightGroup')?.addEventListener('click',e=>{const b=e.target.closest('[data-weight]');if(b)applyTextStyle(el=>el.fontWeight=Number(b.dataset.weight));});
  document.getElementById('textItalicBtn')?.addEventListener('click',()=>applyTextStyle(el=>el.italic=!el.italic));
  document.getElementById('textAlignGroup')?.addEventListener('click',e=>{const b=e.target.closest('[data-align]');if(b)applyTextStyle(el=>el.textAlign=b.dataset.align);});
  document.getElementById('textLineHeight')?.addEventListener('input',e=>applyTextStyle(el=>el.lineHeight=clamp(Number(e.target.value)/100,.8,2.2),false));
  document.getElementById('textLineHeight')?.addEventListener('change',()=>{const el=S.getActiveElement();if(el?.type==='text')S.saveState();});

  const bindHex=(inputId,getColor,setColor,previewId)=>{
    const input=document.getElementById(inputId);if(!input)return;
    input.addEventListener('change',()=>{const el=S.getActiveElement(),hex=normalizeHex(input.value);if(!el||!hex){input.value=getColor(el)||'#111827';S.showToast('اكتب لونًا صحيحًا مثل #5B5CE2');return;}setColor(el,hex);input.value=hex;setPreview(previewId,hex);S.render();S.syncInspectorUI?.();S.saveState();});
  };
  bindHex('textColorHex',el=>el?.color, (el,c)=>{if(el?.type==='text')el.color=c;},'textColorHexPreview');
  bindHex('frameColorHex',el=>el?.frameColor,(el,c)=>{if(el?.type==='image')el.frameColor=c;},'frameColorHexPreview');
  bindHex('shadowColorHex',el=>el?.shadow?.color,(el,c)=>{if(el){el.shadow=el.shadow||S.makeShadow(el.type);el.shadow.color=c;}},'shadowColorHexPreview');

  document.getElementById('textColor')?.addEventListener('input',e=>{const h=document.getElementById('textColorHex');if(h)h.value=e.target.value.toUpperCase();setPreview('textColorHexPreview',e.target.value);});
  document.getElementById('frameColorPicker')?.addEventListener('input',e=>{const h=document.getElementById('frameColorHex');if(h)h.value=e.target.value.toUpperCase();setPreview('frameColorHexPreview',e.target.value);});
  shadowColor?.addEventListener('input',e=>{const h=document.getElementById('shadowColorHex');if(h)h.value=e.target.value.toUpperCase();setPreview('shadowColorHexPreview',e.target.value);});

  const oldSync=S.syncInspectorUI?.bind(S);
  if(oldSync){
    S.syncInspectorUI=()=>{
      oldSync();
      const el=S.getActiveElement();
      if(inspectorContent)inspectorContent.dataset.elementType=el?.type||'';
      if(!el)return;
      if(el.type==='text'){
        ensureTextStyle(el);
        document.querySelectorAll('#textWeightGroup [data-weight]').forEach(b=>b.classList.toggle('active',Number(b.dataset.weight)===el.fontWeight));
        document.getElementById('textItalicBtn')?.classList.toggle('active',!!el.italic);
        document.querySelectorAll('#textAlignGroup [data-align]').forEach(b=>b.classList.toggle('active',b.dataset.align===el.textAlign));
        const lh=document.getElementById('textLineHeight');if(lh)lh.value=Math.round(el.lineHeight*100);
        const lhv=document.getElementById('textLineHeightValue');if(lhv)lhv.textContent=`${el.lineHeight.toFixed(2)}×`;
        const hex=normalizeHex(el.color)||'#111827',h=document.getElementById('textColorHex');if(h)h.value=hex;setPreview('textColorHexPreview',hex);
        document.getElementById('activeElementType').textContent='خصائص النص';
      }else if(el.type==='image'){
        const hex=normalizeHex(el.frameColor)||'#111827',h=document.getElementById('frameColorHex');if(h)h.value=hex;setPreview('frameColorHexPreview',hex);
        document.getElementById('activeElementType').textContent='خصائص الصورة';
      }
      const sh=normalizeHex(el.shadow?.color)||'#111827',shx=document.getElementById('shadowColorHex');if(shx)shx.value=sh;setPreview('shadowColorHexPreview',sh);
    };
  }

  S.syncInspectorUI?.();
  S.render();
})();
