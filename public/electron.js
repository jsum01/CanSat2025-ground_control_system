const path = require('path');
const { app, BrowserWindow } = require('electron');

// isDev 체크를 직접 구현
const isDev = process.env.ELECTRON_START_URL ? true : false;

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 개발 모드일 때는 환경변수의 URL을, 아닐 때는 빌드된 파일을 로드
  win.loadURL(
    isDev
      ? process.env.ELECTRON_START_URL
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // 개발 모드일 때만 개발자 도구 열기
  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Electron 앱이 준비되면 창 생성
app.whenReady().then(createWindow);

// 모든 창이 닫히면 앱 종료
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});