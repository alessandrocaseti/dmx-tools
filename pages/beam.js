class BeamCalculator 
{
    constructor() 
    {
        this.svg = document.getElementById('beam-svg');
        this.scaleSlider = document.getElementById('scale-slider');
        this.angleInput = document.getElementById('beam-angle');
        this.distanceInput = document.getElementById('beam-distance');
        this.diameterInput = document.getElementById('beam-diameter');
        this.lumenInput = document.getElementById('beam-lumen');
        this.luxOutput = document.getElementById('beam-lux-output');

        this.lockAngleBtn = document.getElementById('lock-angle-btn');
        this.lockDistanceBtn = document.getElementById('lock-distance-btn');
        this.lockDiameterBtn = document.getElementById('lock-diameter-btn');

        this.svgWidth = 600;
        this.svgHeight = 300;

        this.fixturePos = { x: 0, y: 0 };

        this.beam = 
        {
            angle: 10,
            distance: 10,
            diameter: 1.76,
            lumen: 5000,
            lux: 0
        };

        this.userScale = 1;
        this.dragging = null;
        this.lockedValue = null; // 'angle', 'distance', 'diameter', or null
        this.dragStart = { y: 0, angle: 0 };

        this.limits = 
        {
            angle: { min: 1, max: 179 },
            distance: { min: 0.01, max: 1000 },
            diameter: { min: 0.01, max: 1000 },
            lumen: { min: 1, max: 1000000 },
            userScale: { min: 0.8, max: 2.0 }
        };

        this.init();
    }

    init() 
    {
        this.setupSVG();
        this.bindEvents();
        this.updateFromInput('angle');
        this.updateLockUI();
        requestAnimationFrame(() => { this.adjustSVGHeight(); });
    }

    adjustSVGHeight() 
    {
        const calculatorPanel = document.querySelector('.beam-calculator-panel');
        if (calculatorPanel) 
        {
            let newHeight = calculatorPanel.offsetHeight;
            if (newHeight < 100) { newHeight = 350; }
            this.svg.setAttribute('height', newHeight);
            this.svgHeight = newHeight;
            this.updateVisualization();
        }
    }

    setupSVG() 
    {
        this.beamPath = this.createSVGElement('path', { id: 'beam-path', fill: '#ffeb3b33', stroke: 'var(--colore-giallo)' });
        
        this.fixtureCircle = this.createSVGElement('circle', { id: 'fixture-circle', cx: this.fixturePos.x, cy: this.fixturePos.y, r: 0.2, fill: 'var(--colore-giallo)' });
        this.fixtureText = this.createSVGElement('text', { x: this.fixturePos.x, y: this.fixturePos.y - 0.6, 'text-anchor': 'middle', fill: 'var(--colore-testo-chiaro)', 'font-size': '0.6px' });
        this.fixtureText.textContent = 'Fixture';
 
        this.handles = 
        {
            angle: this.createHandle(this.fixturePos.x, this.fixturePos.y, 'angle-handle', 0.35),
            distance: this.createHandle(0, 0, 'distance-handle', 0.25),
            diameter: this.createHandle(0, 0, 'diameter-handle', 0.25)
        };
        
        this.labels = 
        {
            distance: this.createLabel(0, 0, ''),
            diameter: this.createLabel(0, 0, ''),
            angle: this.createLabel(0, 0, '')
        };
    }
    
    createSVGElement(tag, attributes) 
    {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const key in attributes) { el.setAttribute(key, attributes[key]); }
        this.svg.appendChild(el);
        return el;
    }

    createHandle(cx, cy, id, radius = 0.3) 
    {
        return this.createSVGElement('circle', { id: id, class: 'drag-handle', cx: cx, cy: cy, r: radius });
    }
    
    createLabel(x, y, text) 
    {
        const label = this.createSVGElement('text', { class: 'label', x: x, y: y });
        label.textContent = text;
        return label;
    }

    bindEvents() 
    {
        window.addEventListener('resize', () => this.adjustSVGHeight());

        this.angleInput.addEventListener('input', () => this.updateFromInput('angle'));
        this.distanceInput.addEventListener('input', () => this.updateFromInput('distance'));
        this.diameterInput.addEventListener('input', () => this.updateFromInput('diameter'));
        this.lumenInput.addEventListener('input', () => this.updateFromInput('lumen'));

        this.lockAngleBtn.addEventListener('click', () => this.toggleLock('angle'));
        this.lockDistanceBtn.addEventListener('click', () => this.toggleLock('distance'));
        this.lockDiameterBtn.addEventListener('click', () => this.toggleLock('diameter'));

        this.svg.addEventListener('mousedown', (e) => this.startDrag(e));
        this.svg.addEventListener('mousemove', (e) => this.drag(e));
        this.svg.addEventListener('mouseup', () => this.endDrag());
        this.svg.addEventListener('mouseleave', () => this.endDrag());
        
        document.getElementById('show-labels').addEventListener('change', () => this.updateVisualization());
        this.scaleSlider.addEventListener('input', (e) => 
        {
            this.userScale = parseFloat(e.target.value);
            this.updateVisualization();
        });
    }

    toggleLock(value) 
    {
        this.lockedValue = this.lockedValue === value ? null : value;
        this.updateLockUI();
    }

    updateLockUI() 
    {
        const buttons = 
        {
            angle: this.lockAngleBtn,
            distance: this.lockDistanceBtn,
            diameter: this.lockDiameterBtn
        };

        const inputs = 
        {
            angle: this.angleInput,
            distance: this.distanceInput,
            diameter: this.diameterInput
        };

        for (const value in buttons) 
        {
            const isLocked = this.lockedValue === value;
            buttons[value].classList.toggle('locked', isLocked);
            buttons[value].querySelector('.buttonIcon').textContent = isLocked ? '' : ''; // lock and lock_open icons
            inputs[value].disabled = isLocked;
        }

        this.handles.angle.classList.toggle('disabled', this.lockedValue === 'angle');
        this.handles.distance.classList.toggle('disabled', this.lockedValue === 'distance');
        this.handles.diameter.classList.toggle('disabled', this.lockedValue === 'diameter');
    }

    calculateLux() 
    {
        // Use luminous flux Phi (lm) and beam solid angle to get on-axis illuminance:
        // Omega = 2π(1 - cos(theta/2)), theta in radians (full beam angle)
        // On-axis illuminance E = Phi / (Omega * r^2)
        const Phi = parseFloat(this.beam.lumen) || 0;
        const r = parseFloat(this.beam.distance) || 0;
        const thetaDeg = parseFloat(this.beam.angle) || 0;
        const thetaRad = thetaDeg * Math.PI / 180;
        const halfTheta = thetaRad / 2;

        // solid angle of a cone
        const Omega = 2 * Math.PI * (1 - Math.cos(halfTheta));

        if (Omega > 1e-8 && r > 0) 
        {
            // on-axis illuminance (lux)
            const I = Phi / Omega; // luminous intensity (cd)
            this.beam.lux = I / (r * r);
        }

        else
        {
            // fallback: approximate using illuminated area at distance (uniform flux)
            const radius = Math.tan(halfTheta) * r; // in meters
            const area = Math.PI * Math.pow(radius, 2);
            this.beam.lux = area > 0 ? Phi / area : 0;
        }
    }

    enforceLimits(beam) 
    {
        beam.angle = Math.max(this.limits.angle.min, Math.min(beam.angle, this.limits.angle.max));
        beam.distance = Math.max(this.limits.distance.min, Math.min(beam.distance, this.limits.distance.max));
        beam.diameter = Math.max(this.limits.diameter.min, Math.min(beam.diameter, this.limits.diameter.max));
        beam.lumen = Math.max(this.limits.lumen.min, Math.min(beam.lumen, this.limits.lumen.max));
        return beam;
    }

    updateFromInput(source) 
    {
        if (source !== this.lockedValue) 
        {
            if (!this.angleInput.disabled) this.beam.angle = parseFloat(this.angleInput.value) || this.beam.angle;
            if (!this.distanceInput.disabled) this.beam.distance = parseFloat(this.distanceInput.value) || this.beam.distance;
            if (!this.diameterInput.disabled) this.beam.diameter = parseFloat(this.diameterInput.value) || this.beam.diameter;
        }
        if (!this.lumenInput.disabled) this.beam.lumen = parseFloat(this.lumenInput.value) || this.beam.lumen;

        try 
        {
            if (this.lockedValue) 
            {
                switch (this.lockedValue) 
                {
                    case 'angle':
                        if (source === 'distance') { this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance; } 
                        else if (source === 'diameter') { this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180)); }
                        break;
                    case 'distance':
                        if (source === 'angle') { this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance; } 
                        else if (source === 'diameter') { this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI); }
                        break;
                    case 'diameter':
                        if (source === 'angle') { this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180)); } 
                        else if (source === 'distance') { this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI); }
                        break;
                }
            }

            else 
            {
                if (source === 'angle' || source === 'distance') { this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance; } 
                else if (source === 'diameter') 
                {
                    if (this.beam.distance > 0) { this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI); }
                }
            }
        } catch (e) { console.error("Calculation error:", e); }
        
        this.beam = this.enforceLimits(this.beam);
        this.calculateLux();
        this.updateInputFields();
        this.updateVisualization();
    }

    updateInputFields() 
    {
        if (document.activeElement !== this.angleInput) { this.angleInput.value = this.beam.angle.toFixed(2); }
        if (document.activeElement !== this.distanceInput) { this.distanceInput.value = this.beam.distance.toFixed(2); }
        if (document.activeElement !== this.diameterInput) { this.diameterInput.value = this.beam.diameter.toFixed(2); }
        if (document.activeElement !== this.lumenInput) { this.lumenInput.value = this.beam.lumen.toFixed(0); }
        this.luxOutput.textContent = `${this.beam.lux.toFixed(0)} lux`;
    }

    updateVisualization() 
    {
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

        if (worldWidth / worldHeight > aspectRatio) { worldHeight = worldWidth / aspectRatio; } 
        else { worldWidth = worldHeight * aspectRatio; }
        
        worldWidth /= this.userScale;
        worldHeight /= this.userScale;

        const viewBox = 
        [
            -worldWidth / 2,
            -padding,
            worldWidth,
            worldHeight
        ].join(' ');

        this.svg.setAttribute('viewBox', viewBox);
        this.updateLabels(distance, diameter, angle);
    }
    
    updateLabels(distance, diameter, angle) 
    {
        const M_TO_FT = 3.28084;
        const isMetersDisplay = document.getElementById('unit-m-btn')?.classList.contains('active') ?? true;
        const showLabelsEl = document.getElementById('show-labels');

        if (showLabelsEl.checked) 
        {
            const distLabel = isMetersDisplay ? `${distance.toFixed(2)} m` : `${(distance * M_TO_FT).toFixed(2)} ft`;
            const diamLabel = isMetersDisplay ? `${diameter.toFixed(2)} m` : `${(diameter * M_TO_FT).toFixed(2)} ft`;

            this.labels.distance.textContent = distLabel;
            this.labels.distance.setAttribute('x', this.fixturePos.x + 0.5);
            this.labels.distance.setAttribute('y', distance / 2);
            this.labels.diameter.textContent = diamLabel;
            this.labels.diameter.setAttribute('x', this.fixturePos.x);
            this.labels.diameter.setAttribute('y', distance + 1.5);
            this.labels.angle.textContent = `${angle.toFixed(2)}°`;
            this.labels.angle.setAttribute('x', this.fixturePos.x - 1);
            this.labels.angle.setAttribute('y', this.fixturePos.y + 1);
        }
        else
        {
            this.labels.distance.textContent = '';
            this.labels.diameter.textContent = '';
            this.labels.angle.textContent = '';
        }
    }

    startDrag(e) 
    {
        if (e.target.classList.contains('drag-handle') && !e.target.classList.contains('disabled')) 
        {
            document.body.classList.add('dragging');
            this.dragging = e.target.id;
            this.scaleSlider.disabled = true;

            if (this.dragging === 'angle-handle') 
            {
                const pt = this.getSVGPoint(e);
                this.dragStart.y = pt.y;
                this.dragStart.angle = this.beam.angle;
            }
        }
    }

    drag(e) {
        if (!this.dragging) return;

        const pt = this.getSVGPoint(e);

        if (this.dragging === 'angle-handle') {
            const dy = this.dragStart.y - pt.y;
            this.beam.angle = this.dragStart.angle + dy * 2; // Sensitivity factor

            if (this.lockedValue === 'diameter') {
                this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180));
            } else { // distance is locked or nothing is locked
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            }

        } else if (this.dragging === 'distance-handle') {
            if (this.lockedValue === 'distance') return;
            this.beam.distance = pt.y > 0 ? pt.y : 0;

            if (this.lockedValue === 'angle') {
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } else { // diameter is locked or nothing is locked
                this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            }

        } else if (this.dragging === 'diameter-handle') {
            if (this.lockedValue === 'diameter') return;
            
            const newDistance = pt.y > 0 ? pt.y : 0;
            const newDiameter = Math.abs(pt.x) * 2;

            if (this.lockedValue === 'distance') {
                this.beam.diameter = newDiameter;
                this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            } else if (this.lockedValue === 'angle') {
                this.beam.distance = newDistance;
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } else { // No lock
                this.beam.distance = newDistance;
                this.beam.diameter = newDiameter;
                this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            }
        }

        this.beam = this.enforceLimits(this.beam);
        this.calculateLux();
        this.updateInputFields();
        this.updateVisualization();
    }

    endDrag() {
        if (this.dragging) {
            document.body.classList.remove('dragging');
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

// Unit conversion for beam panel (meters <-> feet) — run after DOM ready and guard elements
document.addEventListener('DOMContentLoaded', function () {
    const M_TO_FT = 3.28084;
    const unitMBtn = document.getElementById('unit-m-btn');
    const unitFBtn = document.getElementById('unit-f-btn');
    const distInput = document.getElementById('beam-distance');
    const diamInput = document.getElementById('beam-diameter');

    // If any control missing, bail out safely
    if (!unitMBtn || !unitFBtn || !distInput || !diamInput) return;

    // Helper to format numeric values
    function fmt(v) { return (Math.round(v * 100) / 100).toString(); }

    // Toggle active state helper
    function setActiveUnit(isMeters) {
        if (isMeters) {
            unitMBtn.classList.add('active');
            unitFBtn.classList.remove('active');
        } else {
            unitFBtn.classList.add('active');
            unitMBtn.classList.remove('active');
        }
    }

    // Read current unit
    function isCurrentMeters() {
        return unitMBtn.classList.contains('active');
    }

    // Convert function: targetUnitMeters = boolean
    function convertValues(targetUnitMeters) {
        // parse displayed numbers (whatever unit currently shown)
        const dispDist = parseFloat(distInput.value || '0');
        const dispDiam = parseFloat(diamInput.value || '0');
        if (isNaN(dispDist) || isNaN(dispDiam)) return;

        const currentlyMeters = isCurrentMeters();

        // compute internal meters values from displayed numbers
        const metersDist = currentlyMeters ? dispDist : (dispDist / M_TO_FT);
        const metersDiam = currentlyMeters ? dispDiam : (dispDiam / M_TO_FT);

        // decide display values for target unit
        const displayDist = targetUnitMeters ? metersDist : (metersDist * M_TO_FT);
        const displayDiam = targetUnitMeters ? metersDiam : (metersDiam * M_TO_FT);

        // Always update displayed inputs (even if inputs are disabled)
        distInput.value = fmt(displayDist);
        diamInput.value = fmt(displayDiam);

        // Update BeamCalculator internal model (meters) if available
        if (window.beamCalculator) {
            const bc = window.beamCalculator;
            // enforce limits on the new meters values
            const enforced = bc.enforceLimits({ ...bc.beam, distance: metersDist, diameter: metersDiam });
            bc.beam.distance = enforced.distance;
            bc.beam.diameter = enforced.diameter;
            // Recalculate derived values and refresh UI
            bc.calculateLux();
            // ensure unit buttons state matches target
            setActiveUnit(targetUnitMeters);
            bc.updateInputFields();
            bc.updateVisualization();
        } else {
            // if beamCalculator not present, still set unit state
            setActiveUnit(targetUnitMeters);
        }
    }

    // Click handlers
    unitMBtn.addEventListener('click', function () {
        if (isCurrentMeters()) return;
        // convert current display -> meters
        convertValues(true);
    });
    unitFBtn.addEventListener('click', function () {
        if (!isCurrentMeters()) return;
        // convert current display -> feet
        convertValues(false);
    });

    // NOTE: lock buttons are controlled by BeamCalculator.toggleLock (no extra toggles here)

    // Initialize state: ensure unit buttons reflect "meters" by default
    setActiveUnit(true);
});

// --- fixed initialization & expose global instance ---
let beamCalculator = null;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('beam')) {
        beamCalculator = new BeamCalculator();
    }
});

// Re-initialize when navigating to the page
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#beam' && !beamCalculator) {
        beamCalculator = new BeamCalculator();
    }
});