(() => {
  'use strict';

  const S=window.StudioPro;
  if(!S) throw new Error('StudioPro core is missing');

  const T={
    ar:{save:'حفظ المشروع',import:'استيراد مشروع',exportPng:'تصدير PNG',projectMenu:'خيارات المشروع',imageShape:'شكل الصورة',edgeStyle:'نمط الحواف',original:'افتراضي / بدون قص إضافي',rounded:'زوايا دائرية',squircle:'Squircle — نمط One UI',smooth:'نعومة Squircle',smoothHelp:'يوزع الانحناء على امتداد الأضلاع بدل حصره في الزوايا فقط.'},
    en:{save:'Save project',import:'Import project',exportPng:'Export PNG',projectMenu:'Project options',imageShape:'Image shape',edgeStyle:'Edge style',original:'Default / no extra clipping',rounded:'Rounded corners',squircle:'Squircle — One UI style',smooth:'Squircle smoothness',smoothHelp:'Distributes the curvature smoothly along the edges instead of concentrating it only at the corners.'},
    es:{save:'Guardar proyecto',import:'Importar proyecto',exportPng:'Exportar PNG',projectMenu:'Opciones del proyecto',imageShape:'Forma de imagen',edgeStyle:'Estilo de bordes',original:'Predeterminado / sin recorte extra',rounded:'Esquinas redondeadas',squircle:'Squircle — estilo One UI',smooth:'Suavidad Squircle',smoothHelp:'Distribuye la curvatura de forma continua por los bordes, no solo en las esquinas.'},
    hi:{save:'प्रोजेक्ट सहेजें',import:'प्रोजेक्ट आयात करें',exportPng:'PNG निर्यात करें',projectMenu:'प्रोजेक्ट विकल्प',imageShape:'छवि आकार',edgeStyle:'किनारा शैली',original:'डिफ़ॉल्ट / अतिरिक्त क्लिपिंग नहीं',rounded:'गोल कोने',squircle:'Squircle — One UI शैली',smooth:'Squircle स्मूदनेस',smoothHelp:'वक्रता को केवल कोनों तक सीमित रखने के बजाय किनारों पर समान रूप से फैलाता है।'},
    'zh-CN':{save:'保存项目',import:'导入项目',exportPng:'导出 PNG',projectMenu:'项目选项',imageShape:'图片形状',edgeStyle:'边缘样式',original:'默认 / 不额外裁剪',rounded:'圆角',squircle:'Squircle — One UI 风格',smooth:'Squircle 平滑度',smoothHelp:'让曲率沿整个边缘连续分布，而不是只集中在四个角。'}
  };

  const lang=()=>{
    const raw=(document.documentElement.lang||navigator.language||'en').trim();
    if(/^ar/i.test(raw))return'ar';if(/^es/i.test(raw))return'es';if(/^hi/i.test(raw))return'hi';if(/^zh/i.test(raw))return'zh-CN';return'en';
  };
  const tr=k=>T[lang()]?.[k]||T.en[k]||k;

  function installStyles(){
    if(document.getElementById('projectToolbarV2Style'))return;
    const style=document.createElement('style');style.id='projectToolbarV2Style';style.textContent=`
      .project-menu-wrap{position:relative;display:inline-flex;align-items:center}
      .project-menu-btn{min-width:40px;padding-inline:10px;font-size:20px;line-height:1}
      .project-popover{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:1000;display:none;min-width:190px;padding:6px;border:1px solid var(--border,#dfe3ec);border-radius:12px;background:var(--surface,#fff);box-shadow:0 14px 34px rgba(17,24,39,.18)}
      .project-popover.open{display:grid;gap:4px}
      .project-menu-item{width:100%;border:0;background:transparent;color:inherit;border-radius:9px;padding:10px 12px;text-align:start;font:inherit;cursor:pointer;white-space:nowrap}
      .project-menu-item:hover,.project-menu-item:focus-visible{background:var(--panel-soft,#f3f4f8);outline:0}
      .project-save-primary{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
      .project-save-icon{font-size:15px;line-height:1}
      @media(max-width:780px){
        .topbar{gap:8px}.top-actions{gap:5px;min-width:0}.brand-sub{display:none}
        .project-save-primary{width:42px;min-width:42px;height:40px;padding:0;justify-content:center;border-radius:11px}
        .project-save-primary .project-save-label{display:none}
        .project-save-primary .project-save-icon{font-size:18px}
        .project-menu-btn{width:40px;min-width:40px;height:40px;padding:0}
        .top-actions .icon-btn{width:36px;min-width:36px;height:36px}
        .project-popover{min-width:180px}
      }
      @media(max-width:390px){.brand-wrap{min-width:0}.brand{font-size:14px}.brand-mark{width:32px;height:32px}.topbar{padding-inline:8px}.top-actions{gap:3px}}
    `;document.head.appendChild(style);
  }

  function rebuildToolbar(){
    const actions=document.querySelector('.top-actions');if(!actions)return;
    document.getElementById('saveProjectBtn')?.remove();
    document.getElementById('loadProjectBtn')?.remove();

    const oldExport=document.getElementById('exportBtn');
    if(oldExport){
      const replacement=oldExport.cloneNode(true);replacement.id='legacyExportPngHidden';replacement.hidden=true;oldExport.replaceWith(replacement);
    }

    if(!document.getElementById('saveProjectPrimaryBtn')){
      const save=document.createElement('button');save.type='button';save.id='saveProjectPrimaryBtn';save.className='btn btn-primary project-save-primary';
      save.innerHTML='<span class="project-save-icon" aria-hidden="true">▣</span><span class="project-save-label"></span>';
      save.addEventListener('click',()=>S.exportProject?.());
      actions.appendChild(save);

      const wrap=document.createElement('div');wrap.className='project-menu-wrap';wrap.innerHTML=`<button type="button" class="btn btn-secondary project-menu-btn" id="projectMenuBtn" aria-haspopup="menu" aria-expanded="false">⋮</button><div class="project-popover" id="projectPopover" role="menu"><button type="button" class="project-menu-item" id="projectImportMenu" role="menuitem"></button><button type="button" class="project-menu-item" id="projectExportPngMenu" role="menuitem"></button></div>`;
      actions.appendChild(wrap);
      const menuBtn=wrap.querySelector('#projectMenuBtn'),popover=wrap.querySelector('#projectPopover');
      menuBtn.addEventListener('click',e=>{e.stopPropagation();const open=popover.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});
      wrap.querySelector('#projectImportMenu').addEventListener('click',()=>{popover.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');document.getElementById('projectInput')?.click();});
      wrap.querySelector('#projectExportPngMenu').addEventListener('click',()=>{popover.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');S.exportCanvas?.();});
      document.addEventListener('click',e=>{if(!wrap.contains(e.target)){popover.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'){popover.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}});
    }
  }

  function localizeNewUI(){
    const save=document.getElementById('saveProjectPrimaryBtn'),menu=document.getElementById('projectMenuBtn');
    if(save){save.querySelector('.project-save-label').textContent=tr('save');save.title=tr('save');save.setAttribute('aria-label',tr('save'));}
    if(menu){menu.title=tr('projectMenu');menu.setAttribute('aria-label',tr('projectMenu'));}
    const imp=document.getElementById('projectImportMenu'),png=document.getElementById('projectExportPngMenu');if(imp)imp.textContent=tr('import');if(png)png.textContent=tr('exportPng');

    const box=document.querySelector('.shape-pro-controls');
    if(box){
      const group=box.querySelector('.group-title');if(group)group.textContent=tr('imageShape');
      const label=box.querySelector('label[for="shapeMode"]');if(label)label.textContent=tr('edgeStyle');
      const select=document.getElementById('shapeMode');if(select){const o=[...select.options];if(o[0])o[0].textContent=tr('original');if(o[1])o[1].textContent=tr('rounded');if(o[2])o[2].textContent=tr('squircle');}
      const smoothLabel=box.querySelector('label[for="shapeSmoothness"]');
      if(smoothLabel){const value=document.getElementById('shapeSmoothnessValue');smoothLabel.childNodes[0].nodeValue=tr('smooth')+' ';if(value&&!smoothLabel.contains(value))smoothLabel.appendChild(value);}
      const help=box.querySelector('#squircleControls .section-help');if(help)help.textContent=tr('smoothHelp');
    }
  }

  installStyles();rebuildToolbar();localizeNewUI();

  const langObserver=new MutationObserver(()=>localizeNewUI());
  langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
  window.addEventListener('languagechange',localizeNewUI);
})();