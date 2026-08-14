(() => {
  'use strict';
  const S=window.StudioPro;
  const codes=['ar','en','zh-CN','es','hi'];
  const rtl=new Set(['ar']);
  const files=['lang-ar.js','lang-en.js','lang-zh-CN.js','lang-es.js','lang-hi.js'];
  const css=document.createElement('link');css.rel='stylesheet';css.href='site-preferences.css?v=20260815-1';document.head.appendChild(css);
  const load=src=>new Promise(r=>{const s=document.createElement('script');s.src=src+'?v=20260815-1';s.onload=s.onerror=r;document.head.appendChild(s)});
  Promise.all(files.map(load)).then(init);

  function init(){
    const locales=window.StudioProSiteLocales||{};
    const normalize=v=>{v=String(v||'').replace('_','-').toLowerCase();if(v.startsWith('ar'))return'ar';if(v.startsWith('en'))return'en';if(v.startsWith('zh'))return'zh-CN';if(v.startsWith('es'))return'es';if(v.startsWith('hi'))return'hi';return null};
    const saved=localStorage.getItem('studiopro-language');
    let lang=codes.includes(saved)?saved:(navigator.languages||[navigator.language]).map(normalize).find(Boolean)||'ar';
    const t=k=>(locales[lang]&&locales[lang][k])||(locales.ar&&locales.ar[k])||k;

    const prefs=document.createElement('div');prefs.className='site-preferences';prefs.innerHTML='<select class="site-language" id="siteLanguage"><option value="ar">العربية</option><option value="en">English</option><option value="zh-CN">简体中文</option><option value="es">Español</option><option value="hi">हिन्दी</option></select><button class="site-theme-btn" id="siteTheme" type="button">☾</button>';
    document.querySelector('.top-actions')?.prepend(prefs);
    const select=prefs.querySelector('#siteLanguage'),theme=prefs.querySelector('#siteTheme');select.value=lang;

    const text=(sel,key)=>document.querySelectorAll(sel).forEach(e=>{const v=t(key);if(e.textContent!==v)e.textContent=v});
    const direct=(sel,key)=>document.querySelectorAll(sel).forEach(e=>{const v=t(key),n=[...e.childNodes].find(x=>x.nodeType===3&&x.textContent.trim());if(n){if(n.textContent!==v)n.textContent=v}else e.insertBefore(document.createTextNode(v),e.firstChild)});
    const attr=(sel,a,key)=>document.querySelectorAll(sel).forEach(e=>{const v=t(key);if(e.getAttribute(a)!==v)e.setAttribute(a,v)});

    function unified(){
      const by={solidColor:'backgroundColor',textColor:'textColor',frameColorPicker:'chooseFrameColor',shadowColor:'chooseShadowColor'};
      document.querySelectorAll('.unified-color-control').forEach(c=>{
        const ttl=c.querySelector('.unified-color-title');if(ttl){const v=t(by[c.dataset.for]||'color');if(ttl.textContent!==v)ttl.textContent=v}
        const s=c.querySelectorAll('.unified-color-section');
        if(s[0]){const x=s[0].querySelector('.unified-color-section-head span');if(x&&x.textContent!==t('presetColors'))x.textContent=t('presetColors')}
        if(s[1]){const x=s[1].querySelector('.unified-color-section-head span'),b=s[1].querySelector('.unified-extract'),e=s[1].querySelector('.unified-extracted-empty');if(x&&x.textContent!==t('imageColors'))x.textContent=t('imageColors');if(b&&b.textContent!==t('extractFromImage'))b.textContent=t('extractFromImage');if(e&&e.textContent!==t('extractedEmpty'))e.textContent=t('extractedEmpty')}
      })
    }

    function translate(){
      document.documentElement.lang=lang;document.documentElement.dir=rtl.has(lang)?'rtl':'ltr';document.title=t('title');select.value=lang;
      [
        ['#exportBtn','exportPng'],['.panel-tab[data-panel="design"]','design'],['.panel-tab[data-panel="background"]','background'],['.panel-tab[data-panel="elements"]','elements'],['.panel-tab[data-panel="localization"]','localization'],
        ['.mobile-tool[data-mobile-panel="design"] small','design'],['.mobile-tool[data-mobile-panel="background"] small','background'],['.mobile-tool[data-mobile-panel="elements"] small','elements'],['.mobile-tool[data-mobile-panel="localization"] small','localization'],['.mobile-tool[data-mobile-panel="inspector"] small','properties'],
        ['#addImageBtn span:last-child','addImage'],['#addTextBtn span:last-child','addText'],['.preset-btn[data-size="1080x1920"] span','portrait'],['.preset-btn[data-size="1920x1080"] span','landscape'],['.preset-btn[data-size="1080x1080"] span','square'],['[data-section="design"] .advanced-block summary','customSize'],['#applyCustomSize','applySize'],['#zoomReset','fit'],
        ['[data-section="background"] .section-title-row .section-title','professionalBackgrounds'],['[data-section="background"] .section-title-row .section-help','backgroundHelp'],['#smartBgBtn','fromImage'],['#bgImageBtn','chooseBackgroundImage'],
        ['[data-section="elements"] .section-title','elements'],['[data-section="elements"] .section-help','elementsHelp'],['#elementsList .section-help.prominent','noElements'],
        ['[data-section="localization"]>.section-title','localizationExport'],['[data-section="localization"]>.section-help.prominent','localizationHelp'],['[data-section="localization"] .advanced-block summary','translationLanguages'],['#selectAllLanguages','selectAll'],['#clearLanguages','clearAll'],['#copyLocalizationPrompt','copyPrompt'],['label[for="translationJson"]','pasteJson'],['#validateTranslations','validateTranslation'],['#restoreSourceText','restoreSource'],['#previewLanguage option[value=""]','previewLanguage'],['#applyPreviewLanguage','apply'],['#exportTranslationsBtn','exportAllZip'],
        ['#centerElementBtn','center'],['#fitElementBtn','fitElement'],['#emptyState strong','startScreenshot'],['#emptyState span','emptyHelp'],['#emptyAddImage','addImage'],['#inspectorPanel .panel-head strong','elementProperties'],['#inspectorEmpty strong','noSelection'],['#inspectorEmpty span','noSelectionHelp'],
        ['#textInspector>.field-label:first-child','text'],['#textInspector .inline-stepper span','fontSize'],['#textInspector .switch-row>span','autoFit'],['#textInspector>.field-label:last-of-type','translationId'],['#imageInspector>.field-label:first-child','phoneFrame'],['.inspector-group>.group-title','positionSize'],['.aspect-switch strong','keepAspect'],['.aspect-switch small','keepAspectHelp'],['.gesture-hint','gestureHelp'],['#centerXBtn','centerH'],['#centerYBtn','centerV'],['.shadow-group .group-title','shadow'],['.shadow-group .section-help','shadowHelp'],['#shadowControls>.field-label','shadowColor'],
        ['#textInspector .context-style-card .group-title','textFormatting'],['#textAlignGroup [data-align="right"]','alignRight'],['#textAlignGroup [data-align="center"]','alignCenter'],['#textAlignGroup [data-align="left"]','alignLeft'],['#rotationReset','rotationReset'],['.frame-scale-wrap .field-label','frameThickness'],['.frame-scale-note','frameThicknessHelp'],['.rounded-border-control .field-label','roundedThickness'],['.rounded-border-note','roundedThicknessHelp'],['#deviceGrid [data-frame="none"] .frame-label','noFrame'],['#deviceGrid [data-frame="rounded"] .frame-label','softFrame'],['.desktop-fit-btn','fit']
      ].forEach(x=>text(...x));

      const d=document.querySelectorAll('[data-section="design"]>.section-title');[['content',0],['designSize',1],['workspaceView',2]].forEach(([k,i])=>{if(d[i]&&d[i].textContent!==t(k))d[i].textContent=t(k)});
      const b=document.querySelectorAll('[data-section="background"]>.section-title');[['customColor',0],['imageBackground',1]].forEach(([k,i])=>{if(b[i]&&b[i].textContent!==t(k))b[i].textContent=t(k)});
      const activeSection=document.querySelector('.tool-section.active')?.dataset.section||'design',mt=document.getElementById('mobilePanelTitle'),mk={design:'design',background:'background',elements:'elements',localization:'localization'}[activeSection]||'design';if(mt&&mt.textContent!==t(mk))mt.textContent=t(mk);
      const ae=document.getElementById('activeElementType'),el=S?.getActiveElement?.();if(ae){const k=el?.type==='text'?'text':el?.type==='image'?'image':'element';if(ae.textContent!==t(k))ae.textContent=t(k)}
      [['label:has(#customWidth)','width'],['label:has(#customHeight)','height'],['label:has(#bgBlur)','blur'],['label:has(#bgOverlay)','dim'],['label:has(#fontSize)','fontSize'],['label:has(#textColor)','color'],['label:has(#borderRadiusSlider)','cornerRadius'],['label:has(#frameColorPicker)','frameColor'],['label:has(#elementScaleX)','width'],['label:has(#elementScaleY)','height'],['label:has(#elementRotation)','rotation'],['label:has(#shadowBlur)','softness'],['label:has(#shadowOpacity)','opacity'],['label:has(#shadowX)','horizontal'],['label:has(#shadowY)','vertical']].forEach(x=>direct(...x));
      [['400','regular'],['600','semi'],['700','bold'],['800','extra']].forEach(([w,k])=>text('#textWeightGroup [data-weight="'+w+'"]',k));
      const it=document.getElementById('textItalicBtn');if(it){const n=it.lastChild,v=' '+t('italic');if(n&&n.textContent!==v)n.textContent=v}
      const lh=document.getElementById('textLineHeight'),ll=lh?.parentElement?.previousElementSibling;if(ll?.classList.contains('field-label')&&ll.textContent!==t('lineSpacing'))ll.textContent=t('lineSpacing');
      attr('#undoBtn','title','undo');attr('#redoBtn','title','redo');attr('#deleteBtn','title','deleteElement');attr('.desktop-stage-zoom','aria-label','zoomArea');attr('.desktop-zoom-out','title','zoomOut');attr('.desktop-zoom-in','title','zoomIn');attr('.desktop-fit-btn','title','fitDesign');attr('#siteLanguage','aria-label','language');unified();themeLabel();
    }

    let explicit=localStorage.getItem('studiopro-theme'),mq=window.matchMedia?.('(prefers-color-scheme: dark)');
    function themeLabel(){const dark=document.documentElement.dataset.theme==='dark',icon=dark?'☀':'☾',label=dark?t('themeLight'):t('themeDark');if(theme.textContent!==icon)theme.textContent=icon;theme.title=label;theme.setAttribute('aria-label',label)}
    function setTheme(v,save=false){v=v==='dark'?'dark':'light';document.documentElement.dataset.theme=v;if(save){explicit=v;localStorage.setItem('studiopro-theme',v)}const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=v==='dark'?'#151920':'#f7f8fb';themeLabel()}
    setTheme(explicit||(mq?.matches?'dark':'light'));mq?.addEventListener?.('change',e=>{if(!explicit)setTheme(e.matches?'dark':'light')});
    theme.onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true);
    select.onchange=e=>{lang=codes.includes(e.target.value)?e.target.value:'ar';localStorage.setItem('studiopro-language',lang);translate()};
    let scheduled=false;new MutationObserver(ms=>{if(!ms.some(m=>m.addedNodes.length)||scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;translate()})}).observe(document.body,{childList:true,subtree:true});
    translate();
  }
})();
