const logo = document.querySelector('.center-logo');
const downloadBox = document.querySelector('.download-box');
const body = document.body;
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

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
    if (!downloadBox) return;

    const isDarkMode = darkModeQuery.matches;

    downloadBox.style.background = isDarkMode ? 'rgb(15, 30, 60)' : 'rgb(51, 92, 226)';
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

    if (osDisplay) {
        osDisplay.textContent = `Detected OS: ${os}`;
    }
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

// Generate decorative ghosts with deterministic, size-aware spacing.
function createGhosts(count = 18) {
    const container = document.getElementById('floating-ghosts') || document.querySelector('.floating-ghosts');
    if (!container) return;

    const maxAssetIndex = 20;
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
        const idx = Math.floor(random() * (maxAssetIndex + 1));
        img.src = `assets/ghosts/ghost_${idx}.png`;
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

detectOS();