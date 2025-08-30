// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI

// Define the folder structure directly in the code
const fixtureFolders = [
    "Lixada",
    "Sagitter",
    "Stairville"
];

// Store the current view state
let currentView = "folders"; // "folders", "files", "details"
let currentFolder = "";
let currentFile = "";

// Utility to update the address bar
function updateAddressBar() {
    const addressBar = document.getElementById("databaseAddressBar");
    let path = '';
    const brandPattern = new RegExp('^' + currentFolder + '[-_ ]*', 'i');
    if (currentView === "folders") {
        path = 'Fixtures / ';
    } else if (currentView === "files") {
        path = 'Fixtures / ' + currentFolder + ' / ';
    } else if (currentView === "details") {
        path = 'Fixtures / ' + currentFolder + ' / ' + (currentFile ? currentFile.replace('.json', '').replace(/-/g, ' ').replace(brandPattern, '').trim() : '');
    }
    addressBar.textContent = path;
}

// Utility to enable/disable back button
function updateBackButton() {
    const backBtn = document.getElementById("databaseBackButton");
    if (currentView === "folders") {
        backBtn.disabled = true;
    } else {
        backBtn.disabled = false;
    }
}

// Main logic
document.addEventListener("DOMContentLoaded", function() {
    const databaseButtonsDiv = document.getElementById("databaseButtons");
    const backBtn = document.getElementById("databaseBackButton");
    const addressBar = document.getElementById("databaseAddressBar");

    // Back button handler
    backBtn.onclick = function() {
        if (currentView === "files" || currentView === "details") {
            loadFolders();
        }
    };

    // Initial load
    loadFolders();

    function loadFolders() {
        currentView = "folders";
        currentFolder = "";
        currentFile = "";

        databaseButtonsDiv.innerHTML = '';

        fixtureFolders.forEach(folder => {
            const folderButton = document.createElement("button");
            folderButton.className = "folderButton";
            folderButton.innerText = folder;
            folderButton.onclick = () => loadFiles(folder);
            databaseButtonsDiv.appendChild(folderButton);
        });

        updateAddressBar();
        updateBackButton();
    }

    function loadFiles(folder) {
        currentView = "files";
        currentFolder = folder;
        currentFile = "";

        databaseButtonsDiv.innerHTML = '';

        const files = getFilesForFolder(folder);

        files.forEach(file => {
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

        updateAddressBar();
        updateBackButton();
    }

    function getFilesForFolder(folder) {
        // This would normally be dynamic, but we'll define it statically for now
        const folderFiles = {
            "Lixada": [
                "Lixada-5LED-50W-Beam-Wash-Double-Sides-RGBW.json",
                "Lixada-12-RGBW-LED-Par-Light.json",
                "Lixada-Mini-Gobo-Moving-Head.json",
                "Lixada-Mini-Wash-RGBW.json",
                "Lixada-RGBW-LED-Mini-Moving-Head.json",
                "Lixada-Triangle-Spider-Beam.json"
            ],
            "Sagitter": [
                "Sagitter-ARS1500FC.json",
                "Sagitter-Lite-Beam-5R.json",
                "Sagitter-Miniscan-2001.json",
                "Sagitter-Prince.json",
                "Sagitter-Slimpar-7DL.json",
                "Sagitter-Slimpar-12DL.json",
                "Sagitter-Slimpar-18-RGB.json",
                "Sagitter-Smart-DL-Wash.json"
            ],
            "Stairville": [
                "Stairville-AF-40-DMX.json",
                "Stairville-AF-150.json",
                "Stairville-AF-180-LED-Fogger-Co2-FX.json",
                "Stairville-AFH-600.json",
                "Stairville-All-FX-Bar.json",
                "Stairville-Beam-Moving-Head-B5R.json",
                "Stairville-BEL4-Battery-Event-Light-4x15W.json",
                "Stairville-BEL6-IP-Bar-HEX.json",
                "Stairville-Blade-Sting-8-RGBW-Beam-Mover.json",
                "Stairville-BS-280-R10-BeamSpot.json",
                "Stairville-BSW-350-LED.json",
                "Stairville-CLB2.4-CompactLED.json",
                "Stairville-CLB4-RGB-Compact-LED-Bar-4.json",
                "Stairville-CLB5-6P-RGB-WW-Compact-LED-Bar.json",
                "Stairville-CLB5-Compact-LED-Bar-RGBW-RGBWW.json",
                "Stairville-Compact-LED-Bar-CLB8.json",
                "Stairville-Crown-FX-PAR77.json",
                "Stairville-DCL-Flat-Par-18x4W-CW-WW.json",
                "Stairville-DDS-405.json",
                "Stairville-DJ-Lase-25+25-G-MK-II.json",
                "Stairville-DJ-Lase-40-G-MK-III.json",
                "Stairville-DJ-Lase-150-RGY-MkII.json",
                "Stairville-DJ-Lase-BlueStar-MK-II-LED.json",
                "Stairville-DJ-Lase-GR-140-RGY-MKII.json",
                "Stairville-DJ-Lase-Polar-200.json",
                "Stairville-FS-x75-Follow-Spot.json",
                "Stairville-HF-900-Haze-Fogger.json",
                "Stairville-HL-x9-18-DCL-CW-WWFlood-9-18x6W.json",
                "Stairville-HL-x9-Quad-Color-Flood-9x8W.json",
                "Stairville-Hz-200-DMX.json",
                "Stairville-Infinite-Pixel-250.json",
                "Stairville-JunoScan-MKII.json",
                "Stairville-LED-BAR-240-8-RGB.json",
                "Stairville-LED-BAR-RGB-252.json",
                "Stairville-LED-Blinder-2-COB-2x65W.json",
                "Stairville-LED-Flood-Panel-7x3W.json",
                "Stairville-LED-Flood-Panel-150.json",
                "Stairville-LED-Matrix-Blinder-5x5.json",
                "Stairville-LED-PAR-36-COB-RGBW-12W.json",
                "Stairville-LED-PAR-64-Alu.json",
                "Stairville-LED-PAR-64-COB-RGBW-60W.json",
                "Stairville-LED-PAR56-10MM-UV.json",
                "Stairville-LED-PAR56-MKII-RGBA.json",
                "Stairville-LED-PAR56-MKII-RGBW.json",
                "Stairville-LED-PAR56.json",
                "Stairville-LED-PAR64-MKII-RGBW.json",
                "Stairville-LED-PAR64.json",
                "Stairville-LED-Show-Bar-Tri-18x3W-RGB.json",
                "Stairville-M-Fog-1000-DMX.json",
                "Stairville-Matrixx-FL-110-DMX.json",
                "Stairville-maTrixx-SC-100.json",
                "Stairville-MH-100-Beam-36x3-LED.json",
                "Stairville-MH-110-Wash.json",
                "Stairville-MH-250-S.json",
                "Stairville-MH-360.json",
                "Stairville-MH-X20.json",
                "Stairville-MH-X25.json",
                "Stairville-MH-x30-LED-Beam.json",
                "Stairville-MH-x30-LED-Spot.json",
                "Stairville-MH-X50.json",
                "Stairville-MH-X60th-LED-Spot.json",
                "Stairville-MH-x200-Pro-Spot.json",
                "StairVille-MH-z720.json",
                "Stairville-MH-z1915.json",
                "Stairville-Mini-Stage-Par-RGBW.json",
                "Stairville-Mobile-Color.json",
                "Stairville-novaWash-Quad-LED.json",
                "Stairville-Octagon-Theater.json",
                "Stairville-Outdoor-Stage-PAR-12x3W-Tri.json",
                "Stairville-PAR64-CX-3-RGBW.json",
                "Stairville-PAR64-CX-6-RGBWAUV.json",
                "Stairville-Pixel-Panel-144-RGB.json",
                "Stairville-PS1500DMX.json",
                "Stairville-Quad-Par-Profile-RGBW-5x8W.json",
                "Stairville-SC-100.json",
                "Stairville-SC-X50-MKII.json",
                "Stairville-SC250H.json",
                "Stairville-SF-1500.json",
                "Stairville-SonicPulse-LED-Bar-05.json",
                "Stairville-SonicPulse-LED-Bar-10.json",
                "Stairville-SonicPulse-MH-Wash-1208.json",
                "Stairville-Stage-PAR-CX-2-RGBAW.json",
                "Stairville-Stage-Quad-LED-Bundle-RGB-WW.json",
                "Stairville-Tri-Flat-PAR-Profile-5x3W-RGB.json",
                "Stairville-TRI-LED-Bundle-Complete.json",
                "Stairville-WGF-2000.json",
                "Stairville-Wild-Wash-9x3W-LED-UV.json",
                "Stairville-Wild-Wash-132-LED-CW.json",
                "Stairville-Wild-Wash-132-RGB-LED.json",
                "Stairville-WildWash-Pro-648-LED-RGB.json",
                "Stairville-xBrick-Full-Colour-16X3W.json",
                "Stairville-xBrick-Full-Colour.json",
                "Stairville-xBrick-Quad-16x8W-RGBW.json",
                "Stairville-Z100M.json",
                "Stairville-ZF-1500.json"
            ]
        };
        
        return folderFiles[folder] || [];
    }
    
    // Function to load fixture details from a JSON file
    function loadFixtureDetails(folder, file) {
        currentView = "details";
        currentFile = file;
        
        // Show loading message
        databaseButtonsDiv.innerHTML = '<div style="text-align: center; padding: 50px;"><p>Loading fixture details...</p></div>';
        
        // Fetch the JSON file
        fetch(`fixtures/${folder}/${file}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                databaseButtonsDiv.innerHTML = '';

                const detailsDiv = document.createElement("div");
                detailsDiv.className = "fixture-details";

                let channelsHTML = '';
                if (data.channels && data.channels.length > 0) {
                    channelsHTML = '<h3>Channels</h3><div class="channels-container">';
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
                        if (channel.capabilities && channel.capabilities.length > 0) {
                            channelsHTML += '<ul>';
                            channel.capabilities.forEach(cap => {
                                channelsHTML += `<li><strong>${cap.min}-${cap.max}:</strong> ${cap.name}</li>`;
                            });
                            channelsHTML += '</ul>';
                        } else {
                            channelsHTML += '<p>No capabilities defined.</p>';
                        }
                        channelsHTML += `</div></div>`;
                    });
                    channelsHTML += '</div>';
                }

                let modesHTML = '';
                if (data.modes && data.modes.length > 0) {
                    modesHTML = '<h3>Modes</h3><div class="modes-container">';
                    data.modes.forEach(mode => {
                        modesHTML += `
                            <div class="mode-item">
                                <h4>${mode.name} (${mode.totalChannels} Channels)</h4>
                                <div class="mode-channels">
                        `;
                        if (mode.channels && mode.channels.length > 0) {
                            mode.channels.forEach((channel, id) => {
                                modesHTML += `<div class="mode-channel">${id + 1}<span style="display: inline-block; width: 2ch;">&#9;</span>${channel}</div>`;
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
                if (data.physical) {
                    physicalHTML = '<h3>Physical Details</h3><div class="physical-details">';
                    if (data.physical.dimensions) {
                        physicalHTML += `
                            <div><strong>Weight</strong><br><br> ${data.physical.dimensions.weight || 'N/A'} kg</div>
                            <div><strong>Width</strong><br><br> ${data.physical.dimensions.width || 'N/A'} mm</div>
                            <div><strong>Height</strong><br><br> ${data.physical.dimensions.height || 'N/A'} mm</div>
                            <div><strong>Depth</strong><br><br> ${data.physical.dimensions.depth || 'N/A'} mm</div>
                        `;
                    }
                    if (data.physical.technical) {
                        physicalHTML += `
                            <div><strong>Power Consuption</strong><br><br> ${data.physical.technical.powerConsumption || 'N/A'} W</div>
                            <div><strong>DMX Connector</strong><br><br> ${data.physical.technical.dmxConnector || 'N/A'}</div>
                        `;
                    }
                    physicalHTML += '</div>';
                }

                detailsDiv.innerHTML = `
                    <h2>${data.manufacturer || folder} - ${data.model || file.replace('.json', '')}</h2>
                    <h3>Type: ${data.type || 'N/A'}</h3>
                    ${channelsHTML}
                    ${modesHTML}
                    ${physicalHTML}
                `;

                databaseButtonsDiv.appendChild(detailsDiv);

                const channelItems = detailsDiv.querySelectorAll('.channel-item');
                channelItems.forEach(item => {
                    item.addEventListener('click', () => {
                        item.classList.toggle('expanded');
                    });
                });
                
                updateAddressBar();
                updateBackButton();
            })
            .catch(error => {
                console.error('Error loading fixture details:', error);
                databaseButtonsDiv.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <p>Error loading fixture details. Please try again.</p>
                    </div>
                `;
                updateAddressBar();
                updateBackButton();
            });
    }
});
