/**
 * Headquarters Comedy Website JavaScript
 */

class HQCSite {
    constructor() {
        this.config = null;
        this.episodes = null;
        this.posts = null;

        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadEpisodes();
            await this.loadPosts();

            this.setupNavigation();
            this.setupLiveIndicator();
            this.setupPlatformLinks();
            this.loadLatestEpisodes();
            this.loadRecentPosts();
            this.setupNewsletterSignup();
            this.setupFooterLinks();
            this.setupPortfolioTracker();
            this.setupStockTicker();
            this.setupInfohubScrolling();
            this.setupSponsorCarousel();
            this.setupVideoMuteToggle();
            this.setupBeehiivEmbed();

        } catch (error) {
            console.error('Error initializing site:', error);
            this.displayError('Error initializing site. Please try again later.');
        }
    }

    displayError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }

    async loadConfig() {
        try {
            const response = await fetch('/data/config.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.config = await response.json();
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = {
                site_name: "Headquarters Comedy",
                tagline: "Comedy, chaos, and the occasional bad idea.",
                accent_color: "#2B6B99",
                on_air: false,
                social: { x: "#", youtube: "#", spotify: "#", apple: "#" }
            };
        }
    }

    async loadEpisodes() {
        try {
            const response = await fetch('/data/episodes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.episodes = data.episodes;
        } catch (error) {
            console.error('Error loading episodes:', error);
            this.episodes = [];
        }
    }

    async loadPosts() {
        try {
            const response = await fetch('/data/posts.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.posts = data.posts.filter(post => post.published);
        } catch (error) {
            console.error('Error loading posts:', error);
            this.posts = [];
        }
    }

    setupNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileOverlay = document.querySelector('.mobile-menu-overlay');
        const mobileClose = document.querySelector('.mobile-menu-close');

        if (mobileToggle && mobileOverlay) {
            mobileToggle.addEventListener('click', () => {
                mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (mobileClose && mobileOverlay) {
            mobileClose.addEventListener('click', () => {
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', (e) => {
                if (e.target === mobileOverlay) {
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage ||
                (currentPage === '/index.html' && link.getAttribute('href') === '/') ||
                (currentPage === '/' && link.getAttribute('href') === '/')) {
                link.classList.add('active');
            }
        });
    }

    setupLiveIndicator() {
        const liveIndicator = document.getElementById('live-indicator');
        if (liveIndicator && this.config?.on_air) {
            liveIndicator.style.display = 'flex';
        }
    }

    setupPlatformLinks() {
        if (!this.config?.social) return;

        const platformLinks = document.querySelectorAll('.platform-link');
        platformLinks.forEach(link => {
            const platform = link.dataset.platform;
            if (this.config.social[platform] && this.config.social[platform] !== '#') {
                link.href = this.config.social[platform];
            }
        });
    }

    loadLatestEpisodes() {
        const container = document.getElementById('latest-episodes');
        if (!container || !this.episodes) return;

        const latestEpisodes = this.episodes
            .filter(ep => ep.featured)
            .slice(0, 3);

        if (latestEpisodes.length === 0) {
            container.innerHTML = '<div class="loading">No episodes available yet.</div>';
            return;
        }

        container.innerHTML = latestEpisodes.map(ep => this.createEpisodeCard(ep)).join('');
    }

    createEpisodeCard(episode) {
        const date = new Date(episode.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        return `
            <div class="episode-card">
                <div class="episode-number">Episode ${episode.number}</div>
                <h3 class="episode-title">${episode.title}</h3>
                <p class="episode-description">${episode.description}</p>
                <div class="episode-meta">
                    <span>${date}</span>
                    <span>${episode.duration}</span>
                </div>
                ${episode.guest ? `<div class="episode-guest">Guest: ${episode.guest}</div>` : ''}
            </div>
        `;
    }

    loadRecentPosts() {
        const container = document.getElementById('recent-posts');
        if (!container || !this.posts) return;

        const recentPosts = this.posts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        if (recentPosts.length === 0) {
            container.innerHTML = '<div class="loading">No posts available yet.</div>';
            return;
        }

        container.innerHTML = recentPosts.map(post => this.createPostCard(post)).join('');
    }

    createPostCard(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const postUrl = post.url || `/post.html?id=${post.id}`;
        const linkTarget = post.url ? '_blank' : '_self';

        return `
            <article class="post-card">
                <div class="post-content">
                    <div class="post-date">${date}</div>
                    <h3 class="post-title">
                        <a href="${postUrl}" target="${linkTarget}">${post.title}</a>
                    </h3>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-category">${post.category}</div>
                </div>
            </article>
        `;
    }

    setupNewsletterSignup() {
        const container = document.getElementById('newsletter-signup');
        if (!container || !this.config?.subscribe_embed) return;

        if (this.config.subscribe_embed.includes('<!-- Paste your')) {
            container.style.display = 'none';
        } else {
            container.innerHTML = this.config.subscribe_embed;
        }
    }

    setupBeehiivEmbed() {
        const target = document.getElementById('beehiiv-embed-target');
        if (!target) return;

        const formId = target.dataset.beehiivForm;
        if (!formId) return;

        const load = () => {
            if (target.dataset.loaded) return;
            target.dataset.loaded = 'true';
            const script = document.createElement('script');
            script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
            script.async = true;
            script.setAttribute('data-beehiiv-form', formId);
            target.appendChild(script);
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    load();
                    observer.disconnect();
                }
            }, { rootMargin: '200px' });
            observer.observe(target);
        } else {
            load();
        }
    }

    setupFooterLinks() {
        if (!this.config?.social) return;

        const footerLinks = {
            'footer-x': this.config.social.x,
            'footer-youtube': this.config.social.youtube,
            'footer-instagram': this.config.social.instagram,
            'footer-tiktok': this.config.social.tiktok,
            'footer-linkedin': this.config.social.linkedin,
            'footer-newsletter': this.config.social.newsletter
        };

        Object.entries(footerLinks).forEach(([id, url]) => {
            const link = document.getElementById(id);
            if (link && url && url !== '#') {
                link.href = url;
            }
        });
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    truncateText(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    setupPortfolioTracker() {
        this.portfolioHoldings = [
            { symbol: 'AAPL', name: 'Apple Inc.', shares: 12, price: 175.50 },
            { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 8, price: 410.25 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 15, price: 140.80 },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 6, price: 180.45 },
            { symbol: 'TSLA', name: 'Tesla Inc.', shares: 20, price: 250.90 },
            { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 3, price: 880.60 },
            { symbol: 'META', name: 'Meta Platforms', shares: 10, price: 320.15 },
            { symbol: 'NFLX', name: 'Netflix Inc.', shares: 4, price: 450.30 },
            { symbol: 'V', name: 'Visa Inc.', shares: 7, price: 260.40 },
            { symbol: 'JPM', name: 'JPMorgan Chase', shares: 9, price: 145.25 }
        ];

        let totalValue = this.portfolioHoldings.reduce((sum, h) => sum + (h.shares * h.price), 0);
        let previousValue = totalValue * 0.985;
        let change = totalValue - previousValue;
        let changePercent = (change / previousValue) * 100;

        const chartData = this.generateMockChartData(previousValue, totalValue);

        this.updatePortfolioDisplay(change, changePercent, totalValue);
        this.updatePortfolioHoldings(totalValue);
        this.drawPortfolioChart(chartData);

        setInterval(() => {
            this.portfolioHoldings.forEach(h => {
                const fluctuation = (Math.random() - 0.5) * 0.02;
                h.price *= (1 + fluctuation);
            });

            totalValue = this.portfolioHoldings.reduce((sum, h) => sum + (h.shares * h.price), 0);
            change = totalValue - previousValue;
            changePercent = (change / previousValue) * 100;

            this.updatePortfolioDisplay(change, changePercent, totalValue);
            this.updatePortfolioHoldings(totalValue);

            chartData.push(totalValue);
            if (chartData.length > 20) chartData.shift();
            this.drawPortfolioChart(chartData);
        }, 30000);
    }

    updatePortfolioHoldings(totalValue) {
        const holdingsContainer = document.getElementById('portfolio-holdings');
        if (!holdingsContainer) return;

        const keyHoldings = this.portfolioHoldings
            .map(h => ({ ...h, value: h.shares * h.price, percentage: ((h.shares * h.price) / totalValue) * 100 }))
            .filter(h => h.percentage > 10)
            .sort((a, b) => b.percentage - a.percentage);

        holdingsContainer.innerHTML = keyHoldings.map(h => `
            <div class="key-holding-item">
                <div class="holding-info">
                    <div class="holding-symbol">${h.symbol}</div>
                    <div class="holding-name">${h.name}</div>
                </div>
                <div class="holding-details">
                    <div class="holding-value">$${h.value.toFixed(2)}</div>
                    <div class="holding-percentage">${h.percentage.toFixed(1)}%</div>
                </div>
            </div>
        `).join('');
    }

    generateMockChartData(startPrice, endPrice) {
        const points = 20;
        const data = [];
        const step = (endPrice - startPrice) / points;

        for (let i = 0; i <= points; i++) {
            const noise = (Math.random() - 0.5) * 2;
            data.push(startPrice + (step * i) + noise);
        }

        return data;
    }

    updatePortfolioDisplay(change, changePercent, totalValue) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusValue = document.getElementById('status-value');
        const aaplValue = document.getElementById('aapl-value');
        const totalValueEl = document.getElementById('total-value');

        const isPositive = change >= 0;

        if (statusIndicator) {
            statusIndicator.textContent = isPositive ? '▲' : '▼';
            statusIndicator.className = `status-indicator ${isPositive ? 'positive' : 'negative'}`;
        }

        if (statusValue) {
            const sign = isPositive ? '+' : '';
            statusValue.textContent = `${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
            statusValue.className = `status-value ${isPositive ? 'positive' : 'negative'}`;
        }

        if (aaplValue) aaplValue.textContent = `$${totalValue.toFixed(2)}`;
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
    }

    drawPortfolioChart(data) {
        const canvas = document.getElementById('portfolio-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        if (data.length < 2) return;

        const minPrice = Math.min(...data);
        const maxPrice = Math.max(...data);
        const range = maxPrice - minPrice || 1;

        ctx.strokeStyle = data[data.length - 1] >= data[0] ? '#00ff88' : '#ff4757';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        data.forEach((price, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((price - minPrice) / range) * height;
            index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.globalAlpha = 0.1;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    async setupStockTicker() {
        const stocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
            'JPM', 'BAC', 'V', 'MA', 'JNJ', 'UNH', 'PG', 'HD',
            'WMT', 'DIS', 'KO', 'PEP', 'NKE', 'MCD', 'COST', 'SBUX',
            'BA', 'CAT', 'XOM', 'CVX', 'SPY', 'QQQ'
        ];

        const stockTicker = document.getElementById('stock-ticker');
        if (!stockTicker) return;

        const tickerContent = stockTicker.querySelector('.ticker-content');

        this.generateMockStockData(stocks, tickerContent);
        this.updateStockData(stocks, tickerContent);

        setInterval(() => {
            this.updateStockData(stocks, tickerContent);
        }, 120000);
    }

    async updateStockData(stocks, tickerContent) {
        try {
            const stockData = await this.fetchStockData(stocks);

            const tickerItems = this.insertSponsorAds(stockData.map(stock => {
                const isPositive = stock.change >= 0;
                const sign = isPositive ? '+' : '';
                const cssClass = isPositive ? 'ticker-item' : 'ticker-item negative';
                return `<span class="${cssClass}">${stock.symbol} $${stock.price.toFixed(2)} ${sign}${stock.change.toFixed(2)} (${sign}${stock.changePercent.toFixed(2)}%)</span>`;
            }));

            if (tickerContent) {
                const newContent = tickerItems.join('');
                if (tickerContent.innerHTML !== newContent) {
                    tickerContent.style.animationPlayState = 'paused';
                    tickerContent.innerHTML = newContent;
                    tickerContent.offsetHeight;
                    tickerContent.style.animationPlayState = 'running';
                }
            }
        } catch (error) {
            console.error('Error updating stock data:', error);
            this.generateMockStockData(stocks, tickerContent);
        }
    }

    async fetchStockData(symbols) {
        const API_KEY = 'd31lo2pr01qsprr1j1pgd31lo2pr01qsprr1j1q0';

        try {
            const promises = symbols.map(async (symbol) => {
                try {
                    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`)}`);

                    if (response.ok) {
                        const proxyData = await response.json();
                        const apiResponse = JSON.parse(proxyData.contents);

                        if (apiResponse.c && apiResponse.c > 0) {
                            return {
                                symbol,
                                price: Number(apiResponse.c.toFixed(2)),
                                change: Number((apiResponse.d || 0).toFixed(2)),
                                changePercent: Number((apiResponse.dp || 0).toFixed(2))
                            };
                        } else {
                            return this.getMockStockData(symbol);
                        }
                    } else {
                        return this.getMockStockData(symbol);
                    }
                } catch (error) {
                    return this.getMockStockData(symbol);
                }
            });

            return Promise.all(promises);
        } catch (error) {
            return symbols.map(symbol => this.getMockStockData(symbol));
        }
    }

    getMockStockData(symbol) {
        const basePrices = {
            'AAPL': 195, 'MSFT': 430, 'GOOGL': 175, 'AMZN': 185, 'TSLA': 245,
            'NVDA': 950, 'META': 385, 'NFLX': 485, 'JPM': 165, 'BAC': 38,
            'V': 285, 'MA': 450, 'JNJ': 165, 'UNH': 565, 'PG': 165,
            'HD': 385, 'WMT': 175, 'DIS': 115, 'KO': 62, 'PEP': 175,
            'NKE': 98, 'MCD': 295, 'COST': 785, 'SBUX': 108, 'BA': 185,
            'CAT': 385, 'XOM': 120, 'CVX': 165, 'SPY': 515, 'QQQ': 435
        };

        const basePrice = basePrices[symbol] || 100;
        const change = (Math.random() - 0.5) * 6;
        const changePercent = (change / basePrice) * 100;

        return {
            symbol,
            price: Number((basePrice + change).toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2))
        };
    }

    generateMockStockData(stocks, tickerContent) {
        const tickerItems = stocks.map(symbol => {
            const basePrice = Math.random() * 500 + 50;
            const change = (Math.random() - 0.5) * 20;
            const percentChange = (change / basePrice) * 100;
            const isPositive = change >= 0;
            const sign = isPositive ? '+' : '';
            const cssClass = isPositive ? 'ticker-item' : 'ticker-item negative';
            return `<span class="${cssClass}">${symbol} $${basePrice.toFixed(2)} ${sign}${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)</span>`;
        });

        const tickerItemsWithAds = this.insertSponsorAds(tickerItems);

        if (tickerContent) {
            const newContent = tickerItemsWithAds.join('');
            if (tickerContent.innerHTML !== newContent) {
                tickerContent.style.animationPlayState = 'paused';
                tickerContent.innerHTML = newContent;
                tickerContent.offsetHeight;
                tickerContent.style.animationPlayState = 'running';
            }
        }
    }

    insertSponsorAds(stockItems) {
        const sponsorAds = [
            '🎤 Headquarters Comedy — Funnier than your therapist',
            '🎭 HQ Comedy — Live shows every Thursday',
            '😂 Headquarters Comedy — Your new favorite mistake',
            '🎬 HQ Comedy — Watch us embarrass ourselves',
            '🏢 Headquarters Comedy — Where careers go to thrive',
            '🎪 HQ Comedy — Professionally unprofessional',
            '🌟 Headquarters Comedy — Subscribe now, thank us later',
            '🎯 HQ Comedy — We came, we saw, we made a joke about it'
        ];

        const result = [];
        stockItems.forEach((item, index) => {
            result.push(item);
            if ((index + 1) % 10 === 0) {
                const randomAd = sponsorAds[Math.floor(Math.random() * sponsorAds.length)];
                result.push(`<span class="ticker-item sponsor-ad">${randomAd}</span>`);
            }
        });

        return result;
    }

    setupInfohubScrolling() {
        const infoColumn = document.querySelector('.info-column');
        if (!infoColumn) return;

        const videoContainer = document.querySelector('.hero-video-container');
        let overlay = null;

        if (videoContainer) {
            if (getComputedStyle(videoContainer).position === 'static') {
                videoContainer.style.position = 'relative';
            }

            function createOverlay() {
                if (overlay) return;

                overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10;
                    pointer-events: auto;
                    background: transparent;
                `;
                overlay.className = 'video-scroll-overlay';
                videoContainer.appendChild(overlay);

                overlay.addEventListener('wheel', (event) => {
                    event.preventDefault();
                    const infoScrollHeight = infoColumn.scrollHeight - infoColumn.clientHeight;
                    if (infoScrollHeight <= 0) return;

                    const scrollAmount = event.deltaY;
                    const currentScrollTop = infoColumn.scrollTop;
                    const newScrollTop = Math.max(0, Math.min(currentScrollTop + scrollAmount, infoScrollHeight));
                    infoColumn.scrollTop = newScrollTop;
                }, { passive: false });
            }

            function removeOverlay() {
                if (overlay) {
                    overlay.remove();
                    overlay = null;
                }
            }

            function updateOverlayVisibility() {
                window.innerWidth <= 768 ? removeOverlay() : createOverlay();
            }

            updateOverlayVisibility();
            window.addEventListener('resize', updateOverlayVisibility);
        }

        let documentWheelHandler = null;

        function addDocumentWheelListener() {
            if (documentWheelHandler) return;

            documentWheelHandler = (event) => {
                const isOverInfohub = infoColumn.contains(event.target);
                const isOverVideo = videoContainer && videoContainer.contains(event.target);

                if (!isOverInfohub && !isOverVideo) {
                    event.preventDefault();
                    const infoScrollHeight = infoColumn.scrollHeight - infoColumn.clientHeight;
                    if (infoScrollHeight > 0) {
                        const newScrollTop = Math.max(0, Math.min(infoColumn.scrollTop + event.deltaY, infoScrollHeight));
                        infoColumn.scrollTop = newScrollTop;
                    }
                }
            };

            document.addEventListener('wheel', documentWheelHandler, { passive: false });
        }

        function removeDocumentWheelListener() {
            if (documentWheelHandler) {
                document.removeEventListener('wheel', documentWheelHandler);
                documentWheelHandler = null;
            }
        }

        function updateDocumentWheelListener() {
            window.innerWidth <= 768 ? removeDocumentWheelListener() : addDocumentWheelListener();
        }

        updateDocumentWheelListener();
        window.addEventListener('resize', updateDocumentWheelListener);

        infoColumn.style.scrollBehavior = 'auto';
    }

    setupSponsorCarousel() {
        const sponsorsTrack = document.querySelector('.sponsors-track');
        if (!sponsorsTrack) return;

        sponsorsTrack.addEventListener('animationiteration', () => {
            sponsorsTrack.style.transform = 'translateX(0)';
        });

        sponsorsTrack.style.willChange = 'transform';
        sponsorsTrack.style.backfaceVisibility = 'hidden';
        sponsorsTrack.style.perspective = '1000px';
    }

    setupVideoMuteToggle() {
        const video = document.getElementById('hero-video');
        const muteToggle = document.getElementById('mute-toggle');
        const muteIcon = muteToggle?.querySelector('.mute-icon');
        const unmuteIcon = muteToggle?.querySelector('.unmute-icon');

        if (!video || !muteToggle) return;

        video.muted = true;

        muteToggle.addEventListener('click', () => {
            video.muted = !video.muted;

            if (video.muted) {
                muteIcon.style.display = 'none';
                unmuteIcon.style.display = 'block';
            } else {
                muteIcon.style.display = 'block';
                unmuteIcon.style.display = 'none';
            }

            Analytics.trackEvent('Video', video.muted ? 'Muted' : 'Unmuted');
        });

        muteIcon.style.display = 'none';
        unmuteIcon.style.display = 'block';

        // Play/Pause toggle
        const playPauseToggle = document.getElementById('play-pause-toggle');
        const playIcon = playPauseToggle?.querySelector('.play-icon');
        const pauseIcon = playPauseToggle?.querySelector('.pause-icon');

        if (playPauseToggle && playIcon && pauseIcon) {
            playPauseToggle.addEventListener('click', () => {
                if (video.paused) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });

            video.addEventListener('play', () => {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            });

            video.addEventListener('pause', () => {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            });
        }

        // Playhead / progress bar
        const progressBar = document.getElementById('video-progress-bar');
        const progressFill = document.getElementById('video-progress-fill');

        if (progressBar && progressFill) {
            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    progressFill.style.width = ((video.currentTime / video.duration) * 100) + '%';
                }
            });

            progressBar.addEventListener('click', (e) => {
                if (!video.duration) return;
                const rect = progressBar.getBoundingClientRect();
                video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
            });
        }
    }
}

// Analytics
class Analytics {
    static trackEvent(category, action, label = null) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, { event_category: category, event_label: label });
        }
        console.log(`Analytics: ${category} - ${action}${label ? ` - ${label}` : ''}`);
    }

    static trackPageView(page = null) {
        const currentPage = page || window.location.pathname;
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', { page_path: currentPage });
        }
        console.log(`Page view: ${currentPage}`);
    }
}

// Smooth scroll
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                Analytics.trackEvent('Navigation', 'Anchor Click', this.getAttribute('href'));
            }
        });
    });
}

// Platform link tracking
function setupPlatformTracking() {
    document.querySelectorAll('.platform-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const platform = e.currentTarget.dataset.platform;
            Analytics.trackEvent('Subscribe', 'Platform Click', platform);
        });
    });
}

// Landing Screen
function setupLandingScreen() {
    const landingScreen = document.getElementById('landing-screen');
    const skipBtn = document.getElementById('already-subscribed-btn');

    if (!landingScreen) return;

    const hasSeenLandingScreen = localStorage.getItem('hasSeenLandingScreen');
    const referrer = document.referrer;
    const currentDomain = window.location.hostname;
    const isExternalVisit = !referrer || !referrer.includes(currentDomain);

    if (hasSeenLandingScreen && !isExternalVisit) {
        landingScreen.classList.add('hidden');

        const heroVideo = document.getElementById('hero-video');
        if (heroVideo) {
            heroVideo.play().catch(error => {
                console.log('Video autoplay prevented:', error);
            });
        }
        return;
    }

    // Only load Beehiiv embed when landing screen is actually shown
    const landingBeehiivTarget = document.getElementById('landing-beehiiv-target');
    if (landingBeehiivTarget && !landingBeehiivTarget.dataset.loaded) {
        landingBeehiivTarget.dataset.loaded = 'true';
        const script = document.createElement('script');
        script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
        script.async = true;
        script.setAttribute('data-beehiiv-form', landingBeehiivTarget.dataset.beehiivForm);
        landingBeehiivTarget.appendChild(script);
    }

    let hideCalled = false;
    function hideLandingScreen() {
        if (hideCalled) return;
        hideCalled = true;
        landingScreen.classList.add('hidden');
        localStorage.setItem('hasSeenLandingScreen', 'true');
        Analytics.trackEvent('Landing Screen', 'Dismissed');

        landingScreen.addEventListener('transitionend', () => {
            const heroVideo = document.getElementById('hero-video');
            if (heroVideo) {
                heroVideo.play().catch(error => {
                    console.log('Video autoplay prevented:', error);
                });
            }
        }, { once: true });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', hideLandingScreen);
    }

    // Listen for Beehiiv subscription success postMessage
    window.addEventListener('message', (event) => {
        if (landingScreen.classList.contains('hidden')) return;
        const data = event.data;
        const isSuccess =
            (typeof data === 'string' && (data.includes('success') || data.includes('subscribe'))) ||
            (data !== null && typeof data === 'object' && (
                (typeof data.type === 'string' && (
                    data.type.includes('success') ||
                    data.type.includes('subscribe')
                )) ||
                data.status === 'success' ||
                data.subscribed === true
            ));
        if (isSuccess) {
            setTimeout(hideLandingScreen, 1500);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupLandingScreen();
    window.hqcSite = new HQCSite();
    setupSmoothScroll();
    setupPlatformTracking();
    Analytics.trackPageView();

    setTimeout(() => {
        if (window.hqcSite?.config?.accent_color) {
            document.documentElement.style.setProperty('--accent-color', window.hqcSite.config.accent_color);
        }
    }, 100);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HQCSite, Analytics };
}
