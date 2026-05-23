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

    function showImage() {
        loadToken++;
        const token = loadToken;
        lightboxImg.style.transition = 'opacity 0.3s ease';
        lightboxImg.style.transform = 'translateX(0)';
        lightboxImg.style.opacity = '0';
        if (captionEl) captionEl.style.opacity = '0';

        const preloader = new Image();
        preloader.src = galleryImages[currentIndex].src;

        preloader.onload = () => {
            if (token !== loadToken) return;
            lightboxImg.src = preloader.src;
            if (captionEl) {
                captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
            }
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
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        showImage();
        updateButtonVisibility();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
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
        const windowWidth = window.innerWidth;
        const mouseX = e.clientX;
        const threshold = windowWidth * 0.3;
        prevBtn.style.opacity = mouseX < threshold ? '1' : '0';
        nextBtn.style.opacity = mouseX > (windowWidth - threshold) ? '1' : '0';
        closeBtn.style.opacity = '1';
    });

    lightbox.addEventListener('mouseleave', () => {
        prevBtn.style.opacity = '0';
        nextBtn.style.opacity = '0';
        closeBtn.style.opacity = '0';
    });

    // Interactive touch swipe — image follows finger, commits on release
    let touchStartX = 0;
    let touchStartTime = 0;
    let isDragging = false;

    lightbox.addEventListener('touchstart', (e) => {
        if (isAnimating || e.touches.length !== 1) return;
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
        // Rubber-band resistance at boundaries
        const d = ((atStart && delta > 0) || (atEnd && delta < 0)) ? delta * 0.15 : delta;
        lightboxImg.style.transform = `translateX(${d}px)`;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const delta = e.changedTouches[0].clientX - touchStartX;
        const velocity = Math.abs(delta) / (Date.now() - touchStartTime);
        const screenWidth = window.innerWidth;
        const direction = delta < 0 ? 1 : -1;

        const canGo = direction === 1
            ? currentIndex < galleryImages.length - 1
            : currentIndex > 0;

        if (canGo && (Math.abs(delta) > screenWidth * 0.25 || velocity > 0.4)) {
            // Commit: slide current image out then bring next one in
            isAnimating = true;
            loadToken++;
            lightboxImg.style.transition = 'transform 0.25s ease';
            lightboxImg.style.transform = `translateX(${direction === 1 ? -screenWidth : screenWidth}px)`;

            setTimeout(() => {
                currentIndex += direction;
                updateButtonVisibility();
                if (captionEl) captionEl.style.opacity = '0';

                lightboxImg.style.transition = 'none';
                lightboxImg.style.opacity = '0';
                lightboxImg.style.transform = `translateX(${direction === 1 ? screenWidth : -screenWidth}px)`;

                const preloader = new Image();
                preloader.src = galleryImages[currentIndex].src;
                preloader.onload = () => {
                    lightboxImg.src = preloader.src;
                    if (captionEl) captionEl.textContent = galleryImages[currentIndex].dataset.title || '';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            lightboxImg.style.transition = 'transform 0.25s ease, opacity 0.2s ease';
                            lightboxImg.style.transform = 'translateX(0)';
                            lightboxImg.style.opacity = '1';
                            if (captionEl && captionEl.textContent) captionEl.style.opacity = '1';
                            setTimeout(() => { isAnimating = false; }, 260);
                        });
                    });
                };
            }, 250);
        } else {
            // Snap back
            lightboxImg.style.transition = 'transform 0.25s ease';
            lightboxImg.style.transform = 'translateX(0)';
        }
    });
});
