/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

let currentPage = 'home';

// Main & navigation functions

function navigateTo(page)
{
    document.getElementById('home').style.display = 'none';
    document.getElementById('homeNavButton').classList.remove('selectedNavButton');
    document.getElementById('homeNavButton').classList.add('unselectedNavButton');
    document.getElementById('patch').style.display = 'none';
    document.getElementById('patchNavButton').classList.remove('selectedNavButton');
    document.getElementById('patchNavButton').classList.add('unselectedNavButton');
    document.getElementById('dip').style.display = 'none';
    document.getElementById('dipNavButton').classList.remove('selectedNavButton');
    document.getElementById('dipNavButton').classList.add('unselectedNavButton');
    document.getElementById('rgb').style.display = 'none';
    document.getElementById('rgbNavButton').classList.remove('selectedNavButton');
    document.getElementById('rgbNavButton').classList.add('unselectedNavButton');
    document.getElementById('power').style.display = 'none';
    document.getElementById('powerNavButton').classList.remove('selectedNavButton');
    document.getElementById('powerNavButton').classList.add('unselectedNavButton');
    document.getElementById('beam').style.display = 'none';
    document.getElementById('beamNavButton').classList.remove('selectedNavButton');
    document.getElementById('beamNavButton').classList.add('unselectedNavButton');
    document.getElementById('database').style.display = 'none';
    document.getElementById('databaseNavButton').classList.remove('selectedNavButton');
    document.getElementById('databaseNavButton').classList.add('unselectedNavButton');

    currentPage = page;

    switch(page)
    {
        case 'home':
        {
            document.getElementById('home').style.display = 'block';
            document.getElementById('homeNavButton').classList.remove('unselectedNavButton');
            document.getElementById('homeNavButton').classList.add('selectedNavButton');
            return;
        }

        case 'patch':
        {
            document.getElementById('patch').style.display = 'block';
            document.getElementById('patchNavButton').classList.remove('unselectedNavButton');
            document.getElementById('patchNavButton').classList.add('selectedNavButton');
            return;
        }
        
        case 'dip':
        {
            document.getElementById('dip').style.display = 'block';
            document.getElementById('dipNavButton').classList.remove('unselectedNavButton');
            document.getElementById('dipNavButton').classList.add('selectedNavButton');
            return;
        }

        case 'color':
        {
            document.getElementById('rgb').style.display = 'block';
            document.getElementById('rgbNavButton').classList.remove('unselectedNavButton');
            document.getElementById('rgbNavButton').classList.add('selectedNavButton');
            return;
        }

        case 'power':
        {
            document.getElementById('power').style.display = 'block';
            document.getElementById('powerNavButton').classList.remove('unselectedNavButton');
            document.getElementById('powerNavButton').classList.add('selectedNavButton');
            // Initialize power converter when power tools page is shown
            if (typeof PowerConverter !== 'undefined' && !window.powerConverterInitialized) 
            {
                powerConverter = new PowerConverter();
                window.powerConverterInitialized = true;
            }
            return;
        }

        case 'beam':
        {
            document.getElementById('beam').style.display = 'block';
            document.getElementById('beamNavButton').classList.remove('unselectedNavButton');
            document.getElementById('beamNavButton').classList.add('selectedNavButton');
            return;
        }

        case 'database':
        {
            document.getElementById('database').style.display = 'block';
            document.getElementById('databaseNavButton').classList.remove('unselectedNavButton');
            document.getElementById('databaseNavButton').classList.add('selectedNavButton');
            return;
        }
    }
}

