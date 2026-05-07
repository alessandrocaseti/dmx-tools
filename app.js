/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// App info
// TODO: replace with metadata object
const appName = 'DMX Tools';
const description = 'Free DMX utilities developed by Alessandro Caseti'
const version = '1.0.0 Alpha 3';
const date = '26/03/2026';
const author = 'Alessandro Caseti';

// Main & navigation functions

// Single source of truth for pages: add new pages here only
const pageNav = [
    { id: 'home', icon: '', title: 'Get Started' },
    { id: 'patch', icon: '', title: 'DMX Patch' },
    { id: 'universe', icon: '', title: 'Universe View' },
    { id: 'dip', icon: '', title: 'DIP Switch' },
    { id: 'color', icon: '', title: 'Color Converter' },
    { id: 'power', icon: '', title: 'Power Calculator' },
    { id: 'beam', icon: '', title: 'Beam Preview' },
    { id: 'database', icon: '', title: 'Fixture Database' },
    { id: 'artnet-decoder', icon: '', title: 'ArtNet Decoder', desktop: true },
    { id: 'settings', icon: '', title: 'Control Center' }
];

// Derived arrays for convenience (keeps code compatible with existing usages)
const pages = pageNav.map(p => p.id);
const icons = pageNav.map(p => p.icon);
const pageNames = pageNav.map(p => p.title);
const desktopPages = pageNav.filter(p => p.desktop).map(p => p.id);
// layout icon: 

let currentPage = pages.includes('home') ? 'home' : pages[0] || '';

function navigationError(p)
{
    console.error('Navigation error: page "' + p + '" does not exist.');
    setCmdMessage('Navigation error: page "' + p + '" does not exist. Navigated to home.', 'ERROR');
    navigateTo('home');
    return;
}

function navigateTo(page)
{
    if (!pages.includes(page) || !pageIsAvailable(page)) {
        navigationError(page);
        return;
    }

    // hide all pages and reset nav buttons (robust to missing elements)
    for (let id of pages) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';

        const btn = document.getElementById(id + 'NavButton');
        if (btn) {
            btn.classList.remove('selectedNavButton');
            btn.classList.add('unselectedNavButton');
        }
    }

    window.scrollTo(0, 0);
    currentPage = page;

    const pageEl = document.getElementById(page);
    if (pageEl) pageEl.style.display = 'block';

    const navBtn = document.getElementById(page + 'NavButton');
    if (navBtn) {
        navBtn.classList.remove('unselectedNavButton');
        navBtn.classList.add('selectedNavButton');
    }

    const idx = pages.indexOf(page);
    const cmdIconEl = document.getElementById('cmdIcon');
    if (cmdIconEl && icons[idx]) cmdIconEl.innerHTML = icons[idx];

    const title = pageNames[idx] || page;
    document.title = title + ' - ' + appName;
}

function targetPage(offset)
{
    const startIdx = pages.indexOf(currentPage);
    if (startIdx === -1) {
        setCmdMessage('Current page unknown, cannot navigate.', 'ERROR');
        return;
    }

    const base = startIdx + offset;
    let found = null;
    for (let k = 0; k < pages.length; k++) {
        const idx = (base + k + pages.length * 10) % pages.length;
        const candidate = pages[idx];
        if (pageIsAvailable(candidate)) {
            found = candidate;
            break;
        }
    }

    if (!found) {
        setCmdMessage('No available pages for navigation in this environment.', 'NAV');
        return;
    }

    setCmdMessage("Navigated to " + found + ".", "NAV");
    navigateTo(found);
}

// Detect whether app runs as a desktop (Electron) build.
function isDesktop() {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') !== -1) return true;
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) return true;
    } catch (e) {
        // ignore
    }
    return false;
}

// Return whether a page is available in the current environment (web vs desktop)
function pageIsAvailable(pageId) {
    const entry = pageNav.find(p => p.id === pageId);
    if (!entry) return false;
    if (entry.desktop && !isDesktop()) return false;
    return true;
}

function TODO(feature)
{
    setCmdMessage("This feature is not yet implemented.", feature.toUpperCase());
    return;
}

function openLiveclock()
{
    setCmdMessage('Opened liveclock app in a new browser tab.', 'LIVECLOCK');
    window.open('https://alessandrocaseti.github.io/live-clock', '_blank').focus();
}

function downloadDesktopApp()
{
    setCmdMessage('Opened Google Drive page to download desktop app in a new browser tab.', 'DOWNLOAD');
    window.open('https://dl.dropboxusercontent.com/scl/fi/jvxuua38fqf8j3981ply0/dmxtools-1.0.0-alpha-setup.zip?rlkey=wd57ly9d38ps37f9rd7tb5grj&st=hj5imc2a&dl=0', '_blank').focus();
}