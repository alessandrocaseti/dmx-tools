/*
 XML Schema (XSD) for DMX Tools Data files (.dmxtd)

 Root element: <dmxtd>
 - attributes: version (string), exportedAt (xs:dateTime), origin (xs:anyURI)
 - child elements: <metadata?>, <localStorage>

 Each localStorage entry is represented as an <entry> with child elements:
 - <key> (string)
 - <value> (string) -- raw stored value
 - <type>? (string) -- inferred type name (e.g., "string", "number", "object", "boolean")
 - <json>? (string) -- when <value> contains JSON, this element contains the serialized JSON (for convenience)

 The schema is embedded here as a string so tools in the app can validate or reference it.
*/

const DMXTD_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
	<xs:annotation>
		<xs:documentation>DMX Tools Data (.dmxtd) XML Schema</xs:documentation>
	</xs:annotation>

	<xs:element name="dmxtd">
		<xs:complexType>
			<xs:sequence>
				<xs:element name="metadata" minOccurs="0">
					<xs:complexType>
						<xs:sequence>
							<xs:element name="appName" type="xs:string" minOccurs="0"/>
							<xs:element name="appVersion" type="xs:string" minOccurs="0"/>
							<xs:element name="author" type="xs:string" minOccurs="0"/>
							<xs:element name="notes" type="xs:string" minOccurs="0"/>
						</xs:sequence>
					</xs:complexType>
				</xs:element>

				<xs:element name="localStorage">
					<xs:complexType>
						<xs:sequence>
							<xs:element name="entry" maxOccurs="unbounded">
								<xs:complexType>
									<xs:sequence>
										<xs:element name="key" type="xs:string"/>
										<xs:element name="value" type="xs:string" minOccurs="0"/>
										<xs:element name="type" type="xs:string" minOccurs="0"/>
										<xs:any minOccurs="0" maxOccurs="unbounded" processContents="lax"/>
									</xs:sequence>
									<xs:attribute name="index" type="xs:integer" use="optional"/>
								</xs:complexType>
							</xs:element>
						</xs:sequence>
					</xs:complexType>
				</xs:element>
			</xs:sequence>
			<xs:attribute name="version" type="xs:string" use="required"/>
			<xs:attribute name="exportedAt" type="xs:dateTime" use="required"/>
			<xs:attribute name="origin" type="xs:anyURI" use="optional"/>
		</xs:complexType>
	</xs:element>

</xs:schema>`;

// Expose the schema for other scripts to use
if (typeof window !== 'undefined') window.DMXTD_XSD = DMXTD_XSD;
if (typeof module !== 'undefined' && module.exports) module.exports = { DMXTD_XSD };

/*
 Next: implement a function that collects browser localStorage entries
 and serializes them to an XML string that conforms to this schema.
 I'll wait for your review of the tag names before generating a sample .dmxtd file.
*/

function _escapeXml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function _inferType(value) {
	if (value === null) return 'null';
	try {
		const parsed = JSON.parse(value);
		const t = Array.isArray(parsed) ? 'array' : typeof parsed;
		return t;
	} catch (e) {
		return 'string';
	}
}

/**
 * Collects window.localStorage and serializes it to a DMXTD XML string.
 * options: { version?: string, origin?: string, metadata?: {appName, appVersion, author, notes} }
 */
function exportLocalStorageToXML(options = {}) 
{
	const exportedAt = new Date().toISOString();
	const origin = options.origin || (typeof location !== 'undefined' ? location.href : undefined);
	const metadata = options.metadata || {};
	const schemeVersion = '1.0'
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += `<dmxtd version="${_escapeXml(schemeVersion)}" exportedAt="${_escapeXml(exportedAt)}"`;
	if (origin) xml += ` origin="${_escapeXml(origin)}"`;
	xml += '>' + '\n';

	// metadata
	xml += '  <metadata>\n';
	xml += `    <appName>${_escapeXml(appName)}</appName>\n`;
	xml += `    <appVersion>${_escapeXml(version)}</appVersion>\n`;
	xml += `    <author>${_escapeXml(author)}</author>\n`;
	if (metadata.notes) xml += `    <notes>${_escapeXml(metadata.notes)}</notes>\n`;
	xml += '  </metadata>\n';

	xml += '  <localStorage>\n';

	if (typeof window !== 'undefined' && window.localStorage) {
		for (let i = 0; i < window.localStorage.length; i++) {
			const key = window.localStorage.key(i);
			const value = window.localStorage.getItem(key);
			const type = _inferType(value);

			// Helper: convert generic JSON to XML block under <data>
			function convertParsedToDataXml(parsed) {
				function convertToXml(node, indent) {
					const pad = ' '.repeat(indent);
					if (node === null) return `${pad}<null/>\n`;
					const t = typeof node;
					if (Array.isArray(node)) {
						let out = `${pad}<array>\n`;
						for (const item of node) {
							out += `${pad}  <item>\n`;
							out += convertToXml(item, indent + 4);
							out += `${pad}  </item>\n`;
						}
						out += `${pad}</array>\n`;
						return out;
					} else if (t === 'object') {
						let out = `${pad}<object>\n`;
						for (const k of Object.keys(node)) {
							out += `${pad}  <property name="${_escapeXml(k)}">\n`;
							out += convertToXml(node[k], indent + 4);
							out += `${pad}  </property>\n`;
						}
						out += `${pad}</object>\n`;
						return out;
					} else if (t === 'string') {
						return `${pad}<string>${_escapeXml(node)}</string>\n`;
					} else if (t === 'number') {
						return `${pad}<number>${String(node)}</number>\n`;
					} else if (t === 'boolean') {
						return `${pad}<boolean>${node ? 'true' : 'false'}</boolean>\n`;
					}
					return `${pad}<string>${_escapeXml(String(node))}</string>\n`;
				}

				let out = '      <data>\n';
				out += convertToXml(parsed, 8);
				out += '      </data>\n';
				return out;
			}

			// Special mappings
			const kLower = String(key).toLowerCase();
			let handled = false;

			if (kLower.match(/cmd.*(log|logs|message|messages|input|inputs)/)) {
				// unify command logs and inputs into <CmdLog>
				try {
					const parsed = JSON.parse(value);
					if (Array.isArray(parsed)) {
						for (const item of parsed) {
							const itemType = item && item.input !== undefined ? 'input' : 'message';
							const dateAttr = item && item.date ? ` date="${_escapeXml(item.date)}"` : '';
							xml += `    <CmdLog type="${_escapeXml(itemType)}"${dateAttr}>\n`;
							if (item && item.type) xml += `      <State>${_escapeXml(item.type)}</State>\n`;
							if (itemType === 'input' && item && item.input !== undefined) xml += `      <Value>${_escapeXml(item.input)}</Value>\n`;
							else if (item && (item.message !== undefined || item.msg !== undefined)) xml += `      <Value>${_escapeXml(item.message || item.msg)}</Value>\n`;
							else if (item && item.text !== undefined) xml += `      <Value>${_escapeXml(item.text)}</Value>\n`;
							else if (item && item.input === undefined && item.message === undefined) xml += `      <Value>${_escapeXml(JSON.stringify(item))}</Value>\n`;
							xml += '    </CmdLog>\n';
						}
						handled = true;
					}
				} catch (e) {
					// fall through to default handling
				}
			}

			// Local colors mapping
			if (!handled && kLower.match(/localcolou?r|color|colors/)) {
				try {
					const parsed = JSON.parse(value);
					const items = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : null);
					if (items && Array.isArray(items)) {
						for (const c of items) {
							const idAttr = c && (c.id !== undefined) ? ` id="${_escapeXml(String(c.id))}"` : '';
							const nameAttr = c && (c.name || c.title) ? ` name="${_escapeXml(c.name || c.title)}"` : '';
							const paletteAttr = c && (c.palette || c.paletteName) ? ` palette="${_escapeXml(c.palette || c.paletteName)}"` : '';
							xml += `    <LocalColor${idAttr}${nameAttr}${paletteAttr}>\n`;

							// RGB detection: direct r,g,b or nested rgb object or array
							const rgb = (c && c.r !== undefined && c.g !== undefined && c.b !== undefined) ? { r: c.r, g: c.g, b: c.b }
								: (c && c.rgb && c.rgb.r !== undefined && c.rgb.g !== undefined && c.rgb.b !== undefined) ? c.rgb
								: (c && c.rgb && Array.isArray(c.rgb) && c.rgb.length >= 3) ? { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] }
								: null;
							if (rgb) xml += `      <RGB r="${_escapeXml(String(rgb.r))}" g="${_escapeXml(String(rgb.g))}" b="${_escapeXml(String(rgb.b))}" />\n`;

							// CMY and CMYK detection
							const cmy = (c && c.c !== undefined && c.m !== undefined && c.y !== undefined) ? { c: c.c, m: c.m, y: c.y }
								: (c && c.cmy && c.cmy.c !== undefined && c.cmy.m !== undefined && c.cmy.y !== undefined) ? c.cmy
								: null;
							if (cmy) xml += `      <CMY c="${_escapeXml(String(cmy.c))}" m="${_escapeXml(String(cmy.m))}" y="${_escapeXml(String(cmy.y))}" />\n`;

							const cmyk = (c && c.c !== undefined && c.m !== undefined && c.y !== undefined && c.k !== undefined) ? { c: c.c, m: c.m, y: c.y, k: c.k }
								: (c && c.cmyk && c.cmyk.c !== undefined && c.cmyk.m !== undefined && c.cmyk.y !== undefined && c.cmyk.k !== undefined) ? c.cmyk
								: null;
							if (cmyk) xml += `      <CMYK c="${_escapeXml(String(cmyk.c))}" m="${_escapeXml(String(cmyk.m))}" y="${_escapeXml(String(cmyk.y))}" k="${_escapeXml(String(cmyk.k))}" />\n`;

							// HSL detection
							const hsl = (c && c.h !== undefined && c.s !== undefined && c.l !== undefined) ? { h: c.h, s: c.s, l: c.l }
								: (c && c.hsl && c.hsl.h !== undefined && c.hsl.s !== undefined && c.hsl.l !== undefined) ? c.hsl
								: null;
							if (hsl) xml += `      <HSL h="${_escapeXml(String(hsl.h))}" s="${_escapeXml(String(hsl.s))}" l="${_escapeXml(String(hsl.l))}" />\n`;

							// HEX detection
							const hex = (c && c.hex) ? c.hex : (c && c.hexValue) ? c.hexValue : (c && c.hexCode) ? c.hexCode : (c && c.value && typeof c.value === 'string' && c.value.startsWith('#')) ? c.value : null;
							if (hex) xml += `      <HEX value="${_escapeXml(hex)}" />\n`;

							xml += '    </LocalColor>\n';
						}
						handled = true;
					}
				} catch (e) {}
			}

			// Favorite fixtures mapping
					if (!handled && kLower.match(/favorite|favorites|favoritefixture|favoritefixtures/)) {
				try {
					const parsed = JSON.parse(value);
					const items = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : null);
					if (items && Array.isArray(items)) {
						for (const f of items) {
							const brandVal = f && (f.brand || f.manufacturer || f.make || f.vendor) ? (f.brand || f.manufacturer || f.make || f.vendor) : null;
							const dateVal = f && (f.dateAdded || f.addedAt || f.date || f.created) ? (f.dateAdded || f.addedAt || f.date || f.created) : null;
							const brandAttr = brandVal ? ` brand="${_escapeXml(brandVal)}"` : '';
							const dateAttr = dateVal ? ` dateAdded="${_escapeXml(dateVal)}"` : '';
							xml += `    <FavoriteFixture${brandAttr}${dateAttr}>\n`;
							if (f && f.file) xml += `      <File>${_escapeXml(f.file)}</File>\n`;
							else if (f && f.filename) xml += `      <File>${_escapeXml(f.filename)}</File>\n`;
							else if (f && f.filepath) xml += `      <File>${_escapeXml(f.filepath)}</File>\n`;
							else if (f && f.name) xml += `      <File>${_escapeXml(f.name)}</File>\n`;
							xml += '    </FavoriteFixture>\n';
						}
						handled = true;
					}
				} catch (e) {}
			}

			// Default behavior: output generic <entry> with value or converted <data>
			if (!handled) {
				xml += `    <entry index="${i}">\n`;
				xml += `      <key>${_escapeXml(key)}</key>\n`;
				if (type === 'string') {
					xml += `      <value>${_escapeXml(value)}</value>\n`;
				} else if (type === 'null') {
					xml += `      <type>null</type>\n`;
					xml += `      <data><null/></data>\n`;
				} else {
					if (type) xml += `      <type>${_escapeXml(type)}</type>\n`;
					try {
						const parsed = JSON.parse(value);
						xml += convertParsedToDataXml(parsed);
					} catch (e) {
						xml += `      <value>${_escapeXml(value)}</value>\n`;
					}
				}
				xml += '    </entry>\n';
			}
		}
	}

	xml += '  </localStorage>\n';
	xml += '</dmxtd>\n';

	return xml;
}

/**
 * Trigger a download of the given XML string as a .dmxtd file in the browser.
 * filename default: dmxt-export.dmxtd
 */
function downloadDMXTD(filename = 'dmxt-export.dmxtd', xmlString) {
	const blob = new Blob([xmlString], { type: 'application/xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Expose helpers
if (typeof window !== 'undefined') {
	window.exportLocalStorageToXML = exportLocalStorageToXML;
	window.downloadDMXTD = downloadDMXTD;
}
if (typeof module !== 'undefined' && module.exports) {
	module.exports = Object.assign(module.exports || {}, { exportLocalStorageToXML, downloadDMXTD });
}

/*

<LocalColor id="0" name="Example" palette"none">
	<RGB r="255" g="255" b="255" />
	<CMY c="0" m="0" y="0" />
	<CMYK c="0" m="0" y="0" k="255" />
	<HSL h="50" s="100" l="0" />
	<HEX value="#ffffff" />
</LocalColor>

<CmdLog type="message / input" date="">
	<State>TYPE_STATE</State>
	<Value>This is the input or the message</Value>
</CmdLog>

<FavoriteFixture brand="" dateAdded="">
	<File>filename.js</File>
</FavoriteFixture>

*/