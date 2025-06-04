// preload.js (contextIsolation: false)
const { ipcRenderer } = require('electron');

// 전역 객체에 직접 속성 추가
window.electron = {
  serialPort: {
    getPorts: () => ipcRenderer.invoke('get-ports'),
    connect: (port) => ipcRenderer.invoke('connect-port', port),
    disconnect: () => ipcRenderer.invoke('disconnect-port'),
    sendData: (data) => ipcRenderer.invoke('send-data', data),
    onData: (callback) => {
      ipcRenderer.on('serial-data', (event, ...args) => callback(...args));
      return () => ipcRenderer.removeListener('serial-data', callback);
    },
    checkStatus: () => ipcRenderer.invoke('check-port-status'),
    saveTelemetry: (data) => ipcRenderer.invoke('save-telemetry', data)
  }
};