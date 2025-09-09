// pages/beam.js

class BeamCalculator {
    constructor() {
        this.svg = document.getElementById('beam-svg');
        this.beamPath = document.getElementById('beam-path');
        this.fixture = { x: 200, y: 200 };

        // Set default values as requested
        this.beam = {
            angle: 45,
            diameter: 1,
            distance: 0 // Will be calculated
        };
        this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180));

        this.scale = 1;
        this.dragging = null;

        this.init();
    }

    init() {
        this.setupUI();
        this.bindEvents();
        this.updateCalculations();
        this.updateVisualization();
        this.updateInputFields(); // Make sure inputs are populated on load
    }

    setupUI() {
        // Add draggable handles to the SVG
        this.handles = {
            distance: this.createHandle(200, 100, 'distance-handle'),
            diameterLeft: this.createHandle(150, 50, 'diameter-handle-left'),
            diameterRight: this.createHandle(250, 50, 'diameter-handle-right')
        };
    }

    createHandle(cx, cy, id) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('id', id);
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', 8);
        circle.setAttribute('class', 'drag-handle');
        this.svg.appendChild(circle);
        return circle;
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Input fields
        document.querySelectorAll('.calculator-tabs input[type="number"]').forEach(input => {
            input.addEventListener('input', () => this.updateFromInputs());
        });
        
        // Calculation buttons for non-realtime update
        document.querySelector('[onclick="beamCalculator.calculateAngle()"]').addEventListener('click', () => this.updateFromInputs());
        document.querySelector('[onclick="beamCalculator.calculateDistance()"]').addEventListener('click', () => this.updateFromInputs());
        document.querySelector('[onclick="beamCalculator.calculateDiameter()"]').addEventListener('click', () => this.updateFromInputs());


        // SVG dragging
        this.svg.addEventListener('mousedown', (e) => this.startDrag(e));
        this.svg.addEventListener('mousemove', (e) => this.drag(e));
        this.svg.addEventListener('mouseup', () => this.endDrag());
        this.svg.addEventListener('mouseleave', () => this.endDrag());
        
        // Visualization controls
        document.getElementById('show-labels').addEventListener('change', () => this.updateVisualization());
        document.getElementById('scale-slider').addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            this.updateVisualization();
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        this.updateInputFields();
    }

    updateFromInputs() {
        const activeTab = document.querySelector('.tab-content.active').id;
        if (activeTab === 'angle-tab') {
            this.beam.distance = parseFloat(document.getElementById('distance-angle').value) || this.beam.distance;
            this.beam.diameter = parseFloat(document.getElementById('diameter-angle').value) || this.beam.diameter;
        } else if (activeTab === 'distance-tab') {
            this.beam.angle = parseFloat(document.getElementById('angle-distance').value) || this.beam.angle;
            this.beam.diameter = parseFloat(document.getElementById('diameter-distance').value) || this.beam.diameter;
        } else if (activeTab === 'diameter-tab') {
            this.beam.angle = parseFloat(document.getElementById('angle-diameter').value) || this.beam.angle;
            this.beam.distance = parseFloat(document.getElementById('distance-diameter').value) || this.beam.distance;
        }
        this.updateCalculations();
        this.updateVisualization();
    }

    updateCalculations() {
        const activeTab = document.querySelector('.tab-content.active').id;

        try {
            if (activeTab === 'angle-tab') {
                if(this.beam.distance > 0 && this.beam.diameter > 0) {
                    this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
                    this.showResult('angle-result', `Beam Angle: ${this.beam.angle.toFixed(2)}°`);
                }
            } else if (activeTab === 'distance-tab') {
                if(this.beam.angle > 0 && this.beam.angle < 180 && this.beam.diameter > 0) {
                    this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180));
                    this.showResult('distance-result', `Distance: ${this.beam.distance.toFixed(2)} m`);
                }
            } else if (activeTab === 'diameter-tab') {
                if(this.beam.angle > 0 && this.beam.angle < 180 && this.beam.distance > 0) {
                    this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
                    this.showResult('diameter-result', `Diameter: ${this.beam.diameter.toFixed(2)} m`);
                }
            }
        } catch (e) {
            console.error("Calculation error:", e);
        }
        
        this.updateInputFields();
    }

    updateInputFields() {
        // Angle Tab
        document.getElementById('distance-angle').value = this.beam.distance.toFixed(2);
        document.getElementById('diameter-angle').value = this.beam.diameter.toFixed(2);

        // Distance Tab
        document.getElementById('angle-distance').value = this.beam.angle.toFixed(2);
        document.getElementById('diameter-distance').value = this.beam.diameter.toFixed(2);

        // Diameter Tab
        document.getElementById('angle-diameter').value = this.beam.angle.toFixed(2);
        document.getElementById('distance-diameter').value = this.beam.distance.toFixed(2);
    }

    updateVisualization() {
        const distanceY = this.fixture.y - (this.beam.distance * 20 * this.scale);
        const halfDiameterX = (this.beam.diameter / 2) * 20 * this.scale;

        const topY = distanceY > this.fixture.y ? this.fixture.y : distanceY;
        const leftX = this.fixture.x - halfDiameterX;
        const rightX = this.fixture.x + halfDiameterX;

        // Update beam path
        this.beamPath.setAttribute('d', `M ${this.fixture.x} ${this.fixture.y} L ${leftX} ${topY} L ${rightX} ${topY} Z`);

        // Update handle positions
        this.handles.distance.setAttribute('cx', this.fixture.x);
        this.handles.distance.setAttribute('cy', topY);
        this.handles.diameterLeft.setAttribute('cx', leftX);
        this.handles.diameterLeft.setAttribute('cy', topY);
        this.handles.diameterRight.setAttribute('cx', rightX);
        this.handles.diameterRight.setAttribute('cy', topY);
        
        this.addVisualizationLabels();
    }
    
    addVisualizationLabels() {
        // Remove existing labels
        this.svg.querySelectorAll('.label').forEach(label => label.remove());

        if (!document.getElementById('show-labels').checked) return;

        const distanceY = this.fixture.y - (this.beam.distance * 20 * this.scale);
        
        // Distance Label
        this.createLabel(this.fixture.x + 10, this.fixture.y - (this.fixture.y - distanceY) / 2, `${this.beam.distance.toFixed(2)} m`);
        
        // Diameter Label
        this.createLabel(this.fixture.x, distanceY - 10, `${this.beam.diameter.toFixed(2)} m`);

        // Angle Label
        this.createLabel(this.fixture.x - 30, this.fixture.y - 20, `${this.beam.angle.toFixed(2)}°`);
    }

    createLabel(x, y, text) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('class', 'label');
        textEl.textContent = text;
        this.svg.appendChild(textEl);
    }

    startDrag(e) {
        if (e.target.classList.contains('drag-handle')) {
            this.dragging = e.target.id;
        }
    }

    drag(e) {
        if (!this.dragging) return;

        const pt = this.getSVGPoint(e);

        if (this.dragging === 'distance-handle') {
            this.beam.distance = (this.fixture.y - pt.y) / (20 * this.scale);
            if (this.beam.distance < 0) this.beam.distance = 0;
        } else { // diameter handles
            const halfDiameter = Math.abs(pt.x - this.fixture.x) / (20 * this.scale);
            this.beam.diameter = halfDiameter * 2;
            this.beam.distance = (this.fixture.y - pt.y) / (20 * this.scale);
             if (this.beam.distance < 0) this.beam.distance = 0;
        }

        this.updateCalculations();
        this.updateVisualization();
    }

    endDrag() {
        this.dragging = null;
    }

    getSVGPoint(e) {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    }
    
    showResult(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<span class="success">${message}</span>`;
            element.className = 'result success';
        }
    }
}

let beamCalculator;
document.addEventListener('DOMContentLoaded', () => {
    beamCalculator = new BeamCalculator();
});