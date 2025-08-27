/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// DMX Patch functions

let listaFixture = []; // Fixture list
let patchedFixtures = []; // Detailed fixture list for every unit
let docID = "0000"; // Document ID

const PALETTE = 
[
    '#FF1744', // rosso vivo
    '#FF9100', // arancione vivo
    '#FFD600', // giallo vivo
    '#00E676', // verde acceso
    '#00B8D4', // azzurro vivo
    '#2979FF', // blu acceso
    '#651FFF', // viola intenso
    '#D500F9', // magenta
    '#FF4081', // rosa acceso
    '#AEEA00', // lime
    '#FFEB3B', // giallo
    '#00BFAE', // turchese
    '#304FFE', // blu profondo
    '#C51162', // fucsia scuro
    '#FF3D00', // arancio scuro
    '#64DD17', // verde lime
    '#00C853', // verde smeraldo
    '#AA00FF', // viola puro
    '#FFAB00', // giallo/arancio
    '#0091EA', // blu cielo
    '#FF6D00', // arancio intenso
    '#00BFAE', // turchese
    '#D50000', // rosso puro
    '#1DE9B6', // verde acqua
    '#C6FF00', // giallo lime
    '#6200EA', // indaco 
    '#00E5FF', // ciano
    '#FFD600', // giallo vivo (ripetuto per sicurezza)
    '#FF1744', // rosso vivo (ripetuto per sicurezza)
    '#00C853'  // verde smeraldo (ripetuto per sicurezza)
];

const SHEETDB_API = 'https://sheetdb.io/api/v1/sk9zycjj00bvz';

async function getSetDocNumber() 
{
    document.getElementById('loadingOverlay').classList.add('active'); // Show overlay

    const text = document.getElementById('docNumber');
    // Leggi il numero attuale
    const r = await fetch(SHEETDB_API);
    const data = await r.json();
    let num = parseInt(data[0]?.numero, 10);
    console.log("Current document number: " + num);

    if (!isNaN(num)) 
    {
        await fetch('https://sheetdb.io/api/v1/sk9zycjj00bvz/numero/' + num, 
        {
            method: 'PATCH',
            headers: 
            {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: { "numero": num + 1 } })
        });

        let formattedID = (num+1).toString().padStart(4, '0');
        text.innerHTML = `#${formattedID}`;
        docID = formattedID;
    }

    document.getElementById('loadingOverlay').classList.remove('active'); // Hide overlay
}

async function simulateOverlay()
{
    // simuliamo un overlay di caricamento di un secondo in locale
    document.getElementById('loadingOverlay').classList.add('active');
    return new Promise(resolve =>
    {
        setTimeout(() =>
        {
            document.getElementById('loadingOverlay').classList.remove('active');
            resolve();
        }, 1000);
    });
}

function setStats(index)
{
    // Calcola totale canali, universi e fixture
    let totCanali = 0;
    let universi = new Set();
    let totFixture = 0;

    if (typeof calcolaPatchDMXMulti === 'function') 
    {
        const lista = calcolaPatchDMXMulti(listaFixture);
        lista.forEach(item => { universi.add(item.universo); });
        // Somma tutti i canali delle fixture
        totCanali = listaFixture.reduce((acc, f) => acc + (f.numero * f.canali), 0);
        // Somma tutte le fixture (quantità)
        totFixture = listaFixture.reduce((acc, f) => acc + f.numero, 0);
    }

    let unitext = "universe";
    let chanText = "channel";
    if(universi.size > 1) { unitext = "universes"; }
    if(totCanali > 1) { chanText = "channels"; }

    document.getElementById('dmxFootprint').textContent = universi.size + " " + unitext + " : " + totCanali + " " + chanText;
    document.getElementById('totFixturePrint').textContent = totFixture;

    const footprint = universi.size + " " + unitext + " : " + totCanali + " " + chanText;
    if(index === 1) return totFixture
    if(index === 2) return footprint;
    return;
}

document.addEventListener('DOMContentLoaded', function() 
{
    document.getElementById('cmdInput').focus();
    const btn = document.getElementById('exportPdfBtn');
    if (btn) 
    {
        btn.addEventListener('click', async function() 
        {
            const evento = document.getElementById('evento').value.trim();
            const luogo = document.getElementById('luogo').value.trim();
            const autorePatch = document.getElementById('autorePatch').value.trim();

            if (!evento || !luogo || !autorePatch) 
            {
                setCmdMessage('Please fill the patch details fields to continue (event/venue, place, patch author).', 'ERROR');
                return;
            }

            mostraPatchDMX();

            document.getElementById('eventoPrint').textContent = document.getElementById('evento').value || 'Not specified';
            document.getElementById('luogoPrint').textContent = document.getElementById('luogo').value || 'Not specified';
            document.getElementById('autorePatchPrint').textContent = document.getElementById('autorePatch').value || 'Not specified';

            setStats();

            // Evitiamo di raggiungere il limite mensile di chiamate API durante lo sviluppo locale
            if(window.location.protocol.startsWith("http") && window.location.hostname !== "localhost") 
            {
                await getSetDocNumber(); // Esegui la chiamata API
            } 
            else 
            {
                console.log("Local environment detected, skipping API call.");
                await simulateOverlay(); // Simula l'overlay di caricamento
            }

            setCmdMessage('Successfully requested document number via API call. Generated PDF with ID #' + `${docID}.`, 'EXPORT');
            window.print();
        });
    }
});

function randomColor(excludeColor) 
{
    // Restituisce un colore non già usato tra le fixture, e diverso da excludeColor se possibile
    const usati = new Set(listaFixture.map(f => f.colore));
    if (excludeColor) usati.add(excludeColor); // esclude anche il colore attuale
    const disponibili = PALETTE.filter(c => !usati.has(c));
    if (disponibili.length === 0) 
    {
        // Se tutti i colori sono usati, scegli uno diverso da excludeColor
        const altri = PALETTE.filter(c => c !== excludeColor);
        if (altri.length > 0) return altri[Math.floor(Math.random() * altri.length)];
        return PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }
    return disponibili[Math.floor(Math.random() * disponibili.length)];
}

function aggiungiFixture(name, type, qty, channels) 
{
    let nome = "Fixture name";
    let tipo = "Generic";
    let numero = 1;
    let canali = 1;

    if(!add)
    {
        nome = document.getElementById('fixName').value.trim() || "Fixture name";
        tipo = document.getElementById('fixType').value;
        numero = parseInt(document.getElementById('fixQty').value, 10);
        canali = parseInt(document.getElementById('fixChs').value, 10);
    }
    else
    {
        nome = name || "Fixture name";
        tipo = type || "Generic";
        numero = parseInt(qty, 10) || 1;
        canali = parseInt(channels, 10) || 1;
    }

    if (!nome || !tipo || isNaN(numero) || isNaN(canali) || numero < 1 || canali < 1 || canali > 511) 
    {
        setCmdMessage('Invalid values. Please check the fixture name, type, quantity, and channels.', 'ERROR');
        return;
    }

    const colore = randomColor();
    listaFixture.push({ nome, tipo, numero, canali, colore });
    updatePatch();
    setCmdMessage(`Added fixture(s): ${nome} (${tipo}, ${numero} unit(s), ${canali} channel(s) per unit)`, 'ADD'); //TODO singular or plural based on quantity
}

function clearAll() 
{
    listaFixture = [];
    document.getElementById('patchList').innerHTML = '';
    document.getElementById('patchOptions').style.display = "none";
    document.getElementById('fixName').value = "";
    document.getElementById('fixQty').value = 1;
    document.getElementById('fixChs').value = 1;
    document.getElementById('patchButtonText').innerHTML = "Patch";
    document.getElementById('patchButtonIcon').innerHTML = "";
    updatePatch();
    oldCount = 0;
    patch = true;
    resetCmd(false);
    setCmdMessage("Project fully cleared. All fixtures have been deleted.", 'CLEAR');
}

function updatePatch() 
{
    updatePatchedFixtures();
    const div = document.getElementById('fixtureList');
    const calcolaBtn = document.getElementById('calcolaPatchBtn');
    if (!listaFixture.length && div) 
    {
        div.innerHTML = '<span class="empty-message">- No fixtures added -</span>';
        if (calcolaBtn) calcolaBtn.disabled = true;
        return;
    }

    let html = '<table class="patchTable firstTable">';

    html += `<thead><tr>
                <th style="width: 70px;">ID</th>
                <th>Name</th>
                <th>Type</th>
                <th style="width: 70px;">Quantity</th>
                <th style="width: 70px;">Channels</th>
                <th colspan="2">Color</th>
                <th class="rimuoviCol" style="width: 70px;">Remove</th></tr>
            </thead><tbody>`;

    listaFixture.forEach((fixture, idx) => 
    {
        html += 
        `<tr>
            <td>${idx}</td>
            <td>${fixture.nome}</td>
            <td>${fixture.tipo}</td>
            <td>${fixture.numero}</td>
            <td>${fixture.canali}</td>
            <td style="text-align:center;vertical-align:middle;padding:4;width:50px;">
                <span class="colorCircle" id="colorCircle${idx}" style="background-color:${fixture.colore} !important;"></span>
            </td>
            <td style="text-align:center;vertical-align:middle;padding:4;width:50px;">
                <button class="colorBtn default" onclick="cambiaColoreFixture(${idx})"><span class="colorButtonIcon"></span></button>
            </td>
            <td class="rimuoviCol"><button style="height:36px;font-family:IconFont;" onclick=\"removeFixture(${idx})"></button></td>
        </tr>`;
    });

    html += '</tbody></table>';
    if (div) div.innerHTML = html;

    // Cambia colore random alla fixture, evitando di riassegnare lo stesso colore
    window.cambiaColoreFixture = function(idx, col = null) 
    {
        const coloreAttuale = listaFixture[idx].colore;
        let nuovoColore;

        if (col) 
        {
            nuovoColore = col; // Usa il colore passato come parametro
        }
        else
        {
            nuovoColore = randomColor(coloreAttuale);
        }

        listaFixture[idx].colore = nuovoColore;
        updatePatch();
        setCmdMessage(`Changed color of fixture(s) '${listaFixture[idx].nome}' to ${nuovoColore}`, 'COLOR');
    }
    if (calcolaBtn) calcolaBtn.disabled = false;
}

function removeFixture(id) 
{
    setCmdMessage(`Successfully removed fixture(s): ${listaFixture[id].nome}`, 'REMOVE');
    listaFixture.splice(id, 1);
    updatePatch();
}

function calcolaPatchDMXMulti(listaFixture) 
{
    const MAX_CANALI = 512;
    let risultato = [];
    let universo = 1;
    let canaleCorrente = 1;
    let count = 1;
    for (const fixture of listaFixture) 
    {
        for (let i = 1; i <= fixture.numero; i++) 
        {
            if (canaleCorrente + fixture.canali - 1 > MAX_CANALI) 
            {
                universo++;
                canaleCorrente = 1;
            }

            let canaleFormattato = canaleCorrente.toString().padStart(3, '0');
            let nomeFixture = fixture.nome;
            if (fixture.numero > 1) { nomeFixture += ` ${i}`; }

            risultato.push
            ({
                id: count -1,
                tipo: fixture.tipo,
                nome: nomeFixture,
                universo: universo,
                canale: canaleFormattato,
                colore: fixture.colore
            });

            canaleCorrente += fixture.canali;
            count++;
        }
    }
    return risultato;
}

function updatePatchedFixtures() {
    patchedFixtures = calcolaPatchDMXMulti(listaFixture);
}

let patch = true;
let update = false;
let oldCount = 0; // Contatore per il numero di fixture
let newCount = 0; // Contatore per il numero di fixture aggiornate

function mostraPatchDMX(cmdTrigger = false) 
{
    const patchList = document.getElementById('patchList');

    if (!listaFixture.length) 
    {
        patchList.innerHTML = `<span class="empty-message">- No fixtures added -</span>`;
        return;
    }

    if(!cmdTrigger) { updatePatchedFixtures(); }
    const exportBtn = document.getElementById('patchOptions');
    let showImages = true;
    const showImagesCheckbox = document.getElementById('showImagesCheckbox');
    if (showImagesCheckbox) showImages = showImagesCheckbox.checked;

    let html = `<table class="patchTable" id="patchTable">
                    <thead><tr>
                    <th class="idCol" style="font-family: 'Inter';">ID</th>
                    <th class="tipoCol">Type</th>
                    <th class="coloreCol">Color</th>
                    <th class="nomeLuceCol">Fixture</th>
                    <th class="universoCol">Universe</th>
                    <th class="canaleCol">Address</th>
                    </tr></thead><tbody>`;

    patchedFixtures.forEach((item, id) => 
    {
        const tipiConImg = 
        [
            'beam','wash','spot','blinder','scanner','dimmer','strobo','par',
            'fx fog','fx haze','fx spark','fx co2','fx fire','fx pyro','fx confetti',
            'spotlight','led bar','moving bar','moving panel','laser','fan',
            'rgb','rgbw','rgbwav','effect','other'
        ];

        let imgHtml = '';

        if (showImages && tipiConImg.includes(item.tipo.toLowerCase())) 
        {
            imgHtml = `<img src='images/${item.tipo.toLowerCase()}.png' alt='${item.tipo}' title='${item.tipo}' class="patchTypeImage">`;
        }

        else if (showImages)
        {
            imgHtml = `<img src='images/other.png' alt='${item.tipo}' title='${item.tipo}' class="patchTypeImage">`;
        }
        
        let tipoColContent = `<span class='typeLayout'>${imgHtml}<span class='typeText' style='flex:1;justify-content:flex-start;text-align:left;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${item.tipo}</span></span>`;
        let colorCircle = `<span class='colorCircle' style='display:inline-block;width:22px;height:22px;border-radius:50%;background:${item.colore} !important;background-color:${item.colore} !important;vertical-align:middle;margin:0 auto;'></span>`;
        html += `<tr><td class="idCol">${id+1}</td><td class="tipoCol">${tipoColContent}</td><td class="coloreCol">${colorCircle}</td><td class="nomeLuceCol">${item.nome}</td><td class="universoCol">${item.universo}</td><td class="canaleCol">${item.canale}</td></tr>`;
    });

    html += '</tbody></table>';
    patchList.innerHTML = html;
    if (exportBtn) exportBtn.style.display = 'flex';
    document.getElementById('patchButtonText').innerHTML = "Update patch";
    document.getElementById('patchButtonIcon').innerHTML = "";

    if(update)
    {
        newCount = patchedFixtures.length;
        if (newCount > oldCount)
        {
            setCmdMessage(`Patch list updated with ${newCount - oldCount} new fixture(s).`, 'UPDATE');
            oldCount = newCount;
        }
        else if (newCount < oldCount)
        {
            setCmdMessage(`Patch list updated with ${oldCount - newCount} fixture(s) removed.`, 'UPDATE');
            oldCount = newCount;
        }
        else
        {
            setCmdMessage(`Patch list updated`, 'UPDATE');
            oldCount = newCount;
        }
    }
    else
    {
        setCmdMessage(`Patch list created with ${patchedFixtures.length} fixture(s).`, 'PATCH');
        oldCount = patchedFixtures.length;
    }

    // Aggiorna la tabella quando la checkbox cambia
    if (showImagesCheckbox && !showImagesCheckbox._listenerAdded) 
    {
        showImagesCheckbox.addEventListener('change', mostraPatchDMX);
        showImagesCheckbox.addEventListener('change', updateIconColor);
        showImagesCheckbox._listenerAdded = true;
    }

    update = true;
    patch = false;
}

function updateIconColor()
{
    const showImagesCheckbox = document.getElementById('showImagesCheckbox');
    const icon = document.getElementById('showImagesCheckboxIcon');
    if (showImagesCheckbox.checked)
    {
        icon.style.color = 'black';
        setCmdMessage(`Fixture icons enabled`, 'UPDATE');
    }
    else
    {
        icon.style.color = 'transparent';
        setCmdMessage(`Fixture icons disabled`, 'UPDATE');
    }
}

window.onload = updatePatch(); // Inizializza la tabella fixture all'avvio
