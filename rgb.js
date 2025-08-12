/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// RGB / CMY / HEX - Converts RGB to CMY and vice versa

class ColorConverter 
{
    constructor() 
    {
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.savedColors = this.loadSavedColors();
        this.isDragging = false;
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
    rgbToCmy(r, g, b) 
    {
        const c = Math.round(((255 - r) / 255) * 100);
        const m = Math.round(((255 - g) / 255) * 100);
        const y = Math.round(((255 - b) / 255) * 100);
        return { c, m, y };
    }

    cmyToRgb(c, m, y) 
    {
        const r = Math.round(255 * (1 - c / 100));
        const g = Math.round(255 * (1 - m / 100));
        const b = Math.round(255 * (1 - y / 100));
        return { r, g, b };
    }

    rgbToHex(r, g, b) 
    {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) 
    {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
        {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Color picker setup
    setupColorPicker() 
    {
        const picker = document.getElementById('colorPicker');
        const cursor = document.getElementById('colorCursor');
        
        picker.addEventListener('mousedown', (e) => {
            this.handleColorPicker(e);
            document.addEventListener('mousemove', this.handleColorPicker.bind(this));
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', this.handleColorPicker.bind(this));
            });
        });

        picker.addEventListener('click', this.handleColorPicker.bind(this));
    }

    handleColorPicker(e) 
    {
        const picker = document.getElementById('colorPicker');
        const rect = picker.getBoundingClientRect();
        
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        
        const hue = (x / rect.width) * 360;
        const saturation = (y / rect.height) * 100;
        const lightness = 50;
        
        const rgb = this.hslToRgb(hue, saturation, lightness);
        this.setColor(rgb.r, rgb.g, rgb.b);
    }

    hslToRgb(h, s, l) 
    {
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) { r = c; g = x; b = 0; } 
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0;}
        else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // Input listeners
    setupInputListeners() 
    {
        // RGB inputs
        ['rValue', 'gValue', 'bValue'].forEach(id => 
        {
            document.getElementById(id).addEventListener('input', (e) => 
            {
                const r = parseInt(document.getElementById('rValue').value) || 0;
                const g = parseInt(document.getElementById('gValue').value) || 0;
                const b = parseInt(document.getElementById('bValue').value) || 0;
                this.setColor(r, g, b);
            });
        });

        // CMY inputs
        ['cValue', 'mValue', 'yValue'].forEach(id => 
        {
            document.getElementById(id).addEventListener('input', (e) => 
            {
                const c = parseInt(document.getElementById('cValue').value) || 0;
                const m = parseInt(document.getElementById('mValue').value) || 0;
                const y = parseInt(document.getElementById('yValue').value) || 0;
                const rgb = this.cmyToRgb(c, m, y);
                this.setColor(rgb.r, rgb.g, rgb.b);
            });
        });

        // HEX input
        document.getElementById('hexValue').addEventListener('input', (e) => 
        {
            const hex = e.target.value;
            if (hex.match(/^#[0-9A-Fa-f]{6}$/)) 
            {
                const rgb = this.hexToRgb(hex);
                if (rgb) this.setColor(rgb.r, rgb.g, rgb.b);
            }
        });
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
        const cmy = this.rgbToCmy(r, g, b);
        const hex = this.rgbToHex(r, g, b);

        // Update inputs
        document.getElementById('rValue').value = r;
        document.getElementById('gValue').value = g;
        document.getElementById('bValue').value = b;
        
        document.getElementById('cValue').value = cmy.c;
        document.getElementById('mValue').value = cmy.m;
        document.getElementById('yValue').value = cmy.y;
        
        document.getElementById('hexValue').value = hex;

        // Update color display
        document.getElementById('colorDisplay').style.backgroundColor = hex;
    }

    // Saved colors functionality
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
            cmy: this.rgbToCmy(this.currentColor.r, this.currentColor.g, this.currentColor.b),
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
                        CMY: ${color.cmy.c}%, ${color.cmy.m}%, ${color.cmy.y}%<br>
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

    // Local storage
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

// Initialize the color converter when the page loads
let colorConverter;
document.addEventListener('DOMContentLoaded', () => { colorConverter = new ColorConverter(); });

// Global functions for HTML onclick events
function saveColor() { colorConverter.saveColor(); }
