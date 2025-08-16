// Beam Calculator Tool
// Implements beam angle, distance, and diameter calculations

class BeamCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Real-time visualization updates
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', () => this.updateVisualization());
        });

        document.getElementById('show-labels').addEventListener('change', () => this.updateVisualization());
        document.getElementById('scale-slider').addEventListener('input', () => this.updateVisualization());
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    calculateAngle() {
        const distance = parseFloat(document.getElementById('distance-angle').value);
        const diameter = parseFloat(document.getElementById('diameter-angle').value);

        if (!distance || !diameter || distance <= 0 || diameter <= 0) {
            this.showError('angle-result', 'Please enter valid positive values');
            return;
        }

        const angle = 2 * Math.atan((diameter / 2) / distance) * (180 / Math.PI);
        this.showResult('angle-result', `Beam Angle: ${angle.toFixed(2)}°`);
        this.updateVisualization();
    }

    calculateDistance() {
        const angle = parseFloat(document.getElementById('angle-distance').value);
        const diameter = parseFloat(document.getElementById('diameter-distance').value);

        if (!angle || !diameter || angle <= 0 || angle >= 180 || diameter <= 0) {
            this.showError('distance-result', 'Please enter valid values (angle: 0-180°, diameter > 0)');
            return;
        }

        const distance = (diameter / 2) / Math.tan((angle / 2) * (Math.PI / 180));
        this.showResult('distance-result', `Distance: ${distance.toFixed(2)} m`);
        this.updateVisualization();
    }

    calculateDiameter() {
        const angle = parseFloat(document.getElementById('angle-diameter').value);
        const distance = parseFloat(document.getElementById('distance-diameter').value);

        if (!angle || !distance || angle <= 0 || angle >= 180 || distance <= 0) {
            this.showError('diameter-result', 'Please enter valid values (angle: 0-180°, distance > 0)');
            return;
        }

        const diameter = 2 * Math.tan((angle / 2) * (Math.PI / 180)) * distance;
        this.showResult('diameter-result', `Diameter: ${diameter.toFixed(2)} m`);
        this.updateVisualization();
    }

    showResult(elementId, message) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<span class="success">${message}</span>`;
        element.className = 'result success';
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<span class="error">${message}</span>`;
        element.className = 'result error';
    }

    updateVisualization() {
        const svg = document.getElementById('beam-svg');
        const beamPath = document.getElementById('beam-path');
        const scale = parseFloat(document.getElementById('scale-slider').value);
        const showLabels = document.getElementById('show-labels').checked;

        // Get current active tab values
        let angle = 0, distance = 0, diameter = 0;
        
        const activeTab = document.querySelector('.tab-content.active').id;
        
        if (activeTab === 'angle-tab') {
            distance = parseFloat(document.getElementById('distance-angle').value) || 0;
            diameter = parseFloat(document.getElementById('diameter-angle').value) || 0;
            angle = distance > 0 ? 2 * Math.atan((diameter / 2) / distance) * (180 / Math.PI) : 0;
        } else if (activeTab === 'distance-tab') {
            angle = parseFloat(document.getElementById('angle-distance').value) || 0;
            diameter = parseFloat(document.getElementById('diameter-distance').value) || 0;
            distance = angle > 0 ? (diameter / 2) / Math.tan((angle / 2) * (Math.PI / 180)) : 0;
        } else if (activeTab === 'diameter-tab') {
            angle = parseFloat(document.getElementById('angle-diameter').value) || 0;
            distance = parseFloat(document.getElementById('distance-diameter').value) || 0;
            diameter = angle > 0 ? 2 * Math.tan((angle / 2) * (Math.PI / 180)) * distance : 0;
        }

        if (angle > 0 && distance > 0) {
            const beamWidth = Math.tan((angle / 2) * (Math.PI / 180)) * (100 * scale);
            const path = `M 200 ${200 - (distance * 50 * scale)} L ${200 - beamWidth} ${200 - (distance * 100 * scale)} L ${200 + beamWidth} ${200 - (distance * 100 * scale)} Z`;
            beamPath.setAttribute('d', path);

            if (showLabels) {
                // Add labels for visualization
                this.addVisualizationLabels(angle, distance, diameter);
            }
        }
    }

    addVisualizationLabels(angle, distance, diameter) {
        // This would add text labels to the SVG visualization
        // Implementation depends on specific requirements
    }
}

// Initialize the beam calculator when the page loads
let beamCalculator;
document.addEventListener('DOMContentLoaded', () => {
    beamCalculator = new BeamCalculator();
});
