/**
 * Home page: one-page extras on top of app.js.
 * - Highlights the nav link for the section in view
 * - Closes the mobile menu after tapping a section link
 * - Pauses the hero video once the page has scrolled over it
 * - Shrinks the hero video into a rounded card as you scroll
 * - Shows the welcome popup (newsletter + next show tickets)
 * - Handles the native newsletter signup forms
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

        let lastFocus = null;

        const open = () => {
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

        // Close a moment after a successful signup from the popup form
        popup.addEventListener('hq:subscribed', () => setTimeout(close, 1800));

        setTimeout(open, forceOpen ? 0 : 500);
    }

    // Native newsletter forms (popup + Next Show card). Posts to our own
    // /api/subscribe, which adds the email in Beehiiv. If that endpoint
    // isn't set up or fails, open the Beehiiv signup page instead so the
    // signup isn't lost.
    function setupSubscribeForms() {
        const FALLBACK_URL = 'https://headquarterscomedy.beehiiv.com/subscribe';
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        document.querySelectorAll('form.hq-subscribe').forEach((form) => {
            const input = form.querySelector('input[type="email"]');
            const button = form.querySelector('button[type="submit"]');
            const status = form.querySelector('.hq-subscribe-status');
            const say = (msg, kind) => {
                status.textContent = msg;
                form.dataset.state = kind || '';
            };

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = input.value.trim();
                if (!EMAIL_RE.test(email)) {
                    say('Please enter a valid email address.', 'error');
                    input.focus();
                    return;
                }

                button.disabled = true;
                say('Subscribing…', 'busy');
                try {
                    const r = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    if (r.ok) {
                        const data = await r.json().catch(() => ({}));
                        const pending = /validating|pending/i.test(data.status || '');
                        say(pending ? 'Almost there. Check your inbox to confirm.' : "You're in. Check your inbox.", 'success');
                        input.value = '';
                        form.dispatchEvent(new CustomEvent('hq:subscribed', { bubbles: true }));
                        return;
                    }
                    if (r.status === 400) {
                        say('Please enter a valid email address.', 'error');
                        return;
                    }
                    throw new Error('subscribe failed: ' + r.status);
                } catch (err) {
                    // A link rather than window.open: browsers block tabs opened after an await
                    status.textContent = '';
                    const a = document.createElement('a');
                    a.href = FALLBACK_URL + '?email=' + encodeURIComponent(email);
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.textContent = 'Finish signing up on our newsletter page ↗';
                    status.appendChild(a);
                    form.dataset.state = 'fallback';
                } finally {
                    button.disabled = false;
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        [setupActiveNav, setupMobileMenuLinks, setupHeroPause, setupHeroShrink, setupSubscribeForms, setupWelcomePopup].forEach((fn) => {
            try { fn(); } catch (error) { console.error(error); }
        });
    });
})();
