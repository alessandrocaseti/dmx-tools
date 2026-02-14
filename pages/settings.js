// DMX TOOLS

let cmdLogsView = false;
let cmdCommandsView = false;
function showSettings() 
{
    document.getElementById('cards-container').style.display = 'flex';
    document.getElementById('cmdLogs').style.display = 'none';
    document.getElementById('cmdCommands').style.display = 'none';
    document.getElementById('ac').style.display = 'block';
    document.getElementById('logsContainer').innerHTML = '';
    cmdLogsView = false;
    cmdCommandsView = false;
    document.getElementById('settingsPageTitle').innerHTML = 'Control Center';
    window.scrollTo(0, 0);
}

function viewCmdCommands()
{
    window.scrollTo(0, 0);
    document.getElementById('settingsPageTitle').innerHTML = 'Terminal Commands';
    document.getElementById('cards-container').style.display = 'none';
    document.getElementById('cmdCommands').style.display = 'block';
    document.getElementById('ac').style.display = 'none';
    cmdCommandsView = true;
}

function viewCmdLogs() 
{
    window.scrollTo(0, 0);
    document.getElementById('settingsPageTitle').innerHTML = 'Terminal Logs';
    document.getElementById('cards-container').style.display = 'none';
    document.getElementById('cmdLogs').style.display = 'block';
    document.getElementById('ac').style.display = 'none';
    document.getElementById('logsContainer').innerHTML = '';
    cmdLogsView = true;

    if(!localStorage.getItem('cmdLogs') && !localStorage.getItem('cmdInputs')) 
    {
        const noLogsElement = document.createElement('p');
        noLogsElement.textContent = 'No logs available.';
        noLogsElement.style.fontStyle = 'italic';
        noLogsElement.id = 'noLogsMessage';
        document.getElementById('logsContainer').appendChild(noLogsElement);
        return;
    }

    const allLogs = [];
    
    for (let log of _getLocalArray('cmdLogs')) 
    {
        allLogs.push
        ({
            date: log.date,
            text: `[${log.type}] ${log.message}`
        });
    }

    for (let log of _getLocalArray('cmdInputs')) 
    {
        allLogs.push
        ({
            date: log.date,
            text: `User typed "${log.input}" while CMD was on the [${log.type}] state`
        });
    }

    // Ordina per data decrescente (più recenti prima)
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Visualizza i log ordinati
    for (let log of allLogs) 
    {
        const logElement = document.createElement('p');
        logElement.textContent = `${log.text} (${new Date(log.date).toLocaleString()})`;
        logElement.className = 'log-item';
        document.getElementById('logsContainer').appendChild(logElement);
    }
}

function downloadAppData()
{
    const metadata = {
        appName: 'DMX Tools',
        appVersion: (window.APP_VERSION || 'dev'),
        userAgent: (navigator && navigator.userAgent) ? navigator.userAgent : '',
        notes: ''
    };

    // Use exposed helpers from export/dmxt_file.js
    const xml = (typeof exportLocalStorageToXML === 'function')
        ? exportLocalStorageToXML({ metadata })
        : (window.exportLocalStorageToXML ? window.exportLocalStorageToXML({ metadata }) : null);

    if (!xml) {
        alert('Export function not available. Make sure export/dmxt_file.js is loaded.');
        return;
    }

    const filename = `dmxtools_user_data.dmxtd`;

    if (typeof downloadDMXTD === 'function') {
        downloadDMXTD(filename, xml);
    } else if (window.downloadDMXTD) {
        window.downloadDMXTD(filename, xml);
    } else {
        // fallback: create blob and download
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

function loadAppData()
{
    // Create a hidden file input that accepts only .dmxtd files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dmxtd';
    input.title = 'Dmx Tools data configuration file';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', (evt) => {
        const file = input.files && input.files[0];
        if (!file) {
            document.body.removeChild(input);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const filename = file.name || 'unknown';
            const message = `Loaded DMXTD file: ${filename}`;
            if (typeof setCmdMessage === 'function') {
                setCmdMessage(message, 'IMPORT DATA');
            } else if (window && typeof window.setCmdMessage === 'function') {
                window.setCmdMessage(message);
            } else {
                console.log(message);
            }

            // cleanup
            document.body.removeChild(input);
        };

        reader.readAsText(file);
    });

    // Trigger the file dialog
    input.click();
}