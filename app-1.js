(() => {
  'use strict';
  const canvas=document.getElementById('mainCanvas');
  const ctx=canvas.getContext('2d',{alpha:false});
  const canvasArea=document.getElementById('canvasArea');
  const languages=[
    ['en','English'],['ja','Japanese'],['ko','Korean'],['de','German'],['fr','French'],['zh-CN','Chinese Simplified'],['zh-TW','Chinese Traditional'],['es','Spanish'],['it','Italian'],['nl','Dutch'],['sv','Swedish'],['no','Norwegian'],['da','Danish'],['fi','Finnish'],['pl','Polish'],['cs','Czech'],['sk','Slovak'],['ro','Romanian'],['hu','Hungarian'],['uk','Ukrainian'],['pt','Portuguese'],['ru','Russian'],['tr','Turkish'],['ar','Arabic'],['he','Hebrew'],['id','Indonesian'],['ms','Malay'],['vi','Vietnamese'],['th','Thai'],['hi','Hindi']
  ];
  const backgroundPresets=[
    {id:'cloud',name:'Cloud',colors:['#ffffff','#f1f5ff','#eef1ff'],angle:135,spots:[['#c7d2fe',.22,.18,.20],['#e9d5ff',.22,.82,.76]]},
    {id:'blush',name:'Blush',colors:['#fff8fb','#ffe9f3','#f4edff'],angle:145,spots:[['#f9a8d4',.20,.82,.18],['#ddd6fe',.22,.18,.82]]},
    {id:'lavender',name:'Lavender',colors:['#fbf9ff','#ede9fe','#e0e7ff'],angle:130,spots:[['#c4b5fd',.24,.20,.20],['#a5b4fc',.20,.80,.78]]},
    {id:'sky',name:'Sky',colors:['#f8fcff','#e0f2fe','#dbeafe'],angle:155,spots:[['#7dd3fc',.20,.78,.18],['#bfdbfe',.20,.18,.80]]},
    {id:'mint',name:'Mint',colors:['#fbfffd','#dcfce7','#dff9f2'],angle:145,spots:[['#86efac',.18,.18,.20],['#99f6e4',.18,.82,.78]]},
    {id:'peach',name:'Peach',colors:['#fffaf7','#ffedd5','#ffe4e6'],angle:130,spots:[['#fdba74',.18,.20,.76],['#fda4af',.18,.82,.20]]},
    {id:'butter',name:'Butter',colors:['#fffef8','#fef3c7','#fff7ed'],angle:150,spots:[['#fde68a',.16,.20,.20],['#fed7aa',.17,.82,.78]]},
    {id:'aqua',name:'Aqua',colors:['#f8ffff','#cffafe','#dbeafe'],angle:135,spots:[['#67e8f9',.19,.16,.22],['#93c5fd',.18,.84,.76]]},
    {id:'rosewater',name:'Rosewater',colors:['#fffafa','#ffe4e6','#fce7f3'],angle:140,spots:[['#fda4af',.18,.78,.18],['#f9a8d4',.18,.18,.80]]},
    {id:'ice',name:'Ice',colors:['#ffffff','#ecfeff','#eff6ff'],angle:160,spots:[['#a5f3fc',.18,.78,.22],['#bfdbfe',.18,.18,.78]]},
    {id:'lilac',name:'Lilac',colors:['#fffaff','#fae8ff','#ede9fe'],angle:145,spots:[['#e879f9',.15,.78,.20],['#c4b5fd',.20,.18,.80]]},
    {id:'sage',name:'Sage',colors:['#fbfdf9','#ecfccb','#dcfce7'],angle:135,spots:[['#bef264',.15,.20,.18],['#86efac',.16,.82,.78]]},
    {id:'sunrise',name:'Sunrise',colors:['#fff9f3','#ffedd5','#fae8ff'],angle:120,spots:[['#fb923c',.16,.18,.78],['#e879f9',.16,.82,.20]]},
    {id:'violet-blue',name:'Violet Blue',colors:['#f8f7ff','#e0e7ff','#ede9fe'],angle:115,spots:[['#818cf8',.20,.18,.20],['#c084fc',.18,.82,.80]]},
    {id:'cyan-mint',name:'Cyan Mint',colors:['#f6ffff','#ccfbf1','#cffafe'],angle:135,spots:[['#2dd4bf',.16,.18,.75],['#22d3ee',.17,.80,.22]]},
    {id:'pink-blue',name:'Pink Blue',colors:['#fff7fb','#fce7f3','#dbeafe'],angle:125,spots:[['#f472b6',.17,.20,.18],['#60a5fa',.17,.82,.80]]},
    {id:'warm-white',name:'Warm White',colors:['#fffdfb','#faf7f2','#f5f3ff'],angle:145,spots:[['#fed7aa',.12,.80,.18],['#ddd6fe',.14,.20,.82]]},
    {id:'studio',name:'Studio',colors:['#f8fafc','#eef2ff','#f8fafc'],angle:150,spots:[['#a5b4fc',.15,.50,.15],['#c4b5fd',.12,.80,.82]]},
    {id:'brand-indigo',name:'Indigo',colors:['#eef2ff','#c7d2fe','#ddd6fe'],angle:135,spots:[['#6366f1',.18,.16,.20],['#8b5cf6',.18,.84,.78]]},
    {id:'brand-blue',name:'Blue',colors:['#eff6ff','#bfdbfe','#cffafe'],angle:135,spots:[['#3b82f6',.18,.16,.22],['#06b6d4',.16,.84,.78]]},
    {id:'brand-green',name:'Green',colors:['#f0fdf4','#bbf7d0','#ccfbf1'],angle:135,spots:[['#22c55e',.17,.18,.20],['#14b8a6',.17,.82,.80]]},
    {id:'brand-coral',name:'Coral',colors:['#fff7ed','#fed7aa','#fecdd3'],angle:135,spots:[['#f97316',.16,.20,.80],['#fb7185',.17,.82,.20]]},
    {id:'brand-purple',name:'Purple',colors:['#faf5ff','#e9d5ff','#fce7f3'],angle:135,spots:[['#a855f7',.17,.18,.22],['#ec4899',.16,.82,.78]]},
    {id:'clean-white',name:'Clean',colors:['#ffffff','#f8fafc','#f1f5f9'],angle:135,spots:[]}
  ];
  const state={canvas:{width:1080,height:1920},background:{type:'preset',presetId:'cloud',colors:null,solid:'#f3f4f8',image:null,blur:0,overlay:0},elements:[],activeElementId:null};
  const viewState={zoom:100,showSelection:true};
  const history={states:[],index:-1,max:60,restoring:false};
  let counter=0,timer=null;
  const S=window.StudioPro={canvas,ctx,canvasArea,languages,backgroundPresets,state,viewState,history};
  S.uid=(p='el')=>`${p}_${Date.now().toString(36)}_${++counter}`;
  S.getActiveElement=()=>state.elements.find(x=>x.id===state.activeElementId)||null;
  S.getTextElements=()=>state.elements.filter(x=>x.type==='text');
  S.uniqueTranslationKey=()=>{const used=new Set(S.getTextElements().map(x=>x.translationKey));let i=1;while(used.has(`text_${i}`))i++;return`text_${i}`;};
  S.makeShadow=t=>t==='text'?{enabled:true,blur:16,opacity:34,x:0,y:8,color:'#111827'}:{enabled:true,blur:44,opacity:28,x:0,y:28,color:'#111827'};
  S.cloneState=()=>({canvas:{...state.canvas},background:{...state.background},elements:state.elements.map(x=>({...x,shadow:{...x.shadow}})),activeElementId:state.activeElementId});
  S.updateUndoRedo=()=>{const u=document.getElementById('undoBtn'),r=document.getElementById('redoBtn');if(u)u.disabled=history.index<=0;if(r)r.disabled=history.index>=history.states.length-1;};
  S.saveState=()=>{if(history.restoring)return;if(history.index<history.states.length-1)history.states=history.states.slice(0,history.index+1);history.states.push(S.cloneState());if(history.states.length>history.max)history.states.shift();else history.index++;S.updateUndoRedo();};
  S.restoreState=s=>{if(!s)return;history.restoring=true;state.canvas={...s.canvas};state.background={...s.background};state.elements=s.elements.map(x=>({...x,shadow:{...x.shadow}}));state.activeElementId=s.activeElementId;canvas.width=state.canvas.width;canvas.height=state.canvas.height;history.restoring=false;S.render();S.fitCanvasToStage();S.syncAllUI();};
  S.undo=()=>{if(history.index<=0)return;history.index--;S.restoreState(history.states[history.index]);S.updateUndoRedo();};
  S.redo=()=>{if(history.index>=history.states.length-1)return;history.index++;S.restoreState(history.states[history.index]);S.updateUndoRedo();};
  S.showToast=m=>{const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>t.classList.remove('show'),2200);};
  S.hexToRgb=h=>{let v=String(h||'#000000').replace('#','');if(v.length===3)v=v.split('').map(c=>c+c).join('');const n=parseInt(v.padEnd(6,'0').slice(0,6),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};};
  S.rgba=(h,o)=>{const{r,g,b}=S.hexToRgb(h);return`rgba(${r},${g},${b},${Math.max(0,Math.min(100,o))/100})`;};
  S.detectDirection=t=>/[\u0590-\u08FF]/.test(t||'')?'rtl':'ltr';
})();