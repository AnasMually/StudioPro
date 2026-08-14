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
  const script=document.createElement('script');
  script.src='transform-enhancements.js?v=20260814-1';
  script.defer=true;
  document.body.appendChild(script);
})();
