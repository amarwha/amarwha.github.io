// Highlight the active nav link based on the current page filename
document.addEventListener('DOMContentLoaded', () => {
    const currentFile = decodeURIComponent(window.location.pathname).split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        if (linkFile && linkFile === currentFile) {
            link.classList.add('nav-active');
        }
    });

    // Touch: tap once to reveal overlay, tap again to navigate (homepage only)
    const galleryItems = document.querySelectorAll('.gallery .item');
    if (galleryItems.length > 0) {
        galleryItems.forEach(item => {
            item.addEventListener('touchend', (e) => {
                if (!item.classList.contains('active')) {
                    e.preventDefault();
                    galleryItems.forEach(other => other.classList.remove('active'));
                    item.classList.add('active');
                }
                // Second tap: active already set, let the <a> navigate normally
            });
        });

        // Dismiss overlay when tapping outside all items
        document.addEventListener('touchend', (e) => {
            if (!e.target.closest('.gallery .item')) {
                galleryItems.forEach(item => item.classList.remove('active'));
            }
        });
    }

    // Hamburger menu toggle with slide animation
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (hamburger && sidebar) {
        function openNav() {
            sidebar.classList.remove('nav-closing');
            sidebar.classList.add('nav-open');
            hamburger.innerHTML = '&times;';
        }

        function closeNav() {
            sidebar.classList.add('nav-closing');
            sidebar.classList.remove('nav-open');
            hamburger.innerHTML = '&#9776;';
            setTimeout(() => sidebar.classList.remove('nav-closing'), 300);
        }

        hamburger.addEventListener('click', () => {
            sidebar.classList.contains('nav-open') ? closeNav() : openNav();
        });

        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('nav-open')) closeNav();
        });
    }
});
