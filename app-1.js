const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const canvasArea = document.getElementById('canvasArea');
const zoomInput = document.getElementById('zoomInput');
const activeIndicator = document.getElementById('activeIndicator');

const appHistory = { states: [], index: -1, maxStates: 50 };

const viewState = {
    zoom: 25,
    showSelectionBorders: true
};

const state = {
    aspect: 'portrait',
    background: { type: 'gradient', current: 0, solidColor: '#6366f1', image: null },
    elements: [],
    activeElementId: null
};

let elementIdCounter = 0;

const backgrounds = [
    { name: '1', colors: ['#a78bfa', '#c4b5fd', '#93c5fd'] },
    { name: '2', colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'] },
    { name: '3', colors: ['#fbbf24', '#f97316', '#ec4899'] },
    { name: '4', colors: ['#10b981', '#34d399', '#6ee7b7'] },
    { name: '5', colors: ['#f9a8d4', '#fbcfe8', '#fce7f3'] },
    { name: '6', colors: ['#581c87', '#7c3aed', '#a78bfa'] },
    { name: '7', colors: ['#06b6d4', '#22d3ee', '#67e8f9'] },
    { name: '8', colors: ['#ea580c', '#fb923c', '#fdba74'] },
    { name: '9', colors: ['#dc2626', '#f87171', '#fca5a5'] },
    { name: '10', colors: ['#3730a3', '#6366f1', '#a5b4fc'] },
    { name: '11', colors: ['#1e293b', '#334155', '#475569'] },
    { name: '12', colors: ['#111827', '#1f2937', '#374151'] },
    { name: '13', colors: ['#78350f', '#92400e', '#b45309'] },
    { name: '14', colors: ['#134e4a', '#115e59', '#0d9488'] },
    { name: '15', colors: ['#881337', '#9f1239', '#be123c'] }
].map((bg, i) => ({
    ...bg,
    render: (ctx, w, h) => {
        const c = bg.colors;
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, c[0]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[2]);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.3;
        for (let j = 0; j < 3; j++) {
            ctx.fillStyle = c[j % 3];
            ctx.beginPath();
            ctx.ellipse(w * (0.2 + j * 0.3), h * (0.3 + j * 0.2), w * 0.3, h * 0.25, j * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}));

const simpleGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)'
];

const devicePresets = {
    none: { name: 'بدون', borderRadius: 0, padding: 0, notch: false, buttons: false },
    iphone: { name: 'iPhone', borderRadius: 10, padding: 20, notch: true, buttons: false },
    simple: { name: 'إطار بسيط', borderRadius: 10, padding: 20, notch: false, buttons: false },
    buttons: { name: 'مع أزرار', borderRadius: 10, padding: 20, notch: false, buttons: true },
    samsung: { name: 'Samsung', borderRadius: 10, padding: 20, notch: false, buttons: 'unified' }
};

function getActiveElement() {
    return state.elements.find(e => e.id === state.activeElementId);
}

function setActiveElement(id) {
    state.activeElementId = id;
    updateActiveIndicator();
    updateElementsList();
    const el = getActiveElement();
    if (el && el.type === 'image') {
        const br = el.borderRadius !== undefined ? el.borderRadius : 40;
        document.getElementById('borderRadiusSlider').value = br;
        document.getElementById('borderRadiusValue').textContent = br;
        const sh = el.shadowElevation !== undefined ? el.shadowElevation : 0;
        document.getElementById('shadowSlider').value = sh;
        document.getElementById('shadowValue').textContent = sh;
    }
}

function updateActiveIndicator() {
    const el = getActiveElement();
    if (!el) {
        activeIndicator.textContent = '❌ لا يوجد عنصر';
        activeIndicator.style.background = 'rgba(100,100,100,0.9)';
    } else if (el.type === 'text') {
        activeIndicator.textContent = '✏️ نص: ' + (el.content.substring(0, 10) || 'فارغ');
        activeIndicator.style.background = 'rgba(245,158,11,0.9)';
    } else {
        activeIndicator.textContent = '🖼️ صورة: ' + el.name;
        activeIndicator.style.background = 'rgba(99,102,241,0.9)';
    }
}

function updateElementsList() {
    const list = document.getElementById('elementsList');
    list.innerHTML = '';
    if (state.elements.length === 0) {
        list.innerHTML = '<div style="padding:0.5rem;opacity:0.5;">لا توجد عناصر</div>';
        return;
    }
    state.elements.forEach(el => {
        const item = document.createElement('div');
        item.className = 'element-item' + (el.id === state.activeElementId ? ' active' : '');
        const icon = el.type === 'text' ? '✏️' : '🖼️';
        const name = el.type === 'text' ? (el.content.substring(0, 15) || 'نص فارغ') : el.name;
        item.innerHTML = `<span>${icon} ${name}</span><button class="del-btn" data-id="${el.id}">×</button>`;
        item.onclick = (e) => {
            if (e.target.classList.contains('del-btn')) {
                deleteElement(parseInt(e.target.dataset.id));
            } else {
                setActiveElement(el.id);
                render();
            }
        };
        list.appendChild(item);
    });
}

function addImageElement(img, name) {
    const el = {
        type: 'image',
        id: ++elementIdCounter,
        name: name || 'صورة',
        image: img,
        x: 0, y: 0,
        scale: 2,
        rotation: 0,
        frame: 'none',
        customFrame: null,
        frameColor: '#1a1a1a',
        borderRadius: 10,
        shadowElevation: 50
    };
    state.elements.push(el);
    setActiveElement(el.id);
    saveState();
    render();
}

function addTextElement() {
    const el = {
        type: 'text',
        id: ++elementIdCounter,
        content: 'نص جديد',
        fontSize: 48,
        color: '#ffffff',
        shadow: true,
        x: 0, y: 0,
        scale: 1,
        rotation: 0
    };
    state.elements.push(el);
    setActiveElement(el.id);
    saveState();
    render();
}

function deleteElement(id) {
    const idx = state.elements.findIndex(e => e.id === id);
    if (idx !== -1) {
        state.elements.splice(idx, 1);
        if (state.activeElementId === id) {
            state.activeElementId = state.elements.length > 0 ? state.elements[state.elements.length - 1].id : null;
        }
        saveState();
        updateActiveIndicator();
        updateElementsList();
        render();
    }
}

function deleteActiveElement() {
    if (state.activeElementId) deleteElement(state.activeElementId);
}

function setCanvasSize() {
    if (state.aspect === 'portrait') { canvas.width = 1080; canvas.height = 1920; }
    else { canvas.width = 1920; canvas.height = 1080; }
    render();
}

function updateCanvasZoom() {
    canvas.style.transform = `scale(${viewState.zoom / 100})`;
}

function setupPagination(data, containerId, renderFn, pageSize = 9) {
    let currentPage = 0;
    const totalPages = Math.ceil(data.length / pageSize);
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(containerId.replace('Gallery', 'PrevBtn'));
    const nextBtn = document.getElementById(containerId.replace('Gallery', 'NextBtn'));
    const indicator = document.getElementById(containerId.replace('Gallery', 'PageIndicator'));

    function update() {
        container.innerHTML = '';
        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, data.length);
        const pageData = data.slice(start, end);
        pageData.forEach((item, relativeIndex) => {
            renderFn(item, start + relativeIndex, container);
        });
        indicator.textContent = `${currentPage + 1} / ${totalPages}`;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === totalPages - 1;
        prevBtn.style.opacity = prevBtn.disabled ? 0.5 : 1;
        nextBtn.style.opacity = nextBtn.disabled ? 0.5 : 1;
    }

    prevBtn.onclick = () => { if (currentPage > 0) { currentPage--; update(); } };
    nextBtn.onclick = () => { if (currentPage < totalPages - 1) { currentPage++; update(); } };
    update();
}

function initBackgroundGallery() {
    setupPagination(backgrounds, 'bgGallery', (bg, i, container) => {
        const item = document.createElement('div');
        item.className = 'bg-thumb' + (i === state.background.current ? ' active' : '');
        const pc = document.createElement('canvas');
        pc.width = 160; pc.height = 90;
        bg.render(pc.getContext('2d'), 160, 90);
        item.style.backgroundImage = `url(${pc.toDataURL()})`;
        item.style.backgroundSize = 'cover';
        item.onclick = () => {
            document.querySelectorAll('#bgGallery .bg-thumb').forEach(e => e.classList.remove('active'));
            item.classList.add('active');
            state.background.current = i;
            saveState();
            render();
        };
        container.appendChild(item);
    });
}

function initSimpleGallery() {
    setupPagination(simpleGradients, 'simpleGallery', (g, i, container) => {
        const item = document.createElement('div');
        item.className = 'bg-thumb' + (state.background.type === 'simple' && state.background.current === i ? ' active' : '');
        item.style.background = g;
        item.onclick = () => {
            document.querySelectorAll('#simpleGallery .bg-thumb').forEach(e => e.classList.remove('active'));
            item.classList.add('active');
            state.background.current = i;
            saveState();
            render();
        };
        container.appendChild(item);
    });
}

function initDeviceGrid() {
    const grid = document.getElementById('deviceGrid');
    Object.entries(devicePresets).forEach(([key, preset]) => {
        const item = document.createElement('div');
        item.className = 'device-card' + (key === 'none' ? ' active' : '');
        if (key !== 'none') {
            const preview = document.createElement('div');
            preview.className = 'device-wireframe';
            preview.style.borderRadius = preset.borderRadius + 'px';
            item.appendChild(preview);
        } else item.innerHTML = '<div>بدون</div>';
        item.onclick = () => {
            document.querySelectorAll('.device-card').forEach(e => e.classList.remove('active'));
            item.classList.add('active');
            const el = getActiveElement();
            if (el && el.type === 'image') {
                el.frame = key;
                saveState(); render();
            }
        };
        grid.appendChild(item);
    });
}
