// --- KEYBOARD SHORTCUTS ---
let isKeyAction = false;

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        redo();
        return;
    }

    if (e.key === 'Escape') {
        e.preventDefault();
        viewState.showSelectionBorders = !viewState.showSelectionBorders;
        render();
        return;
    }

    if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        const idx = state.elements.findIndex(el => el.id === state.activeElementId);
        if (state.elements.length > 0) {
            const nextIdx = (idx + 1) % state.elements.length;
            setActiveElement(state.elements[nextIdx].id);
            render();
        }
        return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            deleteActiveElement();
            return;
        }
    }

    if (e.altKey && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        isKeyAction = true;
        const el = getActiveElement();
        if (el) {
            el.scale += e.key === 'ArrowUp' ? 0.05 : -0.05;
            el.scale = Math.max(0.1, el.scale);
            render();
        }
        return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        isKeyAction = true;
        const step = e.shiftKey ? 50 : 10;
        const el = getActiveElement();
        if (el) {
            if (e.key === 'ArrowUp') el.y -= step;
            if (e.key === 'ArrowDown') el.y += step;
            if (e.key === 'ArrowLeft') el.x -= step;
            if (e.key === 'ArrowRight') el.x += step;
            render();
        }
    }
});

document.addEventListener('keyup', () => {
    if (isKeyAction) {
        saveState();
        isKeyAction = false;
    }
});
