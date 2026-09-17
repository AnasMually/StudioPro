(() => {
  'use strict';

  const S=window.StudioPro;
  if(!S) throw new Error('StudioPro core is missing');

  const T={
    ar:{save:'تصدير مشروع',saveShort:'مشروع',import:'استيراد مشروع',exportPng:'تصدير PNG',projectMenu:'خيارات المشروع',undo:'تراجع',redo:'إعادة',imageShape:'شكل الصورة',edgeStyle:'نمط الحواف',original:'افتراضي / بدون قص إضافي',rounded:'زوايا دائرية',squircle:'Squircle — نمط One UI',smooth:'نعومة Squircle',smoothHelp:'يوزع الانحناء على امتداد الأضلاع بدل حصره في الزوايا فقط.'},
    en:{save:'Export project',saveShort:'Project',import:'Import project',exportPng:'Export PNG',projectMenu:'Project options',undo:'Undo',redo:'Redo',imageShape:'Image shape',edgeStyle:'Edge style',original:'Default / no extra clipping',rounded:'Rounded corners',squircle:'Squircle — One UI style',smooth:'Squircle smoothness',smoothHelp:'Distributes the curvature smoothly along the edges instead of concentrating it only at the corners.'},
    es:{save:'Exportar proyecto',saveShort:'Proyecto',import:'Importar proyecto',exportPng:'Exportar PNG',projectMenu:'Opciones del proyecto',undo:'Deshacer',redo:'Rehacer',imageShape:'Forma de imagen',edgeStyle:'Estilo de bordes',original:'Predeterminado / sin recorte extra',rounded:'Esquinas redondeadas',squircle:'Squircle — estilo One UI',smooth:'Suavidad Squircle',smoothHelp:'Distribuye la curvatura de forma continua por los bordes, no solo en las esquinas.'},
    hi:{save:'प्रोजेक्ट निर्यात करें',saveShort:'प्रोजेक्ट',import:'प्रोजेक्ट आयात करें',exportPng:'PNG निर्यात करें',projectMenu:'प्रोजेक्ट विकल्प',undo:'पूर्ववत',redo:'फिर करें',imageShape:'छवि आकार',edgeStyle:'किनारा शैली',original:'डिफ़ॉल्ट / अतिरिक्त क्लिपिंग नहीं',rounded:'गोल कोने',squircle:'Squircle — One UI शैली',smooth:'Squircle स्मूदनेस',smoothHelp:'वक्रता को केवल कोनों तक सीमित रखने के बजाय किनारों पर समान रूप से फैलाता है।'},
    'zh-CN':{save:'导出项目',saveShort:'项目',import:'导入项目',exportPng:'导出 PNG',projectMenu:'项目选项',undo:'撤销',redo:'重做',imageShape:'图片形状',edgeStyle:'边缘样式',original:'默认 / 不额外裁剪',rounded:'圆角',squircle:'Squircle — One UI 风格',smooth:'Squircle 平滑度',smoothHelp:'让曲率沿整个边缘连续分布，而不是只集中在四个角。'}
  };

  const lang=()=>{const raw=(document.documentElement.lang||navigator.language||'en').trim();if(/^ar/i.test(raw))return'ar';if(/^es/i.test(raw))return'es';if(/^hi/i.test(raw))return'hi';if(/^zh/i.test(raw))return'zh-CN';return'en';};
  const tr=k=>T[lang()]?.[k]||T.en[k]||k;

  function markPhoneLayout(){
    const phoneLike=window.innerWidth<=780||((navigator.maxTouchPoints||0)>0&&Math.min(screen.width||9999,screen.height||9999)<=900);
    document.documentElement.classList.toggle('phone-layout',phoneLike);
  }

  function installStyles(){
    document.getElementById('projectToolbarV2Style')?.remove();
    document.getElementById('projectToolbarV3Style')?.remove();
    document.getElementById('projectToolbarV4Style')?.remove();
    if(document.getElementById('projectToolbarV5Style'))return;
    const style=document.createElement('style');style.id='projectToolbarV5Style';style.textContent=`
      html,body,.app{max-width:100%;overflow-x:hidden}
      .topbar,.workspace-grid,.stage-column,.stage-toolbar{max-width:100%}
      .top-actions{min-width:0;flex:0 0 auto}.brand-wrap{min-width:0;overflow:hidden}.brand-wrap>div:last-child{min-width:0}.brand,.brand-sub{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .project-menu-wrap{display:inline-flex;align-items:center;flex:0 0 auto}
      .project-menu-btn{min-width:40px;padding-inline:10px;font-size:20px;line-height:1}
      .project-save-primary{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex:0 0 auto}.project-save-icon{font-size:15px;line-height:1}.project-save-short{display:none}
      .project-popover-fixed{position:fixed;z-index:10000;display:none;min-width:190px;padding:6px;border:1px solid var(--border,#dfe3ec);border-radius:12px;background:var(--panel,#fff);color:var(--text,#151922);box-shadow:0 14px 34px rgba(17,24,39,.22)}
      .project-popover-fixed.open{display:grid;gap:4px}
      .project-menu-item{width:100%;border:0;background:transparent;color:inherit;border-radius:9px;padding:11px 12px;text-align:start;font:inherit;cursor:pointer;white-space:nowrap}
      .project-menu-item:active,.project-menu-item:hover{background:var(--panel-soft,#f3f4f8)}
      .stage-history-btn{width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid var(--border);color:var(--text);display:grid;place-items:center;font-size:15px;cursor:pointer;padding:0}.stage-history-btn:disabled{opacity:.35;cursor:default}
      .stage-actions{min-width:0;flex-wrap:nowrap}.stage-status{min-width:0;white-space:nowrap}
      @media(max-width:780px){
        .topbar{gap:6px;padding-inline:8px}.top-actions{gap:4px}.brand-sub{display:none}
        .project-save-primary{height:38px;padding:0 9px;justify-content:center;border-radius:10px;gap:5px;font-size:10px}
        .project-save-primary .project-save-label{display:none}.project-save-primary .project-save-short{display:inline}.project-save-primary .project-save-icon{font-size:15px}
        .project-menu-btn{width:38px;min-width:38px;height:38px;padding:0}.project-popover-fixed{min-width:180px}.stage-toolbar{gap:6px}.stage-actions{gap:5px}.stage-actions .mini-btn{white-space:nowrap}
      }
      html.phone-layout body{overflow:hidden!important}html.phone-layout .desktop-only{display:none!important}html.phone-layout .mobile-only{display:flex!important}
      html.phone-layout .workspace-grid{height:calc(100dvh - 58px - 66px - env(safe-area-inset-bottom));display:block!important;grid-template-columns:none!important;width:100%!important;min-width:0!important}
      html.phone-layout .stage-column{height:100%;width:100%!important;min-width:0!important;grid-template-rows:42px minmax(0,1fr)!important}html.phone-layout .stage{padding:10px;max-width:100%;overflow:hidden}html.phone-layout .stage-toolbar{padding:0 8px;width:100%;overflow:hidden}
      html.phone-layout .left-panel,html.phone-layout .inspector-panel{position:fixed!important;left:8px!important;right:8px!important;width:auto!important;bottom:calc(66px + env(safe-area-inset-bottom) + 8px)!important;max-height:min(62dvh,620px)!important;z-index:70!important;transform:translateY(calc(100% + 100px));opacity:0;pointer-events:none}
      html.phone-layout .panel.mobile-open{transform:translateY(0)!important;opacity:1!important;pointer-events:auto!important}html.phone-layout .mobile-dock{display:flex!important;position:fixed;left:0;right:0;bottom:0;height:calc(66px + env(safe-area-inset-bottom));z-index:80}
      html.phone-layout .brand-sub{display:none!important}html.phone-layout .topbar{height:58px;padding-inline:8px;gap:5px;width:100%;overflow:hidden}html.phone-layout .brand-mark{width:34px;height:34px;flex:0 0 auto}html.phone-layout .brand{font-size:14px}
      html.phone-layout .project-save-primary{height:38px;padding:0 9px;justify-content:center;gap:5px;font-size:10px}html.phone-layout .project-save-primary .project-save-label{display:none}html.phone-layout .project-save-primary .project-save-short{display:inline}html.phone-layout .project-menu-btn{width:38px;min-width:38px;height:38px;padding:0}
      html.phone-layout .stage-status{font-size:9px;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis}html.phone-layout .stage-actions{flex:0 0 auto;gap:4px}html.phone-layout .stage-actions .mini-btn{padding:5px 6px;font-size:9px}html.phone-layout .stage-history-btn{width:29px;height:29px;font-size:14px}
      @media(max-width:390px){.brand-wrap{min-width:0}.brand{font-size:13px}.brand-mark{width:31px;height:31px}.topbar{padding-inline:6px}.top-actions{gap:3px}.stage-status{max-width:82px}.project-save-primary{padding-inline:7px!important}}
    `;document.head.appendChild(style);
  }

  function closeProjectMenu(){const menu=document.getElementById('projectPopoverFixed'),btn=document.getElementById('projectMenuBtn');menu?.classList.remove('open');btn?.setAttribute('aria-expanded','false');}

  function positionProjectMenu(){
    const btn=document.getElementById('projectMenuBtn'),menu=document.getElementById('projectPopoverFixed');if(!btn||!menu)return;
    const r=btn.getBoundingClientRect(),mw=Math.max(180,menu.offsetWidth||190),gap=8;
    let left=document.documentElement.dir==='rtl'?r.left:r.right-mw;
    left=Math.max(8,Math.min(window.innerWidth-mw-8,left));
    let top=r.bottom+gap;
    if(top+(menu.offsetHeight||110)>window.innerHeight-8)top=Math.max(8,r.top-(menu.offsetHeight||110)-gap);
    menu.style.left=`${Math.round(left)}px`;menu.style.top=`${Math.round(top)}px`;
  }

  function toggleProjectMenu(e){
    e.preventDefault();e.stopPropagation();
    const menu=document.getElementById('projectPopoverFixed'),btn=document.getElementById('projectMenuBtn');if(!menu||!btn)return;
    const isOpen=menu.classList.contains('open');
    if(isOpen){closeProjectMenu();return;}
    menu.classList.add('open');btn.setAttribute('aria-expanded','true');
    requestAnimationFrame(positionProjectMenu);
  }

  function rebuildToolbar(){
    const actions=document.querySelector('.top-actions');if(!actions)return;
    document.getElementById('saveProjectBtn')?.remove();document.getElementById('loadProjectBtn')?.remove();document.getElementById('exportBtn')?.remove();document.getElementById('legacyExportPngHidden')?.remove();
    document.getElementById('saveProjectPrimaryBtn')?.remove();document.getElementById('projectMenuBtn')?.closest('.project-menu-wrap')?.remove();document.getElementById('projectPopoverFixed')?.remove();

    const save=document.createElement('button');save.type='button';save.id='saveProjectPrimaryBtn';save.className='btn btn-primary project-save-primary';save.innerHTML='<span class="project-save-icon" aria-hidden="true">⇩</span><span class="project-save-label"></span><span class="project-save-short"></span>';save.addEventListener('click',()=>S.exportProject?.());actions.appendChild(save);

    const wrap=document.createElement('div');wrap.className='project-menu-wrap';wrap.innerHTML='<button type="button" class="btn btn-secondary project-menu-btn" id="projectMenuBtn" aria-haspopup="menu" aria-expanded="false">⋮</button>';actions.appendChild(wrap);

    const menu=document.createElement('div');menu.className='project-popover-fixed';menu.id='projectPopoverFixed';menu.setAttribute('role','menu');menu.innerHTML='<button type="button" class="project-menu-item" id="projectImportMenu" role="menuitem"></button><button type="button" class="project-menu-item" id="projectExportPngMenu" role="menuitem"></button>';document.body.appendChild(menu);

    const btn=document.getElementById('projectMenuBtn');
    /* One event path only. Using both pointerup and click caused touch devices to toggle twice. */
    btn.addEventListener('click',toggleProjectMenu);

    menu.querySelector('#projectImportMenu').addEventListener('click',e=>{e.stopPropagation();closeProjectMenu();document.getElementById('projectInput')?.click();});
    menu.querySelector('#projectExportPngMenu').addEventListener('click',e=>{e.stopPropagation();closeProjectMenu();S.exportCanvas?.();});

    /* Outside click closes the menu. Because the menu button stops propagation, the opening click never reaches this handler. */
    document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!btn.contains(e.target))closeProjectMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProjectMenu();});
  }

  function relocateHistoryControls(){
    const stageActions=document.querySelector('.stage-actions');if(!stageActions)return;const undo=document.getElementById('undoBtn'),redo=document.getElementById('redoBtn');
    if(undo){undo.classList.remove('icon-btn');undo.classList.add('stage-history-btn');undo.setAttribute('aria-label',tr('undo'));undo.title=tr('undo');stageActions.prepend(undo);}
    if(redo){redo.classList.remove('icon-btn');redo.classList.add('stage-history-btn');redo.setAttribute('aria-label',tr('redo'));redo.title=tr('redo');undo?.insertAdjacentElement('afterend',redo);}
  }

  function localizeNewUI(){
    const save=document.getElementById('saveProjectPrimaryBtn'),menuBtn=document.getElementById('projectMenuBtn');
    if(save){save.querySelector('.project-save-label').textContent=tr('save');save.querySelector('.project-save-short').textContent=tr('saveShort');save.title=tr('save');save.setAttribute('aria-label',tr('save'));}
    if(menuBtn){menuBtn.title=tr('projectMenu');menuBtn.setAttribute('aria-label',tr('projectMenu'));}
    const undo=document.getElementById('undoBtn'),redo=document.getElementById('redoBtn');if(undo){undo.title=tr('undo');undo.setAttribute('aria-label',tr('undo'));}if(redo){redo.title=tr('redo');redo.setAttribute('aria-label',tr('redo'));}
    const imp=document.getElementById('projectImportMenu'),png=document.getElementById('projectExportPngMenu');if(imp)imp.textContent=tr('import');if(png)png.textContent=tr('exportPng');
    const box=document.querySelector('.shape-pro-controls');if(box){const group=box.querySelector('.group-title');if(group)group.textContent=tr('imageShape');const label=box.querySelector('label[for="shapeMode"]');if(label)label.textContent=tr('edgeStyle');const select=document.getElementById('shapeMode');if(select){const o=[...select.options];if(o[0])o[0].textContent=tr('original');if(o[1])o[1].textContent=tr('rounded');if(o[2])o[2].textContent=tr('squircle');}const smoothLabel=box.querySelector('label[for="shapeSmoothness"]');if(smoothLabel){const value=document.getElementById('shapeSmoothnessValue');smoothLabel.childNodes[0].nodeValue=tr('smooth')+' ';if(value&&!smoothLabel.contains(value))smoothLabel.appendChild(value);}const help=box.querySelector('#squircleControls .section-help');if(help)help.textContent=tr('smoothHelp');}
  }

  markPhoneLayout();installStyles();rebuildToolbar();relocateHistoryControls();localizeNewUI();
  const langObserver=new MutationObserver(()=>localizeNewUI());langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  window.addEventListener('languagechange',localizeNewUI);
  window.addEventListener('resize',()=>{markPhoneLayout();closeProjectMenu();requestAnimationFrame(()=>S.fitCanvasToStage?.());});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{markPhoneLayout();closeProjectMenu();S.fitCanvasToStage?.();},120));
})();