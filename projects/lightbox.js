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

    function showImage() {
        loadToken++;
        const token = loadToken;
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

    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            currentIndex = index;
            lightbox.classList.add('active');
            showImage();
            updateButtonVisibility();
        });
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        switch (e.key) {
            case 'ArrowLeft':  navigate(-1); break;
            case 'ArrowRight': navigate(1);  break;
            case 'Escape':     lightbox.classList.remove('active'); break;
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

    // Touch swipe left/right to navigate
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    });
});
