// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI

let currentView = "folders"; // "folders", "files", "details"
let filter = "none";
let currentFolder = "";
let currentFile = "";
let currentFixturesCount = 0;

function getFilesForFolder(folder) 
{
    return folderFiles[folder] || [];
}

function updateAddressBar() 
{
    const addressBar = document.getElementById("databaseAddressBar");
    let path = '';

    if (currentView === "folders") 
    {
        if(currentFixturesCount === 1) { path = currentFixturesCount + " fixture found"; }
        else { path = currentFixturesCount + " fixtures found"; }
    }
    
    else if (currentView === "files") 
    {
        path ='Fixtures / ';
    }
    
    else if (currentView === "files") 
    {
        path = 'Fixtures / ';
    }
    
    else if (currentView === "details") 
    {
        path = 'Fixtures / ' + currentFolder + ' / ';
    }

    addressBar.textContent = path;

    const brandFixtures =  document.getElementById("currentBrandFixtures");
    if (brandFixtures) { brandFixtures.innerHTML = currentFixturesCount; }
}

function updateBackButton() 
{
    const backBtn = document.getElementById("databaseBackButton");
    if (currentView === "folders") 
    {
        backBtn.disabled = true;
    } 
    else 
    {
        backBtn.disabled = false;
    }
}

function editFixture()
{
    setCmdMessage('Opened fixture JSON file in a new browser tab.', 'EDIT FIXTURE');
    window.open('https://github.com/alessandrocaseti/dmx-tools/blob/main/fixtures/' + currentFolder + '/' + currentFile, '_blank').focus();
    return;
}
 
function searchProductPage(name, folder)
{
    const url = "https://www.google.com/search?q="
    const link = url + folder + ' ' + name;
    window.open(link, '_blank').focus();
    setCmdMessage('Searched for product page in a new browser tab.', 'PRODUCT PAGE');
    return;
}

function searchManual(name, folder)
{
    const url = "https://www.google.com/search?q="
    const link = url + folder + ' ' + name + ' filetype:pdf';
    window.open(link, '_blank').focus();
    setCmdMessage('Searched for fixture manual in a new browser tab.', 'FIXTURE MANUAL');
    return;
}

function addToFavorites()
{
    setCmdMessage('Fixture added to favorites.', 'ADD TO LIST');
    //
}

function getFavorites()
{
    try {
        const raw = localStorage.getItem('dmx_favorites');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveFavorites(list)
{
    try { localStorage.setItem('dmx_favorites', JSON.stringify(list)); } catch (e) { }
}

function isFavorite(folder, file)
{
    const favs = getFavorites();
    return favs.some(f => f.folder === folder && f.file === file);
}

function addToFavorites()
{
    if (!currentFolder || !currentFile)
    {
        setCmdMessage('No fixture selected to add to favorites.', 'ERROR');
        return;
    }

    const folder = currentFolder;
    const file = currentFile;
    const favs = getFavorites();

    if (favs.some(f => f.folder === folder && f.file === file))
    {
        // REMOVE from favorites:
        const remaining = favs.filter(f => !(f.folder === folder && f.file === file));
        saveFavorites(remaining);
        setCmdMessage('Fixture removed from favorites.', 'FAVORITE');
        try 
        {
            const favBtn = document.querySelector('.hero-card[data-action="favorite"]');
            if (favBtn) 
            {
                favBtn.classList.remove('active');
                favBtn.classList.remove('hero-card-on');
                favBtn.setAttribute('aria-pressed','false');
                const title = favBtn.querySelector('.hero-card-title');
                if (title) { title.textContent = 'Add to favorites'; }
            }
        } catch (e) { }

        return;
    }

    const entry = { folder, file, addedAt: (new Date()).toISOString() };
    favs.push(entry);
    saveFavorites(favs);
    try 
    {
        const favBtn = document.querySelector('.hero-card[data-action="favorite"]');
        if (favBtn) 
        {
            favBtn.classList.remove('active');
            favBtn.classList.add('hero-card-on');
            favBtn.setAttribute('aria-pressed','false');
            const title = favBtn.querySelector('.hero-card-title');
            if (title) { title.textContent = 'Added to favorites'; }
        }
    } catch (e) { }
    setCmdMessage('Fixture added to favorites.', 'FAVORITE');

    // update favorite button state if present
    try {
        const favBtn = document.querySelector('.hero-card[data-action="favorite"]');
        if (favBtn) { favBtn.classList.add('active'); favBtn.setAttribute('aria-pressed','true'); }
    } catch (e) { }
}

function getFixtureName(folder, file)
{
    let displayName = file.replace('.json', '');
    const brandPattern = new RegExp('^' + folder + '[-_ ]*', 'i');
    displayName = displayName.replace(brandPattern, '');
    displayName = displayName.replace(/-/g, ' ').trim();
    if(displayName.startsWith(folder)) { displayName = displayName.replace(folder, ''); }
    return displayName;
}

document.addEventListener("DOMContentLoaded", function() 
{
    const databaseButtonsDiv = document.getElementById("databaseButtons");
    const backBtn = document.getElementById("databaseBackButton");
    backBtn.onclick = function() 
    {
        if (currentView === "files") 
        {
            loadFolders();
        }
        else if (currentView === "details") 
        {
            loadFiles(currentFolder);
        }
        favsbtn.classList.remove("showFavs");
        filter = "none";
    };
    
    // --- Search ---
    let previousView = currentView;
    let previousFolder = currentFolder;
    const searchBox = document.getElementById("fixture-searchbox");

    function restorePreviousView()
    {
        // Ripristina la vista precedente (cartelle o files) quando la ricerca è vuota
        if (previousView === "files" && previousFolder) { loadFiles(previousFolder); }
        else { loadFolders(); }
    }

    function performSearch(query)
    {
        favsbtn.classList.remove("showFavs");
        filter = "none";

        const q = (query || '').trim().toLowerCase();
        if (!q)
        {
            // nessuna query: ripristina vista precedente
            restorePreviousView();
            return;
        }

        // salva lo stato precedente per un possibile restore
        previousView = currentView;
        previousFolder = currentFolder;

        // Mostra risultati: svuota area e metti header
        databaseButtonsDiv.innerHTML = '';
        document.getElementById("brandHeroDiv").innerHTML = "";
        const header = document.createElement('div');
        header.className = 'search-results-header';
        header.style.width = '100%';
        header.style.textAlign = 'center';
        header.style.marginBottom = '12px';
        header.style.color = 'var(--colore-testo)';
        header.style.fontStyle = 'italic';
        header.textContent = `Results for "${query}"`;
        databaseButtonsDiv.appendChild(header);

        const results = [];

        // Cerca in tutte le cartelle e file
        if (typeof fixtureFolders !== 'undefined' && typeof folderFiles !== 'undefined')
        {
            fixtureFolders.forEach(folder =>
            {
                const files = getFilesForFolder(folder) || [];
                // match su nome cartella
                if (folder.toLowerCase().includes(q))
                {
                    // aggiungi tutti i file della cartella come risultati
                    files.forEach(file => results.push({ folder, file }));
                }
                else
                {
                    // match su file singolo
                    files.forEach(file =>
                    {
                        const fileName = file.replace('.json','').replace(/[-_]/g,' ').toLowerCase();
                        if (fileName.includes(q)) { results.push({ folder, file }); }
                    });
                }
            });
        }

        // Se non ci sono risultati, mostra messaggio
        if (results.length === 0)
        {
            const empty = document.createElement('div');
            empty.className = 'empty-message';
            empty.style.width = '100%';
            empty.style.textAlign = 'center';
            empty.style.padding = '28px';
            empty.textContent = '- No results -';
            databaseButtonsDiv.appendChild(empty);
            currentView = "folders";
            currentFixturesCount = 0;
            updateAddressBar();
            updateBackButton();
            return;
        }

        // Crea pulsanti per i risultati (ordinati per brand quindi nome)
        results.forEach(r =>
        {
            const fileButton = document.createElement("button");
            fileButton.className = "fileButton";
            fileButton.innerText = `${r.folder} • ${getFixtureName(r.folder, r.file)}`;
            if (fileButton.innerText.length > 39)
            {
                const fullText = fileButton.innerText;
                fileButton.innerText = fullText.slice(0, 36) + '...';
                fileButton.title = fullText;
                fileButton.setAttribute('aria-label', fullText);
            }
            fileButton.onclick = () => loadFixtureDetails(r.folder, r.file);
            databaseButtonsDiv.appendChild(fileButton);
        });

        // aggiorna contatore e barra indirizzo (manteniamo currentView su 'folders' per coerenza)
        currentView = "folders";
        currentFixturesCount = results.length;
        updateAddressBar();
        updateBackButton();
    }

    if (searchBox)
    {
        // Esegui ricerca ad ogni input (debounce semplice)
        let debounceTimer = null;
        searchBox.addEventListener('input', (e) =>
        {
            const val = e.target.value;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => performSearch(val), 180);
        });
    }

    // Initial load
    loadFolders();
    countFixtures();

    function countFixtures()
    {
        const sbox =  document.getElementById("filterfixdiv");

        if (currentView === "details") 
        {
            sbox.style.display = "none";
            return;
        } 
        else 
        {
            sbox.style.display = "flex";
        }

        // Se non ci sono le variabili globali attese, metti a zero
        if (typeof fixtureFolders === 'undefined' || typeof folderFiles === 'undefined') 
        {
            currentFixturesCount = 0;
            return 0;
        }

        // Se siamo nella vista principale (tutte le cartelle) conta tutte le fixtures
        if (currentView === "folders")
        {
            let total = 0;
            fixtureFolders.forEach(folder => 
            {
                const files = getFilesForFolder(folder) || [];
                total += files.length;
            });
            currentFixturesCount = total;
        }  
        else // Se siamo dentro una cartella (files o details) conta i file di quella cartella
        {
            const files = getFilesForFolder(currentFolder) || [];
            currentFixturesCount = files.length;
        }

        return currentFixturesCount;
    }

    function loadFolders() 
    {
        currentView = "folders";
        currentFolder = "";
        currentFile = "";
        databaseButtonsDiv.innerHTML = '';
        document.getElementById("brandHeroDiv").innerHTML = "";

        fixtureFolders.forEach(folder => 
        {
            const folderButton = document.createElement("button");
            folderButton.className = "folderButton";
            folderButton.innerText = folder;
            folderButton.onclick = () => loadFiles(folder);
            databaseButtonsDiv.appendChild(folderButton);
        });

        countFixtures();
        updateAddressBar();
        updateBackButton();
    }

    function loadFiles(folder) 
    {
        currentView = "files";
        currentFolder = folder;
        currentFile = "";

        databaseButtonsDiv.innerHTML = '';
        document.getElementById("brandHeroDiv").innerHTML = "";
        const brandHero = document.createElement("div");
        brandHero.className = "brand-hero";

        const meta = brandMetadata[folder] || { country: "Unknown", website: "Unknown" };

        brandHero.innerHTML = `
            <div class="brandContainer">
                <h2 class="brand-name">${folder}</h2>
                <div class="brand-fixtures">Fixtures: <strong id="currentBrandFixtures" style="margin-left:6px;"></strong></div>
                <div class="brand-country">Country: <strong style="margin-left:6px;">${meta.country}</strong></div>
                ${meta.website ? `<a href="${meta.website}" target="_blank" rel="noopener noreferrer" class="brand-website"><span class="brand-website-icon">  </span>Visit website</a>` : "Website undefined"}
            </div>
        `;

        document.getElementById("brandHeroDiv").appendChild(brandHero);

        const files = getFilesForFolder(folder);

        files.forEach(file => 
        {
            const fileButton = document.createElement("button");
            fileButton.className = "fileButton";
            fileButton.innerText = getFixtureName(folder, file);
            fileButton.onclick = () => loadFixtureDetails(folder, file);
            databaseButtonsDiv.appendChild(fileButton);
        });

        countFixtures();
        updateAddressBar();
        updateBackButton();
    }

    function loadFixtureDetails(folder, file) 
    {
        favsbtn.classList.remove("showFavs");
        currentView = "details";
        currentFile = file;
        currentFolder = folder;
        countFixtures();
        document.getElementById("fixture-searchbox").value = "";
        databaseButtonsDiv.innerHTML = '<div style="text-align: center; padding: 50px;"><p class="empty-message">Loading fixture details...</p></div>';
        document.getElementById("brandHeroDiv").innerHTML = "";

        fetch(`fixtures/${folder}/${file}`)
        .then(response => 
        {
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.json();
        })
        .then(data => 
        {
            databaseButtonsDiv.innerHTML = '';

            const detailsDiv = document.createElement("div");
            detailsDiv.className = "fixture-details";
            let author = data.author;
            let fxtversion = data.version;

            let favText = 'Add to favorites';
            let favCard = 'hero-card';
            if(isFavorite(folder, file)) { favText = "Added to favorites"; favCard = 'hero-card hero-card-on'; }
            let cardsHTML = `
                <div class="hero-cards">
                    <button class="${favCard}" data-action="favorite" onClick="addToFavorites();" aria-pressed="false">
                        <span class="hero-card-icon"></span>
                        <span class="hero-card-title">${favText}</span>
                    </button>
                    <button class="hero-card">
                        <span class="hero-card-icon"></span>
                        <span class="hero-card-title">Add to patch list</span>
                    </button>
                    <button class="hero-card" onClick="editFixture();">
                        <span class="hero-card-icon"></span>
                        <span class="hero-card-title">Edit definition</span>
                    </button>
                    <button class="hero-card" onclick="searchProductPage('${getFixtureName(folder, file)}', '${folder}');">
                        <span class="hero-card-icon"></span>
                        <span class="hero-card-title">Product page</span>
                    </button>
                    <button class="hero-card" onclick="searchManual('${getFixtureName(folder, file)}', '${folder}');">
                        <span class="hero-card-icon"></span>
                        <span class="hero-card-title">Fixture manual</span>
                    </button>
                </div>
            `;

            let channelsHTML = '';
            if (data.channels && data.channels.length > 0) 
            {
                channelsHTML = '<h3>Channels</h3><div class="separator"></div><div class="channels-container">';
                data.channels.forEach(channel => 
                {
                    let capabilitiesCount = channel.capabilities ? channel.capabilities.length : 0;
                    if(capabilitiesCount === 1) capabilitiesCount += ' capability';
                    else capabilitiesCount += ' capabilities';

                    let currentIcon = '';
                    let iconColor = 'yellow';
                    switch (channel.type) 
                    {
                        case 'Pan': currentIcon = ''; break;
                        case 'Tilt': currentIcon = ''; break;
                        case 'Color': currentIcon = ''; break;
                        case 'Intensity': currentIcon = ''; break;
                        case 'Effect': currentIcon = ''; break;
                        case 'Maintenance': currentIcon = ''; break;
                        case 'Nothing': currentIcon = ''; break;
                        case 'Unknown': currentIcon = ''; break;
                        case 'Speed': currentIcon = ''; break;
                        case 'Shutter': currentIcon = ''; break;
                        case 'Prism': currentIcon = ''; break;
                        case 'Beam': currentIcon = ''; break;
                        case 'Red': { currentIcon = ''; iconColor = 'red'; break; }
                        case 'Green': { currentIcon = ''; iconColor = 'lime'; break; }
                        case 'Blue': { currentIcon = ''; iconColor = 'blue'; break; }
                        case 'White': { currentIcon = ''; iconColor = 'white'; break; }
                        case 'Amber': { currentIcon = ''; iconColor = 'darkorange'; break; }
                        case 'UV': { currentIcon = ''; iconColor = 'indigo'; break; }
                        case 'Indigo': { currentIcon = ''; iconColor = 'indigo'; break; }
                        case 'Lime': { currentIcon = ''; iconColor = 'palegreen'; break; }
                        case 'Cyan': { currentIcon = ''; iconColor = 'cyan'; break; }
                        case 'Magenta': { currentIcon = ''; iconColor = 'magenta'; break; }
                        case 'Yellow': { currentIcon = ''; iconColor = 'yellow'; break; }
                        default : currentIcon = ''; break;
                    }
                    channelsHTML += `
                        <div class="channel-item">
                            <div class="channel-header">
                                <span class="channel-icon" style="color: ${iconColor}">${currentIcon}</span>
                                <span class="channel-type">${channel.type}</span>
                                <span class="channel-name">${channel.name}</span>
                                <span class="channel-info">${capabilitiesCount}</span>
                                <span class="expander-arrow">▶</span>
                            </div>
                            <div class="channel-capabilities">`;
                    if (channel.capabilities && channel.capabilities.length > 0) 
                    {
                        channelsHTML += '<ul>';
                        let caps = 0;
                        let totalCaps = channel.capabilities.length;
                        channel.capabilities.forEach(cap => { channelsHTML += `<li class="capability-range"><strong>${cap.min.padStart(3, 0)}-${cap.max.padStart(3, 0)}</strong> <span>${cap.name}</span></li>`
                            if(caps < totalCaps - 1) { channelsHTML += `<div id='${"sep" + caps}' class="capability-separator"></div>`; } caps++;});
                        channelsHTML += '</ul>';
                    } 
                    else { channelsHTML += '<p class="empty-message">- No capabilities defined -</p>'; }
                    channelsHTML += `</div></div>`;
                });
                channelsHTML += '</div>';
            }

            let modesHTML = '';
            if (data.modes && data.modes.length > 0) 
            {
                modesHTML = '<h3>Channel modes</h3><div class="separator"></div><div class="modes-container">';
                data.modes.forEach(mode => 
                {
                    modesHTML += `
                        <div class="mode-item">
                            <h4>${mode.name} (${mode.totalChannels} Channels)</h4>
                            <div class="mode-channels">
                    `;
                    if (mode.channels && mode.channels.length > 0) 
                    {
                        mode.channels.forEach((channel, id) => 
                        {
                            modesHTML += `<div class="mode-channel" title="${channel}" aria-label="${channel}"><p class="mode-channel-number">${id + 1}</p><p class="mode-text">${channel}</p></div>`;
                        });
                    }
                    modesHTML += `
                            </div>
                        </div>
                    `;
                });
                modesHTML += '</div>';
            }

            let physicalHTML = '';
            if (data.physical) 
            {
                physicalHTML = '<h3>Physical details</h3><div class="separator"></div><div class="physical-details">';
                if (data.physical.dimensions) 
                {
                    physicalHTML += `
                        <div><strong>Weight</strong><br><br> ${data.physical.dimensions.weight || 'N/A'} kg</div>
                        <div><strong>Width</strong><br><br> ${data.physical.dimensions.width || 'N/A'} mm</div>
                        <div><strong>Height</strong><br><br> ${data.physical.dimensions.height || 'N/A'} mm</div>
                        <div><strong>Depth</strong><br><br> ${data.physical.dimensions.depth || 'N/A'} mm</div>
                    `;
                }
                if (data.physical.technical) 
                {
                    physicalHTML += `
                        <div><strong>Power Consuption</strong><br><br> ${data.physical.technical.powerConsumption || 'N/A'} W</div>
                        <div><strong>DMX Connector</strong><br><br> ${data.physical.technical.dmxConnector || 'N/A'}</div>
                    `;
                }
                if (data.physical.bulb) 
                {
                    physicalHTML += `
                        <div><strong>Bulb</strong><br><br> ${data.physical.bulb.type || 'N/A'} W</div>
                        <div><strong>Luminous Flux</strong><br><br> ${data.physical.bulb.lumens || 'N/A'} lm</div>
                        <div><strong>Color Temperature</strong><br><br> ${data.physical.bulb.colourTemperature || 'N/A'} K</div>
                    `;
                }
                if (data.physical.lens) 
                {
                    physicalHTML += `
                        <div><strong>Min beam angle</strong><br><br> ${data.physical.lens.degreesMin || 'N/A'}°</div>
                        <div><strong>Max beam angle</strong><br><br> ${data.physical.lens.degreesMax || 'N/A'}°</div>
                    `;
                }
                if (data.physical.focus) 
                {
                    physicalHTML += `
                        <div><strong>Max pan range</strong><br><br> ${data.physical.focus.panMax || 'N/A'}°</div>
                        <div><strong>Max tilt range</strong><br><br> ${data.physical.focus.tiltMax || 'N/A'}°</div>
                    `;
                }
                physicalHTML += '</div>';
            }

            detailsDiv.innerHTML = `
                <div class="fixtureHeaderDiv">
                <h2>${data.model || file.replace('.json', '')}</h2>
                <h3 style="text-align: right; line-height: 0%;margin-top: -20px;">Type: ${data.type || 'N/A'}</h3>
                </div>   
                <div class="separator" style="margin-top: -16px;"></div>
                ${cardsHTML}
                ${channelsHTML}
                ${modesHTML}
                ${physicalHTML}
                <div class="bottomControlsDiv">
                    <div style="display: flex; flex-direction: row; gap: 24px;">
                    <p>Fixture definition author: ${author || 'Unknown'}</p>
                    <p>Version: ${fxtversion || 'Unknown'}</p>
                    </div>
                    <a href="https://github.com/mcallegari/qlcplus" target="_blank" rel="noopener noreferrer" class="poweredByButton">Powered by QLC+</a>
                </div>
            `;

            databaseButtonsDiv.appendChild(detailsDiv);

            const channelItems = detailsDiv.querySelectorAll('.channel-item');
            channelItems.forEach(item => { item.addEventListener('click', () => { item.classList.toggle('expanded'); }); });
            
            updateAddressBar();
            updateBackButton();
        })
        .catch(error => 
        {
            console.error('Error loading fixture details:', error);
            setCmdMessage('Error loading fixture details: ' + error.message + '.', 'ERROR');
            databaseButtonsDiv.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <p>Error loading fixture details. Please try again.</p>
                </div>`;
            updateAddressBar();
            updateBackButton();
        });
    }
    
    const favsbtn = document.getElementById("favsButton");
    favsbtn.onclick = function()
    {
        showFavorites();
    };

    function showFavorites()
    {
        if(filter === "none")
        {
            const favs = getFavorites();
            favsbtn.classList.add("showFavs");
            document.getElementById("fixture-searchbox").value = "";
            const databaseButtonsDiv = document.getElementById("databaseButtons");
            const brandHeroDiv = document.getElementById("brandHeroDiv");
            if (databaseButtonsDiv) { databaseButtonsDiv.innerHTML = ''; }

            if (!favs || favs.length === 0)
            {
                if (databaseButtonsDiv)
                {
                    const empty = document.createElement('div');
                    empty.className = 'empty-message';
                    empty.style.width = '100%';
                    empty.style.textAlign = 'center';
                    empty.style.padding = '28px';
                    empty.textContent = '- No favorites -';
                    databaseButtonsDiv.appendChild(empty);
                }
                currentView = "folders";
                currentFolder = "";
                currentFile = "";
                currentFixturesCount = 0;
                updateAddressBar();
                updateBackButton();
                filter = "favs";
                return;
            }
            if(currentView === "folders")
            {            
                // Unique folders in favorites (preserve order of appearance)
                const folderOrder = [];
                favs.forEach(f => { if (!folderOrder.includes(f.folder)) folderOrder.push(f.folder); });

                // Create folder buttons for favorites
                folderOrder.forEach(folder =>
                {
                    const folderCount = favs.filter(f => f.folder === folder).length;
                    const folderButton = document.createElement("button");
                    folderButton.className = "folderButton";
                    folderButton.innerText = folder + (folderCount > 0 ? ` (${folderCount})` : '');
                    folderButton.onclick = () =>
                    {
                        // Show only favorite files for this folder
                        if (databaseButtonsDiv) databaseButtonsDiv.innerHTML = '';
                        if (brandHeroDiv) brandHeroDiv.innerHTML = '';

                        const meta = (typeof brandMetadata !== 'undefined' && brandMetadata[folder]) ? brandMetadata[folder] : { country: "Unknown", website: "Unknown" };
                        if (brandHeroDiv)
                        {
                            const brandHero = document.createElement("div");
                            brandHero.className = "brand-hero";
                            brandHero.innerHTML = `
                                <div class="brandContainer">
                                    <h2 class="brand-name">${folder}</h2>
                                    <div class="brand-fixtures">Fixtures: <strong id="currentBrandFixtures" style="margin-left:6px;"></strong></div>
                                    <div class="brand-country">Country: <strong style="margin-left:6px;">${meta.country}</strong></div>
                                    ${meta.website ? `<a href="${meta.website}" target="_blank" rel="noopener noreferrer" class="brand-website"><span class="brand-website-icon">  </span>Visit website</a>` : "Website undefined"}
                                </div>
                            `;
                            brandHeroDiv.appendChild(brandHero);
                        }

                        const files = favs.filter(f => f.folder === folder).map(f => f.file);
                        files.forEach(file =>
                        {
                            const fileButton = document.createElement("button");
                            fileButton.className = "fileButton";
                            fileButton.innerText = getFixtureName(folder, file);
                            fileButton.onclick = () => loadFixtureDetails(folder, file);
                            if (databaseButtonsDiv) databaseButtonsDiv.appendChild(fileButton);
                        });

                        currentView = "files";
                        currentFolder = folder;
                        currentFile = "";
                        currentFixturesCount = files.length;
                        updateAddressBar();
                        updateBackButton();
                    };

                    if (databaseButtonsDiv) databaseButtonsDiv.appendChild(folderButton);
                });

                currentFolder = "";
                currentFile = "";
                currentFixturesCount = favs.length;
                updateAddressBar();
                updateBackButton();
                filter = "favs";
            }
            else if(currentView === "files")
            {
                // Show only favorite files for the currently selected brand (keep the brand hero)
                const favFiles = favs.filter(f => f.folder === currentFolder).map(f => f.file);
                if (databaseButtonsDiv) databaseButtonsDiv.innerHTML = '';

                if (!favFiles || favFiles.length === 0)
                {
                    if (databaseButtonsDiv)
                    {
                        const empty = document.createElement('div');
                        empty.className = 'empty-message';
                        empty.style.width = '100%';
                        empty.style.textAlign = 'center';
                        empty.style.padding = '28px';
                        empty.textContent = '- No favorites for this brand -';
                        databaseButtonsDiv.appendChild(empty);
                    }
                    currentView = "files";
                    currentFixturesCount = 0;
                    updateAddressBar();
                    updateBackButton();
                    filter = "favs";
                    return;
                }

                favFiles.forEach(file =>
                {
                    const fileButton = document.createElement("button");
                    fileButton.className = "fileButton";
                    fileButton.innerText = getFixtureName(currentFolder, file);
                    fileButton.onclick = () => loadFixtureDetails(currentFolder, file);
                    if (databaseButtonsDiv) databaseButtonsDiv.appendChild(fileButton);
                });

                currentView = "files";
                currentFile = "";
                currentFixturesCount = favFiles.length;
                updateAddressBar();
                updateBackButton();
                filter = "favs";
            }
        }
        else
        {
            filter = "none";
            favsbtn.classList.remove("showFavs");
            if(currentView === "folders") { loadFolders(); }
            else if(currentView === "files") { loadFiles(currentFolder); }
        }
    }
});
