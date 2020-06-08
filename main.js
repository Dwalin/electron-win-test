// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');
// const console = require('console');
// app.console = new console.Console(process.stdout, process.stderr);
// process.stdout.write('your output to command prompt console or node js ');

console.log = (message) => {
  if (stripNode) {
    // stripNode.executeJavaScript(`console.log("console.log from electron")`);
    stripNode.executeJavaScript(`console.log(${JSON.stringify(message)})`);
  }
};

app.disableHardwareAcceleration();
let stripWindow;
let stripNode;

const { U } = require('win32-api');
const ffi = require('ffi-napi');
const ref = require('ref-napi');

let pfnWinEventProc = null;
pfnWinEventProc = ffi.Callback("void", ["pointer", "int", "pointer", "long", "long", "int", "int"], () => {
  console.log('HELLO');
});

const user32 = U.load();

setInterval(() => {
  const appWindow = user32.GetForegroundWindow();
  console.log(appWindow);

  user32.SetWindowTextW(appWindow, Buffer.from('OKOK' + '\0', 'ucs2'));

  const msgType = ref.types.void;
  const msgPtr = ref.refType(msgType);
  const EVENT_SYSTEM_FOREGROUND = 3;
  const WINEVENT_OUTOFCONTEXT = 0;
  const WINEVENT_SKPIOWNPROCESS = 2;

  user32.SetWinEventHook(
    1,
    3,
    appWindow,
    pfnWinEventProc,
    0,
    0,
    0 | 2
  );

  // user32.SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, null, pfnWinEventProc,
  //   0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKPIOWNPROCESS)

}, 1000);





const launchStrip = () => {
  // Create the browser window.

  stripWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  stripWindow.loadURL(`file://${__dirname}/test.html`);
  stripNode = stripWindow && stripWindow.webContents;

  // setInterval(func, 1000);

  console.log("Strip launched");

  stripWindow.on('closed', () => {
    stripNode = null;
    stripWindow = null;
  });
};

app.on('ready', async () => {
  setTimeout(() => {
    launchStrip();
  }, 400);
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
