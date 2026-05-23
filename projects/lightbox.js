document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    const galleryImages = Array.from(document.querySelectorAll('.project-gallery img'));
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const captionEl = lightbox.querySelector('.lightbox-caption');

    let currentIndex = 0;
    let loadToken = 0;
    let isAnimating = false;
    let isZoomed = false;

    // Double-tap tracking
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    // Swipe tracking
    let touchStartX = 0;
    let touchStartTime = 0;
    let isDragging = false;

    function resetZoom() {
        isZoomed = false;
        lightboxImg.style.transformOrigin = 'center center';
        lightboxImg.style.transform = 'translateX(0) scale(1)';
    }

    function showImage() {
        loadToken++;
        const token = loadToken;
        isZoomed = false;
        lightboxImg.style.transition = 'opacity 0.3s ease';
        lightboxImg.style.transformOrigin = 'center center';
        lightboxImg.style.transform = 'translateX(0) scale(1)';
        lightboxImg.style.opacity = '0';
        if (captionEl) captionEl.style.opacity = '0';

        const preloader = new Image();
        preloader.src = galleryImages[currentIndex].src;

        preloader.onload = () => {
            if (token !== loadToken) return;
            lightboxImg.src = preloader.src;
            if (captionEl) captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
            requestAnimationFrame(() => {
                lightboxImg.style.opacity = '1';
                if (captionEl && captionEl.textContent) captionEl.style.opacity = '1';
            });
        };
    }

    function updateButtonVisibility() {
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentIndex === galleryImages.length - 1 ? 'none' : 'flex';
    }

    function navigate(direction) {
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= galleryImages.length) return;
        currentIndex = newIndex;
        showImage();
        updateButtonVisibility();
    }

    function openLightbox(index) {
        currentIndex = index;
        isZoomed = false;
        lastTapTime = 0;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        showImage();
        updateButtonVisibility();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        resetZoom();
    }

    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => openLightbox(index));
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    closeBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        switch (e.key) {
            case 'ArrowLeft':  navigate(-1); break;
            case 'ArrowRight': navigate(1);  break;
            case 'Escape':     closeLightbox(); break;
        }
    });

    lightbox.addEventListener('mousemove', (e) => {
        const w = window.innerWidth;
        const threshold = w * 0.3;
        prevBtn.style.opacity = e.clientX < threshold ? '1' : '0';
        nextBtn.style.opacity = e.clientX > (w - threshold) ? '1' : '0';
        closeBtn.style.opacity = '1';
    });

    lightbox.addEventListener('mouseleave', () => {
        prevBtn.style.opacity = '0';
        nextBtn.style.opacity = '0';
        closeBtn.style.opacity = '0';
    });

    // ── Touch handling ─────────────────────────────────────────────

    lightbox.addEventListener('touchstart', (e) => {
        // Multi-touch (pinch): cancel swipe entirely
        if (e.touches.length > 1) {
            isDragging = false;
            return;
        }
        // No swipe while zoomed or animating
        if (isAnimating || isZoomed) {
            isDragging = false;
            return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        isDragging = true;
        lightboxImg.style.transition = 'none';
    }, { passive: true });

    lightbox.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const delta = e.touches[0].clientX - touchStartX;
        const atStart = currentIndex === 0;
        const atEnd = currentIndex === galleryImages.length - 1;
        // Rubber-band at edges
        const d = ((atStart && delta > 0) || (atEnd && delta < 0)) ? delta * 0.15 : delta;
        lightboxImg.style.transform = `translateX(${d}px) scale(1)`;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        if (e.changedTouches.length !== 1) return;
        const touch = e.changedTouches[0];
        const now = Date.now();
        const moveDelta = touch.clientX - touchStartX;

        // If barely moved, treat as a tap regardless of isDragging
        if (isDragging && Math.abs(moveDelta) < 10) {
            isDragging = false;
        }

        if (!isDragging) {
            // ── Tap / double-tap detection ──
            const timeSince = now - lastTapTime;
            const dx = touch.clientX - lastTapX;
            const dy = touch.clientY - lastTapY;

            if (lastTapTime > 0 && timeSince < 300 && Math.sqrt(dx * dx + dy * dy) < 60) {
                // Double-tap!
                lastTapTime = 0;
                if (isZoomed) {
                    lightboxImg.style.transition = 'transform 0.3s ease';
                    resetZoom();
                } else {
                    const rect = lightboxImg.getBoundingClientRect();
                    const ox = ((touch.clientX - rect.left) / rect.width) * 100;
                    const oy = ((touch.clientY - rect.top) / rect.height) * 100;
                    lightboxImg.style.transformOrigin = `${ox}% ${oy}%`;
                    lightboxImg.style.transition = 'transform 0.3s ease';
                    lightboxImg.style.transform = 'scale(2.5)';
                    isZoomed = true;
                }
            } else {
                lastTapTime = now;
                lastTapX = touch.clientX;
                lastTapY = touch.clientY;
            }
            return;
        }

        // ── Swipe commit / snap-back ──
        isDragging = false;
        const velocity = Math.abs(moveDelta) / (now - touchStartTime);
        const screenWidth = window.innerWidth;
        const direction = moveDelta < 0 ? 1 : -1;

        const canGo = direction === 1
            ? currentIndex < galleryImages.length - 1
            : currentIndex > 0;

        if (canGo && (Math.abs(moveDelta) > screenWidth * 0.25 || velocity > 0.4)) {
            isAnimating = true;
            loadToken++;
            lightboxImg.style.transition = 'transform 0.25s ease';
            lightboxImg.style.transform = `translateX(${direction === 1 ? -screenWidth : screenWidth}px) scale(1)`;

            setTimeout(() => {
                currentIndex += direction;
                updateButtonVisibility();
                if (captionEl) captionEl.style.opacity = '0';

                lightboxImg.style.transition = 'none';
                lightboxImg.style.opacity = '0';
                lightboxImg.style.transformOrigin = 'center center';
                lightboxImg.style.transform = `translateX(${direction === 1 ? screenWidth : -screenWidth}px) scale(1)`;

                const preloader = new Image();
                preloader.src = galleryImages[currentIndex].src;
                preloader.onload = () => {
                    lightboxImg.src = preloader.src;
                    if (captionEl) captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            lightboxImg.style.transition = 'transform 0.25s ease, opacity 0.2s ease';
                            lightboxImg.style.transform = 'translateX(0) scale(1)';
                            lightboxImg.style.opacity = '1';
                            if (captionEl && captionEl.textContent) captionEl.style.opacity = '1';
                            setTimeout(() => { isAnimating = false; }, 260);
                        });
                    });
                };
            }, 250);
        } else {
            lightboxImg.style.transition = 'transform 0.25s ease';
            lightboxImg.style.transform = 'translateX(0) scale(1)';
        }
    });
});
