/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// Command prompt main functions

String.prototype.toProperCase = function () 
{
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function isHexColor (hex) 
{
    return typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex))
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
    }, 500); // Cambia ogni 500 millisecondi
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
    stopDotAnimation();
    const container = document.getElementById('cmdListContainer2');
    const cmdMsg = document.createElement('p');
    const dot = document.createElement('p');
    dot.className = 'command-msg dot';
    dot.id = 'dot';
    dot.textContent = '>';

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
    }

    else if (typeText && type === 'WARNING')
    {
        typeText.style.color = 'orange';
        containerType.style.borderColor = 'orange';
        containerType.style.backgroundColor = 'rgba(255, 140, 0, 0.2)';
        cmdBar.style.backgroundColor = '#3a2500ff';
        specialBackground = true;
    }
}

let remove = false;
let add = false;
let color = false;
let doc = false;
let rename = false;
let freeze = false;

function resetCmd(freezeTrigger = true)
{
    remove = false;
    add = false;
    color = false;
    doc = false;
    rename = false;
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

function handleCommand(event)
{
    if (event.key === 'Enter')
    {
        stopDotAnimation();
        const cmdInput = document.getElementById('cmdInput');
        const command = cmdInput.value.trim().toLowerCase();
        cmdInput.value = '';
        focusCmd(false);

        // TODO -> gestire errori quando dentro a color/add/remove/docset/rename
        // TODO -> aggiungere command includes / a tutti gli if
        // TODO -> gestire lowercase / propercase
        // TODO -> hero commands

        if(freeze && command !== 'unfreeze' && command !== 'reset') { return };

        if (command === 'reset') // reset ha la priorità su tutto
        {
            resetCmd();
            setCmdMessage("Successfully resetted command prompt.", "RESET")
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

        else if (command === 'add')
        {
            setCmdMessage('Insert fixture name / fixture type / quantity / channels per unit or press enter to use defaults', 'ADD');
            startDotAnimation();
            add = true;
            return;
        }

        else if (command === 'remove')
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

        else if (command === 'color')
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

        else if (command === 'docset')
        {
            setCmdMessage('Enter the event venue / location / patch author names:', 'DOCSET');
            startDotAnimation();
            doc = true;
            return;
        }
        
        else if (command === 'rename')
        {
            if (listaFixture.length > 0)
            {
                setCmdMessage('Enter the ID of the fixture / new name:', 'RENAME');
                startDotAnimation();
                rename = true;
            }
            else
            {
                setCmdMessage('No fixtures to rename. Please add fixtures first.', 'ERROR');
            }
            return;
        }

        else if (command === 'clear')
        {
            clearAll();
            return;
        }

        else if (command === 'patch')
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

        else if (command === 'update')
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

        else if (command === 'export')
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

        else if (command === 'stats')
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

        else if (command === 'help')
        {
            setCmdMessage('Available commands: add, remove, color, rename, patch, update, stats, docset, export, clear, freeze, unfreeze, help, about, reset', 'HELP');
            return;
        }

        else if (command === 'about')
        {
            setCmdMessage('DMX Tools - Developed by Alessandro Caseti. For more information, visit the GitHub repository.', 'ABOUT');
            return;
        }

        else if (command.startsWith('-'))
        {
            console.log("hero command detected");
            return;
        }

        else if (command === 'skibidiboppi')
        {
            setCmdMessage('Forza Napoli.', 'SKIBIDIBOPPI');
            return;
        }

        else if (command === 'forza napoli')
        {
            setCmdMessage('Skibidiboppi.', 'FORZA NAPOLI');
            return;
        }

        else
        {
            setCmdMessage(`Unknown command: '${command}'. Type 'help' for a list of available commands.`, 'ERROR');
            return;
        }
    }
}