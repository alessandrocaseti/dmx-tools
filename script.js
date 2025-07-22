// DMX PATCH
// Lista delle fixture da patchare, ogni fixture ha anche un colore
let listaFixture = [];
// Palette colori stile label GitHub
const PALETTE = [
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
function randomColor(excludeColor) {
  // Restituisce un colore non già usato tra le fixture, e diverso da excludeColor se possibile
  const usati = new Set(listaFixture.map(f => f.colore));
  if (excludeColor) usati.add(excludeColor); // esclude anche il colore attuale
  const disponibili = PALETTE.filter(c => !usati.has(c));
  if (disponibili.length === 0) {
    // Se tutti i colori sono usati, scegli uno diverso da excludeColor
    const altri = PALETTE.filter(c => c !== excludeColor);
    if (altri.length > 0) return altri[Math.floor(Math.random() * altri.length)];
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
  return disponibili[Math.floor(Math.random() * disponibili.length)];
}

function aggiungiFixture() 
{
    const nome = document.getElementById('fixName').value.trim() || 'Fixture';
    const tipo = document.getElementById('fixType').value;
    const numero = parseInt(document.getElementById('fixQty').value, 10);
    const canali = parseInt(document.getElementById('fixChs').value, 10);

    if (!nome || !tipo || isNaN(numero) || isNaN(canali) || numero < 1 || canali < 1 || canali > 511) 
    {
        alert('Valori non validi.');
        return;
    }

    // Colore random per nuovo gruppo
    const colore = randomColor();
    listaFixture.push({ nome, tipo, numero, canali, colore });
    aggiornaTabellaFixture();
}

function clearAll() 
{
    listaFixture = [];
    document.getElementById('patchList').innerHTML = '';
    document.getElementById('patchOptions').style.display = "none";
    document.getElementById('fixName').value = "Fixture";
    document.getElementById('fixQty').value = 1;
    document.getElementById('fixChs').value = 1;
    document.getElementById('patchButtonText').innerHTML = "Calcola patch";
    document.getElementById('patchButtonIcon').innerHTML = "";
    aggiornaTabellaFixture();
}

function aggiornaTabellaFixture() 
{
    const div = document.getElementById('fixtureList');
    const calcolaBtn = document.getElementById('calcolaPatchBtn');
    if (!listaFixture.length) 
    {
        div.innerHTML = '<span class="empty-message">Aggiungi almeno una fixture</span>';
        if (calcolaBtn) calcolaBtn.disabled = true;
        return;
    }

    let html = '<table class="patchTable firstTable">';
    html += '<thead>';
    html += '<tr><th>Fixture</th><th>Tipo</th><th>Numero</th><th>Canali</th><th colspan="2">Colore</th><th class="rimuoviCol">Rimuovi</th></tr>';
    html += '</thead><tbody>';
    listaFixture.forEach((fixture, idx) => {
        html += `<tr>
            <td>${fixture.nome}</td>
            <td>${fixture.tipo}</td>
            <td>${fixture.numero}</td>
            <td>${fixture.canali}</td>
            <td style="text-align:center;vertical-align:middle;padding:4;width:50px;">
                <span class="colorCircle" id="colorCircle${idx}" style="background-color:${fixture.colore} !important;"></span>
            </td>
            <td style="text-align:center;vertical-align:middle;padding:4;width:50px;">
                <button class="colorBtn default" type="button" title="Cambia colore" onclick="cambiaColoreFixture(${idx})"><span class="colorButtonIcon"></span></button>
            </td>
            <td class="rimuoviCol"><button style="height:32px;font-family:IconFont;" onclick=\"rimuoviFixture(${idx})\"></button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    div.innerHTML = html;

// Cambia colore random alla fixture, evitando di riassegnare lo stesso colore
window.cambiaColoreFixture = function(idx) {
    const coloreAttuale = listaFixture[idx].colore;
    let nuovoColore = randomColor(coloreAttuale);
    // Se per qualche motivo il colore non cambia, riprova fino a 5 volte
    let tentativi = 0;
    while (nuovoColore === coloreAttuale && tentativi < 5) {
        nuovoColore = randomColor(coloreAttuale);
        tentativi++;
    }
    listaFixture[idx].colore = nuovoColore;
    aggiornaTabellaFixture();
}
    if (calcolaBtn) calcolaBtn.disabled = false;
}

function rimuoviFixture(idx) 
{
    listaFixture.splice(idx, 1);
    aggiornaTabellaFixture();
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
            risultato.push({
                tipo: fixture.tipo,
                nome: `${fixture.nome} ${i}`,
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

// Funzione per collegare il form HTML e mostrare la patch DMX

function mostraPatchDMX() 
{
    const patchList = document.getElementById('patchList');

    if (!listaFixture.length) 
    {
        patchList.innerHTML = '<span style="color:red;">Aggiungi almeno una fixture.</span>';
        return;
    }

    const lista = calcolaPatchDMXMulti(listaFixture);
    const exportBtn = document.getElementById('patchOptions');
    let showImages = true;
    const showImagesCheckbox = document.getElementById('showImagesCheckbox');
    if (showImagesCheckbox) showImages = showImagesCheckbox.checked;
    let html = '<table class="patchTable" id="patchTable"><thead><tr><th class="tipoCol">Tipo</th><th class="coloreCol">Colore</th><th>Fixture</th><th>Universo</th><th>Canale</th></tr></thead><tbody>';
    lista.forEach(item => {
        const tipiConImg = [
            'beam','wash','spot','blinder','scanner','dimmer','strobo','par',
            'fx fog','fx haze','fx spark','fx co2','fx fire','fx pyro','fx confetti',
            'spotlight','led bar','moving bar','moving panel','laser','fan',
            'rgb','rgbw','rgbwav','effect','other'
        ];
        let imgHtml = '';
        if (showImages && tipiConImg.includes(item.tipo.toLowerCase())) {
            imgHtml = `<img src='images/${item.tipo.toLowerCase()}.png' alt='${item.tipo}' title='${item.tipo}' style='height:32px;max-width:40px;vertical-align:middle;margin-right:0px;'>`;
        }
        let tipoColContent = `<span class='typeLayout'>${imgHtml}<span style='flex:1;margin-left:16px;justify-content:flex-start;text-align:left;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${item.tipo}</span></span>`;
        let colorCircle = `<span class='colorCircle' style='display:inline-block;width:22px;height:22px;border-radius:50%;background:${item.colore} !important;background-color:${item.colore} !important;vertical-align:middle;margin:0 auto;'></span>`;
        html += `<tr><td class="tipoCol">${tipoColContent}</td><td class="coloreCol">${colorCircle}</td><td class="nomeLuceCol">${item.nome}</td><td class="universoCol">${item.universo}</td><td class="canaleCol">${item.canale}</td></tr>`;
    });
    html += '</tbody></table>';
    patchList.innerHTML = html;
    if (exportBtn) exportBtn.style.display = 'flex';
    document.getElementById('patchButtonText').innerHTML = "Aggiorna patch";
    document.getElementById('patchButtonIcon').innerHTML = "";

    // Aggiorna la tabella quando la checkbox cambia
    if (showImagesCheckbox && !showImagesCheckbox._listenerAdded) 
    {
        showImagesCheckbox.addEventListener('change', mostraPatchDMX);
        showImagesCheckbox._listenerAdded = true;
    }
}

// Inizializza la tabella fixture all'avvio
window.onload = aggiornaTabellaFixture;

