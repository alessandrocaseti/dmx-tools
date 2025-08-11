// DMX DIP Switch Calculator
// Converts DMX address (0-511) to binary switch positions

class DMXDIPSwitch {
    constructor() {
        this.maxAddress = 511;
        this.switches = 9; // 2^9 = 512, covers 0-511
        this.currentAddress = 0;
        this.init();
    }

    init() {
        this.createInterface();
        this.bindEvents();
        this.updateDisplay();
    }

    createInterface() {
        const container = document.getElementById('dip');
        
        // Clear existing content
        container.innerHTML = `
            <h1 class="web-only" style="margin-top: 40px;">DMX DIP Switch</h1>
            
            <div class="dip-container">
                <div class="dip-input-section">
                    <label for="dmxAddress">DMX Address:</label>
                    <input type="number" id="dmxAddress" min="0" max="511" value="0" placeholder="0-511">
                    <button onclick="dipSwitch.updateFromAddress()">Update Switches</button>
                </div>
                
                <div class="dip-switches-container">
                    <h3>Binary Representation</h3>
                    <div class="switches-grid">
                        ${this.createSwitchesHTML()}
                    </div>
                    <div class="binary-display">
                        <span>Binary: </span>
                        <span id="binaryValue">000000000</span>
                    </div>
                </div>
            </div>
        `;
    }

    createSwitchesHTML() {
        let switchesHTML = '';
        for (let i = 8; i >= 0; i--) {
            const bitValue = Math.pow(2, i);
            switchesHTML += `
                <div class="switch-container">
                    <div class="switch-label">${bitValue}</div>
                    <div class="dip-switch" data-bit="${i}" onclick="dipSwitch.toggleSwitch(${i})">
                        <div class="switch-lever"></div>
                    </div>
                    <div class="switch-value">${i}</div>
                </div>
            `;
        }
        return switchesHTML;
    }

    bindEvents() {
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) {
            addressInput.addEventListener('input', (e) => {
                this.updateFromAddress();
            });
        }
    }

    updateFromAddress() {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if (isNaN(address)) address = 0;
        if (address < 0) address = 0;
        if (address > this.maxAddress) address = this.maxAddress;
        
        this.currentAddress = address;
        this.updateDisplay();
    }

    toggleSwitch(bit) {
        const bitValue = Math.pow(2, bit);
        if (this.currentAddress & bitValue) {
            this.currentAddress -= bitValue;
        } else {
            this.currentAddress += bitValue;
        }
        
        // Update address input
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) {
            addressInput.value = this.currentAddress;
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        // Update switches visual state
        for (let i = 0; i < this.switches; i++) {
            const bitValue = Math.pow(2, i);
            const switchElement = document.querySelector(`[data-bit="${i}"]`);
            if (switchElement) {
                const isOn = (this.currentAddress & bitValue) !== 0;
                switchElement.classList.toggle('on', isOn);
            }
        }

        const binaryString = this.currentAddress.toString(2).padStart(9, '0');
        const binaryValue = document.getElementById('binaryValue');
        if (binaryValue) { binaryValue.textContent = binaryString; }
    }

    // Utility method to get switch states
    getSwitchStates() {
        const states = [];
        for (let i = 0; i < this.switches; i++) {
            const bitValue = Math.pow(2, i);
            states.push((this.currentAddress & bitValue) !== 0);
        }
        return states;
    }
}

// Initialize when DOM is loaded
let dipSwitch;
document.addEventListener('DOMContentLoaded', () => {
    dipSwitch = new DMXDIPSwitch();
});

// Global function for HTML onclick
window.dipSwitch = dipSwitch;
