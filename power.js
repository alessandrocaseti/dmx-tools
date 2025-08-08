/// DMX TOOLS - DEVELOPED BY ALESSANDRO CASETI ///

// Power Tools - Watt/Ampere/Volt Converter + Total power consumption calculator

class PowerConverter 
{
    constructor() { this.bindEvents(); }

    bindEvents() 
    {
        // Add event listeners for real-time calculation
        ['watts', 'volts', 'amperes'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', () => this.validateInputs());
        });
    }

    validateInputs() 
    {
        const watts = parseFloat(document.getElementById('watts').value);
        const volts = parseFloat(document.getElementById('volts').value);
        const amperes = parseFloat(document.getElementById('amperes').value);
        
        // Enable/disable calculate button based on inputs
        const filledInputs = [watts, volts, amperes].filter(val => !isNaN(val)).length;
        const calculateBtn = document.querySelector('.calculate-btn');
        
        if (filledInputs === 2) 
        {
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
        } 
        
        else 
        {
            calculateBtn.disabled = true;
            calculateBtn.style.opacity = '0.6';
        }
    }

    calculate() 
    {
        const watts = parseFloat(document.getElementById('watts').value);
        const volts = parseFloat(document.getElementById('volts').value);
        const amperes = parseFloat(document.getElementById('amperes').value);
        
        let result = '';
        let calculation = '';
        
        if (isNaN(watts) && !isNaN(volts) && !isNaN(amperes)) 
        {
            // Calculate watts
            const calculatedWatts = volts * amperes;
            result = `${calculatedWatts.toFixed(2)} W`;
            calculation = `P = V × I = ${volts} V × ${amperes} A = ${calculatedWatts.toFixed(2)} W`;

        }

        else if (!isNaN(watts) && isNaN(volts) && !isNaN(amperes)) 
        {
            // Calculate volts
            const calculatedVolts = watts / amperes;
            result = `${calculatedVolts.toFixed(2)} V`;
            calculation = `V = P ÷ I = ${watts} W ÷ ${amperes} A = ${calculatedVolts.toFixed(2)} V`;

        }
        
        else if (!isNaN(watts) && !isNaN(volts) && isNaN(amperes)) 
        {
            // Calculate amperes
            const calculatedAmperes = watts / volts;
            result = `${calculatedAmperes.toFixed(2)} A`;
            calculation = `I = P ÷ V = ${watts} W ÷ ${volts} V = ${calculatedAmperes.toFixed(2)} A`;
        }
        
        else 
        {
            result = 'Please enter exactly 2 values to calculate the third';
            calculation = '';
        }
        
        this.displayResult(result, calculation);
    }

    displayResult(result, calculation) 
    {
        const resultDiv = document.getElementById('calculation-result');
        resultDiv.innerHTML = `
            <div class="result-item">
                <h4>Result:</h4>
                <p class="result-value">${result}</p>
                ${calculation ? `<p class="calculation-steps">${calculation}</p>` : ''}
            </div>
        `;
    }

    clear() 
    {
        document.getElementById('watts').value = '';
        document.getElementById('volts').value = '';
        document.getElementById('amperes').value = '';
        document.getElementById('calculation-result').innerHTML = '';
        this.validateInputs();
    }

    addFixture() 
    {
        const type = document.getElementById('fixture-type').value;
        const power = parseFloat(document.getElementById('fixture-power').value);
        const quantity = parseInt(document.getElementById('fixture-quantity').value);
        
        if (!type || isNaN(power) || isNaN(quantity)) 
        {
            alert('Please fill in all fields correctly');
            return;
        }
        
        const fixturesContainer = document.getElementById('fixtures-container');
        const fixtureDiv = document.createElement('div');
        fixtureDiv.className = 'fixture-item';
        fixtureDiv.innerHTML = `
            <span>${type} - ${power}W × ${quantity} = ${(power * quantity).toFixed(1)}W</span>
            <button onclick="this.parentElement.remove(); powerConverter.updateTotalPower()" class="remove-btn">×</button>`;
        
        fixturesContainer.appendChild(fixtureDiv);
        this.updateTotalPower();
        
        // Clear inputs
        document.getElementById('fixture-type').value = '';
        document.getElementById('fixture-power').value = '';
        document.getElementById('fixture-quantity').value = '';
    }

    updateTotalPower() 
    {
        const fixtures = document.querySelectorAll('.fixture-item');
        let totalPower = 0;
        
        fixtures.forEach(fixture => 
        {
            const text = fixture.querySelector('span').textContent;
            const match = text.match(/(\d+\.?\d*)W × (\d+) = (\d+\.?\d*)W/);
            if (match) { totalPower += parseFloat(match[3]); }
        });
        
        document.getElementById('total-watts').textContent = totalPower.toFixed(1);
    }
}

let powerConverter;
document.addEventListener('DOMContentLoaded', () => { powerConverter = new PowerConverter(); });