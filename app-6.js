(() => {
  'use strict';
  const S=window.StudioPro,L=window.StudioProLocalization;
  const setCopy=(m,ok=false)=>{const e=document.getElementById('copyStatus');e.textContent=m;e.className='copy-status'+(ok?' success':'');};
  async function exportZip(){if(!L.parsed||!L.base||!L.valid.length)return;if(typeof JSZip==='undefined'){S.showToast('تعذر تحميل مكتبة ZIP. أعد تحميل الصفحة.');return;}const btn=document.getElementById('exportTranslationsBtn'),old=btn.textContent,active=S.state.activeElementId;btn.disabled=true;const zip=new JSZip(),folder=zip.folder('screenshots'),manifest={schema_version:1,generated_at:new Date().toISOString(),languages:L.valid,items:{}};L.base.forEach(b=>manifest.items[b.key]=b.content);try{S.state.activeElementId=null;for(let i=0;i<L.valid.length;i++){const code=L.valid[i];btn.textContent=`تصدير ${i+1}/${L.valid.length}…`;L.restoreBase(false);L.apply(code,false);S.render();await new Promise(requestAnimationFrame);folder.file(`${code}.png`,S.canvas.toDataURL('image/png',1).split(',')[1],{base64:true});}zip.file('translations.json',JSON.stringify({schema_version:1,translations:L.parsed},null,2));zip.file('manifest.json',JSON.stringify(manifest,null,2));const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}),url=URL.createObjectURL(blob),a=document.createElement('a');a.download=`StudioPro_localized_${new Date().toISOString().slice(0,10)}.zip`;a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);S.showToast(`تم إنشاء ${L.valid.length} صورة مترجمة.`);}catch(err){S.showToast(`فشل التصدير: ${err.message}`);}finally{L.restoreBase(false);S.state.activeElementId=active;S.render();S.syncAllUI();btn.disabled=false;btn.textContent=old;}}
  document.getElementById('selectAllLanguages').onclick=()=>document.querySelectorAll('#languageGrid input').forEach(x=>x.checked=true);
  document.getElementById('clearLanguages').onclick=()=>document.querySelectorAll('#languageGrid input').forEach(x=>x.checked=false);
  document.getElementById('copyLocalizationPrompt').onclick=()=>{try{const p=L.makePrompt(),ok=L.copyText(p);if(ok){setCopy('تم نسخ التعليمات. الصقها في نموذج الذكاء الاصطناعي.',true);S.showToast('تم نسخ تعليمات الترجمة.');}else{setCopy('تعذر النسخ التلقائي. انسخ التعليمات من النافذة.');window.prompt('انسخ التعليمات التالية:',p);}}catch(err){setCopy(err.message);S.showToast(err.message);}};
  document.getElementById('validateTranslations').onclick=()=>{const st=document.getElementById('translationStatus');try{const p=JSON.parse(L.strip(document.getElementById('translationJson').value));L.valid=L.validate(p);L.parsed=p.translations;L.captureBase();L.populate(L.valid);st.textContent=`الترجمة صحيحة: ${L.valid.length} لغة × ${S.getTextElements().length} نص.`;st.className='validation-status success';S.showToast('تم التحقق من بنية الترجمة بنجاح.');}catch(err){L.parsed=null;L.valid=[];L.populate([]);st.textContent=err.message;st.className='validation-status error';}};
  document.getElementById('applyPreviewLanguage').onclick=()=>{const c=document.getElementById('previewLanguage').value;if(c&&L.apply(c))S.showToast(`تم تطبيق ${L.name(c)} للمعاينة.`);};
  document.getElementById('restoreSourceText').onclick=()=>{if(!L.base){S.showToast('افحص JSON أولًا لإنشاء حالة النص الأصلية.');return;}L.restoreBase();S.showToast('تمت إعادة النصوص والأحجام الأصلية.');};
  document.getElementById('exportTranslationsBtn').onclick=exportZip;
})();

(() => {
  const initUnifiedColors=()=>{
    const S=window.StudioPro;
    if(!S)return;

    const PRESETS=[
      '#FFFFFF','#F8FAFC','#E5E7EB','#9CA3AF','#4B5563','#111827','#000000',
      '#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981',
      '#14B8A6','#06B6D4','#0EA5E9','#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899'
    ];
    const LABELS={solidColor:'لون الخلفية',textColor:'لون النص',frameColorPicker:'لون الإطار',shadowColor:'لون الظل'};
    const controls=new Map();
    let extractedPalette=[];

    const style=document.createElement('style');
    style.textContent=`
      .unified-source-color{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
      .unified-color-control{display:grid;gap:10px;margin-top:8px;padding:11px;border:1px solid var(--border);border-radius:12px;background:var(--panel-soft);grid-column:1/-1}
      .unified-color-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .unified-color-title{font-size:10px;font-weight:800;color:var(--text)}
      .unified-color-current{width:34px;height:34px;border-radius:9px;border:2px solid #fff;outline:1px solid var(--border);box-shadow:0 2px 7px rgba(17,24,39,.08)}
      .unified-color-entry{display:grid;grid-template-columns:48px minmax(0,1fr);gap:8px;direction:ltr;align-items:center}
      .unified-visual-picker{width:48px!important;height:40px!important;min-height:40px!important;padding:3px!important;border:1px solid var(--border)!important;border-radius:10px!important;background:#fff!important;cursor:pointer}
      .unified-hex-wrap{display:grid;grid-template-columns:auto 1fr;align-items:center;direction:ltr;min-height:40px;border:1px solid var(--border);border-radius:10px;background:#fff;padding-inline:10px}
      .unified-hex-wrap span{font-size:12px;font-weight:800;color:var(--muted)}
      .unified-hex{min-height:36px!important;border:0!important;outline:0!important;padding:0 4px!important;direction:ltr!important;text-align:left!important;text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:800}
      .unified-color-section{display:grid;gap:7px}
      .unified-color-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:9px;font-weight:800;color:var(--muted)}
      .unified-color-section-head button{border:0;background:transparent;color:var(--accent-strong);font:inherit;cursor:pointer;padding:3px}
      .unified-palette{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:6px}
      .unified-swatch{aspect-ratio:1;border-radius:8px;border:2px solid #fff;outline:1px solid var(--border);cursor:pointer;min-width:0;box-shadow:0 1px 5px rgba(17,24,39,.07);transition:.12s ease}
      .unified-swatch:hover{transform:translateY(-1px) scale(1.04);outline-color:var(--accent)}
      .unified-swatch.active{outline:2px solid var(--accent);outline-offset:1px}
      .unified-extracted-empty{grid-column:1/-1;padding:7px 0;color:var(--muted);font-size:9px;line-height:1.55}
      @media(max-width:780px){.unified-palette{grid-template-columns:repeat(8,minmax(0,1fr))}.unified-color-control{padding:10px}.unified-visual-picker{height:44px!important}.unified-color-entry{grid-template-columns:52px minmax(0,1fr)}}
      @media(max-width:390px){.unified-palette{grid-template-columns:repeat(7,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);

    const normalizeHex=value=>{
      let v=String(value||'').trim().replace(/^#/,'');
      if(/^[0-9a-f]{3}$/i.test(v))v=v.split('').map(c=>c+c).join('');
      return /^[0-9a-f]{6}$/i.test(v)?`#${v.toUpperCase()}`:null;
    };
    const rgbHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
    const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

    const findImage=()=>{
      const active=S.getActiveElement?.();
      if(active?.type==='image'&&active.image)return active.image;
      const item=[...(S.state?.elements||[])].filter(x=>x.type==='image'&&x.image).sort((a,b)=>(b.baseWidth||0)*(b.baseHeight||0)-(a.baseWidth||0)*(a.baseHeight||0))[0];
      return item?.image||null;
    };

    const extractColors=()=>{
      const img=findImage();
      if(!img)throw new Error('أضف صورة أولًا لاستخراج الألوان منها.');
      const off=document.createElement('canvas');off.width=off.height=80;
      const c=off.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,80,80);c.drawImage(img,0,0,80,80);
      const data=c.getImageData(0,0,80,80).data,buckets=new Map();let ar=0,ag=0,ab=0,n=0;
      for(let i=0;i<data.length;i+=4){
        if(data[i+3]<80)continue;
        const r=data[i],g=data[i+1],b=data[i+2];ar+=r;ag+=g;ab+=b;n++;
        const qr=Math.min(255,(r>>5)*32+16),qg=Math.min(255,(g>>5)*32+16),qb=Math.min(255,(b>>5)*32+16),key=`${qr},${qg},${qb}`;
        buckets.set(key,(buckets.get(key)||0)+1);
      }
      if(!n)throw new Error('تعذر قراءة ألوان الصورة.');
      const picked=[[ar/n,ag/n,ab/n]],sorted=[...buckets.entries()].sort((a,b)=>b[1]-a[1]);
      for(const [key] of sorted){
        const rgb=key.split(',').map(Number),mx=Math.max(...rgb),mn=Math.min(...rgb);
        if(mx>250&&mn>242)continue;
        if(picked.every(x=>dist(x,rgb)>52)){picked.push(rgb);if(picked.length>=8)break;}
      }
      return picked.slice(0,8).map(x=>rgbHex(...x));
    };

    const renderSwatches=(box,colors,current,onPick,emptyText)=>{
      box.innerHTML='';
      if(!colors.length){const e=document.createElement('div');e.className='unified-extracted-empty';e.textContent=emptyText;box.appendChild(e);return;}
      colors.forEach(color=>{const b=document.createElement('button');b.type='button';b.className='unified-swatch';b.style.background=color;b.title=color;b.classList.toggle('active',color.toUpperCase()===String(current||'').toUpperCase());b.onclick=()=>onPick(color);box.appendChild(b);});
    };

    const applyColor=(source,color)=>{
      const hex=normalizeHex(color);if(!hex)return false;
      source.value=hex;
      source.dispatchEvent(new Event('input',{bubbles:true}));
      source.dispatchEvent(new Event('change',{bubbles:true}));
      syncControl(source);
      return true;
    };

    const syncControl=source=>{
      const c=controls.get(source);if(!c)return;
      const color=normalizeHex(source.value)||'#111827';
      c.visual.value=color;c.hex.value=color.slice(1);c.current.style.background=color;
      renderSwatches(c.presets,PRESETS,color,x=>applyColor(source,x),'');
      renderSwatches(c.extracted,extractedPalette,color,x=>applyColor(source,x),'اضغط «استخراج من الصورة» لإنشاء لوحة ألوان من لقطة الشاشة.');
    };

    const extractForAll=()=>{
      try{
        extractedPalette=extractColors();
        controls.forEach((_,source)=>syncControl(source));
        S.showToast?.('تم استخراج لوحة الألوان وأصبحت متاحة في جميع منتقيات اللون.');
      }catch(err){S.showToast?.(err.message);}
    };

    const hideLegacyColorUI=()=>{
      ['textColorHex','frameColorHex','shadowColorHex'].forEach(id=>{
        const old=document.getElementById(id);if(!old)return;
        const row=old.closest('.hex-color-row');if(row){const prev=row.previousElementSibling;if(prev?.classList.contains('field-label')&&/HEX|شفرة/.test(prev.textContent||''))prev.hidden=true;row.hidden=true;}
      });
      ['textPalette','imagePalette'].forEach(id=>{const p=document.getElementById(id);const tools=p?.closest('.palette-tools');if(tools){const note=tools.nextElementSibling;if(note?.classList.contains('context-note'))note.hidden=true;tools.hidden=true;}});
      const oldSolidHex=document.getElementById('solidHex');if(oldSolidHex)oldSolidHex.hidden=true;
    };

    const createControl=source=>{
      if(!source||source.dataset.unifiedColor==='1')return;
      source.dataset.unifiedColor='1';source.classList.add('unified-source-color');
      const wrap=document.createElement('div');wrap.className='unified-color-control';wrap.dataset.for=source.id;
      wrap.innerHTML=`
        <div class="unified-color-head"><span class="unified-color-title">${LABELS[source.id]||'اختيار اللون'}</span><span class="unified-color-current"></span></div>
        <div class="unified-color-entry"><input class="unified-visual-picker" type="color"><div class="unified-hex-wrap"><span>#</span><input class="unified-hex" type="text" maxlength="6" inputmode="text" autocomplete="off" spellcheck="false"></div></div>
        <div class="unified-color-section"><div class="unified-color-section-head"><span>ألوان جاهزة</span></div><div class="unified-palette unified-presets"></div></div>
        <div class="unified-color-section"><div class="unified-color-section-head"><span>ألوان من الصورة</span><button type="button" class="unified-extract">استخراج من الصورة</button></div><div class="unified-palette unified-extracted"></div></div>
      `;
      const anchor=source.id==='solidColor'?(source.closest('.color-field')||source):(source.closest('label')||source);
      if(source.id==='solidColor'&&anchor!==source){anchor.hidden=true;anchor.insertAdjacentElement('afterend',wrap);}else anchor.insertAdjacentElement('afterend',wrap);
      const c={wrap,visual:wrap.querySelector('.unified-visual-picker'),hex:wrap.querySelector('.unified-hex'),current:wrap.querySelector('.unified-color-current'),presets:wrap.querySelector('.unified-presets'),extracted:wrap.querySelector('.unified-extracted')};
      controls.set(source,c);
      c.visual.addEventListener('input',e=>applyColor(source,e.target.value));
      c.hex.addEventListener('change',()=>{if(!applyColor(source,c.hex.value)){c.hex.value=(normalizeHex(source.value)||'#111827').slice(1);S.showToast?.('أدخل لون HEX صحيحًا مثل 5B5CE2.');}});
      c.hex.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();c.hex.blur();}});
      wrap.querySelector('.unified-extract').addEventListener('click',extractForAll);
      source.addEventListener('input',()=>syncControl(source));source.addEventListener('change',()=>syncControl(source));
      syncControl(source);
    };

    hideLegacyColorUI();
    document.querySelectorAll('input[type="color"]').forEach(createControl);

    const oldInspector=S.syncInspectorUI?.bind(S);
    if(oldInspector)S.syncInspectorUI=()=>{oldInspector();controls.forEach((_,source)=>syncControl(source));};
    const oldBackground=S.syncBackgroundUI?.bind(S);
    if(oldBackground)S.syncBackgroundUI=()=>{oldBackground();controls.forEach((_,source)=>syncControl(source));};
    controls.forEach((_,source)=>syncControl(source));
  };

  const transform=document.createElement('script');
  transform.src='transform-enhancements.js?v=20260814-2';
  transform.onload=()=>{
    const properties=document.createElement('script');
    properties.src='property-enhancements.js?v=20260814-1';
    properties.onload=()=>{
      const rounded=document.createElement('script');
      rounded.src='rounded-border-enhancements.js?v=20260814-1';
      rounded.onload=initUnifiedColors;
      document.body.appendChild(rounded);
    };
    document.body.appendChild(properties);
  };
  document.body.appendChild(transform);
})();
