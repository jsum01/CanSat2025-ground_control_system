import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  serialPort: {
    getPorts: () => ipcRenderer.invoke('get-ports'),
    connect: (port) => ipcRenderer.invoke('connect-port', port),
    disconnect: () => ipcRenderer.invoke('disconnect-port'),
    sendData: (data) => ipcRenderer.invoke('send-data', data),
    onData: (callback) => ipcRenderer.on('serial-data', callback)
  }
});