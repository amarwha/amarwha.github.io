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

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('nav-open');
            hamburger.innerHTML = isOpen ? '&times;' : '&#9776;';
        });

        // Close nav when any link is clicked
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('nav-open');
                hamburger.innerHTML = '&#9776;';
            });
        });

        // Close nav on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sidebar.classList.remove('nav-open');
                hamburger.innerHTML = '&#9776;';
            }
        });
    }
});
