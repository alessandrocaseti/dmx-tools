/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// App info
// TODO: replace with metadata object
const appName = 'DMX Tools';
const version = '1.0.0 Alpha 2';
const date = '06/02/2026';
const author = 'Alessandro Caseti';

// Main & navigation functions

let currentPage = 'home';
let pages = ['home', 'patch', 'universe', 'dip', 'color', 'power', 'beam', 'database', 'settings'];
let icons = ['', '', '', '', '', '', '', '', ''];
// layout icon: 

function navigationError(p)
{
    console.error('Navigation error: page "' + p + '" does not exist.');
    setCmdMessage('Navigation error: page "' + p + '" does not exist. Navigated to home.', 'ERROR');
    navigateTo('home');
    return;
}

function navigateTo(page)
{
    if (!pages.includes(page))
    {
        navigationError(page);
        return;
    }

    for (let p of pages)
    {
        document.getElementById(p).style.display = 'none';
        document.getElementById(p + 'NavButton').classList.remove('selectedNavButton');
        document.getElementById(p + 'NavButton').classList.add('unselectedNavButton');
    }

    window.scrollTo(0, 0);
    currentPage = page;

    document.getElementById(page).style.display = 'block';
    document.getElementById(page + 'NavButton').classList.remove('unselectedNavButton');
    document.getElementById(page + 'NavButton').classList.add('selectedNavButton');
    document.getElementById('cmdIcon').innerHTML = icons[pages.indexOf(page)];
}

function targetPage(offset)
{
    const newPage = pages[(pages.indexOf(currentPage) + offset + pages.length) % pages.length];
    setCmdMessage("Navigated to " + newPage + ".", "NAV");
    navigateTo(newPage);
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