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

    const filename = `dmxtools_appdata.dmxtd`;

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
            const xmlText = reader.result;

            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlText, 'application/xml');
                if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML file');

                const message = `Loaded DMXTD file: ${filename}`;
                if (typeof setCmdMessage === 'function') {
                    setCmdMessage(message, 'IMPORT DATA');
                } else if (window && typeof window.setCmdMessage === 'function') {
                    window.setCmdMessage(message);
                } else {
                    console.log(message);
                }

                // Helper: convert <data> XML back to JS value
                function parseXmlValue(node) {
                    if (!node) return null;
                    const tag = node.tagName ? node.tagName.toLowerCase() : null;
                    if (!tag) return node.textContent || null;
                    if (tag === 'null') return null;
                    if (tag === 'string') return node.textContent || '';
                    if (tag === 'number') return Number(node.textContent);
                    if (tag === 'boolean') return (node.textContent || '').toLowerCase() === 'true';
                    if (tag === 'array') {
                        const out = [];
                        const items = node.getElementsByTagName('item');
                        for (let i = 0; i < items.length; i++) {
                            const child = items[i].firstElementChild;
                            out.push(parseXmlValue(child));
                        }
                        return out;
                    }
                    if (tag === 'object') {
                        const out = {};
                        const props = node.getElementsByTagName('property');
                        for (let i = 0; i < props.length; i++) {
                            const p = props[i];
                            const name = p.getAttribute('name') || p.getAttribute('Name') || '';
                            const child = p.firstElementChild;
                            out[name] = parseXmlValue(child);
                        }
                        return out;
                    }

                    // Fallback: if element contains basic primitives wrapped differently
                    if (node.children && node.children.length === 1) return parseXmlValue(node.children[0]);
                    return node.textContent;
                }

                // Find Engine block (case-insensitive)
                let engine = doc.getElementsByTagName('Engine')[0] || doc.getElementsByTagName('engine')[0];
                if (!engine) {
                    // try to search root for engine-like node
                    const engines = doc.getElementsByTagName('*');
                    for (let i = 0; i < engines.length; i++) {
                        if (engines[i].tagName && engines[i].tagName.toLowerCase() === 'engine') { engine = engines[i]; break; }
                    }
                }

                if (engine) {
                    // Restore generic <entry> elements
                    const entries = engine.getElementsByTagName('entry');
                    for (let i = 0; i < entries.length; i++) {
                        const ent = entries[i];
                        const keyEl = ent.getElementsByTagName('key')[0];
                        if (!keyEl) continue;
                        const key = keyEl.textContent;
                        const valueEl = ent.getElementsByTagName('value')[0];
                        const dataEl = ent.getElementsByTagName('data')[0];

                        try {
                            if (valueEl) {
                                localStorage.setItem(key, valueEl.textContent || '');
                            } else if (dataEl) {
                                // The <data> wrapper usually contains a single typed child
                                const first = dataEl.firstElementChild;
                                const parsed = parseXmlValue(first);
                                localStorage.setItem(key, JSON.stringify(parsed));
                            }
                        } catch (e) {
                            console.warn('Failed to restore key', key, e);
                        }
                    }

                    // Restore Terminal logs (CmdLog) into localStorage keys `cmdLogs` and `cmdInputs`
                    const terminals = engine.getElementsByTagName('Terminal');
                    if (terminals && terminals.length) {
                        const term = terminals[0];
                        const cmdLogNodes = term.getElementsByTagName('CmdLog');
                        const outLogs = [];
                        const outInputs = [];
                        for (let i = 0; i < cmdLogNodes.length; i++) {
                            const n = cmdLogNodes[i];
                            const typeAttr = (n.getAttribute('Type') || n.getAttribute('type') || '').toLowerCase();
                            const dateAttr = n.getAttribute('Date') || n.getAttribute('Date') || new Date().toISOString();
                            const stateEl = n.getElementsByTagName('State')[0];
                            const valueEl = n.getElementsByTagName('Value')[0];
                            const state = stateEl ? stateEl.textContent : '';
                            const val = valueEl ? valueEl.textContent : '';
                            if (typeAttr === 'input') {
                                outInputs.push({ date: dateAttr, type: state, input: val });
                            } else {
                                outLogs.push({ date: dateAttr, type: state, message: val });
                            }
                        }

                        try { if (outLogs.length) localStorage.setItem('cmdLogs', JSON.stringify(outLogs)); } catch (e) {}
                        try { if (outInputs.length) localStorage.setItem('cmdInputs', JSON.stringify(outInputs)); } catch (e) {}
                    }

                    // restore localColors & favorite fixtures
                    try {
                        // ColorManager -> savedColors
                        const colorManager = engine.getElementsByTagName('ColorManager')[0] || engine.getElementsByTagName('colormanager')[0];
                        if (colorManager) {
                            const localColors = [];
                            const localColorNodes = colorManager.getElementsByTagName('LocalColor');
                            for (let i = 0; i < localColorNodes.length; i++) {
                                const n = localColorNodes[i];
                                const id = n.getAttribute('ID') || n.getAttribute('Id') || n.getAttribute('id') || null;
                                const name = n.getAttribute('Name') || n.getAttribute('name') || n.getAttribute('Title') || null;
                                const palette = n.getAttribute('Palette') || n.getAttribute('palette') || null;
                                const colorObj = {};
                                if (id) colorObj.id = id;
                                if (name) colorObj.name = name;
                                if (palette) colorObj.palette = palette;

                                // RGB
                                const rgbEl = n.getElementsByTagName('RGB')[0];
                                if (rgbEl) {
                                    const r = rgbEl.getAttribute('R');
                                    const g = rgbEl.getAttribute('G');
                                    const b = rgbEl.getAttribute('B');
                                    colorObj.rgb = { r: Number(r), g: Number(g), b: Number(b) };
                                    // derive hex if not present
                                    try {
                                        const toHex = (v) => (Math.max(0, Math.min(255, Number(v))) || 0).toString(16).padStart(2, '0');
                                        colorObj.hex = '#' + toHex(colorObj.rgb.r) + toHex(colorObj.rgb.g) + toHex(colorObj.rgb.b);
                                    } catch (e) {}
                                }

                                // HEX
                                const hexEl = n.getElementsByTagName('HEX')[0];
                                if (hexEl) {
                                    const hv = hexEl.getAttribute('Value') || hexEl.getAttribute('value') || hexEl.textContent || null;
                                    if (hv) colorObj.hex = hv;
                                }

                                // HSL
                                const hslEl = n.getElementsByTagName('HSL')[0];
                                if (hslEl) {
                                    const h = hslEl.getAttribute('H');
                                    const s = hslEl.getAttribute('S');
                                    const l = hslEl.getAttribute('L');
                                    colorObj.hsl = { h: Number(h), s: Number(s), l: Number(l) };
                                }

                                // CMY
                                const cmyEl = n.getElementsByTagName('CMY')[0];
                                if (cmyEl) {
                                    const c = cmyEl.getAttribute('C');
                                    const m = cmyEl.getAttribute('M');
                                    const y = cmyEl.getAttribute('Y');
                                    colorObj.cmy = { c: Number(c), m: Number(m), y: Number(y) };
                                }

                                // CMYK
                                const cmykEl = n.getElementsByTagName('CMYK')[0];
                                if (cmykEl) {
                                    const c = cmykEl.getAttribute('C');
                                    const m = cmykEl.getAttribute('M');
                                    const y = cmykEl.getAttribute('Y');
                                    const k = cmykEl.getAttribute('K');
                                    colorObj.cmyk = { c: Number(c), m: Number(m), y: Number(y), k: Number(k) };
                                }

                                localColors.push(colorObj);
                            }
                            if (localColors.length) 
                            {
                                try 
                                {
                                    localStorage.setItem('savedColors', JSON.stringify(localColors));
                                } catch (e) { }
                            }
                        }

                        // FixtureManager -> dmx_favorites
                        const fixtureManager = engine.getElementsByTagName('FixtureManager')[0] || engine.getElementsByTagName('fixturemanager')[0];
                        if (fixtureManager) {
                            const favs = [];
                            const favNodes = fixtureManager.getElementsByTagName('FavoriteFixture');
                            for (let i = 0; i < favNodes.length; i++) {
                                const n = favNodes[i];
                                const dateAttr = n.getAttribute('DateAdded') || n.getAttribute('Date') || null;
                                const brandEl = n.getElementsByTagName('Brand')[0];
                                const fileEl = n.getElementsByTagName('File')[0];
                                const entry = {};
                                if (brandEl && brandEl.textContent) entry.folder = brandEl.textContent;
                                if (fileEl && fileEl.textContent) entry.file = fileEl.textContent;
                                if (dateAttr) entry.addedAt = dateAttr;
                                if (entry.folder || entry.file) favs.push(entry);
                            }
                            if (favs.length) {
                                try { localStorage.setItem('dmx_favorites', JSON.stringify(favs)); } catch (e) { }
                            }
                        }
                    } catch (e) { console.warn('Failed to restore ColorManager/FixtureManager', e); }
                }

                if (typeof setCmdMessage === 'function') setCmdMessage('Application data imported successfully.', 'IMPORT DATA');
                else console.log('Application data imported successfully.');
            } catch (err) {
                if (typeof setCmdMessage === 'function') setCmdMessage('Failed to import app data: ' + err.message, 'ERROR');
                else console.error('Failed to import app data:', err);
            }

            // cleanup
            document.body.removeChild(input);
        };

        reader.readAsText(file);
    });

    // Trigger the file dialog
    input.click();
}

function clearAppData()
{
    // Ask the user via CMD and handle the asynchronous response via callback
    if (window.askViaCmdWithCallback) {
        askViaCmdWithCallback("Are you sure you want to clear all app data?", "WARNING", function(answer) {
            if (answer) {
                setCmdMessage('Clearing all app data...', 'CLEAR');
                try { localStorage.clear(); } catch (e) { /* ignore */ }
                setCmdMessage('All application data cleared.', 'CLEAR');
            } else {
                setCmdMessage('User cancelled. Aborting task.', 'WARNING');
            }
        });
    } else {
        // Fallback: original synchronous flow (legacy)
        askViaCmd("Are you sure you want to clear all app data?", "WARNING");
        if (askInput) {
            setCmdMessage("User said yes", 'TEST');
        } else {
            setCmdMessage("User said no. Aborting task.", 'TEST');
        }
    }
}