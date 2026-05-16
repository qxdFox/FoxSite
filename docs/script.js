const logo = document.querySelector('.center-logo');
const downloadBox = document.querySelector('.download-box');
const body = document.body;
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const changelogMeta = document.getElementById('changelog-meta');
const changelogContent = document.getElementById('changelog-content');
const changelogReleaseLink = document.getElementById('changelog-release-link');
const changelogToggle = document.getElementById('changelog-toggle');
const downloadViewRadio = document.getElementById('view-download');
const changelogViewRadio = document.getElementById('view-changelog');
const changelogPanel = document.getElementById('changelog-panel');
const viewSwitcher = document.querySelector('.view-switcher');
const topBar = document.querySelector('.top-bar');
const topBrandGhost = document.getElementById('top-brand-ghost');
const compactViewportQuery = window.matchMedia('(max-width: 768px)');

const RELEASES_REPO = 'FoxNet-DDNet/Entity-Client-DDNet';
const RELEASES_URL = `https://github.com/${RELEASES_REPO}/releases`;
const RELEASES_PER_PAGE = 25;
const RELEASES_API_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=${RELEASES_PER_PAGE}`;
const RELEASES_CACHE_URL = '/releases-cache.json';
const GHOSTS_ASSET_BASE_PATH = '/assets/ghosts';
const TOP_BAR_DEFAULT_GHOST_FILE = 'ghost_0.png';
const GHOST_VARIANT_FILES = [
    'ghost_0.png',
    'ghost_1.png',
    'ghost_2.png',
    'ghost_3.png',
    'ghost_4.png',
    'ghost_5.png',
    'ghost_6.png',
    'ghost_7.png',
    'ghost_8.png'
];
const TOP_BAR_GHOST_GLITCH_MIN_DELAY_MS = 600;
const TOP_BAR_GHOST_GLITCH_MAX_DELAY_MS = 4500;
const TOP_BAR_GHOST_GLITCH_DURATION_MS = 300;
const TOP_BAR_GHOST_GLITCH_FRAME_INTERVAL_MS = 24;
const VIEW_PANEL_TRANSITION_MS = 280;

let changelogRenderedEntries = [];
let changelogSourceLabel = '';
let activeView = 'download';
let lastScrollY = window.scrollY;
let topBarHovered = false;
let preferMinimizedTopBar = false;
let previousTopBarGhostIndex = -1;
let viewTransitionVersion = 0;
let viewSwitcherIndicator = null;
let viewSwitcherResizeObserver = null;

const DOWNLOAD_URLS = {
    Windows: 'https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-windows.zip',
    macOS: 'https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-macOS.dmg',
    Linux: 'https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-ubuntu.tar.xz'
};

if (logo) {
    // Open project repository when clicking the logo.
    logo.addEventListener('click', () => {
        window.open('https://github.com/qxdFox/Entity-Client', '_blank');
    });
}

// Make the logo move up and down
let angle = 0;
function moveLogo() {
    if (!logo) return;

    const offsetY = Math.sin(angle) * 10;
    angle += 0.005;

    const isHovered = logo.matches(':hover');
    const scale = isHovered ? 1.05 : 1;
    logo.style.transform = `translateY(${offsetY}px) scale(${scale})`;

    requestAnimationFrame(moveLogo);
}

if (logo) {
    moveLogo();
}

// Update the download card gradient based on cursor position.
document.addEventListener('mousemove', (event) => {
    if (!downloadBox) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const isDarkMode = darkModeQuery.matches;

    const downloadBoxRect = downloadBox.getBoundingClientRect();
    const downloadBoxXPercent = ((mouseX - downloadBoxRect.left) / downloadBoxRect.width) * 100;
    const downloadBoxYPercent = ((mouseY - downloadBoxRect.top) / downloadBoxRect.height) * 100;

    const lightGradient = `radial-gradient(circle 250px at ${downloadBoxXPercent}% ${downloadBoxYPercent}%, rgb(51, 92, 226, 0.1), rgb(51, 92, 226))`;
    const darkGradient = `radial-gradient(circle 250px at ${downloadBoxXPercent}% ${downloadBoxYPercent}%, rgb(15, 30, 60, 0.1), rgb(15, 30, 60))`;

    downloadBox.style.background = isDarkMode ? darkGradient : lightGradient;
});

// Function to update the top bar, os box, and body background based on the current theme
function updateTheme() {
    const isDarkMode = darkModeQuery.matches;

    if (downloadBox) {
        downloadBox.style.background = isDarkMode ? 'rgb(15, 30, 60)' : 'rgb(51, 92, 226)';
    }

    body.style.background = isDarkMode
        ? 'linear-gradient(to bottom, rgb(15, 30, 60), rgb(15, 15, 30))'
        : 'linear-gradient(to bottom, rgb(77, 116, 241), rgb(201, 166, 218))';
}

// Initial update based on the current theme
updateTheme();

// Listen for changes in the user's light/dark mode preference
darkModeQuery.addEventListener('change', updateTheme);

// Function to detect the user's operating system
function detectOS() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    let os = 'Unknown OS';

    if (platform.includes('win')) {
        os = 'Windows';
    } else if (platform.includes('mac')) {
        os = 'macOS';
    } else if (platform.includes('linux')) {
        os = 'Linux';
    } else if (/android/.test(userAgent)) {
        os = 'Android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
        os = 'iOS';
    }

    const osDisplay = document.getElementById('os-display');
    const osName = document.getElementById('os-name');

    if (osName) {
        osName.textContent = os;
    }

    const downloadButton = document.getElementById('download-button');
    if (!downloadButton) return;

    const downloadUrl = DOWNLOAD_URLS[os];
    if (downloadUrl) {
        downloadButton.onclick = () => window.open(downloadUrl, '_blank');
        return;
    }

    downloadButton.onclick = () => alert('No download available for your OS.');
}

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return function random() {
        state += 0x6D2B79F5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function formatReleaseDate(isoString) {
    if (!isoString) return 'Unknown release date';

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Unknown release date';

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function isRateLimitError(error) {
    return error?.status === 403 || error?.status === 429;
}

function setChangelogFallback(message, details) {
    if (changelogMeta) {
        changelogMeta.textContent = message;
    }
    if (changelogContent) {
        changelogContent.textContent = details || 'Release notes are currently unavailable. Open the Releases page to view them directly.';
    }
    if (changelogReleaseLink) {
        changelogReleaseLink.href = RELEASES_URL;
    }
}

function updateViewSwitcherIndicator(instant = false) {
    if (!viewSwitcherIndicator || !viewSwitcher) {
        return;
    }

    const activeLabel = viewSwitcher.querySelector("input[type='radio']:checked + label");
    if (!activeLabel) {
        viewSwitcherIndicator.style.opacity = '0';
        return;
    }

    const switcherBounds = viewSwitcher.getBoundingClientRect();
    const labelBounds = activeLabel.getBoundingClientRect();
    const switcherStyles = window.getComputedStyle(viewSwitcher);
    const paddingTop = parseFloat(switcherStyles.paddingTop) || 0;
    const paddingBottom = parseFloat(switcherStyles.paddingBottom) || 0;
    const leftOffset = labelBounds.left - switcherBounds.left;
    const indicatorHeight = Math.max(0, switcherBounds.height - paddingTop - paddingBottom);

    if (instant) {
        viewSwitcherIndicator.style.transition = 'none';
    }

    viewSwitcherIndicator.style.top = `${paddingTop}px`;
    viewSwitcherIndicator.style.height = `${indicatorHeight}px`;
    viewSwitcherIndicator.style.width = `${labelBounds.width}px`;
    viewSwitcherIndicator.style.transform = `translateX(${leftOffset}px)`;
    viewSwitcherIndicator.style.opacity = '1';

    if (instant) {
        // Force reflow so the instant update is committed, then restore transitions.
        void viewSwitcherIndicator.offsetWidth;
        viewSwitcherIndicator.style.transition = '';
    }
}

function initializeViewSwitcherIndicator() {
    if (!viewSwitcher || viewSwitcherIndicator) {
        return;
    }

    const indicator = document.createElement('span');
    indicator.className = 'view-switcher-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    viewSwitcher.appendChild(indicator);
    viewSwitcherIndicator = indicator;

    if (window.ResizeObserver) {
        viewSwitcherResizeObserver = new ResizeObserver(() => {
            updateViewSwitcherIndicator(true);
        });
        viewSwitcherResizeObserver.observe(viewSwitcher);
    }

    window.addEventListener('resize', () => updateViewSwitcherIndicator(true), { passive: true });
    requestAnimationFrame(updateViewSwitcherIndicator);
}

function setPanelVisible(panel, visible) {
    if (!panel) {
        return;
    }

    panel.hidden = !visible;
    panel.classList.remove('is-transitioning-in', 'is-transitioning-out');
    if (!visible) {
        panel.classList.add('is-transitioning-out');
    }
}

function transitionPanelVisibility(panel, shouldShow, transitionVersion) {
    if (!panel) {
        return;
    }

    if (shouldShow) {
        panel.hidden = false;
        panel.classList.remove('is-transitioning-in');
        panel.classList.add('is-transitioning-out');
        // Force reflow so the browser can animate from the offset state.
        void panel.offsetWidth;
        if (transitionVersion !== viewTransitionVersion) {
            return;
        }
        panel.classList.remove('is-transitioning-out');
        panel.classList.add('is-transitioning-in');
        return;
    }

    panel.classList.remove('is-transitioning-in', 'is-transitioning-out');
    panel.hidden = true;
}

function setActiveView(view, syncHash = true, immediate = false) {
    activeView = view === 'changelog' ? 'changelog' : 'download';
    viewTransitionVersion += 1;

    const shouldShowDownload = activeView === 'download';
    const shouldShowChangelog = activeView === 'changelog';

    if (immediate) {
        setPanelVisible(downloadBox, shouldShowDownload);
        setPanelVisible(changelogPanel, shouldShowChangelog);
    } else {
        transitionPanelVisibility(downloadBox, shouldShowDownload, viewTransitionVersion);
        transitionPanelVisibility(changelogPanel, shouldShowChangelog, viewTransitionVersion);
    }

    if (downloadViewRadio) {
        downloadViewRadio.checked = activeView === 'download';
    }

    if (changelogViewRadio) {
        changelogViewRadio.checked = activeView === 'changelog';
    }

    updateViewSwitcherIndicator();

    if (syncHash) {
        const nextHash = activeView === 'changelog' ? '#changelog' : '';
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        history.replaceState(null, '', nextUrl);
    }

    if (logo) {
        logo.style.display = activeView === 'changelog' ? 'none' : '';
    }

    if (activeView === 'changelog') {
        renderVisibleChangelogEntries();
    }
}

function startTopBarGhostGlitch() {
    if (!topBrandGhost) {
        return;
    }

    topBrandGhost.src = `${GHOSTS_ASSET_BASE_PATH}/${TOP_BAR_DEFAULT_GHOST_FILE}`;

    if (!GHOST_VARIANT_FILES.length) {
        return;
    }

    function setRandomGhostFrame() {
        let nextIndex = Math.floor(Math.random() * GHOST_VARIANT_FILES.length);
        if (nextIndex === previousTopBarGhostIndex) {
            nextIndex = (nextIndex + 1) % GHOST_VARIANT_FILES.length;
        }

        previousTopBarGhostIndex = nextIndex;
        topBrandGhost.src = `${GHOSTS_ASSET_BASE_PATH}/${GHOST_VARIANT_FILES[nextIndex]}`;
    }

    function scheduleNextGlitch() {
        const randomDelayRange = TOP_BAR_GHOST_GLITCH_MAX_DELAY_MS - TOP_BAR_GHOST_GLITCH_MIN_DELAY_MS;
        const nextGlitchDelay = TOP_BAR_GHOST_GLITCH_MIN_DELAY_MS + Math.floor(Math.random() * (randomDelayRange + 1));

        window.setTimeout(() => {
            const glitchEndTime = Date.now() + TOP_BAR_GHOST_GLITCH_DURATION_MS;

            // Update once immediately so each glitch burst starts instantly.
            setRandomGhostFrame();

            const glitchIntervalId = window.setInterval(() => {
                setRandomGhostFrame();

                if (Date.now() >= glitchEndTime) {
                    window.clearInterval(glitchIntervalId);
                    topBrandGhost.src = `${GHOSTS_ASSET_BASE_PATH}/${TOP_BAR_DEFAULT_GHOST_FILE}`;
                    scheduleNextGlitch();
                }
            }, TOP_BAR_GHOST_GLITCH_FRAME_INTERVAL_MS);
        }, nextGlitchDelay);
    }

    scheduleNextGlitch();
}

function setTopBarMinimized(minimized) {
    if (!topBar) {
        return;
    }

    const shouldMinimize = minimized && !topBarHovered && !compactViewportQuery.matches;
    topBar.classList.toggle('is-minimized', shouldMinimize);
}

function updateTopBarStateFromScroll() {
    if (!topBar) {
        return;
    }

    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    if (compactViewportQuery.matches || currentScrollY <= 30) {
        preferMinimizedTopBar = false;
    } else if (delta > 3) {
        preferMinimizedTopBar = true;
    } else if (delta < -3) {
        preferMinimizedTopBar = false;
    }

    setTopBarMinimized(preferMinimizedTopBar);
    lastScrollY = currentScrollY;
}

function initializeTopBarBehavior() {
    if (!topBar) {
        return;
    }

    topBar.addEventListener('mouseenter', () => {
        topBarHovered = true;
        setTopBarMinimized(false);
    });

    topBar.addEventListener('mouseleave', () => {
        topBarHovered = false;
        setTopBarMinimized(preferMinimizedTopBar);
    });

    window.addEventListener('scroll', updateTopBarStateFromScroll, { passive: true });

    compactViewportQuery.addEventListener('change', () => {
        if (compactViewportQuery.matches) {
            preferMinimizedTopBar = false;
        }
        setTopBarMinimized(preferMinimizedTopBar);
    });

    updateTopBarStateFromScroll();
}

function getReleaseBodyText(release) {
    if (!release || typeof release !== 'object') {
        return '';
    }

    const bodyText = typeof release.body === 'string' ? release.body.trim() : '';
    if (bodyText) {
        return bodyText;
    }

    return 'No release notes were provided for this release.';
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderMarkdownLocally(markdownText) {
    const fallbackHtml = `<pre>${escapeHtml(markdownText)}</pre>`;

    if (!window.marked || typeof window.marked.parse !== 'function') {
        return fallbackHtml;
    }

    const renderedHtml = window.marked.parse(markdownText, {
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
    });

    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
        return window.DOMPurify.sanitize(renderedHtml);
    }

    return renderedHtml;
}

async function fetchRecentReleases() {
    const releasesResponse = await fetch(RELEASES_API_URL, {
        headers: {
            Accept: 'application/vnd.github+json'
        }
    });

    if (!releasesResponse.ok) {
        throw createHttpError(`GitHub API error ${releasesResponse.status}`, releasesResponse.status);
    }

    const releases = await releasesResponse.json();
    if (!Array.isArray(releases) || releases.length === 0) {
        throw new Error('No releases found');
    }

    return releases;
}

async function fetchCachedReleases() {
    const cacheResponse = await fetch(RELEASES_CACHE_URL, {
        cache: 'no-store'
    });

    if (!cacheResponse.ok) {
        throw createHttpError(`Cache error ${cacheResponse.status}`, cacheResponse.status);
    }

    const cacheData = await cacheResponse.json();
    if (!Array.isArray(cacheData.releases) || cacheData.releases.length === 0) {
        throw new Error('No cached releases found');
    }

    return cacheData;
}

function normalizeRelease(release) {
    return {
        name: release.name || release.tagName || release.tag_name || 'Unnamed release',
        url: release.html_url || release.url || RELEASES_URL,
        publishedAt: release.publishedAt || release.published_at || release.created_at || '',
        body: typeof release.body === 'string' ? release.body : ''
    };
}

function updateChangelogMetaText() {
    if (!changelogMeta) {
        return;
    }

    const total = changelogRenderedEntries.length;
    if (!total) {
        changelogMeta.textContent = changelogSourceLabel || 'No releases available';
        return;
    }

    const summary = activeView === 'changelog'
        ? `Showing ${total} releases`
        : `Loaded ${total} releases`;

    changelogMeta.textContent = changelogSourceLabel ? `${summary} - ${changelogSourceLabel}` : summary;
}

async function buildReleaseEntryHtml(release, isLatest = false) {
    const normalizedRelease = normalizeRelease(release);
    const releaseDate = formatReleaseDate(normalizedRelease.publishedAt);
    const releaseBody = getReleaseBodyText(normalizedRelease);
    const renderedBody = renderMarkdownLocally(releaseBody);
    const latestBadge = isLatest ? '<span class="release-latest-badge">Latest</span>' : '';

    return `
        <article class="release-entry">
            <div class="release-heading">
                <div class="release-title-row">
                    <h4 class="release-title"><a href="${escapeHtml(normalizedRelease.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedRelease.name)}</a></h4>
                    ${latestBadge}
                </div>
                <p class="release-date">${escapeHtml(releaseDate)}</p>
            </div>
            <div class="release-body">${renderedBody}</div>
        </article>
    `;
}

function updateChangelogToggleState() {
    if (!changelogToggle) {
        return;
    }

    changelogToggle.hidden = true;
}

function renderVisibleChangelogEntries() {
    if (!changelogContent) {
        return;
    }

    const visibleCount = changelogRenderedEntries.length;

    changelogContent.innerHTML = changelogRenderedEntries.slice(0, visibleCount).join('');

    const links = changelogContent.querySelectorAll('a');
    links.forEach((link) => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    });

    updateChangelogMetaText();
    updateChangelogToggleState();
}

async function loadChangelog() {
    if (!changelogMeta || !changelogContent || !changelogReleaseLink) {
        return;
    }

    changelogReleaseLink.href = RELEASES_URL;

    try {
        const releases = await fetchRecentReleases();
        changelogSourceLabel = 'Live from GitHub';
        const releasesToRender = releases;
        changelogRenderedEntries = await Promise.all(releasesToRender.map((r, i) => buildReleaseEntryHtml(r, i === 0)));
    } catch (error) {
        try {
            const cacheData = await fetchCachedReleases();
            const updatedAt = formatReleaseDate(cacheData.updatedAt);
            changelogSourceLabel = isRateLimitError(error)
                ? `GitHub API rate limited - cached copy from ${updatedAt}`
                : `Using cached copy from ${updatedAt}`;
            const cachedReleasesToRender = cacheData.releases;
            changelogRenderedEntries = await Promise.all(cachedReleasesToRender.map((r, i) => buildReleaseEntryHtml(r, i === 0)));
        } catch (cacheError) {
            const fallbackMessage = isRateLimitError(error)
                ? 'GitHub API rate limit reached.'
                : 'Could not load the latest changelog.';
            const fallbackDetails = isRateLimitError(error)
                ? 'GitHub temporarily blocked more anonymous API requests from this IP address, and no local cache is available yet. Run the cache refresh script before deploys to keep release notes available.'
                : 'Live GitHub release notes and the local changelog cache are both unavailable right now. Open the Releases page to view them directly.';
            setChangelogFallback(fallbackMessage, fallbackDetails);
            return;
        }
    }

    renderVisibleChangelogEntries();
}

// Generate decorative ghosts with deterministic, size-aware spacing.
function createGhosts(count = 18) {
    const container = document.getElementById('floating-ghosts') || document.querySelector('.floating-ghosts');
    if (!container) return;

    if (!GHOST_VARIANT_FILES.length) return;

    const placedGhosts = [];
    const containerWidth = Math.max(container.clientWidth, window.innerWidth, 1);
    const containerHeight = Math.max(container.clientHeight, window.innerHeight, 1);
    const area = containerWidth * containerHeight;

    // Keep density predictable across screen sizes.
    const hardMaxGhosts = 26;
    const maxGhostsByArea = Math.max(1, Math.floor(area / 65000));
    const targetGhostCount = Math.min(hardMaxGhosts, Math.max(0, Math.floor(count)), maxGhostsByArea);

    // Same viewport size => same ghost layout.
    const seed = (
        (Math.floor(containerWidth) * 73856093) ^
        (Math.floor(containerHeight) * 19349663) ^
        (targetGhostCount * 83492791)
    ) >>> 0;
    const random = createSeededRandom(seed);

    container.innerHTML = '';

    function getRandomPosition(sizePx) {
        const xPaddingPercent = Math.min((sizePx / 2 / containerWidth) * 100, 45);
        const yPaddingPercent = Math.min((sizePx / 2 / containerHeight) * 100, 45);
        const xMin = xPaddingPercent;
        const xMax = 100 - xPaddingPercent;
        const yMin = yPaddingPercent;
        const yMax = 100 - yPaddingPercent;

        return {
            xPercent: xMin + random() * Math.max(xMax - xMin, 0),
            yPercent: yMin + random() * Math.max(yMax - yMin, 0)
        };
    }

    function isTooClose(candidateGhost, spacingFactor = 1) {
        return placedGhosts.some((ghost) => {
            const dx = ((candidateGhost.xPercent - ghost.xPercent) / 100) * containerWidth;
            const dy = ((candidateGhost.yPercent - ghost.yPercent) / 100) * containerHeight;
            const distance = Math.hypot(dx, dy);
            const minDistance = (((candidateGhost.sizePx + ghost.sizePx) / 2) * 0.45 + 16) * spacingFactor;

            return distance < minDistance;
        });
    }

    for (let i = 0; i < targetGhostCount; i++) {
        const img = document.createElement('img');
        const ghostFile = GHOST_VARIANT_FILES[Math.floor(random() * GHOST_VARIANT_FILES.length)];
        img.src = `${GHOSTS_ASSET_BASE_PATH}/${ghostFile}`;
        img.className = 'ghost';

        // 40px - 220px
        const size = Math.floor(random() * 180) + 40;
        img.style.width = `${size}px`;
        img.style.height = 'auto';

        const maxAttempts = 60;
        let position = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidatePosition = getRandomPosition(size);
            const candidateGhost = {
                xPercent: candidatePosition.xPercent,
                yPercent: candidatePosition.yPercent,
                sizePx: size
            };

            // Relax constraints slightly for late attempts to avoid starving placements.
            const spacingFactor = attempt > maxAttempts * 0.75 ? 0.85 : 1;
            if (!isTooClose(candidateGhost, spacingFactor)) {
                position = candidatePosition;
                placedGhosts.push(candidateGhost);
                break;
            }
        }

        if (!position) {
            continue;
        }

        img.style.left = `${position.xPercent}%`;
        img.style.top = `${position.yPercent}%`;
        img.style.position = 'absolute';

        img.style.opacity = (random() * 0.15 + 0.03).toFixed(2);
        img.style.animationDuration = `${random() * 25 + 15}s`; // 15s - 40s
        img.style.animationDelay = `${random() * -20}s`;

        // Start rotated slightly for variety.
        img.style.transform = `translate(-50%, -50%) rotate(${random() * 360}deg)`;

        container.appendChild(img);
    }
}

createGhosts(26);

if (downloadViewRadio) {
    downloadViewRadio.addEventListener('change', () => {
        if (downloadViewRadio.checked) {
            setActiveView('download');
        }
    });
}

if (changelogViewRadio) {
    changelogViewRadio.addEventListener('change', () => {
        if (changelogViewRadio.checked) {
            setActiveView('changelog');
        }
    });
}

if (window.location.hash === '#changelog') {
    setActiveView('changelog', false, true);
} else {
    setActiveView('download', false, true);
}

initializeViewSwitcherIndicator();
startTopBarGhostGlitch();
initializeTopBarBehavior();
detectOS();
loadChangelog();

const topLinksToggle = document.getElementById('top-links-toggle');
const topLinksDropdown = document.getElementById('top-links-dropdown');

if (topLinksToggle && topLinksDropdown) {
    topLinksToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = topLinksDropdown.classList.toggle('is-open');
        topLinksToggle.classList.toggle('is-open', isOpen);
        topLinksToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
        topLinksDropdown.classList.remove('is-open');
        topLinksToggle.classList.remove('is-open');
        topLinksToggle.setAttribute('aria-expanded', 'false');
    });

    topLinksDropdown.addEventListener('click', (e) => e.stopPropagation());
}