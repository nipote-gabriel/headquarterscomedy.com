/**
 * Headquarters Comedy: one-page home
 * Hero video controls, scroll-driven hero fade, section reveals,
 * active-section nav, mobile menu, and the lazy Beehiiv embed.
 */
(function () {
    'use strict';

    document.documentElement.classList.add('js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, { event_category: category, event_label: label || null });
        }
    }

    /* ---------- Hero video ---------- */
    function setupVideo() {
        const video = document.getElementById('hero-video');
        if (!video) return;

        video.muted = true;
        const start = () => {
            video.currentTime = 0;
            video.play().catch(() => {});
        };
        if (video.readyState >= 2) start();
        else video.addEventListener('loadeddata', start, { once: true });

        const muteBtn = document.getElementById('mute-toggle');
        const soundOn = muteBtn.querySelector('.sound-on-icon');
        const soundOff = muteBtn.querySelector('.sound-off-icon');
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            soundOn.hidden = video.muted;
            soundOff.hidden = !video.muted;
            muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
            trackEvent('Video', video.muted ? 'Muted' : 'Unmuted');
        });

        const playBtn = document.getElementById('play-pause-toggle');
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        playBtn.addEventListener('click', () => {
            if (video.paused) video.play().catch(() => {});
            else video.pause();
        });
        const syncPlay = () => {
            playIcon.hidden = !video.paused;
            pauseIcon.hidden = video.paused;
            playBtn.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
        };
        video.addEventListener('play', syncPlay);
        video.addEventListener('pause', syncPlay);

        const bar = document.getElementById('video-progress');
        const fill = document.getElementById('video-progress-fill');
        video.addEventListener('timeupdate', () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration) * 100 + '%';
        });
        bar.addEventListener('click', (e) => {
            if (!video.duration) return;
            const rect = bar.getBoundingClientRect();
            video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
        });

        // Pause once the hero is fully covered, resume when it comes back.
        // Respect a manual pause.
        let userPaused = false;
        playBtn.addEventListener('click', () => { userPaused = video.paused; });
        window.addEventListener('hero:covered', (e) => {
            if (e.detail) video.pause();
            else if (!userPaused) video.play().catch(() => {});
        });
    }

    /* ---------- Scroll: hero fade, header state, parallax ---------- */
    function setupScroll() {
        const root = document.documentElement;
        const header = document.getElementById('site-header');
        const parallax = reduceMotion ? [] : Array.from(document.querySelectorAll('.parallax'));
        let covered = false;
        let ticking = false;

        function update() {
            ticking = false;
            const vh = window.innerHeight;
            const y = window.scrollY;
            const p = Math.min(Math.max(y / vh, 0), 1);
            if (!reduceMotion) root.style.setProperty('--hero-p', p.toFixed(3));

            header.classList.toggle('is-solid', y > vh * 0.85);

            const nowCovered = p >= 1;
            if (nowCovered !== covered) {
                covered = nowCovered;
                window.dispatchEvent(new CustomEvent('hero:covered', { detail: covered }));
            }

            parallax.forEach((img) => {
                const box = img.parentElement.parentElement.getBoundingClientRect();
                if (box.bottom < 0 || box.top > vh) return;
                const speed = parseFloat(img.dataset.speed) || 0.1;
                const offset = (box.top + box.height / 2 - vh / 2) * -speed;
                img.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
            });
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    /* ---------- Reveal on scroll ---------- */
    function setupReveal() {
        const items = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window) || reduceMotion) {
            items.forEach((el) => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

        // Stagger siblings that enter together (offer cards, steps).
        items.forEach((el) => {
            const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
            const idx = siblings.indexOf(el);
            if (siblings.length > 1 && el.parentElement.matches('.offers, .steps')) {
                el.style.transitionDelay = idx * 110 + 'ms';
            }
            io.observe(el);
        });
    }

    /* ---------- Active section in nav ---------- */
    function setupActiveNav() {
        const links = Array.from(document.querySelectorAll('.site-nav-links a[data-section]'));
        const sections = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
        if (!('IntersectionObserver' in window) || !sections.length) return;

        const setActive = (id) => {
            links.forEach((a) => {
                const on = a.dataset.section === id;
                a.classList.toggle('is-active', on);
                if (on) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setActive(entry.target.id);
                else if (entry.target === sections[0] && entry.boundingClientRect.top > 0) setActive(null);
            });
        }, { rootMargin: '-45% 0px -54% 0px' });
        sections.forEach((s) => io.observe(s));
    }

    /* ---------- Mobile menu ---------- */
    function setupMenu() {
        const toggle = document.getElementById('menu-toggle');
        const overlay = document.getElementById('menu-overlay');
        if (!toggle || !overlay) return;
        overlay.hidden = false;

        const setOpen = (open) => {
            document.body.classList.toggle('menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            toggle.querySelector('.menu-toggle-label').textContent = open ? 'Close' : 'Menu';
            document.body.style.overflow = open ? 'hidden' : '';
        };

        toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
        overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setOpen(false);
        });
        window.matchMedia('(min-width: 1001px)').addEventListener('change', (e) => {
            if (e.matches) setOpen(false);
        });
    }

    /* ---------- Beehiiv newsletter embed (loads as you approach it) ---------- */
    function setupNewsletter() {
        const target = document.getElementById('beehiiv-embed-target');
        if (!target) return;

        const load = () => {
            if (target.dataset.loaded) return;
            target.dataset.loaded = 'true';
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
            script.setAttribute('data-beehiiv-form', '706c65d7-5d79-4d82-8b9e-1068d15b6c2e');
            target.appendChild(script);
        };

        // Beehiiv injects inline margins on its iframe; force it centered.
        const center = () => {
            const iframe = target.querySelector('iframe');
            if (!iframe) return;
            iframe.style.setProperty('margin-left', 'auto', 'important');
            iframe.style.setProperty('margin-right', 'auto', 'important');
            iframe.style.setProperty('display', 'block', 'important');
        };
        new MutationObserver(center).observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    load();
                    io.disconnect();
                }
            }, { rootMargin: '800px' });
            io.observe(target);
        } else {
            load();
        }

        // Jumping straight to #newsletter should load it right away.
        document.querySelectorAll('a[href="#newsletter"]').forEach((a) => a.addEventListener('click', load));
        if (location.hash === '#newsletter') load();
    }

    document.addEventListener('DOMContentLoaded', () => {
        [setupVideo, setupScroll, setupReveal, setupActiveNav, setupMenu, setupNewsletter].forEach((fn) => {
            try { fn(); } catch (err) { console.error(err); }
        });
    });
})();
