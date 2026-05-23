document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImg = lightbox.querySelector('img');
    const galleryImages = Array.from(document.querySelectorAll('.project-gallery img'));
    const prevBtn  = lightbox.querySelector('.lightbox-prev');
    const nextBtn  = lightbox.querySelector('.lightbox-next');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const captionEl = lightbox.querySelector('.lightbox-caption');

    let currentIndex = 0;
    let loadToken    = 0;
    let isAnimating  = false;

    // Desktop zoom state
    let desktopZoomed = false;
    let maxZoomScale  = 4; // updated from naturalWidth after each image loads

    // ── Unified transform state ─────────────────────────────────────
    // All touch gestures use translate(panX,panY) scale(scale).
    // transform-origin is always center, so pan offsets handle zoom anchor.
    let scale = 1, panX = 0, panY = 0;

    function applyTransform() {
        lightboxImg.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
    }

    function resetTransform(animated) {
        scale = 1; panX = 0; panY = 0;
        lightboxImg.style.transition = animated ? 'transform 0.3s ease' : 'none';
        applyTransform();
    }

    function updateDesktopCursor() {
        const dpr = window.devicePixelRatio || 1;
        if (desktopZoomed) {
            lightboxImg.style.cursor = 'grab';
        } else if (lightboxImg.naturalWidth > lightboxImg.offsetWidth * dpr * 1.1) {
            lightboxImg.style.cursor = 'zoom-in';
        } else {
            lightboxImg.style.cursor = 'default';
        }
    }

    // Keep zoomed image from panning fully out of view
    function clampPan() {
        if (scale <= 1) { panX = 0; panY = 0; return; }
        const vw = window.innerWidth, vh = window.innerHeight;
        const maxX = Math.max(0, (lightboxImg.offsetWidth  * scale - vw) / 2);
        const maxY = Math.max(0, (lightboxImg.offsetHeight * scale - vh) / 2);
        panX = Math.max(-maxX, Math.min(maxX, panX));
        panY = Math.max(-maxY, Math.min(maxY, panY));
    }

    // ── Image loading ───────────────────────────────────────────────
    function showImage() {
        loadToken++;
        const token = loadToken;
        isAnimating = false;
        desktopZoomed = false;
        lightboxImg.style.cursor = 'default';
        resetTransform(false);
        lightboxImg.style.transition = 'none';
        lightboxImg.style.opacity = '0';
        if (captionEl) captionEl.style.opacity = '0';

        const pre = new Image();
        pre.src = galleryImages[currentIndex].src;
        pre.onload = () => {
            if (token !== loadToken) return;
            lightboxImg.src = pre.src;
            if (captionEl) captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
            requestAnimationFrame(() => {
                lightboxImg.style.transition = 'opacity 0.3s ease';
                lightboxImg.style.opacity = '1';
                if (captionEl && captionEl.textContent) captionEl.style.opacity = '1';
                // Compute full-res zoom scale once layout is known
                requestAnimationFrame(() => {
                    const dpr = window.devicePixelRatio || 1;
                    maxZoomScale = Math.max(2, Math.min(5, pre.naturalWidth / (lightboxImg.offsetWidth * dpr)));
                    updateDesktopCursor();
                });
            });
        };
    }

    function updateBtns() {
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentIndex === galleryImages.length - 1 ? 'none' : 'flex';
    }

    function navigate(dir) {
        const i = currentIndex + dir;
        if (i < 0 || i >= galleryImages.length) return;
        currentIndex = i;
        showImage();
        updateBtns();
    }

    function openLightbox(index) {
        currentIndex = index;
        scale = 1; panX = 0; panY = 0;
        lastTapTime = 0;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        showImage();
        updateBtns();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        resetTransform(false);
        desktopZoomed = false;
        lightboxImg.style.cursor = 'default';
    }

    // ── Desktop / keyboard controls ─────────────────────────────────
    galleryImages.forEach((img, i) => img.addEventListener('click', () => openLightbox(i)));
    prevBtn.addEventListener('click',  () => navigate(-1));
    nextBtn.addEventListener('click',  () => navigate(1));
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if      (e.key === 'ArrowLeft')  navigate(-1);
        else if (e.key === 'ArrowRight') navigate(1);
        else if (e.key === 'Escape')     closeLightbox();
    });

    // Fade buttons in/out on mouse zone (desktop)
    lightbox.addEventListener('mousemove', (e) => {
        const w = window.innerWidth, th = w * 0.3;
        prevBtn.style.opacity  = e.clientX < th       ? '1' : '0';
        nextBtn.style.opacity  = e.clientX > w - th   ? '1' : '0';
        closeBtn.style.opacity = '1';
    });
    lightbox.addEventListener('mouseleave', () => {
        prevBtn.style.opacity = nextBtn.style.opacity = closeBtn.style.opacity = '0';
    });

    // ── Desktop zoom & pan ──────────────────────────────────────────
    let dragActive = false, dragMoved = false;
    let dragStartX = 0, dragStartY = 0, dragT0PanX = 0, dragT0PanY = 0;

    lightboxImg.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragActive  = true;
        dragMoved   = false;
        dragStartX  = e.clientX;
        dragStartY  = e.clientY;
        dragT0PanX  = panX;
        dragT0PanY  = panY;
        if (desktopZoomed) lightboxImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragActive || !desktopZoomed) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
        panX = dragT0PanX + dx;
        panY = dragT0PanY + dy;
        clampPan();
        lightboxImg.style.transition = 'none';
        applyTransform();
    });

    document.addEventListener('mouseup', () => {
        if (!dragActive) return;
        dragActive = false;
        if (desktopZoomed) lightboxImg.style.cursor = 'grab';
    });

    lightboxImg.addEventListener('click', (e) => {
        if (dragMoved) { dragMoved = false; return; }
        if (desktopZoomed) {
            scale = 1; panX = 0; panY = 0;
            lightboxImg.style.transition = 'transform 0.3s ease';
            applyTransform();
            desktopZoomed = false;
            updateDesktopCursor();
        } else {
            const zScale = maxZoomScale;
            if (zScale <= 1.05) return;
            const cx  = window.innerWidth  / 2;
            const cy  = window.innerHeight / 2;
            const ipx = (e.clientX - cx - panX) / scale;
            const ipy = (e.clientY - cy - panY) / scale;
            scale = zScale;
            panX  = e.clientX - cx - ipx * zScale;
            panY  = e.clientY - cy - ipy * zScale;
            clampPan();
            lightboxImg.style.transition = 'transform 0.3s ease';
            applyTransform();
            desktopZoomed = true;
            lightboxImg.style.cursor = 'grab';
        }
    });

    // ── Mobile touch system ─────────────────────────────────────────
    // touch-action:none on .lightbox (CSS) blocks the browser's native
    // pinch-to-zoom. e.preventDefault() below is a belt-and-suspenders
    // guard for older browsers.

    let lastTapTime = 0, lastTapX = 0, lastTapY = 0;

    // Per-gesture state
    let gestureType = null; // 'swipe-h' | 'swipe-v' | 'pan' | 'pinch' | 'none'
    let t0X = 0, t0Y = 0, t0Time = 0;
    let t0PanX = 0, t0PanY = 0;
    let pinchStartDist = 1, pinchStartScale = 1;
    let pinchMidX = 0, pinchMidY = 0, pinchStartPanX = 0, pinchStartPanY = 0;
    let activeGesture = false; // false when touch started on a button

    function pinchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
    }

    // ── touchstart ──────────────────────────────────────────────────
    lightbox.addEventListener('touchstart', (e) => {
        // Buttons handle themselves via click; don't intercept them
        if (e.target.closest('button')) { activeGesture = false; return; }
        e.preventDefault();
        activeGesture = true;

        if (e.touches.length === 2) {
            gestureType     = 'pinch';
            pinchStartDist  = pinchDist(e.touches);
            pinchStartScale = scale;
            pinchMidX       = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            pinchMidY       = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            pinchStartPanX  = panX;
            pinchStartPanY  = panY;
            return;
        }

        if (e.touches.length === 1) {
            gestureType = null;
            t0X = e.touches[0].clientX;
            t0Y = e.touches[0].clientY;
            t0Time  = Date.now();
            t0PanX  = panX;
            t0PanY  = panY;
        }
    }, { passive: false });

    // ── touchmove ───────────────────────────────────────────────────
    lightbox.addEventListener('touchmove', (e) => {
        if (!activeGesture) return;
        e.preventDefault();

        // Pinch zoom with midpoint anchor
        if (e.touches.length === 2 && gestureType === 'pinch') {
            const newDist  = pinchDist(e.touches);
            const newScale = Math.min(maxZoomScale, Math.max(1, pinchStartScale * newDist / pinchStartDist));
            // Keep the original pinch midpoint fixed in the viewport
            const cx  = window.innerWidth  / 2;
            const cy  = window.innerHeight / 2;
            const ipx = (pinchMidX - cx - pinchStartPanX) / pinchStartScale;
            const ipy = (pinchMidY - cy - pinchStartPanY) / pinchStartScale;
            scale = newScale;
            panX  = pinchMidX - cx - ipx * newScale;
            panY  = pinchMidY - cy - ipy * newScale;
            lightboxImg.style.transition = 'none';
            applyTransform();
            return;
        }

        if (e.touches.length !== 1 || gestureType === 'pinch') return;

        const dx = e.touches[0].clientX - t0X;
        const dy = e.touches[0].clientY - t0Y;

        // Lock gesture type once movement is unambiguous
        if (gestureType === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            if (scale > 1) {
                gestureType = 'pan';
            } else if (Math.abs(dx) >= Math.abs(dy)) {
                gestureType = 'swipe-h';
            } else {
                gestureType = dy > 0 ? 'swipe-v' : 'none'; // only downward slides close
            }
        }

        if (gestureType === 'pan') {
            panX = t0PanX + dx;
            panY = t0PanY + dy;
            lightboxImg.style.transition = 'none';
            applyTransform();

        } else if (gestureType === 'swipe-h') {
            const atStart = currentIndex === 0;
            const atEnd   = currentIndex === galleryImages.length - 1;
            const d = ((atStart && dx > 0) || (atEnd && dx < 0)) ? dx * 0.15 : dx;
            lightboxImg.style.transition = 'none';
            lightboxImg.style.transform  = `translate(${d}px,0px) scale(1)`;

        } else if (gestureType === 'swipe-v') {
            const d = Math.max(0, dy); // clamp to downward only
            lightboxImg.style.transition = 'none';
            lightboxImg.style.transform  = `translate(0px,${d}px) scale(1)`;
            lightboxImg.style.opacity    = String(Math.max(0.25, 1 - d / 300));
        }
    }, { passive: false });

    // ── touchend ────────────────────────────────────────────────────
    lightbox.addEventListener('touchend', (e) => {
        if (!activeGesture) return;
        e.preventDefault();

        // Pinch released: snap back to 1 if nearly unzoomed, else clamp pan
        if (gestureType === 'pinch') {
            if (scale < 1.1) {
                scale = 1; panX = 0; panY = 0;
                lightboxImg.style.transition = 'transform 0.25s ease';
                applyTransform();
            } else {
                clampPan();
                lightboxImg.style.transition = 'transform 0.2s ease';
                applyTransform();
            }
            gestureType = null;
            return;
        }

        if (e.changedTouches.length < 1) return;
        const touch  = e.changedTouches[0];
        const now    = Date.now();
        const dx     = touch.clientX - t0X;
        const dy     = touch.clientY - t0Y;
        const dt     = now - t0Time;
        const isTap  = Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 250;

        // ── Tap / double-tap ──
        if (isTap || gestureType === null) {
            // Tap on the lightbox background (not image) → close
            if (e.target === lightbox) { closeLightbox(); gestureType = null; return; }

            const tdx      = touch.clientX - lastTapX;
            const tdy      = touch.clientY - lastTapY;
            const timeSince = now - lastTapTime;

            if (lastTapTime > 0 && timeSince < 300 && Math.sqrt(tdx*tdx + tdy*tdy) < 60) {
                // Double-tap: toggle zoom
                lastTapTime = 0;
                if (scale > 1) {
                    // Zoom out to normal
                    scale = 1; panX = 0; panY = 0;
                    lightboxImg.style.transition = 'transform 0.3s ease';
                    applyTransform();
                } else {
                    // Zoom in to full resolution anchored at tap point
                    const tScale = maxZoomScale;
                    const cx  = window.innerWidth  / 2;
                    const cy  = window.innerHeight / 2;
                    // Convert tap viewport coords → image-space coords
                    const ipx = (touch.clientX - cx - panX) / scale;
                    const ipy = (touch.clientY - cy - panY) / scale;
                    scale = tScale;
                    panX  = touch.clientX - cx - ipx * tScale;
                    panY  = touch.clientY - cy - ipy * tScale;
                    lightboxImg.style.transition = 'transform 0.3s ease';
                    applyTransform();
                }
            } else {
                lastTapTime = now;
                lastTapX    = touch.clientX;
                lastTapY    = touch.clientY;
            }
            gestureType = null;
            return;
        }

        // ── Swipe horizontal: navigate ──
        if (gestureType === 'swipe-h') {
            const vel    = Math.abs(dx) / dt;
            const sw     = window.innerWidth;
            const dir    = dx < 0 ? 1 : -1;
            const canGo  = dir === 1
                ? currentIndex < galleryImages.length - 1
                : currentIndex > 0;

            if (canGo && (Math.abs(dx) > sw * 0.25 || vel > 0.4)) {
                if (!isAnimating) commitSwipe(dir, sw);
            } else {
                // Snap back
                lightboxImg.style.transition = 'transform 0.25s ease';
                lightboxImg.style.transform  = 'translate(0px,0px) scale(1)';
                panX = 0; panY = 0;
            }

        // ── Swipe vertical: slide-down to close ──
        } else if (gestureType === 'swipe-v') {
            const vel = dy / dt;
            if (dy > 100 || vel > 0.5) {
                lightboxImg.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
                lightboxImg.style.transform  = `translate(0px,${window.innerHeight}px) scale(1)`;
                lightboxImg.style.opacity    = '0';
                setTimeout(closeLightbox, 260);
            } else {
                // Snap back
                lightboxImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                lightboxImg.style.transform  = 'translate(0px,0px) scale(1)';
                lightboxImg.style.opacity    = '1';
                panX = 0; panY = 0;
            }

        // ── Pan end: snap pan to within bounds ──
        } else if (gestureType === 'pan') {
            clampPan();
            lightboxImg.style.transition = 'transform 0.2s ease';
            applyTransform();
        }

        gestureType = null;
    }, { passive: false });

    // ── Animated swipe to next/prev image ──────────────────────────
    function commitSwipe(dir, sw) {
        isAnimating = true;
        loadToken++;
        scale = 1; panX = 0; panY = 0;

        lightboxImg.style.transition = 'transform 0.25s ease';
        lightboxImg.style.transform  = `translate(${dir === 1 ? -sw : sw}px,0px) scale(1)`;

        setTimeout(() => {
            currentIndex += dir;
            updateBtns();
            if (captionEl) captionEl.style.opacity = '0';

            lightboxImg.style.transition = 'none';
            lightboxImg.style.opacity    = '0';
            lightboxImg.style.transform  = `translate(${dir === 1 ? sw : -sw}px,0px) scale(1)`;

            const pre = new Image();
            pre.src = galleryImages[currentIndex].src;
            pre.onload = () => {
                lightboxImg.src = pre.src;
                if (captionEl) captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    lightboxImg.style.transition = 'transform 0.25s ease, opacity 0.2s ease';
                    lightboxImg.style.transform  = 'translate(0px,0px) scale(1)';
                    lightboxImg.style.opacity    = '1';
                    if (captionEl && captionEl.textContent) captionEl.style.opacity = '1';
                    setTimeout(() => { isAnimating = false; }, 260);
                    const dpr = window.devicePixelRatio || 1;
                    maxZoomScale = Math.max(2, Math.min(5, pre.naturalWidth / (lightboxImg.offsetWidth * dpr)));
                }));
            };
        }, 250);
    }
});
