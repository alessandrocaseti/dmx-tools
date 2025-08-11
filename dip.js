/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// DIP Switch - converts DMX address to binary switch positions

class DMXDIPSwitch 
{
    constructor() 
    {
        this.maxAddress = 511;
        this.switches = 9; // 2^9 = 512, covers 0-511
        this.currentAddress = 0;
        this.storedAddresses = [];
        this.init();
    }

    init() 
    {
        this.createInterface();
        this.bindEvents();
        this.updateDisplay();
    }

    createInterface() 
    {
        const container = document.getElementById('dip');
        container.innerHTML = `
            <h1 style="margin-top: 40px;">DIP Switch</h1>
            
            <div class="dip-container">
                <div class="dip-input-section">
                    <label for="dmxAddress">DMX Address:</label>
                    <input type="number" id="dmxAddress" min="0" max="511" value="0" placeholder="0-511">
                    <button onclick="dipSwitch.storeAddress()">Store</button>
                    <button onclick="dipSwitch.incrementAddress()">+</button>
                    <button onclick="dipSwitch.decrementAddress()">-</button>
                    <button onclick="dipSwitch.clearAddress()">Clear</button>
                </div>
                
                <div class="dip-switches-container">
                    <div class="switches-grid">
                        ${this.createSwitchesHTML()}
                    </div>
                    <div class="binary-display">
                        <span>Binary: </span>
                        <span id="binaryValue">000000000</span>
                    </div>
                </div>

                <div class="stored-addresses-section">
                    <h3>Stored Addresses</h3>
                    <div id="storedAddressesTable">
                        <table class="addresses-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Address</th>
                                    <th>Binary</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="storedAddressesBody">
                                <tr>
                                    <td colspan="4" style="text-align: center; color: #666;">No addresses stored yet</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    createSwitchesHTML() 
    {
        let switchesHTML = '';
        for (let i = 8; i >= 0; i--) 
        {
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

    bindEvents() 
    {
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) { addressInput.addEventListener('input', (e) => { this.updateFromAddress(); }); }
    }

    updateFromAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if (isNaN(address)) address = 0;
        if (address < 0) address = 0;
        if (address > this.maxAddress) address = this.maxAddress;
        
        this.currentAddress = address;
        this.updateDisplay();
    }

    storeAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if (isNaN(address)) address = 0;
        if (address < 0) address = 0;
        if (address > this.maxAddress) address = this.maxAddress;
        
        // Check if address already exists
        if (!this.storedAddresses.includes(address)) {
            this.storedAddresses.push(address);
            this.storedAddresses.sort((a, b) => a - b);
            this.updateStoredAddressesTable();
        }
    }

    updateStoredAddressesTable() 
    {
        const tbody = document.getElementById('storedAddressesBody');
        if (!tbody) return;

        if (this.storedAddresses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #666;">No addresses stored yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        this.storedAddresses.forEach((address, index) => {
            const binaryString = address.toString(2).padStart(9, '0');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${address}</td>
                <td>${binaryString}</td>
                <td>
                    <button onclick="dipSwitch.loadAddress(${address})" style="margin-right: 5px;">Load</button>
                    <button onclick="dipSwitch.removeAddress(${index})" style="background-color: #dc3545;">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadAddress(address) 
    {
        this.currentAddress = address;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = address;
    }

    removeAddress(index) 
    {
        this.storedAddresses.splice(index, 1);
        this.updateStoredAddressesTable();
    }

    incrementAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if(address > -1 && address < 511) address++;
        else return;

        this.currentAddress = address;
        this.updateDisplay();
        addressInput.value = address;
    }

    decrementAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if(address > 1 && address < 512) address--;
        else return;
        
        this.currentAddress = address;
        this.updateDisplay();
        addressInput.value = address;
    }

    clearAddress() 
    {
        this.currentAddress = 0;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = 0;
    }

    storeAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if (isNaN(address)) address = 0;
        if (address < 0) address = 0;
        if (address > this.maxAddress) address = this.maxAddress;
        
        if (!this.storedAddresses.includes(address)) {
            this.storedAddresses.push(address);
            this.storedAddresses.sort((a, b) => a - b);
            this.updateStoredAddressesTable();
        }
    }

    updateStoredAddressesTable() 
    {
        const tbody = document.getElementById('storedAddressesBody');
        if (!tbody) return;

        if (this.storedAddresses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #666;">No addresses stored yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        this.storedAddresses.forEach((address, index) => {
            const binaryString = address.toString(2).padStart(9, '0');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${address}</td>
                <td>${binaryString}</td>
                <td>
                    <button onclick="dipSwitch.loadAddress(${address})" style="margin-right: 5px;">Load</button>
                    <button onclick="dipSwitch.removeAddress(${index})" style="background-color: #dc3545;">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadAddress(address) 
    {
        this.currentAddress = address;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = address;
    }

    removeAddress(index) 
    {
        this.storedAddresses.splice(index, 1);
        this.updateStoredAddressesTable();
    }

    toggleSwitch(bit) 
    {
        const bitValue = Math.pow(2, bit);
        if (this.currentAddress & bitValue) { this.currentAddress -= bitValue; }
        else { this.currentAddress += bitValue; }
        
        // Update address input
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) { addressInput.value = this.currentAddress; }
        
        this.updateDisplay();
    }

    updateDisplay() 
    {
        // Update switches visual state
        for (let i = 0; i < this.switches; i++) 
        {
            const bitValue = Math.pow(2, i);
            const switchElement = document.querySelector(`[data-bit="${i}"]`);
            if (switchElement) 
            {
                const isOn = (this.currentAddress & bitValue) !== 0;
                switchElement.classList.toggle('on', isOn);
            }
        }

        const binaryString = this.currentAddress.toString(2).padStart(9, '0');
        const binaryValue = document.getElementById('binaryValue');
        if (binaryValue) { binaryValue.textContent = binaryString; }
    }

    // Utility method to get switch states
    getSwitchStates() 
    {
        const states = [];
        for (let i = 0; i < this.switches; i++) 
        {
            const bitValue = Math.pow(2, i);
            states.push((this.currentAddress & bitValue) !== 0);
        }
        return states;
    }
}

// Initialize when DOM is loaded
let dipSwitch;
document.addEventListener('DOMContentLoaded', () => { dipSwitch = new DMXDIPSwitch(); });

// Global function for HTML onclick
window.dipSwitch = dipSwitch;
