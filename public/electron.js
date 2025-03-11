const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const fs = require('fs');

// 개발 환경 체크
const isDev = process.env.ELECTRON_START_URL ? true : false;
let mainWindow = null;
let port = null;

// 메인 윈도우 생성 함수
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

  // 개발/프로덕션 환경에 따른 URL 로드
  mainWindow.loadURL(
    isDev
      ? process.env.ELECTRON_START_URL
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// 텔레메트리 데이터 저장 핸들러
ipcMain.handle('save-telemetry', async (event, data) => {
  try {
    // CSV 헤더 정의
    const headers = [
      'TEAM_ID', 'MISSION_TIME', 'PACKET_COUNT', 'MODE', 'STATE',
      'ALTITUDE', 'TEMPERATURE', 'PRESSURE', 'VOLTAGE',
      'GYRO_R', 'GYRO_P', 'GYRO_Y',
      'ACCEL_R', 'ACCEL_P', 'ACCEL_Y',
      'MAG_R', 'MAG_P', 'MAG_Y',
      'AUTO_GYRO_ROTATION_RATE',
      'GPS_TIME', 'GPS_ALTITUDE', 'GPS_LATITUDE', 'GPS_LONGITUDE', 'GPS_SATS',
      'CMD_ECHO'
    ].join(',');

    // 데이터 행 변환
    const rows = data.map(item => {
      return [
        item.TEAM_ID, item.MISSION_TIME, item.PACKET_COUNT, item.MODE, item.STATE,
        item.ALTITUDE, item.TEMPERATURE, item.PRESSURE, item.VOLTAGE,
        item.GYRO_R, item.GYRO_P, item.GYRO_Y,
        item.ACCEL_R, item.ACCEL_P, item.ACCEL_Y,
        item.MAG_R, item.MAG_P, item.MAG_Y,
        item.AUTO_GYRO_ROTATION_RATE,
        item.GPS_TIME, item.GPS_ALTITUDE, item.GPS_LATITUDE, item.GPS_LONGITUDE, item.GPS_SATS,
        item.CMD_ECHO
      ].join(',');
    });

    // 파일명 생성 (타임스탬프 포함)
    const fileName = `Flight_3167.csv`;
    const filePath = path.join(app.getPath('downloads'), fileName);

    // CSV 파일 작성
    const csvContent = [headers, ...rows].join('\n');
    await fs.promises.writeFile(filePath, csvContent);

    console.log(`Telemetry data saved successfully to: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving telemetry data:', error);
    return { success: false, error: error.message };
  }
});

// 포트 상태 확인 핸들러
ipcMain.handle("check-port-status", () => {
  return {
    isConnected: port !== null && port.isOpen,
    currentPort: port?.path || null
  };
});

// 사용 가능한 포트 목록 조회 핸들러
ipcMain.handle("get-ports", async () => {
  try {
    const ports = await SerialPort.list();
    console.log('Available ports:', ports);
    return ports;
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});

// 시리얼 포트 연결 핸들러
ipcMain.handle("connect-port", async (event, portPath) => {
  try {
    if (!portPath) {
      throw new Error("포트를 선택해주세요");
    }

    // 기존 연결 처리
    if (port && port.isOpen) {
      if (port.path === portPath) {
        console.log('Already connected to port:', portPath);
        return { success: true };
      }
      console.log('Closing existing port connection');
      await new Promise((resolve) => port.close(resolve));
    }

    // 새 포트 연결 설정
    port = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });
    
    // 데이터 파서 설정
    const parser = port.pipe(new ReadlineParser());
    parser.on("data", (message) => {
      console.log("Received data:", message);
      mainWindow.webContents.send("serial-data", message);
    });

    // 에러 핸들링
    port.on("error", (err) => {
      console.error("Serial port error:", err);
      mainWindow.webContents.send("serial-error", err.message);
    });

    console.log('Successfully connected to port:', portPath);
    return { success: true };
  } catch (error) {
    console.error('Port connection error:', error);
    return { success: false, error: error.message };
  }
});

// 포트 연결 해제 핸들러
ipcMain.handle('disconnect-port', async () => {
  if (!port) {
    return { success: true };
  }

  return new Promise((resolve) => {
    port.close((err) => {
      if (err) {
        console.error('Error closing port:', err);
      }
      port.removeAllListeners();
      port = null;
      console.log('Port disconnected successfully');
      resolve({ success: true });
    });
  });
});

// 데이터 전송 핸들러
ipcMain.handle('send-data', async (event, data) => {
  if (!port || !port.isOpen) {
    console.error('Cannot send data: Port not connected');
    return { success: false, error: 'Port not connected' };
  }
  
  try {
    port.write(`${data}\r\n`);
    console.log('Data sent:', data);
    mainWindow.webContents.send('serial-sent', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending data:', error);
    return { success: false, error: error.message };
  }
});

// 앱 라이프사이클 이벤트 핸들러
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
  if (port && port.isOpen) {
    await new Promise((resolve) => port.close(resolve));
    console.log('Port closed on application quit');
  }
});