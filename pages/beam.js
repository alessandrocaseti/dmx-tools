// pages/beam.js

class BeamCalculator {
    constructor() {
        this.svg = document.getElementById('beam-svg');
        this.scaleSlider = document.getElementById('scale-slider');
        this.angleInput = document.getElementById('beam-angle');
        this.distanceInput = document.getElementById('beam-distance');
        this.diameterInput = document.getElementById('beam-diameter');

        this.svgWidth = 600;
        this.svgHeight = 300;

        this.fixturePos = { x: 0, y: 0 };

        this.beam = {
            angle: 10,
            distance: 10,
            diameter: 1.76
        };

        this.userScale = 1;
        this.dragging = null;

        this.limits = {
            angle: { min: 0.1, max: 179 },
            distance: { min: 0.01, max: 1000 },
            diameter: { min: 0.01, max: 1000 },
            userScale: { min: 0.8, max: 2.5 }
        };

        this.init();
    }

    init() {
        this.setupSVG();
        this.bindEvents();
        this.updateInputFields();
        this.updateVisualization();
        
        requestAnimationFrame(() => {
            this.adjustSVGHeight();
        });
    }

    adjustSVGHeight() {
        const calculatorPanel = document.querySelector('.beam-calculator-panel');
        if (calculatorPanel) {
            let newHeight = calculatorPanel.offsetHeight;
            if (newHeight < 100) { 
                newHeight = 350;
            }
            this.svg.setAttribute('height', newHeight);
            this.svgHeight = newHeight;
            this.updateVisualization();
        }
    }

    setupSVG() {
        this.beamPath = this.createSVGElement('path', { id: 'beam-path', fill: '#ffeb3b33', stroke: 'var(--colore-giallo)' });
        this.fixtureCircle = this.createSVGElement('circle', { id: 'fixture-circle', cx: this.fixturePos.x, cy: this.fixturePos.y, r: 0.2, fill: 'var(--colore-giallo)' });
        this.fixtureText = this.createSVGElement('text', { x: this.fixturePos.x, y: this.fixturePos.y - 0.6, 'text-anchor': 'middle', fill: 'var(--colore-testo-chiaro)', 'font-size': '0.6px' });
        this.fixtureText.textContent = 'Fixture';
 
        this.handles = {
            distance: this.createHandle(0, 0, 'distance-handle', 0.25),
            diameter: this.createHandle(0, 0, 'diameter-handle', 0.25)
        };
        
        this.labels = {
            distance: this.createLabel(0, 0, ''),
            diameter: this.createLabel(0, 0, ''),
            angle: this.createLabel(0, 0, '')
        };
    }
    
    createSVGElement(tag, attributes) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        this.svg.appendChild(el);
        return el;
    }

    createHandle(cx, cy, id, radius = 0.3) {
        return this.createSVGElement('circle', { id: id, class: 'drag-handle', cx: cx, cy: cy, r: radius });
    }
    
    createLabel(x, y, text) {
        const label = this.createSVGElement('text', { class: 'label', x: x, y: y });
        label.textContent = text;
        return label;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.adjustSVGHeight());

        this.angleInput.addEventListener('input', () => this.updateFromInput('angle'));
        this.distanceInput.addEventListener('input', () => this.updateFromInput('distance'));
        this.diameterInput.addEventListener('input', () => this.updateFromInput('diameter'));

        this.svg.addEventListener('mousedown', (e) => this.startDrag(e));
        this.svg.addEventListener('mousemove', (e) => this.drag(e));
        this.svg.addEventListener('mouseup', () => this.endDrag());
        this.svg.addEventListener('mouseleave', () => this.endDrag());
        
        document.getElementById('show-labels').addEventListener('change', () => this.updateVisualization());
        this.scaleSlider.addEventListener('input', (e) => {
            this.userScale = parseFloat(e.target.value);
            this.updateVisualization();
        });
    }

    enforceLimits(beam) {
        beam.angle = Math.max(this.limits.angle.min, Math.min(beam.angle, this.limits.angle.max));
        beam.distance = Math.max(this.limits.distance.min, Math.min(beam.distance, this.limits.distance.max));
        beam.diameter = Math.max(this.limits.diameter.min, Math.min(beam.diameter, this.limits.diameter.max));
        return beam;
    }

    updateFromInput(source) {
        this.beam.angle = parseFloat(this.angleInput.value) || this.beam.angle;
        this.beam.distance = parseFloat(this.distanceInput.value) || this.beam.distance;
        this.beam.diameter = parseFloat(this.diameterInput.value) || this.beam.diameter;

        try {
            if (source === 'angle') {
                // Keep distance constant, calculate diameter
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } else if (source === 'distance') {
                // Keep angle constant, calculate diameter
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } else if (source === 'diameter') {
                // Keep distance constant, calculate angle
                if (this.beam.distance > 0) {
                    this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
                }
            }
        } catch (e) {
            console.error("Calculation error:", e);
        }
        
        this.beam = this.enforceLimits(this.beam);
        this.updateInputFields();
        this.updateVisualization();
    }

    updateInputFields() {
        this.angleInput.value = this.beam.angle.toFixed(2);
        this.distanceInput.value = this.beam.distance.toFixed(2);
        this.diameterInput.value = this.beam.diameter.toFixed(2);
    }

    updateVisualization() {
        const { distance, diameter, angle } = this.beam;

        const halfDiameter = diameter / 2;
        this.beamPath.setAttribute('d', `M ${this.fixturePos.x} ${this.fixturePos.y} L ${-halfDiameter} ${distance} L ${halfDiameter} ${distance} Z`);
        
        this.handles.distance.setAttribute('cx', this.fixturePos.x);
        this.handles.distance.setAttribute('cy', distance);
        this.handles.diameter.setAttribute('cx', halfDiameter);
        this.handles.diameter.setAttribute('cy', distance);

        const padding = 1.5;
        let worldWidth = Math.max(20, diameter + padding);
        let worldHeight = Math.max(10, distance + padding);

        if (this.svgHeight === 0) return;
        const aspectRatio = this.svgWidth / this.svgHeight;

        if (worldWidth / worldHeight > aspectRatio) {
            worldHeight = worldWidth / aspectRatio;
        } else {
            worldWidth = worldHeight * aspectRatio;
        }
        
        worldWidth /= this.userScale;
        worldHeight /= this.userScale;

        const viewBox = [
            -worldWidth / 2,
            -padding,
            worldWidth,
            worldHeight
        ].join(' ');
        this.svg.setAttribute('viewBox', viewBox);

        this.updateLabels(distance, diameter, angle);
    }
    
    updateLabels(distance, diameter, angle) {
        if (document.getElementById('show-labels').checked) {
            this.labels.distance.textContent = `${distance.toFixed(2)} m`;
            this.labels.distance.setAttribute('x', this.fixturePos.x + 0.5);
            this.labels.distance.setAttribute('y', distance / 2);
            
            this.labels.diameter.textContent = `${diameter.toFixed(2)} m`;
            this.labels.diameter.setAttribute('x', this.fixturePos.x);
            this.labels.diameter.setAttribute('y', distance + 1.5);

            this.labels.angle.textContent = `${angle.toFixed(2)}°`;
            this.labels.angle.setAttribute('x', this.fixturePos.x - 1);
            this.labels.angle.setAttribute('y', this.fixturePos.y + 1);
        } else {
            this.labels.distance.textContent = '';
            this.labels.diameter.textContent = '';
            this.labels.angle.textContent = '';
        }
    }

    startDrag(e) {
        if (e.target.classList.contains('drag-handle')) {
            this.dragging = e.target.id;
            this.scaleSlider.disabled = true;
        }
    }

    drag(e) {
        if (!this.dragging) return;

        const pt = this.getSVGPoint(e);

        if (this.dragging === 'distance-handle') {
            this.beam.distance = pt.y > 0 ? pt.y : 0;
            // Keep angle constant, recalculate diameter
            this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
        } else if (this.dragging === 'diameter-handle') {
            this.beam.diameter = Math.abs(pt.x) * 2;
            this.beam.distance = pt.y > 0 ? pt.y : 0;
            // Recalculate angle
            if (this.beam.distance > 0) {
                 this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            }
        }

        this.beam = this.enforceLimits(this.beam);
        this.updateInputFields();
        this.updateVisualization();
    }

    endDrag() {
        if (this.dragging) {
            this.dragging = null;
            this.scaleSlider.disabled = false;
        }
    }

    getSVGPoint(e) {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = this.svg.getScreenCTM();
        if (ctm) {
            return pt.matrixTransform(ctm.inverse());
        }
        return pt;
    }
}

let beamCalculator;
document.addEventListener('DOMContentLoaded', () => {
    beamCalculator = new BeamCalculator();
});