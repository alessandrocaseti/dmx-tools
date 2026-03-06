const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startArtNet: (bindAddr) => ipcRenderer.send('start-artnet', bindAddr || '0.0.0.0'),
  stopArtNet: () => ipcRenderer.send('stop-artnet'),
  onPacket: (cb) => {
    ipcRenderer.on('artnet-packet', (event, packet) => cb(packet));
  },
  onStatus: (cb) => {
    ipcRenderer.on('artnet-status', (event, status) => cb(status));
  }
});
