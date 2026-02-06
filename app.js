/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// App info

const appName = 'DMX Tools';
const version = '1.0.0 Alpha 1';
const date = '16/11/2025';
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
    setCmdMessage("Navigated to " + currentPage + ".", "NAV");
    navigateTo(pages[(pages.indexOf(currentPage) + offset + pages.length) % pages.length]);
}
