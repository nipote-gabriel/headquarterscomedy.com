/**
 * Home page: one-page extras on top of app.js.
 * - Highlights the nav link for the section in view
 * - Closes the mobile menu after tapping a section link
 * - Pauses the hero video once the page has scrolled over it
 * - Shrinks the hero video into a rounded card as you scroll
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

    // Shrink the pinned hero into a rounded card over the first screen of
    // scroll, while the About section rises over it.
    function setupHeroShrink() {
        const hero = document.querySelector('.hero-fullscreen');
        if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let ticking = false;
        const update = () => {
            ticking = false;
            const progress = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.8), 0), 1);
            hero.style.setProperty('--hero-shrink', progress.toFixed(3));
        };

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    document.addEventListener('DOMContentLoaded', () => {
        [setupActiveNav, setupMobileMenuLinks, setupHeroPause, setupHeroShrink].forEach((fn) => {
            try { fn(); } catch (error) { console.error(error); }
        });
    });
})();
