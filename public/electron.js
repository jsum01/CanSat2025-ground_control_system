const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const isDev = process.env.ELECTRON_START_URL ? true : false;
let mainWindow = null;
let port = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.loadURL(
    isDev
      ? process.env.ELECTRON_START_URL
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

ipcMain.handle("get-ports", async () => {
  try {
    return await SerialPort.list();
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});

ipcMain.handle("connect-port", async (event, portPath) => {
  try {
    if (!portPath) throw new Error("포트를 선택해주세요");

    port = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    parser.on("data", (data) => {
      mainWindow.webContents.send("serial-data", data);
    });

    port.on("error", (err) => {
      mainWindow.webContents.send("serial-error", err.message);
    });

    return { success: true };
  } catch (error) {
    console.error("Connection error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect-port', async () => {
  if (port) {
    return new Promise((resolve) => {
      port.close((err) => {
        // 에러가 있더라도 포트 객체 정리
        port.removeAllListeners();
        port = null;
        resolve({ success: true });
      });
    });
  }
  return { success: true };
});

// main.js
ipcMain.handle('send-data', async (event, data) => {
  if (!port) return { success: false, error: 'Port not connected' };
  
  try {
    console.log('Attempting to send:', data);
    port.write(`${data}\r\n`, (err) => {
      if (err) console.error('Write error:', err);
      else console.log('Data sent successfully');
    });
    return { success: true };
  } catch (error) {
    console.error('Send error:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  if (port) {
    port.close();
  }
});
