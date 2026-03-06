const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const dgram = require('dgram');

function createWindow() 
{
    const win = new BrowserWindow
    ({
        width: 1920,
        height: 1080,
        title: 'DMX Tools',
        show: false,
        icon: "assets/icon.ico",
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload-artnet.js')
        }
    })
    win.maximize()
    win.show()
    win.loadFile('index.html')
    win.on('closed', () => { app.quit() })
}

app.whenReady().then(createWindow)

// ArtNet listener in main process forwarded via IPC
let artnetSocket = null;
let boundAddress = null;

ipcMain.on('start-artnet', (event, bindAddr = '0.0.0.0') => {
    try {
        if (artnetSocket) {
            try { artnetSocket.close(); } catch (e) {}
            artnetSocket = null;
        }
        artnetSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        artnetSocket.on('error', (err) => {
            event.sender.send('artnet-status', { type: 'error', message: String(err) });
            try { artnetSocket.close(); } catch (e) {}
            artnetSocket = null;
        });

        artnetSocket.on('message', (msg, rinfo) => {
            try {
                const id = msg.slice(0,8).toString('ascii');
                const opcode = msg.length >= 10 ? msg.readUInt16LE(8) : 0;
                if (id === 'Art-Net\u0000' && opcode === 0x5000 && msg.length >= 18) {
                    const sequence = msg[12];
                    const physical = msg[13];
                    const subUni = msg[14];
                    const net = msg[15];
                    const length = msg.readUInt16BE(16);
                    const data = Array.from(msg.slice(18, 18 + length));
                    event.sender.send('artnet-packet', { type: 'dmx', id, opcode, sequence, physical, subUni, net, length, data, rinfo });
                } else {
                    event.sender.send('artnet-packet', { type: 'raw', id, opcode, hex: msg.toString('hex'), length: msg.length, rinfo });
                }
            } catch (e) {
                event.sender.send('artnet-status', { type: 'error', message: 'Failed to parse packet: ' + String(e) });
            }
        });

        const onBind = () => {
            try { artnetSocket.setBroadcast(true); } catch (e) {}
            boundAddress = bindAddr || '0.0.0.0';
            event.sender.send('artnet-status', { type: 'info', message: `Bound ${boundAddress}:6454` });
        };

        if (!bindAddr || bindAddr === '0.0.0.0') artnetSocket.bind(6454, onBind);
        else artnetSocket.bind(6454, bindAddr, onBind);
    } catch (e) {
        event.sender.send('artnet-status', { type: 'error', message: String(e) });
    }
});

ipcMain.on('stop-artnet', (event) => {
    try { if (artnetSocket) artnetSocket.close(); } catch (e) {}
    artnetSocket = null; boundAddress = null;
    event.sender.send('artnet-status', { type: 'info', message: 'Stopped' });
});

app.on('window-all-closed', () => 
{
    if (process.platform !== 'darwin') { app.quit() }
})

app.on('activate', () => 
{
    if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
})