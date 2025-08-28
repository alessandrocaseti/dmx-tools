// DMX TOOLS - QXF to JSON Converter

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
        if (!channelType)
        {
            const preset = channel.getAttribute('Preset');
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
            }
        }
        if (channelType === 'Colour') channelType = 'Color';
        extractedData.channels.push
        ({
            name: channel.getAttribute("Name"),
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
