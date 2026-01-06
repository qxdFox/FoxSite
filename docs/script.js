const logo = document.querySelector('.center-logo');
const DownloadBox = document.querySelector('.download-box');
const body = document.body;

// Add a mouse click event listener to the logo
logo.addEventListener('click', () => {
    window.open('https://github.com/qxdFox/Entity-Client', '_blank');
});

// Make the logo move up and down
let angle = 0;
function moveLogo() {
    const offsetY = Math.sin(angle) * 10;
    angle += 0.005;
    const isHovered = logo.matches(':hover');
    const scale = isHovered ? 1.05 : 1;
    logo.style.transform = `translateY(${offsetY}px) scale(${scale})`;
    requestAnimationFrame(moveLogo);
}
moveLogo();

// Handle mousemove to update gradients for and DownloadBox
document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Update gradient for the os-box
    const DownloadBoxRect = DownloadBox.getBoundingClientRect();
    const DownloadBoxXPercent = ((mouseX - DownloadBoxRect.left) / DownloadBoxRect.width) * 100;
    const DownloadBoxYPercent = ((mouseY - DownloadBoxRect.top) / DownloadBoxRect.height) * 100;

    const DownloadBoxLightGradient = `radial-gradient(circle 250px at ${DownloadBoxXPercent}% ${DownloadBoxYPercent}%, rgb(51, 92, 226, 0.1), rgb(51, 92, 226))`;
    const DownloadBoxDarkGradient = `radial-gradient(circle 250px at ${DownloadBoxXPercent}% ${DownloadBoxYPercent}%, rgb(15, 30, 60, 0.1), rgb(15, 30, 60))`;

    DownloadBox.style.background = isDarkMode ? DownloadBoxDarkGradient : DownloadBoxLightGradient;
});

// Function to update the top bar, os box, and body background based on the current theme
function updateTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    DownloadBox.style.background = isDarkMode ? 'rgb(15, 30, 60)' : 'rgb(51, 92, 226)';
    body.style.background = isDarkMode
        ? 'linear-gradient(to bottom, rgb(15, 30, 60), rgb(15, 15, 30))'
        : 'linear-gradient(to bottom, rgb(77, 116, 241), rgb(201, 166, 218))';
}

// Initial update based on the current theme
updateTheme();

// Listen for changes in the user's light/dark mode preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

// Function to detect the user's operating system
function detectOS() {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    let os = "Unknown OS";

    if (platform.includes('win')) {
        os = "Windows";
    } else if (platform.includes('mac')) {
        os = "macOS";
    } else if (platform.includes('linux')) {
        os = "Linux";
    } else if (/android/.test(userAgent)) {
        os = "Android";
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
        os = "iOS";
    }

    const osDisplay = document.getElementById('os-display');
    const osName = document.getElementById('os-name');
    osDisplay.textContent = `Detected OS: ${os}`;
    osName.textContent = os;

    const downloadButton = document.getElementById('download-button');
    if (os === "Windows") {
        downloadButton.onclick = () => window.open('https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-win64.zip', '_blank');
    } else if (os === "macOS") {
        downloadButton.onclick = () => window.open('https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-macos.zip', '_blank');
    } else if (os === "Linux") {
        downloadButton.onclick = () => window.open('https://github.com/qxdFox/Entity-Client/releases/latest/download/E-Client-ubuntu.zip', '_blank');
    } else if (os === "Android") {
        downloadButton.onclick = () => alert('No download available for your OS.');
    } else if (os === "iOS") {
        downloadButton.onclick = () => alert('No download available for your OS.');
    } else {
        downloadButton.onclick = () => alert('No download available for your OS.');
    }
}

    // Generate decorative ghosts dynamically with random sizes/positions
    function createGhosts(count = 18) {
        const container = document.getElementById('floating-ghosts') || document.querySelector('.floating-ghosts');
        if (!container) return;

        const maxAssetIndex = 20; // highest ghost asset index available
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            const idx = Math.floor(Math.random() * (maxAssetIndex + 1));
            img.src = `assets/ghosts/ghost_${idx}.png`;
            img.className = 'ghost';

            // Random size (px)
            const size = Math.floor(Math.random() * 180) + 40; // 40 - 220px
            img.style.width = `${size}px`;
            img.style.height = 'auto';

            // Random position
            img.style.left = `${Math.random() * 100}%`;
            img.style.top = `${Math.random() * 100}%`;
            img.style.position = 'absolute';

            // Subtle opacity and randomized animation timing
            img.style.opacity = (Math.random() * 0.15 + 0.03).toFixed(2);
            img.style.animationDuration = `${Math.random() * 25 + 15}s`; // 15s - 40s
            img.style.animationDelay = `${Math.random() * -20}s`;

            // Start rotated slightly for variety
            img.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;

            container.appendChild(img);
        }
    }

    // Slightly increase ghost count for a denser background
    createGhosts(26);

detectOS();