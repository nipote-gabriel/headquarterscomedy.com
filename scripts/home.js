/**
 * Home page: one-page extras on top of app.js.
 * - Highlights the nav link for the section in view
 * - Closes the mobile menu after tapping a section link
 * - Pauses the hero video once the page has scrolled over it
 * - Shrinks the hero video into a rounded card as you scroll
 * - Shows the welcome popup (newsletter + next show tickets)
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

    // Welcome popup: shown shortly after arrival, then not again for a week
    // once dismissed or subscribed. Show details are copied from the Next
    // Show card so there's only one place to update them.
    function setupWelcomePopup() {
        const popup = document.getElementById('hq-popup');
        if (!popup) return;

        const KEY = 'hqPopupDismissedAt';
        const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
        const read = () => { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } };
        const write = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* storage blocked */ } };

        const forceOpen = /[?&]popup=1\b/.test(location.search);
        if (!forceOpen && Date.now() - read() < SNOOZE_MS) return;

        // Fill the next-show strip from the page's Next Show card
        const card = document.querySelector('.show-card');
        const showLink = document.getElementById('hq-popup-show');
        const text = (sel) => (card && card.querySelector(sel) ? card.querySelector(sel).textContent.trim() : '');
        const ticketA = card && card.querySelector('.show-action a');
        if (card && ticketA) {
            const venue = card.querySelector('.show-info h3');
            popup.querySelector('[data-show="month"]').textContent = text('.show-date-month');
            popup.querySelector('[data-show="day"]').textContent = text('.show-date-day');
            popup.querySelector('[data-show="venue"]').textContent = venue ? venue.innerText.replace(/\s*\n\s*/g, ', ') : '';
            popup.querySelector('[data-show="time"]').textContent = text('.show-venue');
            showLink.href = ticketA.href;
        } else if (showLink) {
            showLink.remove();
        }

        const formTarget = document.getElementById('hq-popup-form');
        let lastFocus = null;

        const loadForm = () => {
            if (!formTarget || formTarget.dataset.loaded) return;
            formTarget.dataset.loaded = 'true';
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
            script.setAttribute('data-beehiiv-form', '706c65d7-5d79-4d82-8b9e-1068d15b6c2e');
            formTarget.appendChild(script);
        };

        const open = () => {
            loadForm();
            lastFocus = document.activeElement;
            popup.hidden = false;
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => popup.classList.add('is-open'));
            popup.querySelector('.hq-popup-close').focus({ preventScroll: true });
        };

        const close = () => {
            write();
            popup.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { popup.hidden = true; }, 300);
            if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        };

        popup.querySelector('.hq-popup-close').addEventListener('click', close);
        popup.querySelector('.hq-popup-skip').addEventListener('click', close);
        if (showLink) showLink.addEventListener('click', () => write());
        popup.addEventListener('click', (e) => { if (e.target === popup) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !popup.hidden) close();
        });

        // Close a moment after a successful Beehiiv signup
        window.addEventListener('message', (event) => {
            if (popup.hidden) return;
            const d = event.data;
            const ok = (typeof d === 'string' && /success|subscribe/i.test(d)) ||
                (d && typeof d === 'object' && ((typeof d.type === 'string' && /success|subscribe/i.test(d.type)) || d.status === 'success' || d.subscribed === true));
            if (ok) setTimeout(close, 1500);
        });

        setTimeout(open, forceOpen ? 0 : 1500);
    }

    document.addEventListener('DOMContentLoaded', () => {
        [setupActiveNav, setupMobileMenuLinks, setupHeroPause, setupHeroShrink, setupWelcomePopup].forEach((fn) => {
            try { fn(); } catch (error) { console.error(error); }
        });
    });
})();
