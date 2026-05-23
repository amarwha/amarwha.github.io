// Highlight the active nav link based on the current page filename
document.addEventListener('DOMContentLoaded', () => {
    const currentFile = decodeURIComponent(window.location.pathname).split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        if (linkFile && linkFile === currentFile) {
            link.classList.add('nav-active');
        }
    });

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
