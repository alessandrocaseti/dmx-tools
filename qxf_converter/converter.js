// Helper to ensure we always work with an array, as the parser might return a single object
const ensureArray = (item) => {
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
};

/**
 * Parses a QLC+ Fixture Definition file (QXF) and converts it to a JSON object.
 * @param {string} xmlData The QXF file content as a string.
 * @returns {object|null} A JSON object representing the fixture, or null on error.
 */
function convertQxfToJson(xmlData) {
    try {
        // Configure the parser to keep attributes, which are crucial for QXF files.
        const parser = new fxp.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "_"
        });
        const jsonObj = parser.parse(xmlData);

        const fixtureDef = jsonObj.FixtureDefinition;

        if (!fixtureDef) {
            throw new Error("Invalid QXF file: Missing FixtureDefinition root element.");
        }

        const channels = ensureArray(fixtureDef.Channel).map(ch => {
            const capabilities = ensureArray(ch.Capability).map(cap => ({
                min: cap._Min,
                max: cap._Max,
                description: cap["#text"]
            }));

            return {
                name: ch._Name,
                type: ch.Group ? ch.Group['#text'] : 'Generic',
                capabilities: capabilities
            };
        });

        const modes = ensureArray(fixtureDef.Mode).map(mode => {
            const modeChannels = ensureArray(mode.Channel).map(mc => ({
                number: mc._Number,
                name: mc["#text"]
            }));

            return {
                name: mode._Name,
                channels: modeChannels,
            };
        });

        let physical = {};
        if (fixtureDef.Physical) {
            const p = fixtureDef.Physical;
            physical = {
                bulb: p.Bulb ? {
                    type: p.Bulb._Type,
                    lumens: p.Bulb._Lumens,
                    colourTemperature: p.Bulb._ColourTemperature
                } : {},
                dimensions: p.Dimensions ? {
                    weight: p.Dimensions._Weight,
                    width: p.Dimensions._Width,
                    height: p.Dimensions._Height,
                    depth: p.Dimensions._Depth
                } : {},
                lens: p.Lens ? {
                    name: p.Lens._Name,
                    degreesMin: p.Lens._DegreesMin,
                    degreesMax: p.Lens._DegreesMax
                } : {},
                focus: p.Focus ? {
                    type: p.Focus._Type,
                    panMax: p.Focus._PanMax,
                    tiltMax: p.Focus._TiltMax
                } : {},
                technical: p.Technical ? {
                    powerConsumption: p.Technical._PowerConsumption,
                    dmxConnector: p.Technical._DmxConnector
                } : {}
            };
        }

        const result = {
            manufacturer: fixtureDef.Manufacturer,
            model: fixtureDef.Model,
            type: fixtureDef.Type,
            channels: channels,
            modes: modes,
            physical: physical
        };

        return result;

    } catch (error) {
        console.error(`Error processing QXF file: ${error.message}`);
        return null;
    }
}
