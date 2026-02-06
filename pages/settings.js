// DMX TOOLS

let cmdLogsView = false;

function showSettings() {
    document.getElementById('cards-container').style.display = 'flex';
    document.getElementById('cmdLogs').style.display = 'none';
    document.getElementById('ac').style.display = 'block';
    document.getElementById('logsContainer').innerHTML = '';
    cmdLogsView = false;
}

function viewCmdLogs() {
    document.getElementById('cards-container').style.display = 'none';
    document.getElementById('cmdLogs').style.display = 'block';
    document.getElementById('ac').style.display = 'none';
    document.getElementById('logsContainer').innerHTML = '';
    cmdLogsView = true;
    if(!localStorage.getItem('cmdLogs') && !localStorage.getItem('cmdInputs')) 
    {
        const noLogsElement = document.createElement('p');
        noLogsElement.textContent = 'No logs available.';
        noLogsElement.style.fontStyle = 'italic';
        noLogsElement.id = 'noLogsMessage';
        document.getElementById('logsContainer').appendChild(noLogsElement);
        return;
    }

    // Combina tutti i log (cmdLogs e cmdInputs)
    const allLogs = [];
    
    for (let log of _getLocalArray('cmdLogs')) {
        allLogs.push({
            date: log.date,
            text: `[${log.type}] ${log.message}`
        });
    }

    for (let log of _getLocalArray('cmdInputs')) {
        allLogs.push({
            date: log.date,
            text: `User typed "${log.input}" while CMD was on the [${log.type}] state`
        });
    }

    // Ordina per data decrescente (più recenti prima)
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Visualizza i log ordinati
    for (let log of allLogs) {
        const logElement = document.createElement('p');
        logElement.textContent = `${log.text} (${new Date(log.date).toLocaleString()})`;
        document.getElementById('logsContainer').appendChild(logElement);
    }

}