const { app, BrowserWindow } = require('electron')

function createWindow() 
{
    const win = new BrowserWindow
    ({
        width: 1920,
        height: 1080,
        show: false,
        webPreferences: { nodeIntegration: true }
    })
    win.maximize()
    win.show()
    win.loadFile('index.html')
    win.on('closed', () => { app.quit() })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => 
{
    if (process.platform !== 'darwin') { app.quit() }
})

app.on('activate', () => 
{
    if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
})