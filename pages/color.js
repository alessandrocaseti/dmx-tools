/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///
// RGB / CMY / HEX - Enhanced Color Converter with improved UX

class EnhancedColorConverter 
{
    constructor() 
    {
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.savedColors = this.loadSavedColors();
        this.isDragging = false;
        this.dragTarget = null;
        // HSV state for picker
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

    // Color conversion utilities
    // RGB -> CMYK
    rgbToCmyk(r, g, b) {
        r = r / 255; g = g / 255; b = b / 255;
        const k = 1 - Math.max(r, g, b);
        let c = 0, m = 0, y = 0;
        if (k < 1) {
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
    cmykToRgb(c, m, y, k) {
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
    hsvToRgb(h, s, v) {
        s /= 100;
        v /= 100;
        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;
        let r = 0, g = 0, b = 0;
        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // Enhanced color picker setup
    setupColorPicker() 
    {
        // HSV state already set in constructor

        const picker = document.getElementById('colorPicker');
        const cursor = document.getElementById('colorCursor');
        const huePicker = document.getElementById('huePicker');
        const hueCursor = document.getElementById('hueCursor');

        if (!picker || !cursor || !huePicker || !hueCursor) {
            console.error('Color picker elements not found');
            return;
        }

        picker.style.cursor = 'crosshair';
        huePicker.style.cursor = 'ns-resize';

        picker.addEventListener('mouseenter', () => {
            picker.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        picker.addEventListener('mouseleave', () => {
            picker.style.boxShadow = 'none';
        });

        // Universal click handling (both left and right clicks)
        picker.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.dragTarget = 'picker';
            this.updateSaturationValue(e);
            
            const moveHandler = (ev) => {
                if (this.isDragging && this.dragTarget === 'picker') {
                    this.updateSaturationValue(ev);
                }
            };
            
            const upHandler = () => {
                this.isDragging = false;
                this.dragTarget = null;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        // Enhanced hue picker with better feedback
        huePicker.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.dragTarget = 'hue';
            this.updateHue(e);
            
            const moveHandler = (ev) => {
                if (this.isDragging && this.dragTarget === 'hue') {
                    this.updateHue(ev);
                }
            };
            
            const upHandler = () => {
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

        // Saturation and value cursor position
        const x = Math.max(0, Math.min((this.saturation / 100) * pickerRect.width, pickerRect.width));
        const y = Math.max(0, Math.min(((100 - this.value) / 100) * pickerRect.height, pickerRect.height));
        
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.style.display = 'block';

        // Hue cursor position
        const hueY = Math.max(0, Math.min(((360 - this.hue) / 360) * hueRect.height, hueRect.height));
        hueCursor.style.top = `${hueY}px`;
        hueCursor.style.display = 'block';
    }

    // Enhanced input listeners with better validation
    setupInputListeners() 
    {

        // RGB inputs with validation
        ['rValue', 'gValue', 'bValue'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = parseInt(e.target.value) || 0;
                    value = Math.max(0, Math.min(value, 255));
                    e.target.value = value;
                    const r = this.validateInput('rValue', 0, 255);
                    const g = this.validateInput('gValue', 0, 255);
                    const b = this.validateInput('bValue', 0, 255);
                    this.setColor(r, g, b);
                });
            }
        });

        // CMYK inputs with validation
        ['cValue', 'mValue', 'yValue', 'kValue'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = parseInt(e.target.value) || 0;
                    value = Math.max(0, Math.min(value, 100));
                    e.target.value = value;
                    const c = this.validateInput('cValue', 0, 100);
                    const m = this.validateInput('mValue', 0, 100);
                    const y = this.validateInput('yValue', 0, 100);
                    const k = this.validateInput('kValue', 0, 100);
                    const rgb = this.cmykToRgb(c, m, y, k);
                    this.setColor(rgb.r, rgb.g, rgb.b);
                });
            }
        });

        // HEX input with validation
        const hexInput = document.getElementById('hexValue');
        if (hexInput) {
            hexInput.addEventListener('input', (e) => {
                let hex = e.target.value;
                if (hex.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    if (hex.length === 7) {
                        const rgb = this.hexToRgb(hex);
                        if (rgb) this.setColor(rgb.r, rgb.g, rgb.b);
                    }
                } else {
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
        this.updateAllValues();
    }

    updateAllValues() 
    {
        const { r, g, b } = this.currentColor;
        const cmyk = this.rgbToCmyk(r, g, b);
        const hex = this.rgbToHex(r, g, b);

        // Update inputs with validated values
        const rInput = document.getElementById('rValue');
        const gInput = document.getElementById('gValue');
        const bInput = document.getElementById('bValue');
        const cInput = document.getElementById('cValue');
        const mInput = document.getElementById('mValue');
        const yInput = document.getElementById('yValue');
        const kInput = document.getElementById('kValue');
        const hexInput = document.getElementById('hexValue');

        if (rInput) rInput.value = r;
        if (gInput) gInput.value = g;
        if (bInput) bInput.value = b;
        if (cInput) cInput.value = cmyk.c;
        if (mInput) mInput.value = cmyk.m;
        if (yInput) yInput.value = cmyk.y;
        if (kInput) kInput.value = cmyk.k;
        if (hexInput) hexInput.value = hex;

        // Update color display
        const colorDisplay = document.getElementById('colorDisplay');
        if (colorDisplay) {
            colorDisplay.style.backgroundColor = hex;
        }
    }

    // Saved colors functionality (unchanged)
    saveColor() 
    {
        const inputName = document.getElementById('colorName').value.trim();
        if (!inputName) 
        {
            alert('Please enter a color name');
            return;
        }

        const color = 
        {
            name: inputName,
            rgb: this.currentColor,
            cmyk: this.rgbToCmyk(this.currentColor.r, this.currentColor.g, this.currentColor.b),
            hex: this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b)
        };

        this.savedColors.push(color);
        this.saveSavedColors();
        this.renderSavedColors();
        document.getElementById('colorName').value = '';
    }

    loadColor(index) 
    {
        const color = this.savedColors[index];
        this.setColor(color.rgb.r, color.rgb.g, color.rgb.b);
    }

    deleteColor(index) 
    {
        this.savedColors.splice(index, 1);
        this.saveSavedColors();
        this.renderSavedColors();
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
                    <div class="saved-color-details">
                        <strong>${color.name}</strong><br>
                        RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}<br>
                        CMYK: ${color.cmyk ? `${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%` : '-'}<br>
                        HEX: ${color.hex}
                    </div>
                </div>
                <div class="saved-color-actions">
                    <button class="load-btn" onclick="colorConverter.loadColor(${index})">Load</button>
                    <button class="delete-btn" onclick="colorConverter.deleteColor(${index})">Delete</button>
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

// Initialize the enhanced color converter
let colorConverter;
document.addEventListener('DOMContentLoaded', () => { 
    colorConverter = new EnhancedColorConverter(); 
});

// Global functions for HTML onclick events
function saveColor() { colorConverter.saveColor(); }