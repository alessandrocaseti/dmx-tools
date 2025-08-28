// DMX TOOLS - QXF to JSON Converter

const fileInput = document.getElementById('fileInput');
const convertButton = document.getElementById('convertButton');
const downloadButton = document.getElementById('downloadButton');
const output = document.getElementById('output');
let convertedFiles = [];

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
                    convertedFiles.push
                    ({
                        name: file.name.replace('.qxf', '.json'),
                        data: jsonData
                    });
                    const preview = document.createElement('div');
                    preview.classList.add('file-preview');

                    const title = document.createElement('h3');
                    title.textContent = file.name.replace('.qxf', '.json');
                    preview.appendChild(title);

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

    const extractedData = 
    {
        manufacturer: getText(fixture, "Manufacturer"),
        model: getText(fixture, "Model"),
        type: getText(fixture, "Type"),
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
                case 'BeamZoomSmallBig' : channelType = 'Zoom'; break;
                case 'BeamZoomFine' : channelType = 'Zoom'; break;
                case 'BeamFocusNearFar' : channelType = 'Focus'; break;
                case 'BeamFocusFarNear' : channelType = 'Focus'; break;
                case 'IntensityDimmer' : channelType = 'Intensity'; break;
                case 'IntensityDimmerFine' : channelType = 'Intensity'; break;
                case 'SlowToFast': channelType = 'Speed'; break;
                case 'FastToSlow': channelType = 'Speed'; break;
                case 'NearToFar': channelType = 'Focus'; break;
                case 'FarToNear': channelType = 'Focus'; break;
                case 'BigToSmall': channelType = 'Zoom'; break;
                case 'SmallToBig': channelType = 'Zoom'; break;
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
                if(chanName.includes('zoom')) channelType = 'Zoom';
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
                if(chanName.includes('speed')) channelType = 'Speed';
                if(chanName.includes('strobe')) channelType = 'Shutter';
            }
        }
        if (channelType === 'Colour') channelType = 'Color';
        extractedData.channels.push
        ({
            name: channelName,
            type: channelType
        });
    }

    // Extract Modes
    const modes = fixture.getElementsByTagName("Mode");
    for (let i = 0; i < modes.length; i++) 
    {
        const mode = modes[i];
        const chs = mode.getElementsByTagName("Channel");
        const modeChannels = Array.from(chs).map(channel => channel.textContent);
        extractedData.modes.push
        ({
            name: mode.getAttribute("Name"),
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