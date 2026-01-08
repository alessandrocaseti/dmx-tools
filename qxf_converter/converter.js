// DMX TOOLS - QXF to JSON Converter

const fileInput = document.getElementById('fileInput');
const convertButton = document.getElementById('convertButton');
const downloadButton = document.getElementById('downloadButton');
const output = document.getElementById('output');
let convertedFiles = [];

const converterVersion = '1.2'

convertButton.addEventListener('click', () => 
{
    const files = fileInput.files;
    if (files.length > 0) 
    {
        convertedFiles = [];
        output.textContent = '';
        let filesProcessed = 0;

        for (const file of files) 
        {
            const reader = new FileReader();
            reader.onload = (e) => 
            {
                const xmlData = e.target.result;
                const jsonData = convertQxfToJson(xmlData);
                if (jsonData) 
                {
                    const fileName = file.name.replace('.qxf', '.json');
                    convertedFiles.push
                    ({
                        name: fileName,
                        data: jsonData
                    });
                    const preview = document.createElement('div');
                    preview.classList.add('file-preview');

                    const title = document.createElement('h3');
                    title.textContent = fileName;
                    preview.appendChild(title);

                    const inputsContainer = document.createElement('div');
                    inputsContainer.classList.add('manual-inputs');

                    const createInput = (labelText, placeholder, field) => {
                        const label = document.createElement('label');
                        label.textContent = labelText;
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.placeholder = placeholder;
                        input.dataset.filename = fileName;
                        input.dataset.field = field;
                        label.appendChild(input);
                        return label;
                    };

                    inputsContainer.appendChild(createInput('Image URL:', 'Image URL', 'image'));
                    inputsContainer.appendChild(createInput('Product Page:', 'Product Page URL', 'productPage'));
                    inputsContainer.appendChild(createInput('Manual:', 'Manual URL', 'manual'));
                    
                    preview.appendChild(inputsContainer);

                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify(jsonData, null, 2);
                    preview.appendChild(pre);

                    output.appendChild(preview);
                } 
                else 
                {
                    const error = document.createElement('p');
                    error.textContent = `Error converting ${file.name}.\n`;
                    output.appendChild(error);
                }

                filesProcessed++;
                if (filesProcessed === files.length && convertedFiles.length > 0) 
                {
                    downloadButton.disabled = false;
                }
            };
            reader.readAsText(file);
        }
    }
});

downloadButton.addEventListener('click', () => 
{
    if (convertedFiles.length > 0) 
    {
        const zip = new JSZip();
        for (const file of convertedFiles) 
        {
            const imageInput = document.querySelector(`input[data-filename="${file.name}"][data-field="image"]`);
            const productPageInput = document.querySelector(`input[data-filename="${file.name}"][data-field="productPage"]`);
            const manualInput = document.querySelector(`input[data-filename="${file.name}"][data-field="manual"]`);

            if (imageInput) { file.data.image = imageInput.value; }
            if (productPageInput) { file.data.productPage = productPageInput.value; }
            if (manualInput) { file.data.manual = manualInput.value; }

            zip.file(file.name, JSON.stringify(file.data, null, 2));
        }

        zip.generateAsync({ type: 'blob' }).then((content) => 
        {
            const downloadAnchorNode = document.createElement('a');
            const objectURL = URL.createObjectURL(content);
            downloadAnchorNode.setAttribute('href', objectURL);
            downloadAnchorNode.setAttribute('download', 'converted_files.zip');
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            URL.revokeObjectURL(objectURL);
        });
    }
});

function convertQxfToJson(xmlData) 
{
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) 
    {
        alert("Error parsing XML");
        return null;
    }

    const fixture = xmlDoc.getElementsByTagName("FixtureDefinition")[0];

    if (!fixture) 
    {
        alert("Invalid QXF file: Missing FixtureDefinition");
        return null;
    }

    const getText = (element, tagName) => 
    {
        const node = element.getElementsByTagName(tagName)[0];
        return node ? node.textContent : "";
    };

    // Extract Fixture Info
    let fixtureType = getText(fixture, "Type");
    if (fixtureType === 'Color Changer') fixtureType = 'Par';
    if (fixtureType === 'Flower') fixtureType = 'Other';
    if (fixtureType === 'Smoke') fixtureType = 'FX Fog';
    if (fixtureType === 'Hazer') fixtureType = 'FX Haze';
    if (fixtureType === 'LED Bar (Pixels)') fixtureType = 'Led Bar';
    if (fixtureType === 'LED Bar (Beams)') fixtureType = 'Led Bar';

    const extractedData = 
    {
        version: converterVersion,
        manufacturer: getText(fixture, "Manufacturer"),
        model: getText(fixture, "Model"),
        type: fixtureType || 'Other',
        image: "",
        productPage: "",
        manual: "",
        author: getText(fixture, "Author"),
        channels: [],
        modes: [],
        physical: {}
    };

    // Extract Channels
    const channels = fixture.querySelectorAll(":scope > Channel");
    for (let i = 0; i < channels.length; i++) 
    {
        const channel = channels[i];
        let channelType = getText(channel, "Group");
        let channelName = channel.getAttribute("Name");
        let chanName = channelName.toLowerCase();

        if (!channelType)
        {
            const preset = channel.getAttribute('Preset') || 'Unknown';
            switch (preset)
            {
                case 'PositionPan': channelType = 'Pan'; break;
                case 'PositionTilt': channelType = 'Tilt'; break;
                case 'PositionPanFine': channelType = 'Pan'; break;
                case 'PositionTiltFine': channelType = 'Tilt'; break;
                case 'ColorWheelFine' : channelType = 'Color'; break;
                case 'GoboWheelFine' : channelType = 'Gobo'; break;
                case 'BeamZoomSmallBig' : channelType = 'Beam'; break;
                case 'BeamZoomFine' : channelType = 'Beam'; break;
                case 'BeamFocusNearFar' : channelType = 'Focus'; break;
                case 'BeamFocusFarNear' : channelType = 'Focus'; break;
                case 'IntensityDimmer' : channelType = 'Intensity'; break;
                case 'IntensityDimmerFine' : channelType = 'Intensity'; break;
                case 'SlowToFast': channelType = 'Speed'; break;
                case 'FastToSlow': channelType = 'Speed'; break;
                case 'NearToFar': channelType = 'Focus'; break;
                case 'FarToNear': channelType = 'Focus'; break;
                case 'BigToSmall': channelType = 'Beam'; break;
                case 'SmallToBig': channelType = 'Beam'; break;
                case 'ShutterOpen': channelType = 'Shutter'; break;
                case 'ShutterClose': channelType = 'Shutter'; break;
                case 'StrobeSlowToFast': channelType = 'Shutter'; break;
                case 'StrobeFastToSlow': channelType = 'Shutter'; break;
                case 'StrobeRandom': channelType = 'Shutter'; break;
                case 'StrobeRandomSlowToFast': channelType = 'Shutter'; break;
                case 'StrobeRandomFastToSlow': channelType = 'Shutter'; break;
                case 'StrobeFrequency': channelType = 'Shutter'; break;
                case 'StrobeFreqRange': channelType = 'Shutter'; break;
                case 'PulseSlowToFast': channelType = 'Shutter'; break;
                case 'PulseFastToSlow': channelType = 'Shutter'; break;
                case 'PulseFrequency': channelType = 'Shutter'; break;
                case 'PulseFreqRange': channelType = 'Shutter'; break;
                case 'RampUpSlowToFast': channelType = 'Strobe'; break;
                case 'RampUpFastToSlow': channelType = 'Strobe'; break;
                case 'RampDownSlowToFast': channelType = 'Strobe'; break;
                case 'RampDownFastToSlow': channelType = 'Strobe'; break;
                case 'RampUpFrequency': channelType = 'Strobe'; break;
                case 'RampUpFreqRange': channelType = 'Strobe'; break;
                case 'RampDownFrequency': channelType = 'Strobe'; break;
                case 'RampDownFreqRange': channelType = 'Strobe'; break;
                case 'RotationStop': channelType = 'Speed'; break;
                case 'RotationIndexed': channelType = 'Speed'; break;
                case 'RotationClockwise': channelType = 'Speed'; break;
                case 'RotationClockwiseSlowToFast': channelType = 'Speed'; break;
                case 'RotationClockwiseFastToSlow': channelType = 'Speed'; break;
                case 'RotationCounterClockwise': channelType = 'Speed'; break;
                case 'RotationCounterClockwiseSlowToFast': channelType = 'Speed'; break;
                case 'RotationCounterClockwiseFastToSlow': channelType = 'Speed'; break;
                case 'ColorMacro': channelType = 'Color'; break;
                case 'ColorDoubleMacro': channelType = 'Color'; break;
                case 'ColorWheelIndex': channelType = 'Color'; break;
                case 'GoboMacro': channelType = 'Gobo'; break;
                case 'GoboShakeMacro': channelType = 'Gobo'; break;
                case 'GenericPicture': channelType = 'Gobo'; break;
                case 'PrismEffectOn': channelType = 'Prism'; break;
                case 'PrismEffectOff': channelType = 'Prism'; break;
                case 'LampOn': channelType = 'Manteinance'; break;
                case 'LampOff': channelType = 'Manteinance'; break;
                case 'ResetAll': channelType = 'Manteinance'; break;
                case 'ResetPanTilt': channelType = 'Manteinance'; break;
                case 'ResetPan': channelType = 'Manteinance'; break;
                case 'ResetTilt': channelType = 'Manteinance'; break;
                case 'ResetMotors': channelType = 'Manteinance'; break;
                case 'ResetGobo': channelType = 'Manteinance'; break;
                case 'ResetColor': channelType = 'Manteinance'; break;
                case 'ResetCMY': channelType = 'Manteinance'; break;
                case 'ResetCTO': channelType = 'Manteinance'; break;
                case 'ResetEffects': channelType = 'Manteinance'; break;
                case 'ResetPrism': channelType = 'Manteinance'; break;
                case 'ResetBlades': channelType = 'Manteinance'; break;
                case 'ResetIris': channelType = 'Manteinance'; break;
                case 'ResetFrost': channelType = 'Manteinance'; break;
                case 'ResetZoom': channelType = 'Manteinance'; break;
                case 'SilentModeOn': channelType = 'Manteinance'; break;
                case 'SilentModeOff': channelType = 'Manteinance'; break;
                case 'SilentModeAutomatic': channelType = 'Manteinance'; break;
                case 'Alias': channelType = 'Manteinance'; break;
                default: channelType = 'Unknown'; break;
            }
            if(channelType === 'Unknown')
            {
                if(chanName.includes('dimmer')) channelType = 'Intensity';
                if(chanName.includes('pan')) channelType = 'Pan';
                if(chanName.includes('tilt')) channelType = 'Tilt';
                if(chanName.includes('shutter')) channelType = 'Shutter';
                if(chanName.includes('focus')) channelType = 'Focus';
                if(chanName.includes('zoom')) channelType = 'Beam';
                if(chanName.includes('iris')) channelType = 'Iris';
                if(chanName.includes('frost')) channelType = 'Frost';
                if(chanName.includes('prism')) channelType = 'Prism';
                if(chanName.includes('gobo')) channelType = 'Gobo';
                if(chanName.includes('color') || chanName.includes('colour')) channelType = 'Color';
                if(chanName.includes('cto')) channelType = 'Color';
                if(chanName.includes('cmy')) channelType = 'Color';
                if(chanName.includes('white')) channelType = 'White';
                if(chanName.includes('red')) channelType = 'Red';
                if(chanName.includes('green')) channelType = 'Green';
                if(chanName.includes('blue')) channelType = 'Blue';
                if(chanName.includes('amber')) channelType = 'Amber';
                if(chanName.includes('uv')) channelType = 'UV';
                if(chanName.includes('indigo')) channelType = 'Indigo';
                if(chanName.includes('lime')) channelType = 'Lime';
                if(chanName.includes('cyan')) channelType = 'Cyan';
                if(chanName.includes('magenta')) channelType = 'Magenta';
                if(chanName.includes('yellow')) channelType = 'Yellow';
                if(chanName.includes('speed')) channelType = 'Speed';
                if(chanName.includes('strobe')) channelType = 'Shutter';
                if(chanName.includes('reserved')) channelType = 'Nothing';
            }
        }
        if (channelType === 'Colour') channelType = 'Color';

        const channelData = 
        {
            name: channelName,
            type: channelType
        };

        // Exctract channel capabilities
        const capabilities = [];
        const caps = channel.getElementsByTagName('Capability');
        for (let j = 0; j < caps.length; j++) 
        {
            const capability = 
            {
                min: caps[j].getAttribute('Min'),
                max: caps[j].getAttribute('Max'),
                name: caps[j].textContent
            };
            capabilities.push(capability);
        }

        if (capabilities.length > 0) 
        {
            channelData.capabilities = capabilities;
        }

        extractedData.channels.push(channelData);
    }

    // Extract Modes
    const modes = fixture.getElementsByTagName("Mode");
    for (let i = 0; i < modes.length; i++) 
    {
        const mode = modes[i];
        const chs = mode.querySelectorAll(":scope > Channel");
        const modeChannels = Array.from(chs).map(channel => channel.textContent);
        const chsQty = modeChannels.length;
        let modeName = mode.getAttribute("Name");
        if (modeName === chsQty + " Channel" || modeName === chsQty + " Channels"
        || modeName === chsQty + " channel" || modeName === chsQty + " channels")
        {
            modeName = "Mode " + (i + 1);
        }
        extractedData.modes.push
        ({
            name: modeName,
            totalChannels: modeChannels.length,
            channels: modeChannels
        });
    }

    // Extract Physical
    const physical = fixture.getElementsByTagName("Physical")[0];
    if (physical) 
    {
        const bulb = physical.getElementsByTagName("Bulb")[0];
        if (bulb) 
        {
            extractedData.physical.bulb = 
            {
                type: bulb.getAttribute("Type") || 'Not specified',
                lumens: bulb.getAttribute("Lumens") || 'Not specified',
                colourTemperature: bulb.getAttribute("ColourTemperature") || 'Not specified'
            };
        }
        const dimensions = physical.getElementsByTagName("Dimensions")[0];
        if (dimensions) 
        {
            extractedData.physical.dimensions = 
            {
                weight: dimensions.getAttribute("Weight") || 'Not specified',
                width: dimensions.getAttribute("Width") || 'Not specified',
                height: dimensions.getAttribute("Height") || 'Not specified',
                depth: dimensions.getAttribute("Depth") || 'Not specified'
            };
        }
        const lens = physical.getElementsByTagName("Lens")[0];
        if (lens) 
        {
            extractedData.physical.lens = 
            {
                name: lens.getAttribute("Name") || 'Not specified',
                degreesMin: lens.getAttribute("DegreesMin") || 'Not specified',
                degreesMax: lens.getAttribute("DegreesMax") || 'Not specified'
            };
        }
        const focus = physical.getElementsByTagName("Focus")[0];
        if (focus) 
        {
            extractedData.physical.focus = 
            {
                type: focus.getAttribute("Type") || 'Not specified',
                panMax: focus.getAttribute("PanMax") || 'Not specified',
                tiltMax: focus.getAttribute("TiltMax") || 'Not specified'
            };
        }
        const technical = physical.getElementsByTagName("Technical")[0];
        if (technical) 
        {
            extractedData.physical.technical = 
            {
                powerConsumption: technical.getAttribute("PowerConsumption") || 'Not specified',
                dmxConnector: technical.getAttribute("DmxConnector") || 'Not specified'
            };
        }
    }

    return extractedData;
}

document.addEventListener('DOMContentLoaded', () => 
{
    document.getElementById('versionText').innerHTML = 'Version ' + converterVersion;
});
