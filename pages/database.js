// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI

let currentView = "folders"; // "folders", "files", "details"
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
    const fixturesCount = document.getElementById("fixtures-count");
    let path = '';
    const brandPattern = new RegExp('^' + currentFolder + '[-_ ]*', 'i');

    if (currentView === "folders") 
    {
        path = 'Fixtures / ';
    }
    
    else if (currentView === "files") 
    {
        path = 'Fixtures / ' + currentFolder + ' / ';
    }
    
    else if (currentView === "details") 
    {
        path = 'Fixtures / ' + currentFolder + ' / ' + (currentFile ? currentFile.replace('.json', '').replace(/-/g, ' ').replace(brandPattern, '').trim() : '');
    }

    addressBar.textContent = path;
    if(currentFixturesCount > 1) { fixturesCount.textContent = currentFixturesCount + " fixtures found"; }
    else { fixturesCount.textContent = currentFixturesCount + " fixture found"; }
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
    const editBtn = document.getElementById("databaseEditButton");

    if(editBtn)
    {
        setCmdMessage('Opened fixture JSON file in a new browser page.', 'EDIT FIXTURE');
        window.open('https://github.com/alessandrocaseti/dmx-tools/blob/main/fixtures/' + currentFolder + '/' + currentFile, '_blank').focus();
        return;
    };
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
    };
    
    // Initial load
    loadFolders();
    countFixtures();

    function countFixtures()
    {
        const fixturesCount =  document.getElementById("fixtures-count");

        if (currentView === "details") 
        {
            fixturesCount.style.display = "none";
            return;
        } 
        else 
        {
            fixturesCount.style.display = "block";
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

        const files = getFilesForFolder(folder);

        files.forEach(file => 
        {
            const fileButton = document.createElement("button");
            fileButton.className = "fileButton";
            let displayName = file.replace('.json', '');
            const brandPattern = new RegExp('^' + folder + '[-_ ]*', 'i');
            displayName = displayName.replace(brandPattern, '');
            displayName = displayName.replace(/-/g, ' ').trim();
            fileButton.innerText = displayName;
            fileButton.onclick = () => loadFixtureDetails(folder, file);
            databaseButtonsDiv.appendChild(fileButton);
        });

        countFixtures();
        updateAddressBar();
        updateBackButton();
    }

    function loadFixtureDetails(folder, file) 
    {
        currentView = "details";
        currentFile = file;
        countFixtures();
        databaseButtonsDiv.innerHTML = '<div style="text-align: center; padding: 50px;"><p>Loading fixture details...</p></div>';
        
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
                        case 'Red':
                        {
                            currentIcon = '';
                            iconColor = 'red';
                            break;
                        }
                        case 'Green':
                        {
                            currentIcon = '';
                            iconColor = 'lime';
                            break;
                        }
                        case 'Blue':
                        {
                            currentIcon = '';
                            iconColor = 'blue';
                            break;
                        }
                        case 'White':
                        {
                            currentIcon = '';
                            iconColor = 'white';
                            break;
                        }
                        case 'Amber':
                        {
                            currentIcon = '';
                            iconColor = 'darkorange';
                            break;
                        }
                        case 'UV':
                        {
                            currentIcon = '';
                            iconColor = 'indigo';
                            break;
                        }
                        case 'Indigo':
                        {
                            currentIcon = '';
                            iconColor = 'indigo';
                            break;
                        }
                        case 'Lime':
                        {
                            currentIcon = '';
                            iconColor = 'palegreen';
                            break;
                        }
                        case 'Cyan':
                        {
                            currentIcon = '';
                            iconColor = 'cyan';
                            break;
                        }
                        case 'Magenta':
                        {
                            currentIcon = '';
                            iconColor = 'magenta';
                            break;
                        }
                        case 'Yellow':
                        {
                            currentIcon = '';
                            iconColor = 'yellow';
                            break;
                        }
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
                        channel.capabilities.forEach(cap => { channelsHTML += `<li><strong>${cap.min}-${cap.max}:</strong> ${cap.name}</li>`; });
                        channelsHTML += '</ul>';
                    } 
                    else { channelsHTML += '<p>No capabilities defined.</p>'; }
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
                            modesHTML += `<div class="mode-channel"><p class="mode-channel-number">${id + 1}</p><p class="mode-text">${channel}</p></div>`;
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
                physicalHTML = '<h3>Physical Details</h3><div class="separator"></div><div class="physical-details">';
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
                        <div><strong>Lumens</strong><br><br> ${data.physical.bulb.lumens || 'N/A'}</div>
                        <div><strong>Color Temperature</strong><br><br> ${data.physical.bulb.colourTemperature || 'N/A'} K</div>
                    `;
                }
                if (data.physical.lens) 
                {
                    physicalHTML += `
                        <div><strong>Min angle</strong><br><br> ${data.physical.lens.degreesMin || 'N/A'}°</div>
                        <div><strong>Max angle</strong><br><br> ${data.physical.lens.degreesMax || 'N/A'}°</div>
                    `;
                }
                if (data.physical.focus) 
                {
                    physicalHTML += `
                        <div><strong>Max pan</strong><br><br> ${data.physical.focus.panMax || 'N/A'}°</div>
                        <div><strong>Max tilt</strong><br><br> ${data.physical.focus.tiltMax || 'N/A'}°</div>
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
                ${channelsHTML}
                ${modesHTML}
                ${physicalHTML}
                <button id="databaseEditButton" onClick="editFixture();" class="iconButton" style="margin-top: 48px;">
                    <span class="buttonIcon"></span>
                    <span class="buttonText">Edit this fixture</span>
                </button>
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
            databaseButtonsDiv.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <p>Error loading fixture details. Please try again.</p>
                </div>`;
            updateAddressBar();
            updateBackButton();
        });
    }
});
