// --- UI EVENTS ---
document.querySelectorAll('.aspect-btn').forEach(btn => {
btn.onclick = () => {
document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
state.aspect = btn.dataset.aspect;
saveState(); setCanvasSize();
};
});
document.getElementById('bgType').onchange = (e) => {
state.background.type = e.target.value;
document.getElementById('gradientSection').style.display = state.background.type === 'gradient' ? 'block' : 'none';
document.getElementById('simpleSection').style.display = state.background.type === 'simple' ? 'block' : 'none';
document.getElementById('solidSection').style.display = state.background.type === 'solid' ? 'block' : 'none';
document.getElementById('imageSection').style.display = state.background.type === 'image' ? 'block' : 'none';
saveState(); render();
};
document.getElementById('randomBg').onclick = () => {
const i = Math.floor(Math.random() * backgrounds.length);
state.background.current = i;
document.querySelectorAll('#bgGallery .bg-item').forEach((e, idx) => { e.classList.remove('active'); if (idx === i) e.classList.add('active'); });
saveState(); render();
};
document.getElementById('solidColor').oninput = (e) => {
state.background.solidColor = e.target.value;
state.background.type = 'solid';
saveState(); render();
};
document.getElementById('bgImageInput').onchange = (e) => {
const file = e.target.files[0];
if (file) {
const reader = new FileReader();
reader.onload = (ev) => {
const img = new Image();
img.onload = () => { state.background.image = img; saveState(); render(); };
img.src = ev.target.result;
};
reader.readAsDataURL(file);
}
};
document.getElementById('imageInput').onchange = (e) => {
Array.from(e.target.files).forEach(file => {
const reader = new FileReader();
reader.onload = (ev) => {
const img = new Image();
img.onload = () => addImageElement(img, file.name.substring(0, 15));
img.src = ev.target.result;
};
reader.readAsDataURL(file);
});
e.target.value = '';
};
let editingTextId = null;
document.getElementById('addTextBtn').onclick = () => {
editingTextId = null;
document.getElementById('textContent').value = '';
document.getElementById('textContent').placeholder = 'نص جديد (اكتب هنا)';
document.getElementById('fontSize').value = 48;
document.getElementById('fontSizeValue').textContent = 48;
document.getElementById('textColor').value = '#ffffff';
document.getElementById('textShadow').checked = true;
document.getElementById('textModal').classList.add('active');
};
document.getElementById('textModalBtn').onclick = () => {
const el = getActiveElement();
if (el && el.type === 'text') {
editingTextId = el.id;
document.getElementById('textContent').value = el.content;
document.getElementById('fontSize').value = el.fontSize;
document.getElementById('fontSizeValue').textContent = el.fontSize;
document.getElementById('textColor').value = el.color;
document.getElementById('textShadow').checked = el.shadow;
document.getElementById('textModal').classList.add('active');
}
};
document.getElementById('confirmTextBtn').onclick = () => {
const content = document.getElementById('textContent').value;
if (!content.trim()) return alert('الرجاء كتابة نص');
const fontSize = parseInt(document.getElementById('fontSize').value);
const color = document.getElementById('textColor').value;
const shadow = document.getElementById('textShadow').checked;
if (editingTextId) {
const el = state.elements.find(e => e.id === editingTextId);
if (el) {
el.content = content;
el.fontSize = fontSize;
el.color = color;
el.shadow = shadow;
}
} else {
const el = {type: 'text', id: ++elementIdCounter, content, fontSize, color, shadow, x: 0, y: 0, scale: 1, rotation: 0};
state.elements.push(el);
setActiveElement(el.id);
}
document.getElementById('textModal').classList.remove('active');
saveState();
render();
};
document.getElementById('deleteBtn').onclick = deleteActiveElement;
document.querySelectorAll('.color-dot').forEach(box => {
box.onclick = () => {
const color = box.dataset.color;
const el = getActiveElement();
if (el && el.type === 'image') {
el.frameColor = color;
const picker = document.getElementById('frameColorPicker');
if (picker) picker.value = color;
document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
box.classList.add('active');
saveState();
render();
}
};
});
document.getElementById('frameColorPicker').oninput = (e) => {
const el = getActiveElement();
if (el && el.type === 'image') {
el.frameColor = e.target.value;
document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
saveState();
render();
}
};
document.getElementById('textModalBtn').onclick = () => {
const el = getActiveElement();
if (el && el.type === 'text') {
editingTextId = el.id;
document.getElementById('textContent').value = el.content;
document.getElementById('fontSize').value = el.fontSize;
document.getElementById('fontSizeValue').textContent = el.fontSize;
document.getElementById('textColor').value = el.color;
document.getElementById('textShadow').checked = el.shadow;
}
document.getElementById('textModal').classList.add('active');
};
document.getElementById('closeTextModal').onclick = () => document.getElementById('textModal').classList.remove('active');
document.getElementById('textModal').onclick = (e) => { if (e.target.id === 'textModal') document.getElementById('textModal').classList.remove('active'); };
document.getElementById('textContent').oninput = (e) => {
const el = getActiveElement();
if (el && el.type === 'text') { el.content = e.target.value; saveState(); render(); updateElementsList(); }
};
document.getElementById('fontSize').oninput = (e) => {
const el = getActiveElement();
document.getElementById('fontSizeValue').textContent = e.target.value;
if (el && el.type === 'text') { el.fontSize = +e.target.value; saveState(); render(); }
};
document.getElementById('textColor').oninput = (e) => {
const el = getActiveElement();
if (el && el.type === 'text') { el.color = e.target.value; saveState(); render(); }
};
document.getElementById('textShadow').onchange = (e) => {
const el = getActiveElement();
if (el && el.type === 'text') { el.shadow = e.target.checked; saveState(); render(); }
};
document.getElementById('borderRadiusSlider').oninput = (e) => {
const el = getActiveElement();
document.getElementById('borderRadiusValue').textContent = e.target.value;
if (el && el.type === 'image') {
el.borderRadius = parseInt(e.target.value);
saveState();
render();
}
};
document.getElementById('shadowSlider').oninput = (e) => {
const el = getActiveElement();
document.getElementById('shadowValue').textContent = e.target.value;
if (el && el.type === 'image') {
el.shadowElevation = parseInt(e.target.value);
saveState();
render();
}
};
function setZoom(val) {
viewState.zoom = Math.max(1, Math.min(300, val));
zoomInput.value = viewState.zoom;
const display = document.getElementById('zoomDisplay');
if (display) display.textContent = viewState.zoom + '%';
updateCanvasZoom();
}
zoomInput.oninput = (e) => setZoom(parseInt(e.target.value) || 100);
document.getElementById('zoomIn').onclick = () => setZoom(viewState.zoom + 5);
document.getElementById('zoomOut').onclick = () => setZoom(viewState.zoom - 5);
document.getElementById('zoomReset').onclick = () => setZoom(100);
let isDragging = false, isRotating = false, startX, startY;
canvas.addEventListener('mousedown', (e) => {
if (e.shiftKey) isRotating = true; else isDragging = true;
startX = e.clientX; startY = e.clientY;
const rect = canvas.getBoundingClientRect();
const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
const my = (e.clientY - rect.top) * (canvas.height / rect.height);
let hit = null;
for (let i = state.elements.length - 1; i >= 0; i--) {
const el = state.elements[i];
const cx = canvas.width / 2 + el.x;
const cy = canvas.height / 2 + el.y;
let w, h;
if (el.type === 'image') { w = el.image.width * el.scale / 5; h = el.image.height * el.scale / 5; }
else { w = 200 * el.scale; h = 100 * el.scale; }
if (mx > cx - w / 2 && mx < cx + w / 2 && my > cy - h / 2 && my < cy + h / 2) { hit = el; break; }
}
if (hit) setActiveElement(hit.id);
});
canvas.addEventListener('mousemove', (e) => {
const dx = e.clientX - startX, dy = e.clientY - startY;
if (isRotating) {
const el = getActiveElement();
if (el) { el.rotation += dx * 0.5; render(); }
} else if (isDragging) {
const zf = 100 / viewState.zoom;
const el = getActiveElement();
if (el) { el.x += dx * zf; el.y += dy * zf; render(); }
}
startX = e.clientX; startY = e.clientY;
});
canvas.addEventListener('dblclick', (e) => {
const rect = canvas.getBoundingClientRect();
const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
const my = (e.clientY - rect.top) * (canvas.height / rect.height);
for (let i = state.elements.length - 1; i >= 0; i--) {
const el = state.elements[i];
const cx = canvas.width / 2 + el.x;
const cy = canvas.height / 2 + el.y;
if (el.type === 'text') {
const w = 200 * el.scale, h = 100 * el.scale;
if (mx > cx - w / 2 && mx < cx + w / 2 && my > cy - h / 2 && my < cy + h / 2) { document.getElementById('textModalBtn').click(); break; }
}
}
});
canvas.addEventListener('mouseup', () => { if (isDragging || isRotating) saveState(); isDragging = isRotating = false; });
canvas.addEventListener('mouseleave', () => { if (isDragging || isRotating) saveState(); isDragging = isRotating = false; });
canvasArea.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom(viewState.zoom + (e.deltaY > 0 ? -10 : 10)); } });
function render() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
if (state.background.type === 'gradient') backgrounds[state.background.current].render(ctx, canvas.width, canvas.height);
else if (state.background.type === 'simple') {
const g = simpleGradients[state.background.current];
const colors = g.match(/#[0-9a-f]{6}/gi) || g.match(/hsl\([^)]+\)/gi) || ['#667eea', '#764ba2'];
const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[colors.length > 1 ? 1 : 0]);
ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
} else if (state.background.type === 'solid') { ctx.fillStyle = state.background.solidColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
else if (state.background.type === 'image' && state.background.image) ctx.drawImage(state.background.image, 0, 0, canvas.width, canvas.height);
state.elements.forEach(el => {
ctx.save();
ctx.translate(canvas.width / 2 + el.x, canvas.height / 2 + el.y);
ctx.rotate(el.rotation * Math.PI / 180);
ctx.scale(el.scale, el.scale);
if (el.type === 'image') {
const imgW = el.image.width, imgH = el.image.height, maxSize = 400;
const ratio = Math.min(maxSize / imgW, maxSize / imgH);
const w = imgW * ratio, h = imgH * ratio;
const preset = devicePresets[el.frame] || devicePresets.none;
const br = el.borderRadius !== undefined ? el.borderRadius : preset.borderRadius;
if (el.shadowElevation > 0) {
ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; ctx.shadowBlur = el.shadowElevation * 1.5; ctx.shadowOffsetY = el.shadowElevation * 0.8;
const shadowRadius = (el.frame === 'none' || el.frame === 'custom') ? 0 : br;
ctx.fillStyle = '#000000'; ctx.beginPath(); roundRect(ctx, -w / 2, -h / 2, w, h, shadowRadius); ctx.fill(); ctx.restore();
}
if (el.frame !== 'none' && el.frame !== 'custom') {
ctx.save(); ctx.beginPath(); roundRect(ctx, -w / 2, -h / 2, w, h, br); ctx.clip(); ctx.drawImage(el.image, -w / 2, -h / 2, w, h); ctx.restore();
ctx.strokeStyle = el.frameColor || '#1a1a1a'; ctx.lineWidth = 5; ctx.beginPath(); roundRect(ctx, -w / 2, -h / 2, w, h, br); ctx.stroke();
if (preset.notch) { ctx.fillStyle = el.frameColor || '#1a1a1a'; ctx.beginPath(); roundRect(ctx, -50, -h / 2 - 2, 100, 24, 12); ctx.fill(); }
if (preset.buttons === true) {
ctx.fillStyle = el.frameColor || '#1a1a1a';
ctx.beginPath(); roundRect(ctx, -w / 2 - 5, -h / 2 + h * 0.2, 3, 22, 1.5); ctx.fill();
ctx.beginPath(); roundRect(ctx, -w / 2 - 5, -h / 2 + h * 0.2 + 30, 3, 22, 1.5); ctx.fill();
ctx.beginPath(); roundRect(ctx, w / 2 + 2, -h / 2 + h * 0.25, 3, 30, 1.5); ctx.fill();
} else if (preset.buttons === 'unified') {
ctx.fillStyle = el.frameColor || '#1a1a1a';
ctx.beginPath(); roundRect(ctx, w / 2 + 2, -h / 2 + h * 0.15, 3, 22, 1.5); ctx.fill();
ctx.beginPath(); roundRect(ctx, w / 2 + 2, -h / 2 + h * 0.15 + 30, 3, 22, 1.5); ctx.fill();
ctx.beginPath(); roundRect(ctx, w / 2 + 2, -h / 2 + h * 0.15 + 65, 3, 30, 1.5); ctx.fill();
}
if (el.id === state.activeElementId && viewState.showSelectionBorders) { ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]); ctx.strokeRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10); ctx.setLineDash([]); }
} else {
ctx.drawImage(el.image, -w / 2, -h / 2, w, h);
if (el.id === state.activeElementId && viewState.showSelectionBorders) { ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]); ctx.strokeRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10); ctx.setLineDash([]); }
}
} else if (el.type === 'text') {
ctx.font = `bold ${el.fontSize}px 'Cairo', 'Segoe UI', sans-serif`; ctx.fillStyle = el.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
if (el.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3; }
const lines = el.content.split('\n'); const lh = el.fontSize * 1.2;
lines.forEach((line, i) => ctx.fillText(line, 0, i * lh - (lines.length - 1) * lh / 2));
if (el.id === state.activeElementId && viewState.showSelectionBorders) { ctx.shadowColor = 'transparent'; const tw = ctx.measureText(lines.reduce((a, b) => a.length > b.length ? a : b, '')).width; const th = lh * lines.length; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.setLineDash([8, 4]); ctx.strokeRect(-tw / 2 - 10, -th / 2 - 10, tw + 20, th + 20); ctx.setLineDash([]); }
}
ctx.restore();
});
}
function roundRect(ctx, x, y, w, h, r) {
ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
}
function cloneState(s) { return { aspect: s.aspect, background: { ...s.background }, elements: s.elements.map(el => ({ ...el })), activeElementId: s.activeElementId }; }
function saveState() { const newState = cloneState(state); if (appHistory.index < appHistory.states.length - 1) appHistory.states = appHistory.states.slice(0, appHistory.index + 1); appHistory.states.push(newState); if (appHistory.states.length > appHistory.maxStates) appHistory.states.shift(); else appHistory.index++; updateUndoRedo(); }
function restoreState(saved) { if (!saved) return; state.aspect = saved.aspect; state.background = { ...saved.background }; state.elements = saved.elements.map(el => ({ ...el })); state.activeElementId = saved.activeElementId; updateActiveIndicator(); updateElementsList(); render(); }
function undo() { if (appHistory.index > 0) { appHistory.index--; restoreState(appHistory.states[appHistory.index]); updateUndoRedo(); } }
function redo() { if (appHistory.index < appHistory.states.length - 1) { appHistory.index++; restoreState(appHistory.states[appHistory.index]); updateUndoRedo(); } }
function updateUndoRedo() { document.getElementById('undoBtn').disabled = appHistory.index <= 0; document.getElementById('redoBtn').disabled = appHistory.index >= appHistory.states.length - 1; }
document.getElementById('undoBtn').onclick = undo;
document.getElementById('redoBtn').onclick = redo;
document.getElementById('exportBtn').onclick = () => {
const wasShowing = viewState.showSelectionBorders; viewState.showSelectionBorders = false; render();
const link = document.createElement('a'); link.download = `mockup_${Date.now()}.png`; link.href = canvas.toDataURL('image/png', 1.0); link.click();
viewState.showSelectionBorders = wasShowing; render();
};
document.getElementById('generateAllBtn').onclick = async () => {
const jsonInput = document.getElementById('jsonInput').value;
try {
const translations = JSON.parse(jsonInput); const keys = Object.keys(translations); if (!keys.length) return alert('JSON غير صالح');
const textEl = state.elements.find(el => el.type === 'text'); if (!textEl) return alert('لا يوجد عنصر نص');
const wasShowing = viewState.showSelectionBorders; viewState.showSelectionBorders = false;
const zip = new JSZip(); const folder = zip.folder('mockups');
for (const key of keys) { textEl.content = translations[key]; render(); await new Promise(r => setTimeout(r, 100)); const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_'); const imageData = canvas.toDataURL('image/png', 1.0).split(',')[1]; folder.file(`${cleanKey}.png`, imageData, { base64: true }); }
const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
viewState.showSelectionBorders = wasShowing; render();
const link = document.createElement('a'); const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, ''); link.download = `mockups_${timestamp}.zip`; link.href = URL.createObjectURL(blob); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 100);
} catch (e) { alert('خطأ: ' + e.message); }
};
initBackgroundGallery();
initSimpleGallery();
initDeviceGrid();
setCanvasSize();
updateElementsList();
saveState();
updateCanvasZoom();
render();
