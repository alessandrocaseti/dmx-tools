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
        this.isFlipped = true;
        this.init();
    }

    init() 
    {
        this.createSwitchesHTML();
        this.bindEvents();
        this.updateDisplay();
    }

    createSwitchesHTML() 
    {
        let switchesHTML = '';
        const isFlipped = this.isFlipped || false;
        
        for (let i = 0; i < this.switches; i++) 
        {
            const displayIndex = isFlipped ? i : 8 - i;
            const bitValue = Math.pow(2, displayIndex);
            const switchNumber = isFlipped ? i + 1 : 9 - i;
            
            switchesHTML += `
                <div class="switch-container">
                    <div class="switch-label">${bitValue}</div>
                    <div class="dip-switch" data-bit="${displayIndex}" onclick="dipSwitch.toggleSwitch(${displayIndex})">
                        <div class="switch-lever"></div>
                    </div>
                    <div class="switch-value">${switchNumber}</div>
                </div>
            `;
        }
        document.getElementById('switchesHTML').innerHTML = switchesHTML;
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
        addressInput.value = address.toString().padStart(3, '0');
        this.updateDisplay();
    }

    updateStoredAddressesTable() 
    {
        const tbody = document.getElementById('storedAddressesBody');
        if (!tbody) return;

        if (this.storedAddresses.length === 0) 
        {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">No addresses stored yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        this.storedAddresses.forEach((address, index) => 
        {
            const binaryString = address.toString(2).padStart(9, '0');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${address}</td>
                <td>${binaryString}</td>
                <td>
                    <button onclick="dipSwitch.loadAddress(${address})">Load</button>
                    <button onclick="dipSwitch.removeAddress(${index})">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadAddress(address) 
    {
        this.currentAddress = address;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = address.toString().padStart(3, '0');
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
        addressInput.value = address.toString().padStart(3, '0');
    }

    decrementAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if(address > 0 && address < 512) address--;
        else return;
        
        this.currentAddress = address;
        this.updateDisplay();
        addressInput.value = address.toString().padStart(3, '0');
    }

    clearAddress() 
    {
        setCmdMessage('Cleared DIP. Current address set to 000.', 'CLEAR DIP');
        this.currentAddress = 0;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = this.currentAddress.toString().padStart(3, '0');
    }

    clearAll()
    {
        this.clearAddress();
        this.storedAddresses = [];
        this.updateStoredAddressesTable();
        setCmdMessage('Cleared all stored addresses and reset current address to 000.', 'CLEAR ALL');
    }

    storeAddress() 
    {
        const addressInput = document.getElementById('dmxAddress');
        let address = parseInt(addressInput.value);
        
        if (isNaN(address)) address = 0;
        if (address < 0) address = 0;
        if (address > this.maxAddress) address = this.maxAddress;
        
        if (!this.storedAddresses.includes(address)) 
        {
            this.storedAddresses.push(address);
            this.storedAddresses.sort((a, b) => a - b);
            this.updateStoredAddressesTable();
            setCmdMessage(`Stored address ${address.toString().padStart(3, '0')}.`, 'STORE');
        }
        else
        {
            setCmdMessage(`Address ${address.toString().padStart(3, '0')} is already stored.`, 'WARNING');
        }
    }

    updateStoredAddressesTable() 
    {
        const tbody = document.getElementById('storedAddressesBody');
        if (!tbody) return;

        if (this.storedAddresses.length === 0) 
        {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">No addresses stored yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        this.storedAddresses.forEach((address, index) => 
        {
            const binaryString = address.toString(2).padStart(9, '0');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${address.toString().padStart(3, '0')}</td>
                <td style="font-family: 'Roboto Mono', monospace">${binaryString}</td>
                <td>
                    <div style="display: flex; flex-direction: row; justify-content: center; gap: 24px;">
                        <button onclick="dipSwitch.loadAddress(${address})" class="iconButton">
                            <span class="buttonIcon"></span>
                            <span class="buttonText">Load</span>
                        </button>
                        <button onclick="dipSwitch.removeAddress(${index})" class="iconButton">
                            <span class="buttonIcon"></span>
                            <span class="buttonText">Remove</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadAddress(address) 
    {
        setCmdMessage(`Loaded address ${address.toString().padStart(3, '0')}.`, 'LOAD');
        this.currentAddress = address;
        this.updateDisplay();
        document.getElementById('dmxAddress').value = address.toString().padStart(3, '0');
    }

    removeAddress(index) 
    {
        const address = this.storedAddresses[index];
        setCmdMessage(`Removed address ${address.toString().padStart(3, '0')}.`, 'REMOVE');
        this.storedAddresses.splice(index, 1);
        this.updateStoredAddressesTable();
    }

    toggleSwitch(bit) 
    {
        const bitValue = Math.pow(2, bit);
        if (this.currentAddress & bitValue) { this.currentAddress -= bitValue; }
        else { this.currentAddress += bitValue; }
        
        // Ensure address stays within bounds
        if (this.currentAddress < 0) this.currentAddress = 0;
        if (this.currentAddress > this.maxAddress) this.currentAddress = this.maxAddress;

        // Update address input
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) { addressInput.value = this.currentAddress.toString().padStart(3, '0'); }
        
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
        if (this.currentAddress < 1) { document.getElementById('lessButton').disabled = true; }
        else { document.getElementById('lessButton').disabled = false; }
        if (this.currentAddress > 510) { document.getElementById('moreButton').disabled = true; }
        else { document.getElementById('moreButton').disabled = false; }
    }

    flipSwitches() 
    {
        // Toggle the flip state
        this.isFlipped = !this.isFlipped;
        
        // Recreate the interface with flipped layout
        this.createSwitchesHTML();
        this.bindEvents();
        this.updateDisplay();
        this.updateStoredAddressesTable();
        // Update address input
        const addressInput = document.getElementById('dmxAddress');
        if (addressInput) { addressInput.value = this.currentAddress; }
        if(this.isFlipped)
        {
            setCmdMessage('DIP switch layout flipped (ascending order - 1/256).', 'FLIP');
        }
        else
        {
            setCmdMessage('DIP switch layout flipped (descending order - 256/1).', 'FLIP');
        }
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
