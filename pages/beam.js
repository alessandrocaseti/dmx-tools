class BeamCalculator 
{
    currentFixtureName = "Fixture";
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

        this.unitMBtn = document.getElementById('unit-m-btn');
        this.unitFBtn = document.getElementById('unit-f-btn');
        this.M_TO_FT = 3.28084;

        this.svgWidth = 700;
        this.svgHeight = 400;

        this.fixturePos = { x: 0, y: 0 };

        this.beam = 
        {
            angle: 10,
            distance: 2,
            diameter: 1.75,
            lumen: 5000,
            lux: 0
        };
        this.currentUnit = 'm';
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
            userScale: { min: 1.5, max: 2.0 }
        };

        this.init();
    }

    init() 
    {
        this.setupSVG();
        this.bindEvents();
        this.updateFromInput('angle');
        this.updateLockUI();
        this.setActiveUnit(true);
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
        this.fixtureText = this.createSVGElement('text', { x: this.fixturePos.x, y: this.fixturePos.y - 0.6, 'text-anchor': 'middle', fill: 'var(--colore-testo-chiaro)', 'font-size': '0.5px' });
        this.fixtureText.textContent = this.currentFixtureName;
 
        this.handles = 
        {
            angle: this.createHandle(this.fixturePos.x, this.fixturePos.y, 'angle-handle', 0.25),
            distance: this.createHandle(0, 0, 'distance-handle', 0.20),
            diameter: this.createHandle(0, 0, 'diameter-handle', 0.20)
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

    setUnit(unit)
    {
        if (unit === 'm')
        {
            if (this.isCurrentMeters()) return;
            this.convertValues(true);
            document.getElementById('currentUnitDistance').innerHTML = '(m)';
            document.getElementById('currentUnitDiameter').innerHTML = '(m)';
            this.currentUnit = 'm';
        }
        else // ft
        {
            if (!this.isCurrentMeters()) return;
            this.convertValues(false);
            document.getElementById('currentUnitDistance').innerHTML = '(ft)';
            document.getElementById('currentUnitDiameter').innerHTML = '(ft)';
            this.currentUnit = 'ft';
        }
    }

    setAngle(value)
    {
        if(this.angleInput.disabled)
        {
            setCmdMessage('Parameter locked. Unable to set angle.', 'ERROR');
            return;
        }
        setCmdMessage('Setted angle to ' + value + ' degrees.', 'SET ANGLE');
        this.beam.angle = value;
        this.angleInput.value = value;
        this.updateFromInput('angle');
    }

    setDistance(value)
    {
        if(this.distanceInput.disabled)
        {
            setCmdMessage('Parameter locked. Unable to set distance.', 'ERROR');
            return;
        }
        setCmdMessage('Setted distance to ' + value + ' ' + this.currentUnit + '.', 'SET DISTANCE');
        // value is provided in the currently displayed unit (m or ft). Set the input
        // and let updateFromInput convert it into internal meters.
        this.distanceInput.value = value;
        this.updateFromInput('distance');
    }

    setDiameter(value)
    {
        if(this.diameterInput.disabled)
        {
            setCmdMessage('Parameter locked. Unable to set diameter.', 'ERROR');
            return;
        }
        setCmdMessage('Setted diameter to ' + value + ' ' + this.currentUnit + '.', 'SET DIAMETER');
        // value is provided in the currently displayed unit (m or ft). Set the input
        // and let updateFromInput convert it into internal meters.
        this.diameterInput.value = value;
        this.updateFromInput('diameter');
    }

    setFlux(value)
    {
        if(this.lumenInput.disabled)
        {
            setCmdMessage('Parameter locked. Unable to set flux.', 'ERROR');
            return;
        }
        setCmdMessage('Setted flux to ' + value + ' lumen.', 'SET FLUX');
        this.beam.lumen = value;
        this.lumenInput.value = value;
        this.updateFromInput('lumen');
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

        if (this.unitMBtn) { this.unitMBtn.addEventListener('click', () => { this.setUnit('m'); }); }
        if (this.unitFBtn) { this.unitFBtn.addEventListener('click', () => { this.setUnit('ft'); }); }

        this.svg.addEventListener('mousedown', (e) => this.startDrag(e));
        this.svg.addEventListener('mousemove', (e) => this.drag(e));
        this.svg.addEventListener('mouseup', () => this.endDrag());
        this.svg.addEventListener('mouseleave', () => this.endDrag());
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));
        
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
        setCmdMessage('Toggled lock on ' + value + ' parameter.', 'LOCK')
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
        const isMetersDisplay = this.isCurrentMeters();

        if (source !== this.lockedValue) 
        {
            if (!this.angleInput.disabled) this.beam.angle = parseFloat(this.angleInput.value) || this.beam.angle;

            if (!this.distanceInput.disabled) 
            {
                let d = parseFloat(this.distanceInput.value);
                if (!isNaN(d)) { d = isMetersDisplay ? d : (d / this.M_TO_FT); }
                this.beam.distance = d || this.beam.distance;
            }

            if (!this.diameterInput.disabled) 
            {
                let dia = parseFloat(this.diameterInput.value);
                if (!isNaN(dia)) { dia = isMetersDisplay ? dia : (dia / this.M_TO_FT); }
                this.beam.diameter = dia || this.beam.diameter;
            }
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
        const isMetersDisplay = this.isCurrentMeters();

        if (document.activeElement !== this.angleInput) { this.angleInput.value = this.beam.angle.toFixed(2); }
        
        if (document.activeElement !== this.distanceInput) 
        { 
            const displayDist = isMetersDisplay ? this.beam.distance : this.beam.distance * this.M_TO_FT;
            this.distanceInput.value = displayDist.toFixed(2);
        }

        if (document.activeElement !== this.diameterInput) 
        { 
            const displayDiam = isMetersDisplay ? this.beam.diameter : this.beam.diameter * this.M_TO_FT;
            this.diameterInput.value = displayDiam.toFixed(2);
        }

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
        const isMetersDisplay = this.isCurrentMeters();
        const showLabelsEl = document.getElementById('show-labels');

        if (showLabelsEl.checked) 
        {
            const distLabel = isMetersDisplay ? `${distance.toFixed(2)} m` : `${(distance * this.M_TO_FT).toFixed(2)} ft`;
            const diamLabel = isMetersDisplay ? `${diameter.toFixed(2)} m` : `${(diameter * this.M_TO_FT).toFixed(2)} ft`;
            this.labels.distance.textContent = distLabel;
            this.labels.distance.setAttribute('x', this.fixturePos.x + 1.5);
            this.labels.distance.setAttribute('y', distance / 2);
            this.labels.diameter.textContent = diamLabel;
            this.labels.diameter.setAttribute('x', this.fixturePos.x);
            this.labels.diameter.setAttribute('y', distance + 1);
            this.labels.angle.textContent = `${angle.toFixed(2)}°`;
            this.labels.angle.setAttribute('x', this.fixturePos.x - 1);
            this.labels.angle.setAttribute('y', this.fixturePos.y + 1);
            this.fixtureText.textContent = this.currentFixtureName;
        }
        else
        {
            this.labels.distance.textContent = '';
            this.labels.diameter.textContent = '';
            this.labels.angle.textContent = '';
            this.fixtureText.textContent = '';       
        }
    }

    handleWheel(e) 
    {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.05 : -0.05;
        this.userScale -= delta;
        this.userScale = Math.max(0.8, Math.min(2.5, this.userScale));
        this.scaleSlider.value = this.userScale;
        this.updateVisualization();
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

    drag(e) 
    {
        if (!this.dragging) return;

        const pt = this.getSVGPoint(e);

        if (this.dragging === 'angle-handle') 
        {
            const dy = this.dragStart.y - pt.y;
            this.beam.angle = this.dragStart.angle + dy * 3; // Sensitivity factor

            if (this.lockedValue === 'diameter') 
            {
                this.beam.distance = (this.beam.diameter / 2) / Math.tan((this.beam.angle / 2) * (Math.PI / 180));
            } 
            else // distance is locked or nothing is locked
            {
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            }

        } 
        else if (this.dragging === 'distance-handle') 
        {
            if (this.lockedValue === 'distance') return;
            this.beam.distance = pt.y > 0 ? pt.y : 0;

            if (this.lockedValue === 'angle') 
            {
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } 
            else // diameter is locked or nothing is locked
            {
                this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            }

        } 
        else if (this.dragging === 'diameter-handle') 
        {
            if (this.lockedValue === 'diameter') return;
            
            const newDistance = pt.y > 0 ? pt.y : 0;
            const newDiameter = Math.abs(pt.x) * 2;

            if (this.lockedValue === 'distance') 
            {
                this.beam.diameter = newDiameter;
                this.beam.angle = 2 * Math.atan((this.beam.diameter / 2) / this.beam.distance) * (180 / Math.PI);
            } 
            else if (this.lockedValue === 'angle') 
            {
                this.beam.distance = newDistance;
                this.beam.diameter = 2 * Math.tan((this.beam.angle / 2) * (Math.PI / 180)) * this.beam.distance;
            } 
            else // No lock
            {
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

    endDrag() 
    {
        if (this.dragging) 
        {
            document.body.classList.remove('dragging');
            this.dragging = null;
            this.scaleSlider.disabled = false;
        }
    }

    getSVGPoint(e) 
    {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = this.svg.getScreenCTM();
        if (ctm) { return pt.matrixTransform(ctm.inverse()); }
        return pt;
    }

    _fmt(v) { return (Math.round(v * 100) / 100).toString(); }

    setActiveUnit(isMeters) 
    {
        if (!this.unitMBtn || !this.unitFBtn) return;
        if (isMeters) 
        {
            this.unitMBtn.classList.add('active');
            this.unitFBtn.classList.remove('active');
        } 
        else
        {
            this.unitFBtn.classList.add('active');
            this.unitMBtn.classList.remove('active');
        }
    }

    isCurrentMeters() { return this.unitMBtn?.classList.contains('active') ?? true; }

    convertValues(targetUnitMeters) 
    {
        const dispDist = parseFloat(this.distanceInput.value || '0');
        const dispDiam = parseFloat(this.diameterInput.value || '0');
        if (isNaN(dispDist) || isNaN(dispDiam)) return;

        const currentlyMeters = this.isCurrentMeters();

        const metersDist = currentlyMeters ? dispDist : (dispDist / this.M_TO_FT);
        const metersDiam = currentlyMeters ? dispDiam : (dispDiam / this.M_TO_FT);

        const enforced = this.enforceLimits({ ...this.beam, distance: metersDist, diameter: metersDiam });
        this.beam.distance = enforced.distance;
        this.beam.diameter = enforced.diameter;
        
        this.calculateLux();
        this.setActiveUnit(targetUnitMeters);
        this.updateInputFields();
        this.updateVisualization();
    }

    clear()
    {
        this.beam = { angle: 10, distance: 10, diameter: 1.75, lumen: 5000, lux: 0 };
        this.currentFixtureName = 'Fixture';
        this.calculateLux();
        this.updateInputFields();
        this.updateVisualization();
    }

    openDialog() 
    {
        const modal = document.getElementById('fixtureBeamModal');
        const fixtureList = document.getElementById('fixtureBeamList');
        fixtureList.innerHTML = `
            <div class="fixture-tree">
                <div class="brand-column">
                    ${fixtureFolders.map(brand => `<button class="brand-btn" data-brand="${brand}">${brand}</button>`).join('')}
                </div>
                <div class="fixture-column" id="fixture-column">
                    <p>Select a brand to view fixtures.</p>
                </div>
            </div>
        `;

        // Add event listeners for brand buttons
        fixtureList.querySelectorAll('.brand-btn').forEach(btn => 
        {
            btn.addEventListener('click', (e) => 
            {
                fixtureList.querySelectorAll('.brand-btn').forEach(btn => btn.classList.remove('selected'));
                btn.classList.add('selected');
                const brand = e.target.dataset.brand;
                this.showFixtures(brand);
            });
        });

        modal.style.display = 'flex';
        document.getElementById("minAngle").innerHTML = '0°';
        document.getElementById("maxAngle").innerHTML = '0°';
        document.getElementById("lumiFlux").innerHTML = '0 lm';
        // Small delay to allow display property to apply before transition starts
        setTimeout(() => { modal.classList.add('show');}, 10);
    }

    showFixtures(brand) 
    {
        document.getElementById("beamImportFixtureBtn").disabled = true;
        const fixtureColumn = document.getElementById('fixture-column');
        fixtureColumn.innerHTML = folderFiles[brand].map(file => 
        {
            const name = file.replace('.json', '').replace(new RegExp('^' + brand + '[-_ ]*', 'i'), '').replace(/-/g, ' ').trim();
            return `<button class="fixture-btn" data-brand="${brand}" data-file="${file}">${name}</button>`;
        }).join('');

        // Add event listeners for fixture buttons
        fixtureColumn.querySelectorAll('.fixture-btn').forEach(btn => 
        {
            if (btn.innerText.length > 30)
            {
                const fullText = btn.innerText;
                btn.innerText = fullText.slice(0, 27) + '...';
                btn.title = fullText;
                btn.setAttribute('aria-label', fullText);
            }
            btn.addEventListener('click', async (e) => 
            {
                document.getElementById("beamImportFixtureBtn").disabled = false;
                fixtureColumn.querySelectorAll('.fixture-btn').forEach(but => but.classList.remove('selected'));
                btn.classList.add('selected');
                const brand = e.target.dataset.brand;
                const file = e.target.dataset.file;
                await this.selectFixture(brand, file);
            });
        });
    }

    async selectFixture(brand, file) 
    {
        try 
        {
            const response = await fetch(`fixtures/${brand}/${file}`);
            const data = await response.json();
            const angleMin = data.physical?.lens?.degreesMin || 10;
            const angleMax = data.physical?.lens?.degreesMax || 10;
            const lumen = parseInt(data.physical?.bulb?.lumens) || 5000;
            document.getElementById("minAngle").innerHTML = angleMin + '°';
            document.getElementById("maxAngle").innerHTML = angleMax + '°';
            document.getElementById("lumiFlux").innerHTML = lumen + ' lm';
            document.getElementById("beamImportFixtureBtn").addEventListener('click', () => this.importFixture(data, angleMin, angleMax, lumen));
        }
        catch (error) 
        {
            console.error('Error loading fixture:', error);
            setCmdMessage('Error loading fixture data.', 'ERROR');
        }
    }

    importFixture(data, angleMin, angleMax, lumen)
    {
        this.currentFixtureName = data.manufacturer + ' ' + data.model;
        this.setAngle(angleMin);
        this.setFlux(lumen);
        this.toggleLock('angle');
        this.closeDialog();
        setCmdMessage(`Loaded fixture: ${this.currentFixtureName}`, 'IMPORT');
    }

    closeDialog() 
    {
        const modal = document.getElementById('fixtureBeamModal');
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300); // Match timeout with CSS transition duration
        document.getElementById("beamImportFixtureBtn").disabled = true;
    }
}

let beamCalculator = null;
document.addEventListener('DOMContentLoaded', () => { beamCalculator = new BeamCalculator(); });

// Re-initialize when navigating to the page
window.addEventListener('hashchange', () => 
{
    if (window.location.hash === '#beam' && !beamCalculator) { beamCalculator = new BeamCalculator(); }
});
