/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

class EnhancedColorConverter 
{
    rgbToHsv(r, g, b) 
    {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, v = max;
        let d = max - min;
        s = max === 0 ? 0 : d / max;
        if (d === 0) 
        {
            // Se il colore è nero o grigio, mantieni l'hue precedente se disponibile
            if (typeof this !== 'undefined' && this.hue !== undefined) 
            {
                h = this.hue;
            }
            else 
            {
                h = 0;
            }
        } 
        else 
        {
            switch (max) 
            {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
            h = h * 360;
            if (h < 0) h += 360;
        }
        return {
            h: Math.round(h),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }
    constructor() 
    {
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.savedColors = this.loadSavedColors();
        this.isDragging = false;
        this.dragTarget = null;
        this.hue = 0;
        this.saturation = 100;
        this.value = 100;
        this.init();
    }

    init() 
    {
        this.setupColorPicker();
        this.setupInputListeners();
        this.updateAllValues();
        this.renderSavedColors();
    }

    // RGB -> CMYK
    rgbToCmyk(r, g, b) 
    {
        r = r / 255; g = g / 255; b = b / 255;
        const k = 1 - Math.max(r, g, b);
        let c = 0, m = 0, y = 0;
        if (k < 1) 
        {
            c = ((1 - r - k) / (1 - k));
            m = ((1 - g - k) / (1 - k));
            y = ((1 - b - k) / (1 - k));
        }
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    // CMYK -> RGB
    cmykToRgb(c, m, y, k) 
    {
        c = c / 100; m = m / 100; y = y / 100; k = k / 100;
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));
        return { r, g, b };
    }

    rgbToHex(r, g, b) 
    {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(Math.round(x), 255)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) 
    {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
        {
            r: Math.max(0, Math.min(parseInt(result[1], 16), 255)),
            g: Math.max(0, Math.min(parseInt(result[2], 16), 255)),
            b: Math.max(0, Math.min(parseInt(result[3], 16), 255))
        } : null;
    }

    // HSV to RGB conversion
    hsvToRgb(h, s, v) 
    {
        s /= 100;
        v /= 100;
        // Correggi hue=360 per essere identico a hue=0 (rosso)
        let hNorm = h % 360;
        let c = v * s;
        let x = c * (1 - Math.abs((hNorm / 60) % 2 - 1));
        let m = v - c;
        let r = 0, g = 0, b = 0;
        if (hNorm >= 0 && hNorm < 60) { r = c; g = x; b = 0; }
        else if (hNorm >= 60 && hNorm < 120) { r = x; g = c; b = 0; }
        else if (hNorm >= 120 && hNorm < 180) { r = 0; g = c; b = x; }
        else if (hNorm >= 180 && hNorm < 240) { r = 0; g = x; b = c; }
        else if (hNorm >= 240 && hNorm < 300) { r = x; g = 0; b = c; }
        else if (hNorm >= 300 && hNorm < 360) { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // RGB <-> HSL
    rgbToHsl(r, g, b) 
    {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } 
        else 
        {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) 
            {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: Math.round((h || 0) * 360),
            s: Math.round((s || 0) * 100),
            l: Math.round((l || 0) * 100)
        };
    }

    hslToRgb(h, s, l) 
    {
        h = (h % 360) / 360;
        s /= 100;
        l /= 100;
        let r, g, b;
        if (s === 0) { r = g = b = l; } 
        else 
        {
            const hue2rgb = (p, q, t) => 
            {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // RGB <-> CMY (solo CMY, non CMYK)
    rgbToCmy(r, g, b) 
    {
        return {
            c: Math.round((1 - r / 255) * 100),
            m: Math.round((1 - g / 255) * 100),
            y: Math.round((1 - b / 255) * 100)
        };
    }

    cmyToRgb(c, m, y) 
    {
        return {
            r: Math.round(255 * (1 - c / 100)),
            g: Math.round(255 * (1 - m / 100)),
            b: Math.round(255 * (1 - y / 100))
        };
    }

    setupColorPicker() 
    {
        const picker = document.getElementById('colorPicker');
        const cursor = document.getElementById('colorCursor');
        const huePicker = document.getElementById('huePicker');
        const hueCursor = document.getElementById('hueCursor');

        if (!picker || !cursor || !huePicker || !hueCursor) 
        {
            console.error('Color picker elements not found');
            return;
        }

        picker.style.cursor = 'crosshair';
        huePicker.style.cursor = 'ns-resize';

        picker.addEventListener('mouseenter', () => 
        {
            picker.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        picker.addEventListener('mouseleave', () => 
        {
            picker.style.boxShadow = 'none';
        });

        picker.addEventListener('mousedown', (e) => 
        {
            e.preventDefault();
            this.isDragging = true;
            this.dragTarget = 'picker';
            this.updateSaturationValue(e);
            
            const moveHandler = (ev) => 
            {
                if (this.isDragging && this.dragTarget === 'picker') 
                {
                    this.updateSaturationValue(ev);
                }
            };
            
            const upHandler = () => 
            {
                this.isDragging = false;
                this.dragTarget = null;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        huePicker.addEventListener('mousedown', (e) => 
        {
            e.preventDefault();
            this.isDragging = true;
            this.dragTarget = 'hue';
            this.updateHue(e);
            
            const moveHandler = (ev) => 
            {
                if (this.isDragging && this.dragTarget === 'hue') 
                {
                    this.updateHue(ev);
                }
            };
            
            const upHandler = () => 
            {
                this.isDragging = false;
                this.dragTarget = null;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        this.updatePickerBackground();
        this.updateCursors();
    }

    // HSV picker logic
    updateSaturationValue(e) 
    {
        const picker = document.getElementById('colorPicker');
        const rect = picker.getBoundingClientRect();

        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        this.saturation = Math.max(0, Math.min((x / rect.width) * 100, 100));
        this.value = Math.max(0, Math.min(100 - (y / rect.height) * 100, 100));

        this.updateColor();
        this.updateCursors();
    }

    updateHue(e) 
    {
        const huePicker = document.getElementById('huePicker');
        const rect = huePicker.getBoundingClientRect();

        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        this.hue = Math.max(0, Math.min(360 - (y / rect.height) * 360, 360));

        this.updatePickerBackground();
        this.updateColor();
        this.updateCursors();
    }

    updatePickerBackground() 
    {
        const picker = document.getElementById('colorPicker');
        picker.style.background = `
            linear-gradient(to top, black, transparent),
            linear-gradient(to right, white, transparent),
            hsl(${this.hue}, 100%, 50%)
        `;
    }

    updateColor() 
    {
        const rgb = this.hsvToRgb(this.hue, this.saturation, this.value);
        this.setColor(rgb.r, rgb.g, rgb.b);
    }

    updateCursors() 
    {
        const picker = document.getElementById('colorPicker');
        const cursor = document.getElementById('colorCursor');
        const huePicker = document.getElementById('huePicker');
        const hueCursor = document.getElementById('hueCursor');

        const pickerRect = picker.getBoundingClientRect();
        const hueRect = huePicker.getBoundingClientRect();

        const x = Math.max(0, Math.min((this.saturation / 100) * pickerRect.width, pickerRect.width));
        const y = Math.max(0, Math.min(((100 - this.value) / 100) * pickerRect.height, pickerRect.height));
        
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.style.display = 'block';

        const hueY = Math.max(0, Math.min(((360 - this.hue) / 360) * (hueRect.height - 6), (hueRect.height - 6)));
        hueCursor.style.top = `${hueY}px`;
        hueCursor.style.display = 'block';
    }

    setupInputListeners() 
    {
        // RGB
        ['rValue', 'gValue', 'bValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let value = parseInt(e.target.value) || 0;
                    value = Math.max(0, Math.min(value, 255));
                    e.target.value = value;
                    const r = this.validateInput('rValue', 0, 255);
                    const g = this.validateInput('gValue', 0, 255);
                    const b = this.validateInput('bValue', 0, 255);
                    this.setColor(r, g, b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // HSL
        ['hValue', 'sValue', 'lValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let h = parseInt(document.getElementById('hValue').value) || 0;
                    let s = parseInt(document.getElementById('sValue').value) || 0;
                    let l = parseInt(document.getElementById('lValue').value) || 0;
                    h = Math.max(0, Math.min(h, 360));
                    s = Math.max(0, Math.min(s, 100));
                    l = Math.max(0, Math.min(l, 100));
                    const rgb = this.hslToRgb(h, s, l);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // HSL
        ['hslHValue', 'hslSValue', 'hslLValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let value = parseInt(e.target.value) || 0;
                    if (id === 'hslHValue') value = Math.max(0, Math.min(value, 360));
                    else value = Math.max(0, Math.min(value, 100));
                    e.target.value = value;
                    const h = this.validateInput('hslHValue', 0, 360);
                    const s = this.validateInput('hslSValue', 0, 100);
                    const l = this.validateInput('hslLValue', 0, 100);
                    const rgb = this.hslToRgb(h, s, l);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // CMY
        ['cyanValue', 'magentaValue', 'yellowValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let c = parseInt(document.getElementById('cyanValue').value) || 0;
                    let m = parseInt(document.getElementById('magentaValue').value) || 0;
                    let y = parseInt(document.getElementById('yellowValue').value) || 0;
                    c = Math.max(0, Math.min(c, 100));
                    m = Math.max(0, Math.min(m, 100));
                    y = Math.max(0, Math.min(y, 100));
                    const rgb = this.cmyToRgb(c, m, y);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // CMY
        ['cmyCValue', 'cmyMValue', 'cmyYValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let value = parseInt(e.target.value) || 0;
                    value = Math.max(0, Math.min(value, 100));
                    e.target.value = value;
                    const c = this.validateInput('cmyCValue', 0, 100);
                    const m = this.validateInput('cmyMValue', 0, 100);
                    const y = this.validateInput('cmyYValue', 0, 100);
                    const rgb = this.cmyToRgb(c, m, y);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // CMYK
        ['cValue', 'mValue', 'yValue', 'kValue'].forEach(id => 
        {
            const input = document.getElementById(id);
            if (input) 
            {
                input.addEventListener('input', (e) => 
                {
                    let value = parseInt(e.target.value) || 0;
                    value = Math.max(0, Math.min(value, 100));
                    e.target.value = value;
                    const c = this.validateInput('cValue', 0, 100);
                    const m = this.validateInput('mValue', 0, 100);
                    const y = this.validateInput('yValue', 0, 100);
                    const k = this.validateInput('kValue', 0, 100);
                    const rgb = this.cmykToRgb(c, m, y, k);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                    this.updatePickerBackground();
                    this.updateCursors();
                });
            }
        });

        // HEX
        const hexInput = document.getElementById('hexValue');
        if (hexInput) 
        {
            hexInput.addEventListener('input', (e) => 
            {
                let hex = e.target.value;
                if (hex.match(/^#[0-9A-Fa-f]{0,6}$/)) 
                {
                    if (hex.length === 7) 
                    {
                        const rgb = this.hexToRgb(hex);
                        if (rgb) this.setColor(rgb.r, rgb.g, rgb.b);
                        this.updatePickerBackground();
                        this.updateCursors();
                    }
                } else 
                {
                    // Remove invalid characters
                    e.target.value = '#' + hex.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
                }
            });
        }
    }

    validateInput(id, min, max) 
    {
        const input = document.getElementById(id);
        if (!input) return min;
        
        let value = parseInt(input.value) || min;
        return Math.max(min, Math.min(value, max));
    }

    // Update all color values
    setColor(r, g, b) 
    {
        this.currentColor = { r, g, b };
        // Aggiorna HSV solo se non stiamo trascinando il picker (cioè se non è in corso un drag su saturation/value)
        if (!this.isDragging || this.dragTarget !== 'picker') 
        {
            const hsv = this.rgbToHsv(r, g, b);
            this.hue = hsv.h;
            this.saturation = hsv.s;
            this.value = hsv.v;
        }
        this.updateAllValues();
    }

    updateAllValues() 
    {
        const { r, g, b } = this.currentColor;
        const cmyk = this.rgbToCmyk(r, g, b);
        const hex = this.rgbToHex(r, g, b);
        const hsl = this.rgbToHsl(r, g, b);
        const cmy = this.rgbToCmy(r, g, b);

        const rInput = document.getElementById('rValue');
        const gInput = document.getElementById('gValue');
        const bInput = document.getElementById('bValue');
        const cInput = document.getElementById('cValue');
        const mInput = document.getElementById('mValue');
        const yInput = document.getElementById('yValue');
        const kInput = document.getElementById('kValue');
        const hexInput = document.getElementById('hexValue');
        const hInput = document.getElementById('hValue');
        const sInput = document.getElementById('sValue');
        const lInput = document.getElementById('lValue');
        const cyanInput = document.getElementById('cyanValue');
        const magentaInput = document.getElementById('magentaValue');
        const yellowInput = document.getElementById('yellowValue');

        if (rInput) rInput.value = r;
        if (gInput) gInput.value = g;
        if (bInput) bInput.value = b;
        if (cInput) cInput.value = cmyk.c;
        if (mInput) mInput.value = cmyk.m;
        if (yInput) yInput.value = cmyk.y;
        if (kInput) kInput.value = cmyk.k;
        if (hexInput) hexInput.value = hex;
        if (hInput) hInput.value = hsl.h;
        if (sInput) sInput.value = hsl.s;
        if (lInput) lInput.value = hsl.l;
        if (cyanInput) cyanInput.value = cmy.c;
        if (magentaInput) magentaInput.value = cmy.m;
        if (yellowInput) yellowInput.value = cmy.y;

        // Update color display
        const colorDisplay = document.getElementById('colorDisplay');
        if (colorDisplay) { colorDisplay.style.backgroundColor = hex; }

        // Aggiorna cursori dopo aver aggiornato tutti i valori
        this.updateCursors();
    }

    saveColor(cmd = false, cmdInput = '') 
    {
        let inputName;
        if(!cmd)
        {
            inputName = document.getElementById('colorName').value.trim();
            if (!inputName) 
            {
                setCmdMessage('Please enter a name for the color before saving.', 'ERROR');
                return;
            }
        }
        else
        {
            inputName = cmdInput.trim();
        }

        const color = 
        {
            name: inputName,
            rgb: this.currentColor,
            hsl: this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b),
            cmy: this.rgbToCmy(this.currentColor.r, this.currentColor.g, this.currentColor.b),
            cmyk: this.rgbToCmyk(this.currentColor.r, this.currentColor.g, this.currentColor.b),
            hex: this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b)
        };

        setCmdMessage(`Color "${inputName}" (${color.hex}) saved successfully.`, 'SAVE');
        this.savedColors.push(color);
        this.savedColors.reverse(); 
        this.saveSavedColors();
        this.renderSavedColors();
        document.getElementById('colorName').value = '';
    }

    loadColor(index) 
    {
        let color;
        if(isNaN(index))
        {
            color = this.savedColors.find(c => c.name.toLowerCase() === index);
            if(!color)
            {
                setCmdMessage('Invalid color name.', 'ERROR');
                return;
            }
            index = this.savedColors.indexOf(color);
        }
        else 
        {
            if(index < 0 || index >= this.savedColors.length)
            {
                setCmdMessage('Invalid color index.', 'ERROR');
                return;
            }
            color = this.savedColors[index];
        }
        setCmdMessage(`Loaded color "${color.name}" (${color.hex}).`, 'LOAD');
        this.setColor(color.rgb.r, color.rgb.g, color.rgb.b);
        const hsv = this.rgbToHsv(color.rgb.r, color.rgb.g, color.rgb.b);
        this.hue = hsv.h;
        this.saturation = hsv.s;
        this.value = hsv.v;
        this.updatePickerBackground();
        this.updateCursors();
    }

    deleteColor(index) 
    {
        const color = this.savedColors[index];
        setCmdMessage(`Deleted color "${color.name}" (${color.hex}).`, 'DELETE');
        this.savedColors.splice(index, 1);
        this.saveSavedColors();
        this.renderSavedColors();
    }

    deleteAllColors()
    {
        setCmdMessage('All saved colors have been deleted.', 'CLEAR LIST');
        this.savedColors = [];
        this.saveSavedColors();
        this.renderSavedColors();
        document.getElementById('colorName').value = '';
    }

    generateRandomColor()
    {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        this.setColor(r, g, b);
        const hsv = this.rgbToHsv(r, g, b);
        this.hue = hsv.h;
        this.saturation = hsv.s;
        this.value = hsv.v;
        this.updatePickerBackground();
        this.updateCursors();
        setCmdMessage(`Generated random color (${this.rgbToHex(r, g, b)}).`, 'RAND');
    }

    renderSavedColors() 
    {
        const container = document.getElementById('savedColorsList');
        if (!container) return;
        
        if (this.savedColors.length === 0) 
        {
            container.innerHTML = '<p class="empty-message">No saved colors yet</p>';
            return;
        }

        container.innerHTML = this.savedColors.map((color, index) => `
            <div class="saved-color-item">
                <div class="saved-color-info">
                    <div class="saved-color-preview" style="background-color: ${color.hex}"></div>
                    <div class="saved-color-details-grid">
                        <div class="saved-color-details">
                            <strong>${color.name}</strong><br>
                            Palette: ${color.palette || 'None'}<br>
                            HEX: ${color.hex}
                        </div>
                        <div class="saved-color-details" style="margin-left: -20px;">
                            RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}<br>
                            HSL: ${color.hsl ? `${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%` : '-'}<br>
                        </div>
                        <div class="saved-color-details" style="margin-left: -20px;">
                            CMY: ${color.cmy ? `${color.cmy.c}%, ${color.cmy.m}%, ${color.cmy.y}%` : '-'}<br>
                            CMYK: ${color.cmyk ? `${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%` : '-'}<br>
                        </div>
                    </div>
                </div>
                <div class="saved-color-actions">
                    <button class="iconButton" onclick="colorConverter.loadColor(${index})">
                            <span class="buttonIcon"></span>
                            <span class="buttonText">Link</span>
                    </button>
                    <button class="iconButton" onclick="colorConverter.loadColor(${index})">
                            <span class="buttonIcon"></span>
                            <span class="buttonText">Load</span>
                    </button>
                    <button class="iconButton" onclick="colorConverter.deleteColor(${index})">
                            <span class="buttonIcon"></span>
                            <span class="buttonText">Delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    saveSavedColors() 
    {
        localStorage.setItem('savedColors', JSON.stringify(this.savedColors));
    }

    loadSavedColors() 
    {
        const saved = localStorage.getItem('savedColors');
        return saved ? JSON.parse(saved) : [];
    }
}

let colorConverter;
document.addEventListener('DOMContentLoaded', () => { colorConverter = new EnhancedColorConverter(); });

function saveColor() { colorConverter.saveColor(); }