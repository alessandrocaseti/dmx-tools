
function convertQxfToJson(xmlData) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        alert("Error parsing XML");
        return null;
    }

    const fixture = xmlDoc.getElementsByTagName("FixtureDefinition")[0];

    if (!fixture) {
        alert("Invalid QXF file: Missing FixtureDefinition");
        return null;
    }

    const getText = (element, tagName) => {
        const node = element.getElementsByTagName(tagName)[0];
        return node ? node.textContent : "";
    };

    const extractedData = {
        manufacturer: getText(fixture, "Manufacturer"),
        model: getText(fixture, "Model"),
        type: getText(fixture, "Type"),
        channels: [],
        modes: [],
        physical: {}
    };

    // Extract Channels
    const channels = fixture.getElementsByTagName("Channel");
    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        extractedData.channels.push({
            id: channel.getAttribute("Name"),
            name: channel.getAttribute("Name"),
            type: getText(channel, "Group")
        });
    }

    // Extract Modes
    const modes = fixture.getElementsByTagName("Mode");
    for (let i = 0; i < modes.length; i++) {
        const mode = modes[i];
        const modeChannels = [];
        const chs = mode.getElementsByTagName("Channel");
        for (let j = 0; j < chs.length; j++) {
            modeChannels.push(chs[j].textContent);
        }
        extractedData.modes.push({
            name: mode.getAttribute("Name"),
            totalChannels: modeChannels.length,
            channels: modeChannels
        });
    }

    // Extract Physical
    const physical = fixture.getElementsByTagName("Physical")[0];
    if (physical) {
        const bulb = physical.getElementsByTagName("Bulb")[0];
        if (bulb) {
            extractedData.physical.bulb = {
                type: bulb.getAttribute("Type"),
                lumens: bulb.getAttribute("Lumens"),
                colourTemperature: bulb.getAttribute("ColourTemperature")
            };
        }
        const dimensions = physical.getElementsByTagName("Dimensions")[0];
        if (dimensions) {
            extractedData.physical.dimensions = {
                weight: dimensions.getAttribute("Weight"),
                width: dimensions.getAttribute("Width"),
                height: dimensions.getAttribute("Height"),
                depth: dimensions.getAttribute("Depth")
            };
        }
        const lens = physical.getElementsByTagName("Lens")[0];
        if (lens) {
            extractedData.physical.lens = {
                name: lens.getAttribute("Name"),
                degreesMin: lens.getAttribute("DegreesMin"),
                degreesMax: lens.getAttribute("DegreesMax")
            };
        }
        const focus = physical.getElementsByTagName("Focus")[0];
        if (focus) {
            extractedData.physical.focus = {
                type: focus.getAttribute("Type"),
                panMax: focus.getAttribute("PanMax"),
                tiltMax: focus.getAttribute("TiltMax")
            };
        }
        const technical = physical.getElementsByTagName("Technical")[0];
        if (technical) {
            extractedData.physical.technical = {
                powerConsumption: technical.getAttribute("PowerConsumption"),
                dmxConnector: technical.getAttribute("DmxConnector")
            };
        }
    }

    return extractedData;
}
