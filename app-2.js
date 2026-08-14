(() => {
  'use strict';

  const S = window.StudioPro;
  const { canvas, ctx, state, viewState } = S;

  const grad = (colors, angle=135) => {
    const r=angle*Math.PI/180, x=Math.cos(r), y=Math.sin(r), cx=canvas.width/2, cy=canvas.height/2;
    const len=Math.abs(canvas.width*x)+Math.abs(canvas.height*y);
    const g=ctx.createLinearGradient(cx-x*len/2,cy-y*len/2,cx+x*len/2,cy+y*len/2);
    (colors?.length?colors:['#fff','#f3f4f8']).forEach((c,i,a)=>g.addColorStop(a.length===1?0:i/(a.length-1),c));
    return g;
  };

  const spot = (color,a,nx,ny) => {
    const x=canvas.width*nx, y=canvas.height*ny, r=Math.max(canvas.width,canvas.height)*.42;
    const g=ctx.createRadialGradient(x,y,0,x,y,r), rgb=S.hexToRgb(color);
    g.addColorStop(0,`rgba(${rgb.r},${rgb.g},${rgb.b},${a})`);
    g.addColorStop(1,`rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
  };

  S.renderBackground = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const b=state.background;
    if(b.type==='solid'){
      ctx.fillStyle=b.solid||'#f3f4f8';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      return;
    }
    if(b.type==='image'&&b.image){
      const sc=Math.max(canvas.width/b.image.width,canvas.height/b.image.height), w=b.image.width*sc, h=b.image.height*sc;
      ctx.save();
      ctx.filter=b.blur?`blur(${b.blur}px)`:'none';
      ctx.drawImage(b.image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
      ctx.restore();
      if(b.overlay>0){ctx.fillStyle=`rgba(255,255,255,${b.overlay/100})`;ctx.fillRect(0,0,canvas.width,canvas.height);}
      return;
    }
    const p=S.backgroundPresets.find(x=>x.id===b.presetId)||S.backgroundPresets[0];
    const colors=b.type==='smart'&&b.colors?b.colors:p.colors;
    ctx.fillStyle=grad(colors,p.angle); ctx.fillRect(0,0,canvas.width,canvas.height);
    (b.type==='smart'?(b.spots||[]):p.spots).forEach(x=>spot(...x));
  };

  const roundedPath = (x,y,w,h,r) => {
    r=Math.min(Math.max(0,r),Math.abs(w)/2,Math.abs(h)/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  };

  const applyShadow = el => {
    const s=el.shadow||{};
    if(!s.enabled||s.opacity<=0||s.blur<=0){
      ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0; return;
    }
    ctx.shadowColor=S.rgba(s.color||'#111827',s.opacity??30);
    ctx.shadowBlur=s.blur||0; ctx.shadowOffsetX=s.x||0; ctx.shadowOffsetY=s.y||0;
  };

  S.getTextMetrics = (el,fontSize=el.fontSize) => {
    ctx.save();
    const fs=Math.max(1,Number(fontSize)||1);
    ctx.font=`700 ${fs}px 'Cairo',system-ui,sans-serif`;
    const lines=String(el.content||'').split('\n');
    const width=Math.max(1,...lines.map(x=>ctx.measureText(x||' ').width));
    const lineHeight=fs*1.25;
    ctx.restore();
    return {lines,width,height:Math.max(lineHeight,lines.length*lineHeight),lineHeight};
  };

  S.getElementBaseBounds = el => {
    if(!el) return {w:1,h:1};
    if(el.type==='image'){
      const frame=S.getFrameDefinition(el.frame);
      const pad=frame.kind==='none'?0:(frame.kind==='rounded'?4:(frame.bezel||8));
      return {w:(el.baseWidth||400)+pad*2,h:(el.baseHeight||800)+pad*2,pad};
    }
    const m=S.getTextMetrics(el);
    return {w:m.width,h:m.height,pad:0};
  };

  S.imageSize = el => {
    const {x,y}=S.getScales(el);
    return {w:(el.baseWidth||400)*x,h:(el.baseHeight||800)*y};
  };

  const rotatedBounds = (w,h,d) => {
    const r=Math.abs(d||0)*Math.PI/180,c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r));
    return {width:w*c+h*s,height:w*s+h*c};
  };

  S.fitTextElementToCanvas = (el,opt={}) => {
    if(!el||el.type!=='text'||el.autoFit===false) return;
    S.ensureElementTransform(el);
    const margin=Math.max(18,Math.min(canvas.width,canvas.height)*.025);
    let cx=canvas.width/2+el.x, cy=canvas.height/2+el.y;
    cx=Math.max(margin,Math.min(canvas.width-margin,cx));
    cy=Math.max(margin,Math.min(canvas.height-margin,cy));
    el.x=cx-canvas.width/2; el.y=cy-canvas.height/2;
    const mw=Math.max(60,2*Math.min(cx-margin,canvas.width-margin-cx));
    const mh=Math.max(60,2*Math.min(cy-margin,canvas.height-margin-cy));
    const {x:sx,y:sy}=S.getScales(el);
    const min=opt.minFontSize||8;
    el.fontSize=Math.max(min,Math.min(1600,opt.startFontSize||el.fontSize||64));
    let guard=0;
    while(el.fontSize>min&&guard++<240){
      const q=S.getTextMetrics(el,el.fontSize), b=rotatedBounds(q.width*sx,q.height*sy,el.rotation);
      if(b.width<=mw&&b.height<=mh) break;
      const ratio=Math.min(mw/b.width,mh/b.height);
      const next=Math.max(min,Math.floor(el.fontSize*Math.min(.97,ratio*.985)));
      el.fontSize=next===el.fontSize?el.fontSize-1:next;
    }
  };

  S.localPointToCanvas = (el,lx,ly) => {
    const {x:sx,y:sy}=S.getScales(el), r=(el.rotation||0)*Math.PI/180;
    const px=lx*sx, py=ly*sy;
    return {
      x:canvas.width/2+el.x+px*Math.cos(r)-py*Math.sin(r),
      y:canvas.height/2+el.y+px*Math.sin(r)+py*Math.cos(r)
    };
  };

  S.canvasToElementAxes = (el,point) => {
    const dx=point.x-(canvas.width/2+el.x),dy=point.y-(canvas.height/2+el.y),r=-(el.rotation||0)*Math.PI/180;
    return {x:dx*Math.cos(r)-dy*Math.sin(r),y:dx*Math.sin(r)+dy*Math.cos(r)};
  };

  S.getSelectionGeometry = el => {
    const b=S.getElementBaseBounds(el), hw=b.w/2, hh=b.h/2;
    const local={nw:[-hw,-hh],n:[0,-hh],ne:[hw,-hh],e:[hw,0],se:[hw,hh],s:[0,hh],sw:[-hw,hh],w:[-hw,0]};
    const handles=Object.entries(local).map(([id,[x,y]])=>({id,...S.localPointToCanvas(el,x,y)}));
    const corners=['nw','ne','se','sw'].map(id=>handles.find(h=>h.id===id));
    return {bounds:b,handles,corners};
  };

  S.canvasUnitsForCssPx = px => {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width) return px*3;
    return px*(canvas.width/rect.width);
  };

  S.hitTestResizeHandle = (point,el=S.getActiveElement()) => {
    if(!el||!viewState.showSelection) return null;
    const radius=S.canvasUnitsForCssPx(13);
    const geo=S.getSelectionGeometry(el);
    for(const h of geo.handles){
      if(Math.hypot(point.x-h.x,point.y-h.y)<=radius) return h.id;
    }
    return null;
  };

  S.hitTestElement = (el,point) => {
    if(!el) return false;
    const axes=S.canvasToElementAxes(el,point), {x:sx,y:sy}=S.getScales(el), b=S.getElementBaseBounds(el), tol=S.canvasUnitsForCssPx(7);
    return Math.abs(axes.x)<=b.w*sx/2+tol && Math.abs(axes.y)<=b.h*sy/2+tol;
  };

  S.topHit = point => {
    for(let i=state.elements.length-1;i>=0;i--) if(S.hitTestElement(state.elements[i],point)) return state.elements[i];
    return null;
  };

  const drawDeviceCutout = (frame,w,h,color) => {
    if(frame.cutout==='island'){
      const iw=Math.min(w*.26,150), ih=Math.max(16,Math.min(34,h*.024));
      ctx.fillStyle=color; roundedPath(-iw/2,-h/2+10,iw,ih,ih/2); ctx.fill();
    }else if(frame.cutout==='hole'){
      const rr=Math.max(5,Math.min(9,w*.014));
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(0,-h/2+16,rr,0,Math.PI*2); ctx.fill();
    }
    if(frame.crease){
      ctx.save();
      const g=ctx.createLinearGradient(-8,0,8,0); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.5,'rgba(20,24,32,.12)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(-8,-h/2,16,h); ctx.restore();
    }
  };

  const drawImage = el => {
    const w=el.baseWidth||400,h=el.baseHeight||800,frame=S.getFrameDefinition(el.frame),color=el.frameColor||'#111827';
    if(frame.kind==='none'){
      applyShadow(el); ctx.drawImage(el.image,-w/2,-h/2,w,h); ctx.shadowColor='transparent'; return;
    }
    if(frame.kind==='rounded'){
      const r=el.borderRadius??frame.radius;
      applyShadow(el); ctx.fillStyle='rgba(255,255,255,.001)'; roundedPath(-w/2,-h/2,w,h,r); ctx.fill(); ctx.shadowColor='transparent';
      ctx.save(); roundedPath(-w/2,-h/2,w,h,r); ctx.clip(); ctx.drawImage(el.image,-w/2,-h/2,w,h); ctx.restore();
      ctx.strokeStyle=color; ctx.lineWidth=4; roundedPath(-w/2,-h/2,w,h,r); ctx.stroke(); return;
    }
    const bezel=frame.bezel||8,r=el.borderRadius??frame.radius,ow=w+bezel*2,oh=h+bezel*2;
    applyShadow(el); ctx.fillStyle=color; roundedPath(-ow/2,-oh/2,ow,oh,r+bezel); ctx.fill(); ctx.shadowColor='transparent';
    ctx.save(); roundedPath(-w/2,-h/2,w,h,r); ctx.clip(); ctx.drawImage(el.image,-w/2,-h/2,w,h); ctx.restore();
    drawDeviceCutout(frame,w,h,color);
  };

  const drawText = el => {
    const m=S.getTextMetrics(el);
    ctx.font=`700 ${el.fontSize}px 'Cairo',system-ui,sans-serif`;
    ctx.fillStyle=el.color||'#111827'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.direction=S.detectDirection(el.content);
    applyShadow(el);
    m.lines.forEach((line,i)=>ctx.fillText(line,0,i*m.lineHeight-(m.lines.length-1)*m.lineHeight/2));
    ctx.shadowColor='transparent';
  };

  S.drawSelectionOverlay = el => {
    if(!el||!viewState.showSelection||el.id!==state.activeElementId) return;
    const geo=S.getSelectionGeometry(el), line=S.canvasUnitsForCssPx(2), r=S.canvasUnitsForCssPx(6.5), outer=S.canvasUnitsForCssPx(1.5);
    ctx.save();
    ctx.shadowColor='transparent'; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.strokeStyle='#5b5ce2'; ctx.lineWidth=line;
    ctx.beginPath();
    ctx.moveTo(geo.corners[0].x,geo.corners[0].y);
    geo.corners.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath(); ctx.stroke();
    geo.handles.forEach(h=>{
      ctx.beginPath(); ctx.arc(h.x,h.y,r,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); ctx.lineWidth=outer; ctx.strokeStyle='#5b5ce2'; ctx.stroke();
    });
    ctx.restore();
  };

  S.render = () => {
    S.renderBackground();
    state.elements.forEach(el=>{
      S.ensureElementTransform(el);
      const {x:sx,y:sy}=S.getScales(el);
      ctx.save();
      ctx.translate(canvas.width/2+el.x,canvas.height/2+el.y);
      ctx.rotate((el.rotation||0)*Math.PI/180);
      ctx.scale(sx,sy);
      if(el.type==='image') drawImage(el); else drawText(el);
      ctx.restore();
    });
    S.drawSelectionOverlay(S.getActiveElement());
    document.getElementById('emptyState')?.classList.toggle('hidden',state.elements.length>0);
  };

  S.fitCanvasToStage = () => {
    const rect=S.canvasArea.getBoundingClientRect(); if(!rect.width||!rect.height) return;
    const pad=window.innerWidth<=780?18:34, base=Math.min((rect.width-pad)/canvas.width,(rect.height-pad)/canvas.height), sc=Math.max(.03,base*(viewState.zoom/100));
    canvas.style.width=`${Math.round(canvas.width*sc)}px`; canvas.style.height=`${Math.round(canvas.height*sc)}px`;
    const z=document.getElementById('zoomDisplay'); if(z) z.textContent=`${Math.round(viewState.zoom)}%`;
    S.render();
  };

  S.setZoom = v => { viewState.zoom=Math.max(30,Math.min(300,v)); S.fitCanvasToStage(); };

  S.setCanvasSize = (w,h) => {
    const sx=w/state.canvas.width,sy=h/state.canvas.height;
    state.elements.forEach(el=>{el.x*=sx;el.y*=sy;});
    state.canvas={width:w,height:h}; canvas.width=w; canvas.height=h;
    S.getTextElements().forEach(S.fitTextElementToCanvas);
    S.render(); S.fitCanvasToStage(); S.syncAllUI(); S.saveState();
  };

  S.loadImageFile = f => new Promise((res,rej)=>{
    const r=new FileReader(); r.onerror=()=>rej(new Error('تعذر قراءة الصورة'));
    r.onload=e=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('ملف الصورة غير صالح'));i.src=e.target.result;};
    r.readAsDataURL(f);
  });

  S.addImage = (img,name='صورة') => {
    const ratio=Math.min(canvas.width*.68/img.width,canvas.height*.68/img.height,1);
    const el={id:S.uid('img'),type:'image',name:name||'صورة',image:img,x:0,y:0,scale:1,scaleX:1,scaleY:1,aspectLocked:true,rotation:0,baseWidth:Math.max(20,img.width*ratio),baseHeight:Math.max(20,img.height*ratio),frame:'none',frameColor:'#111827',borderRadius:46,shadow:S.makeShadow('image')};
    state.elements.push(el); state.activeElementId=el.id; S.render(); S.syncAllUI(); S.saveState(); return el;
  };

  S.addText = (content='نص جديد') => {
    const el={id:S.uid('txt'),type:'text',name:'نص',content,x:0,y:-canvas.height*.22,scale:1,scaleX:1,scaleY:1,aspectLocked:true,rotation:0,fontSize:Math.round(Math.min(canvas.width,canvas.height)*.072),color:'#111827',autoFit:true,translationKey:S.uniqueTranslationKey(),shadow:{enabled:false,blur:16,opacity:24,x:0,y:8,color:'#111827'}};
    state.elements.push(el); state.activeElementId=el.id; S.fitTextElementToCanvas(el); S.render(); S.syncAllUI(); S.saveState(); return el;
  };

  S.deleteElement = id => {
    const i=state.elements.findIndex(x=>x.id===id); if(i<0)return;
    state.elements.splice(i,1);
    if(state.activeElementId===id) state.activeElementId=state.elements[i-1]?.id||state.elements[i]?.id||null;
    S.render(); S.syncAllUI(); S.saveState();
  };

  S.setActiveElement = id => { state.activeElementId=id; S.render(); S.syncAllUI(); };

  S.centerElement = (axis='both',el=S.getActiveElement()) => {
    if(!el)return; if(axis==='both'||axis==='x')el.x=0; if(axis==='both'||axis==='y')el.y=0;
    S.render(); S.syncAllUI(); S.saveState();
  };

  S.fitElementToCanvas = (el=S.getActiveElement()) => {
    if(!el)return;
    const b=S.getElementBaseBounds(el),{x:sx,y:sy}=S.getScales(el),mw=canvas.width*.82,mh=canvas.height*.82;
    const visual=rotatedBounds(b.w*sx,b.h*sy,el.rotation);
    if(visual.width>mw||visual.height>mh){
      const factor=Math.min(mw/visual.width,mh/visual.height); S.scaleElementByFactor(el,factor);
    }
    el.x=Math.max(-canvas.width*.45,Math.min(canvas.width*.45,el.x));
    el.y=Math.max(-canvas.height*.45,Math.min(canvas.height*.45,el.y));
    S.render(); S.syncAllUI(); S.saveState();
  };

  S.selectBackground = id => { state.background.type='preset';state.background.presetId=id;state.background.colors=null;S.render();S.syncAllUI();S.saveState(); };
  S.useSolidBackground = h => { state.background.type='solid';state.background.solid=h;S.render();S.syncAllUI();S.saveState(); };
  S.useImageBackground = i => { state.background.type='image';state.background.image=i;S.render();S.syncAllUI();S.saveState(); };

  const rgbHsl=(r,g,b)=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}return{h,s:s*100,l:l*100};};
  const hslHex=(h,s,l)=>{s/=100;l/=100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return'#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');};

  S.suggestBackgroundFromImage = () => {
    const el=state.elements.find(x=>x.type==='image'); if(!el){S.showToast('أضف صورة أولًا لاستخراج ألوان مناسبة.');return;}
    const o=document.createElement('canvas');o.width=o.height=64;const c=o.getContext('2d',{willReadFrequently:true});c.drawImage(el.image,0,0,64,64);const d=c.getImageData(0,0,64,64).data;
    let ar=0,ag=0,ab=0,n=0,b1={score:-1,r:91,g:92,b:226},b2={score:-1,r:129,g:140,b:248};
    for(let i=0;i<d.length;i+=16){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];if(a<80)continue;ar+=r;ag+=g;ab+=b;n++;const h=rgbHsl(r,g,b),sc=h.s*(1-Math.abs(h.l-55)/70);if(sc>b1.score){b2=b1;b1={score:sc,r,g,b}}else if(sc>b2.score)b2={score:sc,r,g,b};}
    if(!n)return;const av=rgbHsl(ar/n,ag/n,ab/n),a=rgbHsl(b1.r,b1.g,b1.b),z=rgbHsl(b2.r,b2.g,b2.b);
    state.background.type='smart';state.background.colors=[hslHex(a.h,Math.min(58,Math.max(22,a.s)),93),hslHex(av.h,Math.min(42,Math.max(14,av.s)),97),hslHex(z.h,Math.min(54,Math.max(20,z.s)),91)];state.background.spots=[[hslHex(a.h,Math.min(70,a.s+10),68),.15,.18,.22],[hslHex(z.h,Math.min(70,z.s+10),70),.14,.82,.78]];state.background.presetId='cloud';
    S.render();S.syncAllUI();S.saveState();S.showToast('تم إنشاء خلفية متناسقة من ألوان الصورة.');
  };

  S.exportCanvas = (name=`studiopro_${Date.now()}.png`) => {
    const active=state.activeElementId; state.activeElementId=null; S.render();
    const link=document.createElement('a');link.download=name;link.href=canvas.toDataURL('image/png',1);link.click();
    state.activeElementId=active;S.render();
  };
})();
