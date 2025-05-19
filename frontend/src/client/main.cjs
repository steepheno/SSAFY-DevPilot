const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const { format } = require('url');

function findJava() {
  try {
    // macOS / Linux
    const cmd = process.platform === 'win32' ? 'where java' : 'which java';
    const javaPath = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split(/\r?\n/)[0] // 여러 줄로 나오면 첫 번째만
      .trim();

    if (fs.existsSync(javaPath)) {
      return javaPath;
    }
  } catch {
    // ignore
  }
  // fallback: 그냥 'java' 명령으로 시도
  return 'java';
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 1) HTML 로드
  if (isDev) {
    win.loadURL('http://localhost:5173/');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../../dist/app/index.html');
    win.loadFile(indexPath);

    // const indexUrl = format({
    //   pathname: indexPath,
    //   protocol: 'file:',
    //   slashes: true,
    // });
    // win.loadURL(indexUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  }

  // 2) JAR 경로 결정
  const jarPath = path.resolve(process.resourcesPath, 'devpilot-0.0.1-SNAPSHOT.jar');
  console.log('Production JAR path:', jarPath);
  console.log('Exists at runtime?', fs.existsSync(jarPath));

  // 3) 자바 프로세스 실행
  const SERVER_PORT = 3000;
  const JAVA_PATH = findJava();
  console.log(JAVA_PATH);
  const javaProc = spawn(
    JAVA_PATH,
    ['-jar', jarPath, `--server.port=${SERVER_PORT}`],
    {
      cwd: path.dirname(jarPath),
      stdio: 'inherit',
      env: process.env,
    },
    (err, stdout, stderr) => {
      if (err) console.error(err);
    },
  );
  console.log('>> attempting to spawn java at:', JAVA_PATH);
  console.log('>> exists:', require('fs').existsSync(JAVA_PATH));
  javaProc.stdout.pipe(process.stdout);
  javaProc.stderr.pipe(process.stderr);

  // 4) PID 및 로그 리스닝
  console.log('Spring Boot PID:', javaProc.pid);
  javaProc.stdout?.on('data', (data) => console.log(`[JAVA OUT] ${data}`));
  javaProc.stderr?.on('data', (data) => console.error(`[JAVA ERR] ${data}`));
  javaProc.on('exit', (code) => console.log(`Java exited with code ${code}`));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
