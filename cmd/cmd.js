/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// Command prompt main functions

document.addEventListener('keydown', function(e)
{
    try 
    {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C'))
        {
            const input = document.getElementById('cmdInput');
            if (input)
            {
                e.preventDefault();
                input.focus();
                input.select();
            }
        }
    } catch (err) { /* ignore */ }
});

String.prototype.toProperCase = function () 
{
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function isBinaryString(str) 
{
    // Regular expression pattern to match
    const binaryPattern = /^[01]+$/; // only 0s and 1s
    return binaryPattern.test(str); // Test if the string matches the pattern
}

function isHexColor(hex) 
{
    return typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex))
}

// --- localStorage helpers for CMD logs & inputs ---
function _getLocalArray(key) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : [];
    } catch (e) {
        return [];
    }
}

function _pushLocalArray(key, obj) {
    try {
        const arr = _getLocalArray(key);
        arr.push(obj);
        localStorage.setItem(key, JSON.stringify(arr));
        if((key === 'cmdLogs' || key === 'cmdInputs') && cmdLogsView) { viewCmdLogs(); } 
    } catch (e) {
        // ignore storage errors
    }
}

function pushCmdLog(message, type) {
    _pushLocalArray('cmdLogs', { message: message || '', type: type || 'WELCOME', date: new Date().toISOString() });
}

function pushCmdInput(input, lastCmdType) {
    _pushLocalArray('cmdInputs', { input: input || '', type: lastCmdType || 'UNKNOWN', date: new Date().toISOString() });
}

function clearCmdLogs() {
    localStorage.removeItem('cmdLogs');
    localStorage.removeItem('cmdInputs');
    document.getElementById('logsContainer').innerHTML = '';
    viewCmdLogs();
}

let specialBackground = false;

function startDotAnimation() 
{
    const dotText = document.getElementById('dot');
    const container = document.getElementById('cmdMsgTypeContainer');
    dotText.style.visibility = 'hidden';
    container.classList.add('blink');
    document.getElementById('command-bar').style.backgroundColor = '#130036ff';
    document.getElementById('cmdTitle').innerHTML = 'CMD • Waiting for input...';
    specialBackground = true;

    setInterval(() =>
    {
        if (dotText.style.visibility === 'hidden') 
        {
            dotText.style.visibility = 'visible';
        }
        else 
        {
            dotText.style.visibility = 'hidden';
        }
    }, 500);
}

function stopDotAnimation()
{
    const dotText = document.getElementById('dot');
    dotText.style.visibility = 'visible';
    const container = document.getElementById('cmdMsgTypeContainer');
    container.classList.remove('blink');
    document.getElementById('cmdTitle').innerHTML = 'CMD • Current message';
    document.getElementById('command-bar').style.backgroundColor = '#141414';
}

function setCmdMessage(msg, type)
{   
    // store inside localstorage
    try { pushCmdLog(msg, type); } catch (e) { /* ignore */ }
    stopDotAnimation();
    const container = document.getElementById('cmdListContainer2');
    const cmdMsg = document.createElement('p');
    const dot = document.createElement('p');
    const icon = document.getElementById("cmdIcon");
    dot.className = 'command-msg dot';
    dot.id = 'dot';
    dot.textContent = '>';
    icon.style.color = "rgb(81, 81, 81)";
    if (!freeze) 
    { 
        container.innerHTML = '';
        cmdMsg.className = 'command-msg';
        cmdMsg.id = 'cmdMsg';
        cmdMsg.textContent = msg; 
        container.appendChild(cmdMsg);
        container.appendChild(dot);
    }

    else { document.getElementById('cmdMsg').textContent = "Command prompt frozen"}

    const typeText = document.getElementById('cmdMsgType');
    const containerType = document.getElementById('cmdMsgTypeContainer');
    const cmdBar = document.getElementById('command-bar');

    if(freeze) { type = 'FREEZE'; }

    if(!freeze)
    {
        document.getElementById('cmdInput').value = '';
        focusCmd(false);
    }

    if (typeText) 
    { 
        if (!freeze) typeText.innerHTML = type || 'WELCOME';
        else typeText.innerHTML = 'FREEZE';
        typeText.style.color = 'white';
        containerType.style.borderColor = 'yellow';
        containerType.style.backgroundColor = 'rgba(255, 255, 0, 0.0)';
        cmdBar.style.backgroundColor = '#141414';
        specialBackground = false;
    }

    if (typeText && type === 'FREEZE')
    {
        typeText.style.color = '#a4a4a4ff';
        containerType.style.borderColor = '#a4a4a4ff';
        containerType.style.backgroundColor = '#0f0f0f';
        cmdBar.style.backgroundColor = '#0f0f0f';
        specialBackground = true;
        return;
    }

    if (typeText && type === 'ERROR')
    {
        typeText.style.color = 'LightCoral';
        containerType.style.borderColor = 'LightCoral';
        containerType.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        cmdBar.style.backgroundColor = '#340000ff';
        specialBackground = true;
        icon.style.color = "rgba(165, 18, 18, 1)";
    }

    else if (typeText && type === 'WARNING')
    {
        typeText.style.color = 'orange';
        containerType.style.borderColor = 'orange';
        containerType.style.backgroundColor = 'rgba(255, 140, 0, 0.2)';
        cmdBar.style.backgroundColor = '#3a2500ff';
        specialBackground = true;
        icon.style.color = 'rgba(165, 133, 18, 1)';
    }
}

let remove = false;
let add = false;
let color = false;
let doc = false;
let rename = false;
let freeze = false;
let nav = false;
let vectorShift = false;

function resetCmd(freezeTrigger = true)
{
    remove = false;
    add = false;
    color = false;
    doc = false;
    rename = false;
    nav = false;
    vectorShift = false;
    if (freezeTrigger) freeze = false;
}

function focusCmd(trigger)
{
    if(trigger && !specialBackground) document.getElementById('command-bar').style.backgroundColor = '#141414';
    if(trigger && specialBackground) document.getElementById('command-bar').style.backgroundColor = oldBackground;
    if(!trigger) document.getElementById('cmdInput').select();
    return;
}

let oldBackground;

function unfocusCmd()
{
    if(specialBackground) oldBackground = document.getElementById('command-bar').style.backgroundColor;
    document.getElementById('command-bar').style.backgroundColor = '#0f0f0f';
    return;
}

function startVectorShift()
{
    setCmdMessage('Vector shift is only available on the Universe page.', 'ERROR');
    vectorShift = true;
    setCmdMessage('Enter vector value. (syntax: + or - {offset} OR -sf {targetStart}):', 'VECTOR SHIFT');
    startDotAnimation();
}
window.startVectorShift = startVectorShift;

function handleCommand(event)
{
    if (event.key === 'Enter')
    {
        stopDotAnimation();
        const cmdInput = document.getElementById('cmdInput');
        const command = cmdInput.value.trim().toLowerCase();
        const rawCommand = cmdInput.value.trim();
        // store user input in localstorage
        try { pushCmdInput(rawCommand, document.getElementById('cmdMsgType').innerHTML); } catch (e) { /* ignore */ }
        cmdInput.value = '';
        focusCmd(false);

        // TODO -> gestire errori quando dentro a color/add/remove/docset/rename
        // TODO -> aggiungere command includes / a tutti gli if
        // TODO -> gestire lowercase / propercase
        // TODO -> hero commands
        // TODO -> usare switch al posto di if/else

        if(freeze && command !== 'unfreeze' && command !== 'reset') { return };

        if (command === 'reset') // reset ha la priorità su tutto
        {
            resetCmd();
            setCmdMessage("Successfully resetted command prompt.", "RESET")
            return;
        }

        else if (nav)
        {
            nav = false;

            if (!command || !pages.includes(command))
            {
                setCmdMessage('Invalid page name. Enter a page between home, patch, universe, dip, color, power, beam, database or settings.', 'ERROR');
                startDotAnimation();
                nav = true;
            }
            else
            {
                navigateTo(command);
                setCmdMessage('Navigated to ' + command + '.', 'NAV');
            }
            return;
        }

        else if (remove)
        {
            remove = false;

            if (!isNaN(command) && command > -1 && command < listaFixture.length)
            {
                removeFixture(command);
            }

            else
            {
                setCmdMessage('Invalid fixture ID. Please enter a number between 0 and ' + (listaFixture.length - 1) + '.', 'ERROR');
                startDotAnimation();
                remove = true;
            }
            return;
        }

        else if (add)
        {
            let name, type, qty, channels;

            if (command.includes('/')) // Se il comando contiene '/'
            {
                [name, type, qty, channels] = command.split('/').map(s => s.trim());
                console.log(`Parsed fixture values: name=${name}, type=${type}, qty=${qty}, channels=${channels}`);
                if (!name || !type || isNaN(qty) || isNaN(channels) || qty < 1 || channels < 1 || channels > 511)
                {
                    setCmdMessage('Invalid fixture values. Please check the name, type, quantity, and channels.', 'ERROR');
                    add = true;
                    startDotAnimation();
                    return;
                }
            }
            else
            {
                setCmdMessage('Invalid syntax. Please insert the fixture name / type / quantity / channels separated by a slash.', 'ERROR');
                add = true;
                startDotAnimation();
                return;
            }

            aggiungiFixture(name.toProperCase(), type.toProperCase(), qty, channels);
            add = false;
            return;
        }

        else if (color)
        {
            color = false;
            let id, hex;
            [id, hex] = command.split('/').map(s => s.trim());
            hex = hex.toString();// TO DO TOGLIERE IL CANCELLETTO SE C'è, LO RIMETTI ALLA FINE MA IL CONTROLLO NON LO VUOLE
 
            console.log(`Parsed values: id=${id}, hex=${hex}`);

            if (id > -1 && id < listaFixture.length && isHexColor(hex))
            {
                if(!hex.startsWith('#'))
                {
                    hex = '#' + hex;
                }
                window.cambiaColoreFixture(id, hex);
            }
            else
            {
                setCmdMessage('Invalid fixture ID or hex color code. Please enter proper values.', 'ERROR');
                startDotAnimation();
                color = true;
            }
            return;
        }

        else if (doc)
        {
            doc = false;
            let event, location, author;
            [event, location, author] = command.split('/').map(s => s.trim());
 
            if (event && location && author)
            {
                document.getElementById('evento').value = event.toProperCase();
                document.getElementById('luogo').value = location.toProperCase();
                document.getElementById('autorePatch').value = author.toProperCase();
                setCmdMessage('Successfully updated document details.', 'DOCSET');
            }
            else
            {
                setCmdMessage('Invalid syntax. Please insert the event / place / author names separated by a slash.', 'ERROR');
                startDotAnimation();
                doc = true;
            }
            return;
        }

        else if (vectorShift)
        {
            // consume one input for the vector value
            vectorShift = false;
            let raw = rawCommand.trim();
            // allow optional + sign
            if (command.startsWith('-sf'))
            {
                // syntax: -sf {targetStart}
                let value = rawCommand.slice(3).trim();
                if (!value)
                {
                    setCmdMessage('Invalid syntax. Use -sf {targetStart}.', 'ERROR');
                    return;
                }
                if (isNaN(value))
                {
                    setCmdMessage('Invalid start address. Please enter a number between 1 and 512.', 'ERROR');
                    return;
                }
                const target = parseInt(value, 10);
                if (window.universeController && typeof window.universeController.shiftFrom === 'function')
                {
                    window.universeController.shiftFrom(target);
                }
                else
                {
                    setCmdMessage('Universe controller not available.', 'ERROR');
                }
                return;
            }
            if (raw.startsWith('+')) raw = raw.slice(1);
            if (!raw || isNaN(raw))
            {
                setCmdMessage('Invalid vector value. Please enter a numeric offset (e.g. +200 or -50).', 'ERROR');
                startDotAnimation();
                vectorShift = true;
                return;
            }
            const offset = parseInt(raw, 10);
            // delegate to universe controller if present
            if (window.universeController && typeof window.universeController.applyVectorShift === 'function')
            {
                window.universeController.applyVectorShift(offset);
            }
            else
            {
                setCmdMessage('Universe controller not available.', 'ERROR');
            }
            return;
        }

        else if (rename)
        {
            rename = false;
            let id, newName;
            [id, newName] = command.split('/').map(s => s.trim());
 
            if (id > -1 && id < listaFixture.length && newName)
            {
                setCmdMessage('Successfully renamed fixture "' + listaFixture[id].nome + '" to "' + newName + '".', 'RENAME');
                listaFixture[id].nome = newName;
                updatePatch();
            }
            else
            {
                setCmdMessage('Invalid fixture ID or new fixture name. Please enter proper values.', 'ERROR');
                startDotAnimation();
                rename = true;
            }
            return;
        }

        else if (command === '')
        {
            setCmdMessage('Please enter a command.', 'ERROR');
            return;
        }

        else if (command === 'freeze')
        {
            stopDotAnimation();
            freeze = true;
            setCmdMessage("Command prompt frozen", "FREEZE")
            return;
        }
        else if (command === 'unfreeze')
        {
            freeze = false;
            setCmdMessage("Command prompt unfrozen", "UNFREEZE")
            return;
        }

        else if (command === 'nav')
        {
            nav = true;
            setCmdMessage("Select page: home, patch, universe, dip, color, power, beam, database or settings.", "NAV")
            startDotAnimation();
            return;
        }

        else if (command.startsWith('-n'))
        {
            const page = rawCommand.slice(3).trim().toLowerCase();
            if (!page || page!== 'home' && page!== 'patch'  && page!== 'dip'  && page!== 'color' && page!== 'power' && page!== 'beam' && page!== 'database')
            {
                setCmdMessage('Invalid page name.', 'ERROR');
                return;
            }
            navigateTo(page);
            setCmdMessage("Navigated to " + page + ".", "NAV")
            return;
        }

        else if (command.startsWith('>'))
        {
            let offset = 0;
            for (let i = 0; i < command.length; i++) 
            {
                if (command[i] === '>') offset++;
                else break;
            }
            targetPage(offset);
            return;
        }

        else if (command.startsWith('<'))
        {
            let offset = 0;
            for (let i = 0; i < command.length; i++) 
            {
                if (command[i] === '<') offset++;
                else break;
            }
            targetPage(-offset);
            return;
        }

        else if (command === 'add' && currentPage === 'patch')
        {
            setCmdMessage('Insert fixture name / fixture type / quantity / channels per unit separated by a slash', 'ADD');
            startDotAnimation();
            add = true;
            return;
        }

        else if (command === 'remove' && currentPage === 'patch')
        {
            if (listaFixture.length > 0 && !remove)
            {
                setCmdMessage('Enter the fixture ID to remove (0 to ' + (listaFixture.length - 1) + '):', 'REMOVE');
                startDotAnimation();
                remove = true;
            }
            else
            {
                setCmdMessage('No fixtures to remove. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        else if (command === 'color' && currentPage === 'patch')
        {
            if (listaFixture.length > 0)
            {
                setCmdMessage('Enter the ID of the fixture / hex code of the new color without #:', 'COLOR');
                startDotAnimation();
                color = true;
            }
            else
            {
                setCmdMessage('No fixtures to change color. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        else if (command === 'docset' && currentPage === 'patch')
        {
            setCmdMessage('Enter the event venue / location / patch author names:', 'DOCSET');
            startDotAnimation();
            doc = true;
            return;
        }
        
        else if (command === 'rename' && currentPage === 'patch')
        {
            if (listaFixture.length > 0)
            {
                setCmdMessage('Enter the ID of the group / new name:', 'RENAME');
                startDotAnimation();
                rename = true;
            }
            else
            {
                setCmdMessage('No fixtures to rename. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        else if (command.startsWith('rename -f') && currentPage === 'patch')
        {
            if (listaFixture.length > 0)
            {
                const newCommand = rawCommand.slice(9).trim();
                [id, newName] = newCommand.split('/').map(s => s.trim());
                if (!newName || !id || isNaN(id) || id <= 0 || id > patchedFixtures.length + 1)
                {
                    setCmdMessage('Invalid syntax. Please enter fixture ID / new name after "rename -f".', 'ERROR');
                    return;
                }
                let oldName = patchedFixtures[id-1].nome;
                patchedFixtures[id-1].nome = newName;
                mostraPatchDMX(true);
                setCmdMessage('Successfully renamed fixture "' + oldName + '" to "' + newName + '".', 'RENAME');
            }
            else
            {
                setCmdMessage('No fixtures to rename. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        else if (command === 'clear' && currentPage === 'patch')
        {
            clearAll();
            return;
        }

        else if (command === 'patch' && currentPage === 'patch')
        {
            if (listaFixture.length > 0 && patch)
            {
                mostraPatchDMX();
            }
            else if (!patch)
            {
                setCmdMessage("Patch already created. Use 'update' instead.", 'WARNING');
            }
            else
            {
                setCmdMessage('No fixtures added. Please add fixtures before patching.', 'ERROR');
            }
            return;
        }

        else if (command === 'update' && currentPage === 'patch')
        {
            if (listaFixture.length > 0 && update)
            {
                mostraPatchDMX();
            }
            else if (!update)
            {
                setCmdMessage("Cannot update an empty patch. Use 'patch' instead.", 'WARNING');
            }
            else
            {
                setCmdMessage('Fixture list is empty, nothing to update.', 'ERROR');
            }
            return;
        }

        else if (command === 'export' && currentPage === 'patch')
        {
            const evento = document.getElementById('evento').value.trim();
            const luogo = document.getElementById('luogo').value.trim();
            const autorePatch = document.getElementById('autorePatch').value.trim();    
            if (!evento || !luogo || !autorePatch || !listaFixture.length)
            {
                setCmdMessage('Please fill the patch and fixture details fields to continue or type "docset" to set them here.', 'ERROR');
                return;
            }
            const exportBtn = document.getElementById('exportPdfBtn');
            if (exportBtn)
            {
                exportBtn.click();
            }
            else
            {
                setCmdMessage('Export button not found. Please check the HTML structure.', 'ERROR');
            }
            return;
        }

        else if (command === 'stats' && currentPage === 'patch')
        {
            if (listaFixture.length > 0)
            {
                const totalFixtures = setStats(1);;
                const footprint = setStats(2);;
                setCmdMessage('Statistics. Total fixtures: ' + totalFixtures + '. DMX footprint: ' + footprint + '.', 'STATS');
            }
            else
            {
                setCmdMessage('No fixtures detected. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        // DIP PAGE COMMANDS
        else if (command === 'clear -d' || command === '--cd' && currentPage === 'dip')
        {
            dipSwitch.clearAddress();
            return;
        }

        else if (command === 'clear -a' || command === '--ca' && currentPage === 'dip')
        {
            dipSwitch.clearAll();
            return;
        }

        else if (command === 'store' || command === '--s' && currentPage === 'dip')
        {
            dipSwitch.storeAddress();
            return;
        }

        else if (command === 'flip' || command === '--f' && currentPage === 'dip')
        {
            dipSwitch.flipSwitches();
            return;
        }

        else if ((command.startsWith('load') || command.startsWith('-l')) && currentPage === 'dip')
        {
            let value = rawCommand.slice(4).trim();
            if(command.startsWith('-l'))
            {
                value = rawCommand.slice(2).trim();
            }
            if (value && !isNaN(value) && value > -1 && value < 512)
            {
                let v = parseInt(value);
                dipSwitch.loadAddress(v);
                return;
            }
            else
            {
                if (isBinaryString(value))
                {
                    let v = parseInt(value, 2);
                    if(v > -1 && v < 512)
                    {
                        dipSwitch.loadAddress(v);
                        return;
                    }
                    else
                    {
                        setCmdMessage("Invalid binary string.", "ERROR");
                        return;
                    }
                }
                else
                {
                    setCmdMessage('Invalid DMX address. Please enter a number between 0 and 511.', 'ERROR');
                    return;
                }
            }
        }

        else if (command === '+' || command === 'increment' && currentPage === 'dip')
        {
            if(dipSwitch.currentAddress >= 511)
            {
                setCmdMessage('Address is already at maximum (511). Cannot increment further.', 'WARNING');
                return;
            }
            dipSwitch.incrementAddress();
            setCmdMessage('Incremented address to ' + dipSwitch.currentAddress + '.', 'INCREMENT');
            return;
        }

        else if (command === '-' || command === 'decrement' && currentPage === 'dip')
        {
            if(dipSwitch.currentAddress <= 0)
            {
                setCmdMessage('Address is already at minimum (0). Cannot decrement further.', 'WARNING');
                return;
            }
            dipSwitch.decrementAddress();
            setCmdMessage('Decremented address to ' + dipSwitch.currentAddress + '.', 'DECREMENT');
            return;
        }

        // COLOR PAGE COMMANDS
        else if ((command.startsWith('-s') || command.startsWith('save')) && currentPage === 'color')
        {
            let value = rawCommand.slice(2).trim();
            if(command.startsWith('save'))
            {
                value = rawCommand.slice(4).trim();
            }

            if (command)
            {
                colorConverter.saveColor(true, value);
            }
            else
            {
                setCmdMessage('Invalid syntax.', 'ERROR');
            }
            return;
        }

        else if ((command === 'rand' || command === '-r') && currentPage === 'color')
        {
            colorConverter.generateRandomColor();
            return;
        }

        else if (command === 'clear list' && currentPage === 'color')
        {
            colorConverter.deleteAllColors();
            return;
        }

        else if ((command.startsWith('-l') || command.startsWith('load')) && currentPage === 'color')
        {
            let value = command.slice(2).trim();
            if(command.startsWith('load'))
            {
                value = command.slice(4).trim();
            }

            if(isNaN(value))
            {
                if (value && colorConverter.savedColors.some(stored => stored.name.toLowerCase() === value.toLowerCase()))
                {
                    colorConverter.loadColor(value);
                }
                else
                {
                    setCmdMessage('Invalid color name.', 'ERROR');
                }
            }
            else
            {
                id = parseInt(value);
                if (id >= 0 && id <= colorConverter.savedColors.length)
                {
                    colorConverter.loadColor(id);
                }
                else
                {
                    setCmdMessage('Invalid color ID.', 'ERROR');
                }
            }
        }

        // BEAM PAGE COMMANDS

        else if (command.startsWith('-s') || command.startsWith('set') && currentPage === 'beam')
        {
            let value, val;
            if(command.startsWith('-s')) { value = command.slice(2).trim() }
            if(command.startsWith('set')) { value = command.slice(3).trim() }

            if(value.startsWith('-a') || value.startsWith('angle')) // ANGLE
            {
                if(value.startsWith('-a')) { val = value.slice(2).trim() }
                if(value.startsWith('angle')) { val = value.slice(5).trim() }
                if(isNaN(val))
                {
                    setCmdMessage('Invalid angle value. Please enter valid number.', 'ERROR');
                    return;
                }
                beamCalculator.setAngle(parseFloat(val));
                return; 
            }

            if(value.startsWith('-ds') || value.startsWith('distance')) // DISTANCE
            {
                if(value.startsWith('-ds')) { val = value.slice(3).trim() }
                if(value.startsWith('distance')) { val = value.slice(8).trim() }
                if(isNaN(val))
                {
                    setCmdMessage('Invalid distance value. Please enter valid number.', 'ERROR');
                    return;
                }
                beamCalculator.setDistance(parseFloat(val));
                return; 
            }

            if(value.startsWith('-dm') || value.startsWith('diameter')) // DIAMETER
            {
                if(value.startsWith('-dm')) { val = value.slice(3).trim() }
                if(value.startsWith('diameter')) { val = value.slice(8).trim() }
                if(isNaN(val))
                {
                    setCmdMessage('Invalid diameter value. Please enter valid number.', 'ERROR');
                    return;
                }
                beamCalculator.setDiameter(parseFloat(val));
                return; 
            }

            if(value.startsWith('-fl') || value.startsWith('flux')) // FLUX
            {
                if(value.startsWith('-fl')) { val = value.slice(3).trim() }
                if(value.startsWith('flux')) { val = value.slice(4).trim() }
                if(isNaN(val))
                {
                    setCmdMessage('Invalid lumious flux value. Please enter valid number.', 'ERROR');
                    return;
                }
                beamCalculator.setFlux(parseFloat(val));
                return; 
            }
            setCmdMessage('Invalid syntax. Please enter a valid parameter (-a, -ds, -dm, -fl).', 'ERROR')
            return;
        }

        else if ((command.startsWith('-l') || command.startsWith('lock')) && currentPage === 'beam')
        {
            let value;
            if(command.startsWith('-l')) { value = command.slice(2).trim() }
            if(command.startsWith('lock')) { value = command.slice(4).trim() }

            if(value == 'angle' || value == '-a') { beamCalculator.toggleLock('angle'); return; }
            if(value == 'distance' || value == '-ds') { beamCalculator.toggleLock('distance'); return; }
            if(value == 'diameter' || value == '-dm') { beamCalculator.toggleLock('diameter'); return; }
            setCmdMessage('Invalid syntax. Please enter a valid parameter (-a, -ds, -dm).', 'ERROR');
        }

        else if (command === 'clear' && currentPage === 'beam')
        {
            beamCalculator.clear();
            setCmdMessage('Successfully resetted beam calculator.', 'CLEAR');
            return;
        }

        else if (command === 'm' || command === 'meters' && currentPage === 'beam')
        {
            beamCalculator.setUnit('m');
            setCmdMessage('Setted meters as current unit.', 'METERS');
            return;
        }

        else if (command === 'ft' || command === 'feet' && currentPage === 'beam')
        {
            beamCalculator.setUnit('ft');
            setCmdMessage('Setted feet as current unit.', 'FEET');
            return;
        }

        else if (command === 'vec' && currentPage === 'universe')
        {
            startVectorShift();
            return;
        }

        else if (command === 'help')
        {
            switch(currentPage)
            {
                case 'home':
                    setCmdMessage('Available generic commands: nav (or -n {page} or < or >), freeze, unfreeze, help, about, github, reset, reload, liveclock.', 'HELP');
                    return;
                case 'patch':
                    setCmdMessage('Available patch commands: add, remove, color, rename, patch, update, stats, docset, export, clear.', 'HELP');
                    return;
                case 'universe':
                    setCmdMessage('Available universe commands: vec.', 'HELP');
                    return;
                case 'dip':
                    setCmdMessage('Available DIP commands: clear -d (or --cd), clear -a (or --ca), store (or --s), flip (or --f), load (or -l) {address}, increment (or +), decrement (or -).', 'HELP');
                    return;
                case 'color':
                    setCmdMessage('Available color commands: save (or -s {color name}), clear list, rand, load (or -l {color name or id}).', 'HELP');
                    return;
                case 'beam':
                    setCmdMessage('Available beam commands: set (or -s) {parameter} {value}, clear, lock (or -l) {parameter}, ft (or feet), m (or meters).', 'HELP');
                    return;
                case 'database':
                    setCmdMessage('Available database commands: nav (or -n {page} or < or >), freeze, unfreeze, help, about, github, reset, reload, liveclock.', 'HELP');
                    return;
                case 'settings':
                    setCmdMessage('Available settings commands: nav (or -n {page} or < or >), freeze, unfreeze, help, about, github, reset, reload, liveclock.', 'HELP');
                    return;
                default:
                    setCmdMessage('Available generic commands: nav (or -n {page} or < or >), freeze, unfreeze, help, about, github, reset, reload, liveclock.', 'HELP');
                    return;
            }
        }

        else if (command === 'help --all' || command === 'help -a')
        {
            setCmdMessage('Available generic commands: nav (or -n {page} or < or >), freeze, unfreeze, help, about, github, reset, reload, liveclock.', 'HELP');
            return;
        }

        else if (command === 'github')
        {
            setCmdMessage('Opened GitHub repository in a new browser tab.', 'GITHUB');
            window.open('https://www.github.com/alessandrocaseti/dmx-tools', '_blank').focus();
            return;
        }

        else if (command === 'liveclock')
        {
            openLiveclock();
            return;
        }

        else if (command === 'qxf')
        {
            setCmdMessage('Opened QXF to JSON converter in a new browser tab.', 'QXF');
            window.open('qxf_converter/index.html', '_blank').focus();
            return;
        }

        else if (command === 'qxf --test' || command === 'qxf -t')
        {
            setCmdMessage('Downloaded a text QXF file & opened QXF to JSON converter in a new browser tab.', 'QXF TEST');
            window.open('qxf_converter/index.html', '_blank').focus();
            const link = document.createElement('a');
            link.href = 'qxf_converter/utils/test.qxf';
            link.download = 'test.qxf';
            link.click();
            return;
        }

        else if (command === 'about')
        {
            about(); return;
        }

        else if (command === 'reload')
        {
            location.reload(); return;
        }

        else if (command === 'skibidipatching')
        {
            setCmdMessage('Volevo un server...', 'SKIBIDIPATCHING'); return;
        }

        else
        {
            setCmdMessage(`Unknown command in this context: '${command}'. Type 'help' for a list of available commands.`, 'ERROR');
            return;
        }
    }
}

function about()
{
    setCmdMessage(appName  + ' - Developed by ' + author + '. ' + 'Version ' + version + ' - ' + date + '.', 'ABOUT');
    return;
}