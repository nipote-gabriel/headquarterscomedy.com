/**
 * Home page: one-page extras on top of app.js.
 * - Highlights the nav link for the section in view
 * - Closes the mobile menu after tapping a section link
 * - Pauses the hero video once the page has scrolled over it
 */
(function () {
    'use strict';

    function setupActiveNav() {
        const ids = ['about', 'tickets', 'book'];
        const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
        if (!('IntersectionObserver' in window) || !sections.length) return;

        const setActive = (id) => {
            document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
                link.classList.toggle('active', id !== null && link.getAttribute('href') === '#' + id);
            });
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setActive(entry.target.id);
                else if (entry.target === sections[0] && entry.boundingClientRect.top > 0) setActive(null);
            });
        }, { rootMargin: '-45% 0px -54% 0px' });
        sections.forEach((section) => observer.observe(section));
    }

    function setupMobileMenuLinks() {
        const overlay = document.querySelector('.mobile-menu-overlay');
        if (!overlay) return;
        overlay.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', () => {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    function setupHeroPause() {
        const video = document.getElementById('hero-video');
        const spacer = document.querySelector('.hero-scroll-spacer');
        if (!video || !spacer || !('IntersectionObserver' in window)) return;

        let pausedByScroll = false;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries[0].isIntersecting;
            if (!visible && !video.paused) {
                video.pause();
                pausedByScroll = true;
            } else if (visible && pausedByScroll) {
                video.play().catch(() => {});
                pausedByScroll = false;
            }
        });
        observer.observe(spacer);
    }

    document.addEventListener('DOMContentLoaded', () => {
        [setupActiveNav, setupMobileMenuLinks, setupHeroPause].forEach((fn) => {
            try { fn(); } catch (error) { console.error(error); }
        });
    });
})();
